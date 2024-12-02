import express from 'express';
import adminController from '../controllers/adminController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import PendingManager from '../models/PendingManager.js';

const router = express.Router();

// Configuration du transporteur email avec Gmail
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'noreply.cybermathia@gmail.com',
    pass: 'zayf pfpp iatp dmwm'
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  },
  pool: true, // Utiliser un pool de connexions
  maxConnections: 1,
  maxMessages: 3,
  rateDelta: 1000,
  rateLimit: 3,
  connectionTimeout: 5000, // 5 secondes
  socketTimeout: 5000,
  greetingTimeout: 5000
});

// Fonction d'envoi d'email avec gestion des timeouts
const sendMailWithRetry = async (mailOptions) => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Timeout lors de l\'envoi de l\'email'));
    }, 10000); // 10 secondes de timeout global

    transporter.sendMail({
      ...mailOptions,
      from: {
        name: 'CyberMathIA',
        address: 'noreply.cybermathia@gmail.com'
      }
    })
    .then((info) => {
      clearTimeout(timeoutId);
      console.log('Email envoyé avec succès:', {
        messageId: info.messageId,
        response: info.response
      });
      resolve(info);
    })
    .catch((error) => {
      clearTimeout(timeoutId);
      console.error('Erreur d\'envoi d\'email:', {
        error: error.message,
        code: error.code,
        command: error.command
      });
      reject(error);
    });
  });
};

// Vérifier la connexion SMTP au démarrage
const verifyConnection = async () => {
  try {
    await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout de vérification SMTP'));
      }, 5000);

      transporter.verify((error, success) => {
        clearTimeout(timeoutId);
        if (error) {
          console.error('Erreur de configuration SMTP:', error);
          reject(error);
        } else {
          console.log('Serveur SMTP prêt');
          resolve(success);
        }
      });
    });
  } catch (error) {
    console.error('Erreur de configuration email:', error);
  }
};

// Vérifier la connexion au démarrage
verifyConnection();

// Routes publiques pour l'authentification admin
router.post('/login', adminController.login);
router.post('/verify-2fa', adminController.verifyTwoFactor);

// Routes protégées nécessitant une authentification admin
router.get('/stats', authMiddleware, adminMiddleware, adminController.getStats);
router.get('/connections', authMiddleware, adminMiddleware, adminController.getConnections);

// Route pour récupérer tous les utilisateurs
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('Récupération de tous les utilisateurs');
    const users = await User.find({})
      .select('-password -twoFactorCode')
      .sort({ createdAt: -1 });
    
    console.log(`${users.length} utilisateurs trouvés`);
    res.json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des utilisateurs',
      error: error.message 
    });
  }
});

// Route pour récupérer les utilisateurs par rôle
router.get('/users/:role', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role } = req.params;
    console.log('Récupération des utilisateurs par rôle:', role);

    // Vérifier que le rôle est valide
    const validRoles = ['manager', 'teacher', 'parent', 'student'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide' });
    }

    const users = await User.find({ role })
      .select('-password -twoFactorCode')
      .sort({ createdAt: -1 });
    
    console.log(`${users.length} utilisateurs trouvés pour le rôle ${role}`);
    res.json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des utilisateurs',
      error: error.message 
    });
  }
});

// Route pour supprimer un utilisateur
router.delete('/users/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Suppression de l\'utilisateur:', userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Empêcher la suppression d'un admin
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Impossible de supprimer un administrateur' });
    }

    await User.deleteOne({ _id: userId });
    console.log('Utilisateur supprimé avec succès');
    
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la suppression de l\'utilisateur',
      error: error.message 
    });
  }
});

// Route pour créer un manager
router.post('/create-manager', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    console.log('Création d\'un nouveau manager:', { firstName, lastName, email });

    // Vérifier si l'email existe déjà dans les utilisateurs actifs
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Email déjà utilisé dans users:', email);
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Vérifier si une invitation est déjà en attente
    const existingInvitation = await PendingManager.findOne({ email });
    if (existingInvitation) {
      console.log('Invitation déjà en attente pour:', email);
      return res.status(400).json({ 
        message: 'Une invitation est déjà en attente pour cet email',
        pendingManager: {
          id: existingInvitation._id,
          email: existingInvitation.email,
          expiresAt: new Date(existingInvitation.createdAt.getTime() + 24*60*60*1000)
        }
      });
    }

    // Générer le token d'invitation
    const token = jwt.sign(
      { 
        data: {
          firstName, 
          lastName, 
          email,
          role: 'manager'
        }
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Créer l'invitation en attente
    const pendingManager = new PendingManager({
      firstName,
      lastName,
      email,
      token
    });

    await pendingManager.save();
    console.log('Manager en attente créé:', pendingManager);

    // Envoyer l'email d'invitation
    const activationLink = `http://localhost:3000/complete-manager-registration?token=${token}`;
    
    try {
      await sendMailWithRetry({
        to: email,
        subject: 'Invitation à rejoindre CyberMathIA en tant que Manager',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4F46E5;">Bienvenue chez CyberMathIA !</h1>
            <p>Bonjour ${firstName},</p>
            <p>Vous avez été invité(e) à rejoindre CyberMathIA en tant que Manager.</p>
            <p>Pour activer votre compte, veuillez cliquer sur le lien ci-dessous :</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${activationLink}" 
                 style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block;">
                Activer mon compte
              </a>
            </div>
            <p style="color: #666;">Ce lien est valable pendant 24 heures.</p>
          </div>
        `
      });

      res.json({ 
        message: 'Invitation envoyée avec succès',
        email: email,
        pendingManager: {
          id: pendingManager._id,
          email: pendingManager.email,
          expiresAt: new Date(pendingManager.createdAt.getTime() + 24*60*60*1000)
        }
      });
    } catch (emailError) {
      console.error('Erreur finale d\'envoi d\'email après plusieurs tentatives:', emailError);
      // Si l'email échoue, supprimer le pendingManager
      await PendingManager.findByIdAndDelete(pendingManager._id);
      
      console.error('Erreur d\'envoi d\'email:', emailError);
      res.status(500).json({ 
        message: 'Erreur lors de l\'envoi de l\'invitation',
        error: emailError.message 
      });
    }

  } catch (error) {
    console.error('Erreur lors de la création du manager:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la création du manager',
      error: error.message 
    });
  }
});

// Récupérer les managers en attente
router.get('/pending-managers', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pendingManagers = await PendingManager.find().sort({ createdAt: -1 });
    console.log('Pending managers trouvés:', pendingManagers);
    res.json(pendingManagers);
  } catch (error) {
    console.error('Erreur lors de la récupération des invitations:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des invitations' });
  }
});

// Annuler une invitation
router.delete('/pending-managers/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('Tentative d\'annulation de l\'invitation:', req.params.id);
    
    const pendingManager = await PendingManager.findById(req.params.id);
    if (!pendingManager) {
      console.log('Invitation non trouvée');
      return res.status(404).json({ message: 'Invitation non trouvée' });
    }

    console.log('Invitation trouvée:', pendingManager);

    // Envoyer l'email d'annulation
    try {
      await sendMailWithRetry({
        to: pendingManager.email,
        subject: 'Annulation de votre invitation CyberMathIA',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4F46E5;">Information importante</h1>
            <p>Bonjour ${pendingManager.firstName},</p>
            <p>Nous vous informons que votre invitation à rejoindre CyberMathIA en tant que Manager a été annulée.</p>
            <p>Le lien d'activation qui vous a été envoyé n'est plus valide.</p>
            <p>Si vous pensez qu'il s'agit d'une erreur, veuillez nous contacter à l'adresse suivante : support@cybermathia.fr</p>
            <p style="color: #666;">Cordialement,<br>L'équipe CyberMathIA</p>
          </div>
        `
      });
      console.log('Email d\'annulation envoyé avec succès');
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email d\'annulation:', emailError);
      // On continue même si l'email échoue
    }

    // Supprimer l'invitation de la base de données
    const deleteResult = await PendingManager.deleteOne({ _id: req.params.id });
    console.log('Résultat de la suppression:', deleteResult);

    if (deleteResult.deletedCount === 0) {
      console.log('Échec de la suppression');
      return res.status(500).json({ message: 'Échec de la suppression de l\'invitation' });
    }

    // Vérifier que l'invitation a bien été supprimée
    const verifyDeletion = await PendingManager.findById(req.params.id);
    if (verifyDeletion) {
      console.log('L\'invitation existe encore après la suppression');
      // Forcer la suppression avec deleteMany
      await PendingManager.deleteMany({ email: pendingManager.email });
    }

    // Rafraîchir la liste des invitations
    const remainingInvitations = await PendingManager.find().sort({ createdAt: -1 });
    console.log('Invitations restantes:', remainingInvitations.length);

    res.json({ 
      message: 'Invitation annulée avec succès',
      remainingInvitations
    });

  } catch (error) {
    console.error('Erreur lors de l\'annulation:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'annulation de l\'invitation',
      error: error.message 
    });
  }
});

// Renvoyer une invitation
router.post('/pending-managers/:id/resend', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pendingManager = await PendingManager.findById(req.params.id);
    if (!pendingManager) {
      return res.status(404).json({ message: 'Invitation non trouvée' });
    }

    // Générer le lien d'activation avec le token existant
    const activationLink = `http://localhost:3000/complete-manager-registration?token=${pendingManager.token}`;
    
    // Renvoyer l'email avec le même token
    await sendMailWithRetry({
      to: pendingManager.email,
      subject: 'Invitation à rejoindre CyberMathIA en tant que Manager (renvoi)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4F46E5;">Bienvenue chez CyberMathIA !</h1>
          <p>Bonjour ${pendingManager.firstName},</p>
          <p>Voici un nouveau lien pour activer votre compte Manager chez CyberMathIA.</p>
          <p>Pour activer votre compte, veuillez cliquer sur le lien ci-dessous :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${activationLink}" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Activer mon compte
            </a>
          </div>
          <p style="color: #666;">Ce lien est valable pendant 24 heures.</p>
          <p style="color: #666; font-size: 0.9em;">Si vous n'avez pas demandé ce renvoi, vous pouvez ignorer cet email.</p>
        </div>
      `
    });

    res.json({ 
      message: 'Invitation renvoyée avec succès',
      email: pendingManager.email
    });
  } catch (error) {
    console.error('Erreur lors du renvoi de l\'invitation:', error);
    res.status(500).json({ 
      message: 'Erreur lors du renvoi de l\'invitation',
      error: error.message 
    });
  }
});

export default router; 
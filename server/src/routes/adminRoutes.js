import express from 'express';
import adminController from '../controllers/adminController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import PendingManager from '../models/PendingManager.js';

const router = express.Router();

// Configuration du transporteur email avec plus d'options
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'noreply.cybermathia@gmail.com',
    pass: 'zayf pfpp iatp dmwm'
  },
  debug: true,
  logger: true
});

// Vérifier la configuration du transporteur au démarrage
transporter.verify((error, success) => {
  if (error) {
    console.error('Erreur de configuration email:', error);
  } else {
    console.log('Serveur prêt à envoyer des emails');
  }
});

// Routes publiques pour l'authentification admin
router.post('/login', adminController.login);
router.post('/verify-2fa', adminController.verifyTwoFactor);

// Routes protégées nécessitant une authentification admin
router.get('/stats', authMiddleware, adminMiddleware, adminController.getStats);
router.get('/connections', authMiddleware, adminMiddleware, adminController.getConnections);

// Autres routes protégées
router.get('/users/:role', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await adminController.getUsersByRole(req.params.role);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
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
      await transporter.sendMail({
        from: {
          name: 'CyberMathIA',
          address: process.env.EMAIL_USER
        },
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

router.delete('/users/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await adminController.deleteUser(req.params.userId);
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur' });
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
    const pendingManager = await PendingManager.findById(req.params.id);
    if (!pendingManager) {
      return res.status(404).json({ message: 'Invitation non trouvée' });
    }

    // Supprimer l'invitation en utilisant deleteOne pour plus de fiabilité
    const result = await PendingManager.deleteOne({ _id: req.params.id });
    console.log('Résultat de la suppression:', result);

    if (result.deletedCount === 0) {
      console.error('Échec de la suppression de l\'invitation');
      return res.status(500).json({ message: 'Échec de la suppression de l\'invitation' });
    }

    // Double vérification pour s'assurer que l'invitation est supprimée
    const verifyDeletion = await PendingManager.findById(req.params.id);
    if (verifyDeletion) {
      // Si l'invitation existe encore, forcer la suppression
      await PendingManager.deleteMany({ email: pendingManager.email });
      console.log('Suppression forcée de toutes les invitations pour:', pendingManager.email);
    }

    // Envoyer un email d'annulation
    try {
      await transporter.sendMail({
        from: {
          name: 'CyberMathIA',
          address: process.env.EMAIL_USER
        },
        to: pendingManager.email,
        subject: 'Invitation CyberMathIA annulée',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4F46E5;">Information CyberMathIA</h1>
            <p>Bonjour ${pendingManager.firstName},</p>
            <p>Votre invitation à rejoindre CyberMathIA en tant que Manager a été annulée.</p>
            <p>Si vous pensez qu'il s'agit d'une erreur, veuillez contacter l'administrateur.</p>
            <p style="color: #666;">Le lien d'activation précédemment envoyé n'est plus valide.</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email d\'annulation:', emailError);
      // On continue même si l'email échoue
    }

    // Rafraîchir la liste des invitations
    const remainingInvitations = await PendingManager.find().sort({ createdAt: -1 });

    res.json({ 
      message: 'Invitation annulée avec succès',
      remainingInvitations
    });
  } catch (error) {
    console.error('Erreur lors de l\'annulation de l\'invitation:', error);
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
    await transporter.sendMail({
      from: {
        name: 'CyberMathIA',
        address: process.env.EMAIL_USER
      },
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
import User from '../models/User.js';
import LoginLog from '../models/LoginLog.js';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import TeacherAvailability from '../models/TeacherAvailability.js';

// Configuration du transporteur email
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

// Test de connexion SMTP au démarrage
transporter.verify((error, success) => {
  if (error) {
    console.error('Erreur de configuration SMTP:', {
      error: error.message,
      code: error.code,
      command: error.command
    });
  } else {
    console.log('Configuration SMTP réussie:', {
      success,
      user: 'noreply.cybermathia@gmail.com',
      host: 'smtp.gmail.com'
    });
  }
});

// Stockage temporaire des codes 2FA (en production, utiliser Redis)
const twoFactorCodes = new Map();

// Fonction pour envoyer le code 2FA avec plus de logs
const send2FACode = async (code) => {
  try {
    console.log('Préparation de l\'envoi d\'email...');
    
    // Configuration de l'email
    const mailOptions = {
      from: '"CyberMathIA Admin" <noreply.cybermathia@gmail.com>',
      to: 'admin@cybermathia.com', // Changez ceci par votre email pour les tests
      subject: 'Code de vérification CyberMathIA',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4F46E5;">Code de vérification administrateur</h1>
          <p style="font-size: 18px;">Votre code de vérification est : <strong style="color: #4F46E5; font-size: 24px;">${code}</strong></p>
          <p>Ce code expire dans 5 minutes.</p>
        </div>
      `,
      auth: {
        user: 'noreply.cybermathia@gmail.com',
        pass: 'zayf pfpp iatp dmwm'
      }
    };

    console.log('Tentative d\'envoi avec les options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('Email envoyé avec succès:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    });

    return true;
  } catch (error) {
    console.error('Erreur détaillée lors de l\'envoi:', {
      name: error.name,
      message: error.message,
      code: error.code,
      command: error.command
    });
    return false;
  }
};

const adminController = {
  login: async (req, res) => {
    try {
      console.log('Tentative de connexion admin:', req.body);
      const { login, password } = req.body;

      // Vérifier le login
      if (login !== 'admin_cybermathia') {
        return res.status(401).json({ message: 'Identifiants incorrects' });
      }

      // Vérifier si l'utilisateur admin existe
      const admin = await User.findOne({ email: 'admin@cybermathia.com', role: 'admin' });
      if (!admin) {
        return res.status(401).json({ message: 'Compte administrateur non trouvé' });
      }

      // Vérifier le mot de passe
      const isValidPassword = await bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Identifiants incorrects' });
      }

      // Générer un code 2FA
      const twoFactorCode = Math.floor(100000 + Math.random() * 900000).toString();
      twoFactorCodes.set(login, {
        code: twoFactorCode,
        timestamp: Date.now(),
        attempts: 0
      });

      console.log('Code 2FA généré:', twoFactorCode);

      // Toujours essayer d'envoyer l'email, même en développement
      const emailSent = await send2FACode(twoFactorCode);
      console.log('Statut envoi email:', emailSent);

      // Envoyer la réponse avec le code en développement
      res.json({
        message: emailSent ? 'Code de vérification envoyé' : 'Code de vérification généré',
        requireTwoFactor: true,
        testCode: process.env.NODE_ENV === 'development' ? twoFactorCode : undefined
      });

    } catch (error) {
      console.error('Erreur de connexion admin:', error);
      res.status(500).json({ message: 'Erreur lors de la connexion' });
    }
  },

  verifyTwoFactor: async (req, res) => {
    try {
      const { login, twoFactorCode } = req.body;

      // Vérifier si un code existe pour ce login
      const storedData = twoFactorCodes.get(login);
      if (!storedData) {
        return res.status(401).json({ message: 'Code expiré ou invalide' });
      }

      // Vérifier le nombre de tentatives
      if (storedData.attempts >= 3) {
        twoFactorCodes.delete(login);
        return res.status(401).json({ message: 'Trop de tentatives. Veuillez recommencer la connexion.' });
      }

      // Vérifier si le code n'a pas expiré (5 minutes)
      if (Date.now() - storedData.timestamp > 5 * 60 * 1000) {
        twoFactorCodes.delete(login);
        return res.status(401).json({ message: 'Code expiré' });
      }

      // Vérifier le code
      if (storedData.code !== twoFactorCode) {
        storedData.attempts++;
        return res.status(401).json({ message: 'Code incorrect' });
      }

      // Récupérer l'utilisateur admin
      const admin = await User.findOne({ email: 'admin@cybermathia.com', role: 'admin' });
      
      // Créer le token
      const token = jwt.sign(
        { userId: admin._id, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      // Supprimer le code 2FA utilisé
      twoFactorCodes.delete(login);

      res.json({
        token,
        user: {
          id: admin._id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: 'admin'
        }
      });
    } catch (error) {
      console.error('Erreur de vérification 2FA:', error);
      res.status(500).json({ message: 'Erreur lors de la vérification' });
    }
  },

  // Récupérer les statistiques
  getStats: async (req, res) => {
    try {
      console.log('Récupération des statistiques...');
      const stats = {
        totalUsers: await User.countDocuments(),
        totalTeachers: await User.countDocuments({ role: 'teacher' }),
        totalStudents: await User.countDocuments({ role: 'student' }),
        totalParents: await User.countDocuments({ role: 'parent' }),
        totalManagers: await User.countDocuments({ role: 'manager' })
      };
      console.log('Statistiques récupérées:', stats);
      res.json(stats);
    } catch (error) {
      console.error('Erreur de récupération des stats:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
    }
  },

  // Récupérer les connexions récentes
  getConnections: async (req, res) => {
    try {
      const connections = await LoginLog.find()
        .sort({ timestamp: -1 })
        .limit(20);
      res.json(connections);
    } catch (error) {
      console.error('Erreur de récupération des connexions:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération des connexions' });
    }
  },

  // Récupérer les utilisateurs par rôle
  getUsersByRole: async (req, res) => {
    try {
      const { role } = req.params;
      console.log('Récupération des utilisateurs pour le rôle:', role);
      
      let users;
      if (role === 'all') {
        users = await User.find({}).sort({ createdAt: -1 });
      } else {
        users = await User.find({ role }).sort({ createdAt: -1 });
      }

      console.log(`Nombre d'utilisateurs trouvés: ${users.length}`);
      res.json(users);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
    }
  },

  // Créer un manager
  createManager: async (req, res) => {
    try {
      const { firstName, lastName, email } = req.body;

      // Vérifier si l'email existe déjà
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }

      // Générer un token d'invitation unique
      const inviteToken = jwt.sign(
        { email, role: 'manager', firstName, lastName },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Envoyer l'email d'invitation
      const inviteUrl = `http://localhost:3000/complete-registration?token=${inviteToken}`;
      
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Invitation à rejoindre CyberMathIA en tant que Manager',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #059669;">Bienvenue chez CyberMathIA !</h1>
            <p>Bonjour ${firstName},</p>
            <p>Vous avez été invité(e) à rejoindre l'équipe CyberMathIA en tant que Manager.</p>
            <p>Pour finaliser la création de votre compte, veuillez cliquer sur le lien ci-dessous :</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Finaliser mon inscription
              </a>
            </div>
            <p style="color: #666;">Ce lien expire dans 24 heures.</p>
          </div>
        `
      });

      res.status(200).json({
        message: 'Invitation envoyée avec succès',
        email
      });
    } catch (error) {
      console.error('Erreur lors de la création du manager:', error);
      res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'invitation' });
    }
  },

  // Supprimer un utilisateur
  deleteUser: async (req, res) => {
    try {
      const { userId } = req.params;
      console.log('Tentative de suppression de l\'utilisateur:', userId);

      // Vérifier que l'utilisateur existe
      const user = await User.findById(userId);
      if (!user) {
        console.log('Utilisateur non trouvé');
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      // Empêcher la suppression d'un admin
      if (user.role === 'admin') {
        console.log('Tentative de suppression d\'un admin bloquée');
        return res.status(403).json({ message: 'Impossible de supprimer un administrateur' });
      }

      // Si c'est un professeur, supprimer aussi ses disponibilités
      if (user.role === 'teacher') {
        console.log('Suppression des disponibilités du professeur');
        await TeacherAvailability.deleteMany({ teacherId: userId });
      }

      // Supprimer l'utilisateur
      await User.findByIdAndDelete(userId);
      console.log('Utilisateur supprimé avec succès');

      res.json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la suppression de l\'utilisateur',
        error: error.message 
      });
    }
  }
};

export default adminController; 
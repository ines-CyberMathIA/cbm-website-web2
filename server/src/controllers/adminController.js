import User from '../models/User.js';
import LoginLog from '../models/LoginLog.js';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Configuration du transporteur email avec les nouveaux identifiants
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'cybermathia@gmail.com',  // Email configuré
    pass: 'wuig znrg uggv tydt'     // Mot de passe d'application généré
  }
});

// Fonction pour envoyer le code 2FA
const send2FACode = async (code) => {
  try {
    await transporter.sendMail({
      from: 'CyberMathIA Admin <cybermathia@gmail.com>',
      to: 'admin@cybermathia.com',
      subject: 'Code de vérification CyberMathIA',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4F46E5;">Code de vérification administrateur</h1>
          <p style="font-size: 18px;">Votre code de vérification est : <strong style="color: #4F46E5; font-size: 24px;">${code}</strong></p>
          <p>Ce code expire dans 5 minutes.</p>
          <p style="color: #EF4444;">Si vous n'avez pas demandé ce code, veuillez sécuriser votre compte immédiatement.</p>
          <hr>
          <p style="color: #6B7280; font-size: 12px;">CyberMathIA - Administration</p>
        </div>
      `
    });
    console.log('Email 2FA envoyé avec succès à admin@cybermathia.com');
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    console.error('Détails:', error.message);
    return false;
  }
};

// Stockage temporaire des codes 2FA (en production, utiliser Redis)
const twoFactorCodes = new Map();

const adminController = {
  // Connexion admin - première étape
  login: async (req, res) => {
    try {
      console.log('Tentative de connexion admin:', req.body);
      const { login, password } = req.body;

      // Vérifier le login
      if (login !== 'admin_cybermathia') {
        console.log('Login incorrect:', login);
        return res.status(401).json({ message: 'Identifiants incorrects' });
      }

      // Vérifier si l'utilisateur admin existe
      const admin = await User.findOne({ email: 'admin@cybermathia.com', role: 'admin' });
      console.log('Admin trouvé:', admin ? {
        email: admin.email,
        role: admin.role,
        passwordHash: admin.password.substring(0, 10) + '...'
      } : 'Non');
      
      if (!admin) {
        console.log('Admin non trouvé dans la base de données');
        return res.status(401).json({ message: 'Compte administrateur non trouvé' });
      }

      // Vérifier le mot de passe
      const isValidPassword = await bcrypt.compare(password, admin.password);
      console.log('Mot de passe fourni:', password);
      console.log('Hash stocké:', admin.password);
      console.log('Mot de passe valide:', isValidPassword);
      
      if (!isValidPassword) {
        console.log('Mot de passe incorrect');
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

      // Pour le développement, afficher le code dans la console
      console.log('Code 2FA pour test:', twoFactorCode);

      // Envoyer le code par email
      const emailSent = await send2FACode(twoFactorCode);
      if (!emailSent) {
        return res.status(500).json({ message: 'Erreur lors de l\'envoi du code de vérification' });
      }

      res.json({ 
        message: 'Code de vérification envoyé', 
        requireTwoFactor: true,
        // En développement uniquement, on envoie aussi le code dans la réponse
        testCode: process.env.NODE_ENV === 'development' ? twoFactorCode : undefined
      });
    } catch (error) {
      console.error('Erreur de connexion admin:', error);
      res.status(500).json({ message: 'Erreur lors de la connexion' });
    }
  },

  // Vérification du code 2FA
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

      // Enregistrer la connexion
      await LoginLog.create({
        userId: admin._id,
        userName: `${admin.firstName} ${admin.lastName}`,
        role: 'admin',
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Envoyer une notification de connexion
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: 'admin@cybermathia.com',
        subject: 'Nouvelle connexion admin détectée',
        html: `
          <h1>Nouvelle connexion administrateur</h1>
          <p>Une nouvelle connexion a été détectée sur votre compte.</p>
          <p>IP: ${req.ip}</p>
          <p>Navigateur: ${req.headers['user-agent']}</p>
          <p>Date: ${new Date().toLocaleString()}</p>
          <p>Si ce n'était pas vous, veuillez sécuriser votre compte immédiatement.</p>
        `
      });

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
      const stats = {
        totalUsers: await User.countDocuments(),
        totalTeachers: await User.countDocuments({ role: 'teacher' }),
        totalStudents: await User.countDocuments({ role: 'student' }),
        totalParents: await User.countDocuments({ role: 'parent' })
      };
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
  }
};

export default adminController; 
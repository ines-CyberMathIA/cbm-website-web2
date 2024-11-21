import User from '../models/User.js';
import LoginLog from '../models/LoginLog.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

// Configuration du transporteur email avec OAuth2
const createTransporter = async () => {
  try {
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
      }
    });

    // Test de connexion
    const testResult = await transporter.verify();
    console.log('Test de connexion SMTP:', {
      result: testResult,
      host: 'smtp.gmail.com',
      port: 587,
      user: 'noreply.cybermathia@gmail.com'
    });
    
    return transporter;
  } catch (error) {
    console.error('Erreur de configuration SMTP:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack
    });
    return null;
  }
};

// Fonction pour envoyer un email avec retry et plus de logs
const sendEmail = async (to, subject, html, retryCount = 3) => {
  for (let i = 0; i < retryCount; i++) {
    try {
      console.log(`Tentative d'envoi d'email (${i + 1}/${retryCount}) à ${to}`);
      
      const transporter = await createTransporter();
      if (!transporter) {
        throw new Error('Impossible de créer le transporteur SMTP');
      }

      const mailOptions = {
        from: {
          name: 'CyberMathIA',
          address: 'noreply.cybermathia@gmail.com'
        },
        to,
        subject,
        html,
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high'
        }
      };

      console.log('Options du mail:', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        from: mailOptions.from
      });

      const info = await transporter.sendMail(mailOptions);

      console.log('Email envoyé avec succès:', {
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected,
        envelope: info.envelope
      });
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de la tentative ${i + 1}:`, {
        error: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        stack: error.stack
      });
      
      if (i === retryCount - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
};

const adminController = {
  login: async (req, res) => {
    try {
      const { login, password } = req.body;
      console.log('Tentative de connexion admin avec:', { login });

      const admin = await User.findOne({ 
        email: login,
        role: 'admin'
      });

      if (!admin) {
        console.log('Admin non trouvé avec identifiant:', login);
        return res.status(401).json({ message: 'Identifiants invalides' });
      }

      const isValidPassword = await bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
        console.log('Mot de passe invalide pour:', login);
        return res.status(401).json({ message: 'Identifiants invalides' });
      }

      // Générer un code 2FA aléatoire à 6 chiffres
      const twoFactorCode = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('Code 2FA généré:', twoFactorCode);

      // Stocker le code hashé
      const salt = await bcrypt.genSalt(10);
      const hashedCode = await bcrypt.hash(twoFactorCode, salt);
      admin.twoFactorCode = hashedCode;
      await admin.save();
      console.log('Code 2FA hashé et sauvegardé pour:', admin.email);

      // Envoyer la réponse immédiatement
      res.json({
        requireTwoFactor: true,
        message: 'Code 2FA envoyé',
        testCode: process.env.NODE_ENV === 'development' ? twoFactorCode : undefined
      });

      // Envoyer l'email après la réponse
      await sendEmail(
        admin.notificationEmail,
        'Code de vérification CyberMathIA',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4F46E5;">Connexion Admin CyberMathIA</h1>
            <p>Voici votre code de vérification :</p>
            <div style="background-color: #F3F4F6; padding: 20px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
              <strong>${twoFactorCode}</strong>
            </div>
            <p style="color: #666; font-size: 14px;">Ce code est valable pendant 5 minutes.</p>
          </div>
        `
      );

    } catch (error) {
      console.error('Erreur détaillée de connexion admin:', error);
      res.status(500).json({ message: 'Erreur lors de la connexion' });
    }
  },

  verifyTwoFactor: async (req, res) => {
    try {
      const { login, twoFactorCode } = req.body;
      console.log('Vérification 2FA pour:', { login });

      const admin = await User.findOne({ 
        email: login,
        role: 'admin'
      });

      if (!admin || !admin.twoFactorCode) {
        console.log('Admin non trouvé ou pas de code 2FA');
        return res.status(401).json({ message: 'Code invalide' });
      }

      // Vérifier le code
      const isValidCode = await bcrypt.compare(twoFactorCode, admin.twoFactorCode);
      console.log('Résultat de la vérification du code:', isValidCode);

      if (!isValidCode) {
        console.log('Code 2FA invalide');
        return res.status(401).json({ message: 'Code invalide' });
      }

      // Effacer le code 2FA
      admin.twoFactorCode = null;
      await admin.save();

      // Générer le token
      const token = jwt.sign(
        { userId: admin._id, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Logger la connexion
      const loginLog = new LoginLog({
        userId: admin._id,
        userName: `${admin.firstName} ${admin.lastName}`,
        role: 'admin',
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      await loginLog.save();

      console.log('Connexion admin réussie');

      res.json({
        token,
        user: {
          id: admin._id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (error) {
      console.error('Erreur de vérification 2FA:', error);
      res.status(500).json({ message: 'Erreur lors de la vérification' });
    }
  },

  getStats: async (req, res) => {
    try {
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
      console.error('Erreur lors de la récupération des stats:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
    }
  },

  getConnections: async (req, res) => {
    try {
      const connections = await LoginLog.find()
        .sort({ timestamp: -1 })
        .limit(100);
      console.log('Connexions récupérées:', connections.length);
      res.json(connections);
    } catch (error) {
      console.error('Erreur lors de la récupération des connexions:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération des connexions' });
    }
  },

  getUsersByRole: async (role) => {
    return await User.find({ role }).select('-password');
  },

  createManager: async (managerData) => {
    const manager = new User({
      ...managerData,
      role: 'manager'
    });
    return await manager.save();
  },

  deleteUser: async (userId) => {
    return await User.findByIdAndDelete(userId);
  }
};

export default adminController; 
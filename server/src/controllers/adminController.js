import User from '../models/User.js';
import LoginLog from '../models/LoginLog.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

// Configuration du transporteur email
const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true pour 465, false pour les autres ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3'
    },
    debug: true,
    logger: true,
    timeout: 10000 // timeout de 10 secondes
  });

  return transporter;
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

      console.log('Admin trouvé:', {
        login: admin.email,
        notificationEmail: admin.notificationEmail,
        storedPassword: admin.password
      });

      const isValidPassword = await bcrypt.compare(password, admin.password);
      console.log('Résultat de la comparaison du mot de passe:', isValidPassword);

      if (!isValidPassword) {
        console.log('Mot de passe invalide pour:', login);
        return res.status(401).json({ message: 'Identifiants invalides' });
      }

      // Générer un code 2FA
      const twoFactorCode = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('Code 2FA généré:', twoFactorCode);

      // Hasher et sauvegarder le code
      const salt = await bcrypt.genSalt(10);
      const hashedCode = await bcrypt.hash(twoFactorCode, salt);
      admin.twoFactorCode = hashedCode;
      await admin.save();

      try {
        console.log('Configuration email:', {
          host: 'smtp.gmail.com',
          port: 587,
          user: process.env.EMAIL_USER,
          hasPassword: !!process.env.EMAIL_PASSWORD
        });

        const transporter = createTransporter();
        
        // Vérifier la connexion SMTP avec timeout
        const verifyPromise = transporter.verify();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout de vérification SMTP')), 5000)
        );
        
        await Promise.race([verifyPromise, timeoutPromise]);
        console.log('Connexion SMTP vérifiée');

        // Envoyer l'email avec timeout
        const mailOptions = {
          from: {
            name: 'CyberMathIA',
            address: process.env.EMAIL_USER
          },
          to: admin.notificationEmail,
          subject: 'Code de vérification CyberMathIA',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #4F46E5;">Connexion Admin CyberMathIA</h1>
              <p>Voici votre code de vérification :</p>
              <div style="background-color: #F3F4F6; padding: 20px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
                <strong>${twoFactorCode}</strong>
              </div>
              <p style="color: #666; font-size: 14px;">Ce code est valable pendant 5 minutes.</p>
            </div>
          `
        };

        const sendMailPromise = transporter.sendMail(mailOptions);
        const sendTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout d\'envoi d\'email')), 10000)
        );

        const info = await Promise.race([sendMailPromise, sendTimeoutPromise]);

        console.log('Email envoyé:', {
          messageId: info.messageId,
          response: info.response,
          accepted: info.accepted,
          rejected: info.rejected
        });

        res.json({
          requireTwoFactor: true,
          message: 'Code 2FA envoyé',
          testCode: process.env.NODE_ENV === 'development' ? twoFactorCode : undefined
        });

      } catch (emailError) {
        console.error('Erreur détaillée d\'envoi d\'email:', {
          message: emailError.message,
          code: emailError.code,
          command: emailError.command,
          response: emailError.response,
          stack: emailError.stack
        });

        // En développement, on continue même si l'email échoue
        if (process.env.NODE_ENV === 'development') {
          res.json({
            requireTwoFactor: true,
            message: 'Code 2FA généré (email désactivé en dev)',
            testCode: twoFactorCode
          });
        } else {
          res.status(500).json({ 
            message: 'Erreur lors de l\'envoi du code de vérification',
            error: emailError.message
          });
        }
      }

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

      const isValidCode = await bcrypt.compare(twoFactorCode, admin.twoFactorCode);
      console.log('Résultat de la vérification du code:', isValidCode);

      if (!isValidCode) {
        console.log('Code 2FA invalide');
        return res.status(401).json({ message: 'Code invalide' });
      }

      admin.twoFactorCode = null;
      await admin.save();

      const token = jwt.sign(
        { userId: admin._id, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

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
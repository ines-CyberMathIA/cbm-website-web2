import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import PendingTeacher from '../models/PendingTeacher.js';

// Configuration du transporteur email avec les bonnes informations
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true pour 465, false pour les autres ports
  auth: {
    user: 'noreply.cybermathia@gmail.com',
    pass: 'zayf pfpp iatp dmwm'
  },
  tls: {
    rejectUnauthorized: false
  },
  debug: true, // Active les logs détaillés
  logger: true // Active le logging
});

// Vérifier la configuration du transporteur au démarrage
transporter.verify((error, success) => {
  if (error) {
    console.error('Erreur de configuration email:', error);
  } else {
    console.log('Serveur prêt à envoyer des emails');
  }
});

const managerController = {
  // Récupérer la liste des professeurs
  getTeachers: async (req, res) => {
    try {
      const teachers = await User.find({ role: 'teacher' }).sort({ createdAt: -1 });
      res.json(teachers);
    } catch (error) {
      console.error('Erreur lors de la récupération des professeurs:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération des professeurs' });
    }
  },

  // Créer un nouveau professeur
  createTeacher: async (req, res) => {
    try {
      console.log('Début de la création du professeur');
      const { firstName, lastName, email, speciality, level } = req.body;
      const managerId = req.user.userId;

      console.log('Données reçues:', { firstName, lastName, email, speciality, level, managerId });

      // Validation des données
      if (!firstName || !lastName || !email || !speciality || !level) {
        console.log('Données manquantes:', { firstName, lastName, email, speciality, level });
        return res.status(400).json({ message: 'Toutes les informations sont requises' });
      }

      // Vérifier si l'email existe déjà comme utilisateur
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          message: 'Cet email est déjà utilisé par un utilisateur existant',
          type: 'EMAIL_EXISTS'
        });
      }

      // Vérifier si une invitation est déjà en attente pour cet email
      const pendingInvitation = await PendingTeacher.findOne({ email });
      if (pendingInvitation) {
        return res.status(400).json({ 
          message: 'Une invitation est déjà en attente pour cet enseignant',
          type: 'PENDING_INVITATION'
        });
      }

      // Créer un token pour l'invitation
      const token = jwt.sign(
        { email, role: 'teacher', firstName, lastName, speciality, level },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Créer l'invitation en attente
      const pendingTeacher = new PendingTeacher({
        firstName,
        lastName,
        email,
        speciality,
        level,
        managerId,
        token
      });

      await pendingTeacher.save();
      console.log('Invitation enregistrée en base de données');

      // Construire l'URL d'inscription
      const inviteUrl = `http://localhost:3000/complete-teacher-registration?token=${token}`;
      console.log('URL d\'invitation générée:', inviteUrl);

      // Envoyer l'email d'invitation avec gestion d'erreur améliorée
      try {
        console.log('Tentative d\'envoi d\'email à:', email);
        const mailOptions = {
          from: {
            name: 'CyberMathIA',
            address: 'noreply.cybermathia@gmail.com'
          },
          to: email,
          subject: 'Invitation à rejoindre CyberMathIA en tant que Professeur',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #4F46E5;">Bienvenue chez CyberMathIA !</h1>
              <p>Bonjour ${firstName},</p>
              <p>Vous avez été invité(e) à rejoindre l'équipe CyberMathIA en tant que Professeur.</p>
              <p>Pour finaliser la création de votre compte, veuillez cliquer sur le lien ci-dessous :</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" 
                   style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; display: inline-block;">
                  Finaliser mon inscription
                </a>
              </div>
              <p style="color: #666;">Ce lien expire dans 24 heures.</p>
            </div>
          `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email envoyé avec succès:', info.messageId);

        res.status(200).json({
          message: 'Invitation envoyée avec succès',
          email,
          messageId: info.messageId
        });

      } catch (emailError) {
        console.error('Erreur détaillée lors de l\'envoi de l\'email:', {
          error: emailError,
          stack: emailError.stack,
          code: emailError.code,
          command: emailError.command
        });

        // Supprimer l'invitation en cas d'échec
        await PendingTeacher.deleteOne({ _id: pendingTeacher._id });
        
        throw new Error(`Erreur lors de l'envoi de l'email: ${emailError.message}`);
      }

    } catch (error) {
      console.error('Erreur lors de la création du professeur:', error);
      res.status(500).json({ 
        message: 'Erreur lors de l\'envoi de l\'invitation',
        error: error.message,
        type: 'SERVER_ERROR'
      });
    }
  }
};

export default managerController; 
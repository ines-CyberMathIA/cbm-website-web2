import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
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
      console.log('Données reçues pour la création du professeur:', req.body);
      const { firstName, lastName, email, speciality, level } = req.body;

      // Validation des données
      if (!firstName || !lastName || !email || !speciality || !level) {
        console.error('Données manquantes:', { firstName, lastName, email, speciality, level });
        return res.status(400).json({ 
          message: 'Toutes les informations sont requises',
          received: { firstName, lastName, email, speciality, level }
        });
      }

      // Vérifier si l'email existe déjà
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log('Email déjà utilisé:', email);
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }

      // Créer un token temporaire pour l'inscription
      const inviteToken = jwt.sign(
        { 
          email, 
          role: 'teacher', 
          firstName, 
          lastName,
          speciality,
          level 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Construire l'URL d'inscription
      const inviteUrl = `http://localhost:3000/complete-teacher-registration?token=${inviteToken}`;
      console.log('URL d\'invitation générée:', inviteUrl);

      // Envoyer l'email d'invitation
      await transporter.sendMail({
        from: 'CyberMathIA <cybermathia@gmail.com>',
        to: email,
        subject: 'Invitation à rejoindre CyberMathIA en tant que Professeur',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #059669;">Bienvenue chez CyberMathIA !</h1>
            <p>Bonjour ${firstName},</p>
            <p>Vous avez été invité(e) à rejoindre l'équipe CyberMathIA en tant que Professeur.</p>
            <p>Pour finaliser la création de votre compte, veuillez cliquer sur le lien ci-dessous :</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Finaliser mon inscription
              </a>
            </div>
            <p style="color: #666;">Ce lien expire dans 24 heures.</p>
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
              Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email.
            </p>
          </div>
        `
      });

      console.log('Email d\'invitation envoyé avec succès à:', email);

      res.status(200).json({
        message: 'Invitation envoyée avec succès',
        email
      });
    } catch (error) {
      console.error('Erreur détaillée lors de la création du professeur:', error);
      console.error('Stack trace:', error.stack);
      res.status(500).json({ 
        message: 'Erreur lors de l\'envoi de l\'invitation',
        details: error.message
      });
    }
  }
};

export default managerController; 
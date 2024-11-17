import express from 'express';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const router = express.Router();

// Configuration du transporteur email (comme dans adminController)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Récupérer tous les professeurs créés par le manager
router.get('/my-teachers', authMiddleware, async (req, res) => {
  try {
    const teachers = await User.find({ 
      createdBy: req.user._id,
      role: 'teacher'
    }).select('-password');

    res.json(teachers);
  } catch (error) {
    console.error('Erreur lors de la récupération des professeurs:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer un nouveau professeur
router.post('/create-teacher', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Générer un token d'invitation
    const inviteToken = jwt.sign(
      { 
        email, 
        role: 'teacher', 
        firstName, 
        lastName,
        createdBy: req.user._id  // Ajouter l'ID du manager
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Envoyer l'email d'invitation
    const inviteUrl = `http://localhost:3000/complete-teacher-registration?token=${inviteToken}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Invitation à rejoindre CyberMathIA en tant que Professeur',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4F46E5;">Bienvenue chez CyberMathIA !</h1>
          <p>Bonjour ${firstName},</p>
          <p>Vous avez été invité(e) à rejoindre l'équipe CyberMathIA en tant que Professeur.</p>
          <p>Pour finaliser la création de votre compte, veuillez cliquer sur le lien ci-dessous :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
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
    console.error('Erreur lors de la création du professeur:', error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'invitation' });
  }
});

export default router; 
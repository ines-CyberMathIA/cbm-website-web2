import express from 'express';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import PendingTeacher from '../models/PendingTeacher.js';

const router = express.Router();

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'noreply.cybermathia@gmail.com',  // Email en dur
    pass: 'zayf pfpp iatp dmwm'  // Mot de passe en dur
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Vérifier la configuration immédiatement
transporter.verify(function(error, success) {
  if (error) {
    console.error('Erreur de configuration email:', {
      error: error.message,
      code: error.code,
      command: error.command
    });
  } else {
    console.log('Configuration email réussie');
  }
});

// Récupérer tous les professeurs créés par le manager
router.get('/my-teachers', authMiddleware, async (req, res) => {
  try {
    console.log('Recherche des professeurs pour le manager:', {
      managerId: req.user._id,
      managerEmail: req.user.email
    });
    
    // Récupérer les professeurs actifs
    const activeTeachers = await User.find({ 
      createdBy: req.user._id,
      role: 'teacher'
    }).select('-password');

    console.log('Professeurs actifs trouvés:', {
      count: activeTeachers.length,
      teachers: activeTeachers.map(t => ({
        id: t._id,
        email: t.email,
        createdBy: t.createdBy
      }))
    });

    // Récupérer les invitations en attente
    const pendingTeachers = await PendingTeacher.find({
      managerId: req.user._id
    });

    console.log('Invitations en attente trouvées:', {
      count: pendingTeachers.length,
      pending: pendingTeachers.map(t => ({
        id: t._id,
        email: t.email,
        managerId: t.managerId
      }))
    });

    // Combiner les résultats
    const allTeachers = [
      ...activeTeachers.map(t => ({
        ...t.toObject(),
        status: 'active'
      })),
      ...pendingTeachers.map(t => ({
        _id: t._id,
        firstName: t.firstName,
        lastName: t.lastName,
        email: t.email,
        speciality: t.speciality,
        level: t.level,
        createdAt: t.createdAt,
        status: 'pending',
        expiresAt: new Date(t.createdAt.getTime() + 24*60*60*1000)
      }))
    ];

    console.log('Liste finale des professeurs:', {
      total: allTeachers.length,
      active: allTeachers.filter(t => t.status === 'active').length,
      pending: allTeachers.filter(t => t.status === 'pending').length
    });

    res.json(allTeachers);
  } catch (error) {
    console.error('Erreur détaillée lors de la récupération des professeurs:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Erreur serveur',
      details: error.message
    });
  }
});

// Créer un nouveau professeur
router.post('/create-teacher', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, email, speciality, level } = req.body;
    
    console.log('Création de professeur par le manager:', {
      managerId: req.user._id,
      managerEmail: req.user.email,
      teacherData: { firstName, lastName, email, speciality, level }
    });

    // Vérifier si l'email existe déjà dans les utilisateurs actifs
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Email déjà utilisé dans users:', email);
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Supprimer toute invitation en attente existante pour cet email
    await PendingTeacher.deleteOne({ email });
    console.log('Anciennes invitations supprimées pour:', email);

    // Vérifier les données requises
    if (!firstName || !lastName || !email) {
      console.log('Données manquantes');
      return res.status(400).json({ 
        message: 'Tous les champs sont requis',
        received: { firstName, lastName, email, speciality, level }
      });
    }

    // Vérifier la configuration email
    console.log('Configuration email:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      user: process.env.EMAIL_USER,
      hasPassword: !!process.env.EMAIL_PASSWORD
    });

    // Tester la connexion SMTP avant d'envoyer
    try {
      await transporter.verify();
      console.log('Connexion SMTP vérifiée avec succès');
    } catch (smtpError) {
      console.error('Erreur de connexion SMTP:', smtpError);
      return res.status(500).json({
        message: 'Erreur de configuration email',
        details: smtpError.message
      });
    }

    // Générer le token
    const inviteToken = jwt.sign(
      { 
        email, 
        role: 'teacher', 
        firstName, 
        lastName,
        speciality: speciality || 'mathematics',
        level: level || ['college'],
        createdBy: req.user._id
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Créer l'invitation en attente
    const pendingTeacher = new PendingTeacher({
      firstName,
      lastName,
      email,
      speciality: speciality || 'mathematics',
      level: level || ['college'],
      managerId: req.user._id,
      token: inviteToken
    });

    await pendingTeacher.save();

    console.log('Token créé avec les données:', {
      email,
      role: 'teacher',
      firstName,
      lastName,
      speciality: speciality || 'mathematics',
      level: level || ['college'],
      createdBy: req.user._id,
      managerId: req.user._id,
      managerEmail: req.user.email
    });

    const inviteUrl = `http://localhost:3000/complete-teacher-registration?token=${inviteToken}`;
    console.log('URL d\'invitation générée:', inviteUrl);

    // Envoyer l'email
    try {
      const mailOptions = {
        from: {
          name: 'CyberMathIA',
          address: process.env.EMAIL_USER
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
              <a href="${inviteUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Finaliser mon inscription
              </a>
            </div>
            <p style="color: #666;">Ce lien expire dans 24 heures.</p>
          </div>
        `
      };

      console.log('Tentative d\'envoi d\'email avec:', {
        to: email,
        from: mailOptions.from,
        auth: {
          user: process.env.EMAIL_USER,
          hasPassword: !!process.env.EMAIL_PASSWORD
        }
      });

      const info = await transporter.sendMail(mailOptions);
      
      console.log('Email envoyé avec succès:', {
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected
      });

      res.status(200).json({
        message: 'Invitation envoyée avec succès',
        pendingTeacher: {
          id: pendingTeacher._id,
          email: pendingTeacher.email,
          expiresAt: new Date(pendingTeacher.createdAt.getTime() + 24*60*60*1000)
        }
      });
    } catch (emailError) {
      console.error('Erreur détaillée lors de l\'envoi de l\'email:', {
        name: emailError.name,
        message: emailError.message,
        code: emailError.code,
        command: emailError.command,
        stack: emailError.stack
      });

      res.status(500).json({
        message: 'Erreur lors de l\'envoi de l\'email',
        details: emailError.message,
        code: emailError.code
      });
    }
  } catch (error) {
    console.error('Erreur complète:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    res.status(500).json({
      message: 'Erreur lors de l\'envoi de l\'invitation',
      details: error.message
    });
  }
});

// Supprimer une invitation en attente
router.delete('/pending-teachers/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Suppression de l\'invitation en attente:', id);

    const pendingTeacher = await PendingTeacher.findOne({
      _id: id,
      managerId: req.user._id
    });

    if (!pendingTeacher) {
      return res.status(404).json({ message: 'Invitation non trouvée' });
    }

    await PendingTeacher.deleteOne({ _id: id });
    console.log('Invitation supprimée avec succès');

    res.json({ message: 'Invitation supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'invitation:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'invitation' });
  }
});

export default router; 
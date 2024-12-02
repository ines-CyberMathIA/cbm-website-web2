import express from 'express';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import PendingTeacher from '../models/PendingTeacher.js';
import TeacherAvailability from '../models/TeacherAvailability.js';
import Message from '../models/Message.js';

const router = express.Router();

// Configuration du transporteur email avec plus de logs et de gestion d'erreurs
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'noreply.cybermathia@gmail.com',
    pass: 'zayf pfpp iatp dmwm'
  },
  debug: true, // Active les logs détaillés
  logger: true, // Active le logging
  tls: {
    rejectUnauthorized: false
  },
  maxConnections: 5,
  maxMessages: 10,
  pool: true // Active le pool de connexions
});

// Vérifier la configuration immédiatement
transporter.verify(function(error, success) {
  if (error) {
    console.error('Erreur de configuration email:', {
      error: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
  } else {
    console.log('Configuration email réussie:', success);
  }
});

// Récupérer tous les professeurs créés par le manager
router.get('/my-teachers', authMiddleware, async (req, res) => {
  try {
    console.log('Recherche des professeurs pour le manager:', {
      managerId: req.user.userId
    });
    
    // Récupérer les professeurs actifs
    const activeTeachers = await User.find({ 
      createdBy: req.user.userId,
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
      managerId: req.user.userId
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
    
    console.log('\n=== Début de création de professeur ===');
    console.log('Données reçues:', {
      firstName,
      lastName,
      email,
      speciality,
      level,
      managerId: req.user.userId
    });

    // 1. Vérification de l'email dans la base des professeurs
    const existingTeacherByEmail = await User.findOne({ 
      email,
      role: 'teacher'
    });

    if (existingTeacherByEmail) {
      console.log('Email déjà utilisé par un professeur:', email);
      return res.status(400).json({ 
        message: 'Cette adresse email est déjà utilisée par un professeur' 
      });
    }

    // 2. Vérification du couple (Nom, Prénom) dans la base des professeurs
    const existingTeacherByName = await User.findOne({
      firstName: { $regex: new RegExp(`^${firstName}$`, 'i') },
      lastName: { $regex: new RegExp(`^${lastName}$`, 'i') },
      role: 'teacher'
    });

    if (existingTeacherByName) {
      console.log('Nom et prénom déjà utilisés:', { firstName, lastName });
      return res.status(400).json({ 
        message: 'Un professeur avec ce nom et ce prénom existe déjà' 
      });
    }

    // 3. Vérification des invitations en attente par email
    const pendingInvitationByEmail = await PendingTeacher.findOne({ email });
    if (pendingInvitationByEmail) {
      console.log('Invitation existante trouvée par email:', {
        email,
        invitingManagerId: pendingInvitationByEmail.managerId
      });

      const invitingManager = await User.findById(pendingInvitationByEmail.managerId);
      return res.status(403).json({ 
        message: `Ce professeur a déjà été invité par ${invitingManager.firstName} ${invitingManager.lastName}`,
        alreadyInvited: true,
        invitingManager: {
          firstName: invitingManager.firstName,
          lastName: invitingManager.lastName
        }
      });
    }

    // 4. Vérification des invitations en attente par nom/prénom
    const pendingInvitationByName = await PendingTeacher.findOne({
      firstName: { $regex: new RegExp(`^${firstName}$`, 'i') },
      lastName: { $regex: new RegExp(`^${lastName}$`, 'i') }
    });

    if (pendingInvitationByName) {
      console.log('Invitation existante trouvée par nom/prénom:', {
        firstName,
        lastName,
        invitingManagerId: pendingInvitationByName.managerId
      });

      const invitingManager = await User.findById(pendingInvitationByName.managerId);
      return res.status(403).json({ 
        message: `Un professeur avec ce nom et ce prénom a déjà été invité par ${invitingManager.firstName} ${invitingManager.lastName}`,
        alreadyInvited: true,
        invitingManager: {
          firstName: invitingManager.firstName,
          lastName: invitingManager.lastName
        }
      });
    }

    // Si toutes les vérifications sont passées, on continue avec la création...
    // ... reste du code inchangé ...

  } catch (error) {
    console.error('Erreur lors de la création du professeur:', {
      error: error.message,
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

// Ajouter cette nouvelle route
router.get('/teacher/:teacherId/availabilities', authMiddleware, async (req, res) => {
  try {
    const { teacherId } = req.params;
    console.log('Récupération des disponibilités pour le professeur:', teacherId);

    const availabilities = await TeacherAvailability.find({ teacherId });
    console.log('Disponibilités trouvées:', availabilities);

    res.json(availabilities);
  } catch (error) {
    console.error('Erreur lors de la récupération des disponibilités:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les messages avec un professeur
router.get('/messages/:teacherId', authMiddleware, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: teacherId },
        { sender: teacherId, receiver: req.user._id }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'firstName lastName role');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des messages' });
  }
});

// Envoyer un message à un professeur
router.post('/messages/:teacherId', authMiddleware, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { content } = req.body;

    const message = new Message({
      sender: req.user._id,
      receiver: teacherId,
      content
    });

    await message.save();
    
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'firstName lastName role');

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'envoi du message' });
  }
});

// Marquer les messages comme lus
router.put('/messages/:teacherId/read', authMiddleware, async (req, res) => {
  try {
    const { teacherId } = req.params;
    await Message.updateMany(
      { sender: teacherId, receiver: req.user._id, read: false },
      { read: true }
    );
    res.json({ message: 'Messages marqués comme lus' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour des messages' });
  }
});

// Ajouter cette route pour renvoyer une invitation
router.post('/resend-invitation/:teacherId', authMiddleware, async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    // Récupérer l'invitation en attente
    const pendingTeacher = await PendingTeacher.findOne({
      _id: teacherId,
      managerId: req.user.userId
    });

    if (!pendingTeacher) {
      return res.status(404).json({ message: 'Invitation non trouvée' });
    }

    // Générer un nouveau token
    const inviteToken = jwt.sign(
      { 
        email: pendingTeacher.email, 
        role: 'teacher', 
        firstName: pendingTeacher.firstName, 
        lastName: pendingTeacher.lastName,
        speciality: pendingTeacher.speciality,
        level: pendingTeacher.level,
        createdBy: req.user.userId
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Mettre à jour le token dans l'invitation
    pendingTeacher.token = inviteToken;
    await pendingTeacher.save();

    // Générer le lien d'invitation
    const inviteUrl = `http://localhost:3000/complete-teacher-registration?token=${inviteToken}`;

    // Envoyer le nouvel email
    await transporter.sendMail({
      from: {
        name: 'CyberMathIA',
        address: process.env.EMAIL_USER
      },
      to: pendingTeacher.email,
      subject: 'Nouvelle invitation à rejoindre CyberMathIA en tant que Professeur',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4F46E5;">Bienvenue chez CyberMathIA !</h1>
          <p>Bonjour ${pendingTeacher.firstName},</p>
          <p>Voici un nouveau lien pour finaliser la création de votre compte professeur :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Finaliser mon inscription
            </a>
          </div>
          <p style="color: #666;">Ce lien expire dans 24 heures.</p>
        </div>
      `
    });

    res.json({ 
      message: 'Invitation renvoyée avec succès',
      email: pendingTeacher.email
    });

  } catch (error) {
    console.error('Erreur lors du renvoi de l\'invitation:', error);
    res.status(500).json({ 
      message: 'Erreur lors du renvoi de l\'invitation',
      details: error.message 
    });
  }
});

// Modifier la route d'annulation d'invitation
router.delete('/cancel-invitation/:teacherId', authMiddleware, async (req, res) => {
  try {
    const { teacherId } = req.params;
    console.log('\n=== Début de l\'annulation d\'invitation ===');
    console.log('Paramètres reçus:', {
      teacherId,
      managerId: req.user.userId,
      headers: req.headers
    });
    
    // Vérifier que l'invitation existe et appartient au manager
    const pendingTeacher = await PendingTeacher.findOne({
      _id: teacherId,
      managerId: req.user.userId
    });

    console.log('Recherche de l\'invitation:', {
      found: !!pendingTeacher,
      teacherDetails: pendingTeacher ? {
        email: pendingTeacher.email,
        firstName: pendingTeacher.firstName,
        managerId: pendingTeacher.managerId
      } : null
    });

    if (!pendingTeacher) {
      console.log('Invitation non trouvée ou non autorisée');
      return res.status(404).json({ 
        message: 'Invitation non trouvée ou non autorisée',
        details: {
          searchedId: teacherId,
          searchedManagerId: req.user.userId
        }
      });
    }

    // Envoyer l'email d'annulation
    try {
      console.log('Tentative d\'envoi de l\'email d\'annulation');
      await transporter.sendMail({
        from: {
          name: 'CyberMathIA',
          address: process.env.EMAIL_USER || 'noreply.cybermathia@gmail.com'
        },
        to: pendingTeacher.email,
        subject: 'Annulation de votre invitation CyberMathIA',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4F46E5;">Information importante</h1>
            <p>Bonjour ${pendingTeacher.firstName},</p>
            <p>Nous vous informons que votre invitation à rejoindre CyberMathIA a été annulée.</p>
            <p>Le lien d'activation précédent n'est plus valide.</p>
            <p style="color: #666;">Si vous pensez qu'il s'agit d'une erreur, veuillez contacter votre manager.</p>
          </div>
        `
      });
      console.log('Email d\'annulation envoyé avec succès');
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email d\'annulation:', {
        error: emailError.message,
        code: emailError.code
      });
      // On continue même si l'email échoue
    }

    // Supprimer l'invitation
    console.log('Tentative de suppression de l\'invitation');
    const result = await PendingTeacher.deleteOne({
      _id: teacherId,
      managerId: req.user.userId
    });

    console.log('Résultat de la suppression:', {
      acknowledged: result.acknowledged,
      deletedCount: result.deletedCount
    });

    if (result.deletedCount === 0) {
      throw new Error('Échec de la suppression de l\'invitation');
    }

    console.log('=== Fin de l\'annulation d\'invitation ===\n');
    res.json({ 
      message: 'Invitation annulée avec succès',
      teacherId,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Erreur lors de l\'annulation de l\'invitation:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      teacherId: req.params.teacherId,
      managerId: req.user?.userId
    });

    res.status(500).json({ 
      message: 'Erreur lors de l\'annulation de l\'invitation',
      details: error.message
    });
  }
});

export default router; 
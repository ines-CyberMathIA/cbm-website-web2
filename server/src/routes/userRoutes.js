import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';
import PendingManager from '../models/PendingManager.js';

const router = express.Router();

// Route d'inscription
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Créer le nouvel utilisateur
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role
    });

    await user.save();

    // Générer le token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    res.status(500).json({ message: 'Erreur lors de l\'inscription' });
  }
});

// Route de connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Trouver l'utilisateur
    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Générer le token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
});

// Route de vérification d'email
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    const exists = await User.exists({ email });
    res.json({ exists: !!exists });
  } catch (error) {
    console.error('Erreur de vérification d\'email:', error);
    res.status(500).json({ message: 'Erreur lors de la vérification de l\'email' });
  }
});

// Vérification du token manager
router.post('/verify-manager-token', async (req, res) => {
  try {
    const { token } = req.body;
    console.log('Vérification du token manager:', token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token décodé:', decoded);

    // Vérifier que l'invitation existe toujours dans la base de données
    const pendingManager = await PendingManager.findOne({ 
      email: decoded.data.email,
      token: token 
    });

    if (!pendingManager) {
      console.log('Invitation non trouvée ou annulée pour:', decoded.data.email);
      return res.status(401).json({ 
        message: 'Cette invitation n\'est plus valide ou a été annulée'
      });
    }

    // Accéder aux données dans la structure correcte
    const { firstName, lastName, email } = decoded.data;

    res.json({
      firstName,
      lastName,
      email
    });
  } catch (error) {
    console.error('Erreur de vérification du token:', error);
    res.status(401).json({ 
      message: 'Token invalide ou expiré',
      details: error.message 
    });
  }
});

// Finalisation de l'inscription manager
router.post('/complete-manager-registration', async (req, res) => {
  try {
    const { token, password } = req.body;
    console.log('Finalisation inscription manager avec token');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Données décodées du token:', decoded);

    // Vérifier que l'invitation existe toujours
    const pendingManager = await PendingManager.findOne({ 
      email: decoded.data.email,
      token: token 
    });

    if (!pendingManager) {
      console.log('Invitation non trouvée ou annulée pour:', decoded.data.email);
      return res.status(401).json({ 
        message: 'Cette invitation n\'est plus valide ou a été annulée'
      });
    }

    // Accéder aux données dans la structure correcte
    const { firstName, lastName, email, role } = decoded.data;

    // Créer le compte manager
    const manager = new User({
      firstName,
      lastName,
      email,
      password,
      role
    });

    const savedManager = await manager.save();

    // Supprimer l'invitation en attente
    await PendingManager.findByIdAndDelete(pendingManager._id);

    // Générer le token de connexion
    const authToken = jwt.sign(
      { userId: savedManager._id, role: 'manager' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token: authToken,
      user: {
        id: savedManager._id,
        firstName: savedManager.firstName,
        lastName: savedManager.lastName,
        email: savedManager.email,
        role: savedManager.role
      }
    });
  } catch (error) {
    console.error('Erreur détaillée lors de la création du compte:', error);
    res.status(400).json({ 
      message: 'Erreur lors de la création du compte',
      details: error.message
    });
  }
});

// Vérification du token professeur
router.post('/verify-teacher-token', async (req, res) => {
  try {
    const { token } = req.body;
    console.log('Token reçu:', token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token décodé:', decoded);

    res.json({
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      email: decoded.email,
      speciality: decoded.speciality,
      level: decoded.level,
      createdBy: decoded.createdBy
    });
  } catch (error) {
    console.error('Erreur de vérification du token:', error);
    res.status(401).json({ 
      message: 'Token invalide ou expiré',
      details: error.message 
    });
  }
});

// Finalisation de l'inscription professeur
router.post('/complete-teacher-registration', async (req, res) => {
  try {
    const { token, password } = req.body;
    console.log('Finalisation inscription professeur avec token');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Données décodées du token:', {
      ...decoded,
      createdBy: decoded.createdBy
    });

    // Créer le compte professeur
    const teacher = new User({
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      email: decoded.email,
      password: password,
      role: 'teacher',
      speciality: decoded.speciality || 'mathematics',
      level: decoded.level || ['college'],
      createdBy: decoded.createdBy
    });

    console.log('Création du compte professeur avec les données:', {
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      role: teacher.role,
      speciality: teacher.speciality,
      level: teacher.level,
      createdBy: teacher.createdBy
    });

    const savedTeacher = await teacher.save();
    console.log('Professeur sauvegardé avec succès:', {
      id: savedTeacher._id,
      email: savedTeacher.email,
      createdBy: savedTeacher.createdBy
    });

    // Générer le token de connexion
    const authToken = jwt.sign(
      { userId: savedTeacher._id, role: 'teacher' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token: authToken,
      user: {
        id: savedTeacher._id,
        firstName: savedTeacher.firstName,
        lastName: savedTeacher.lastName,
        email: savedTeacher.email,
        role: savedTeacher.role,
        speciality: savedTeacher.speciality,
        level: savedTeacher.level
      }
    });
  } catch (error) {
    console.error('Erreur détaillée lors de la création du compte:', error);
    res.status(400).json({ 
      message: 'Erreur lors de la création du compte',
      details: error.message,
      stack: error.stack
    });
  }
});

export default router; 
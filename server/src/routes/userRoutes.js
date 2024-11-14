import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Route pour créer un utilisateur
router.post('/register', async (req, res) => {
  try {
    console.log('=== Début de l\'inscription ===');
    console.log('Données reçues:', req.body);

    const { role, email, password, firstName, lastName } = req.body;

    // Vérification des champs requis
    if (!role || !email || !password || !firstName || !lastName) {
      console.log('Champs manquants:', { role, email, firstName, lastName });
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Email déjà utilisé:', email);
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe
    console.log('Hashage du mot de passe...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Mot de passe hash�� avec succès');

    // Créer le nouvel utilisateur
    const user = new User({
      role,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      ...(role === 'student' && { studentFields: { level: '' } }),
      ...(role === 'parent' && { parentFields: { children: [] } })
    });

    console.log('Tentative de sauvegarde de l\'utilisateur...');
    await user.save();
    console.log('Utilisateur sauvegardé avec succès:', user._id);

    // Vérification du JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET non défini');
      throw new Error('Configuration JWT manquante');
    }

    // Création du token JWT avec vérification
    console.log('Création du token JWT avec secret:', process.env.JWT_SECRET ? 'présent' : 'manquant');
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    console.log('Token JWT créé avec succès');

    // Envoyer la réponse
    res.status(201).json({
      message: 'Compte créé avec succès',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      },
      token
    });

    console.log('=== Inscription terminée avec succès ===');

  } catch (error) {
    console.error('=== Erreur lors de l\'inscription ===');
    console.error('Type d\'erreur:', error.name);
    console.error('Message d\'erreur:', error.message);
    console.error('Stack trace:', error.stack);
    console.error('JWT_SECRET présent:', !!process.env.JWT_SECRET);
    
    res.status(500).json({ 
      message: 'Erreur lors de la création du compte',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Route pour la connexion
router.post('/login', async (req, res) => {
  try {
    console.log('=== Tentative de connexion ===');
    console.log('Données reçues:', req.body);

    const { email, password, role } = req.body;

    // Vérification des champs requis
    if (!email || !password || !role) {
      console.log('Champs manquants:', { email: !!email, password: !!password, role: !!role });
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    // Recherche de l'utilisateur
    const user = await User.findOne({ email, role });
    console.log('Utilisateur trouvé:', user ? 'Oui' : 'Non');

    if (!user) {
      console.log('Utilisateur non trouvé avec email:', email, 'et rôle:', role);
      return res.status(401).json({ 
        message: 'Email ou rôle incorrect',
        details: 'Aucun utilisateur trouvé avec ces identifiants'
      });
    }

    // Vérification du mot de passe
    console.log('Vérification du mot de passe...');
    const isValidPassword = await user.comparePassword(password);
    console.log('Mot de passe valide:', isValidPassword);

    if (!isValidPassword) {
      console.log('Mot de passe invalide pour l\'utilisateur:', email);
      return res.status(401).json({ 
        message: 'Mot de passe incorrect',
        details: 'Le mot de passe fourni ne correspond pas'
      });
    }

    // Création du token JWT
    console.log('Création du token JWT...');
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    console.log('Token JWT créé avec succès');

    // Envoi de la réponse
    res.json({
      message: 'Connexion réussie',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      },
      token
    });

    console.log('=== Connexion réussie ===');

  } catch (error) {
    console.error('=== Erreur lors de la connexion ===');
    console.error('Type d\'erreur:', error.name);
    console.error('Message d\'erreur:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Erreur lors de la connexion',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Route pour supprimer un utilisateur (pour les tests)
router.delete('/delete', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Tentative de suppression de l\'utilisateur:', email);
    
    const result = await User.deleteOne({ email });
    console.log('Résultat de la suppression:', result);

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur' });
  }
});

// Route pour vérifier si un email existe déjà
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    const existingUser = await User.findOne({ email });
    res.json({ exists: !!existingUser });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la vérification de l\'email' });
  }
});

export default router; 
import express from 'express';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Route pour créer un enfant
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, birthDate, schoolLevel } = req.body;
    
    console.log('1. Données reçues:', { firstName, lastName, birthDate, schoolLevel });
    console.log('2. Utilisateur connecté:', {
      id: req.user._id,
      role: req.user.role,
      email: req.user.email
    });
    
    // Vérifier que l'utilisateur connecté est bien un parent
    if (req.user.role !== 'parent') {
      console.log('3. Erreur: L\'utilisateur n\'est pas un parent');
      return res.status(403).json({ message: 'Seuls les parents peuvent ajouter des enfants' });
    }

    // Générer un login unique pour l'enfant
    const baseLogin = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    const login = `${baseLogin}.${Date.now()}`;
    console.log('4. Login généré:', login);

    // Générer et hasher un mot de passe temporaire
    const temporaryPassword = 'ChangeMe123!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(temporaryPassword, salt);
    console.log('5. Mot de passe temporaire hashé');

    // Créer le compte enfant
    const childData = {
      firstName,
      lastName,
      login,
      role: 'student',
      parentId: req.user._id,
      password: hashedPassword,
      level: [schoolLevel],
      birthDate
    };

    console.log('6. Données de l\'enfant à créer:', childData);

    const child = new User(childData);
    console.log('7. Instance User créée');

    // Validation du modèle
    const validationError = child.validateSync();
    if (validationError) {
      console.error('8. Erreur de validation:', validationError);
      return res.status(400).json({
        message: 'Données invalides',
        errors: validationError.errors
      });
    }

    console.log('9. Validation réussie, tentative de sauvegarde...');
    const savedChild = await child.save();
    console.log('10. Enfant créé avec succès:', {
      id: savedChild._id,
      login: savedChild.login,
      role: savedChild.role
    });

    res.status(201).json({
      message: 'Enfant ajouté avec succès',
      child: {
        id: savedChild._id,
        firstName: savedChild.firstName,
        lastName: savedChild.lastName,
        schoolLevel: savedChild.level[0]
      }
    });

  } catch (error) {
    console.error('Erreur complète:', {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack
    });

    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Un compte existe déjà avec ces informations',
        error: error.message
      });
    }

    res.status(500).json({ 
      message: 'Erreur lors de la création de l\'enfant',
      error: error.message,
      details: error.stack
    });
  }
});

export default router; 
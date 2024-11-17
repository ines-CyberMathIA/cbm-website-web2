import express from 'express';
import TeacherAvailability from '../models/TeacherAvailability.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Récupérer les disponibilités d'un professeur
router.get('/availabilities', authMiddleware, async (req, res) => {
  try {
    console.log('Récupération des disponibilités pour le professeur:', req.user._id);
    const availabilities = await TeacherAvailability.find({ teacherId: req.user._id });
    console.log('Disponibilités trouvées:', availabilities.length);
    res.json(availabilities);
  } catch (error) {
    console.error('Erreur lors de la récupération des disponibilités:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Sauvegarder les disponibilités
router.post('/availabilities', authMiddleware, async (req, res) => {
  try {
    console.log('Sauvegarde des disponibilités pour le professeur:', req.user._id);
    const { availabilities } = req.body;
    
    if (!Array.isArray(availabilities)) {
      return res.status(400).json({ message: 'Format de données invalide' });
    }

    console.log('Suppression des anciennes disponibilités');
    await TeacherAvailability.deleteMany({ teacherId: req.user._id });
    
    console.log('Création des nouvelles disponibilités:', availabilities.length);
    const newAvailabilities = availabilities.map(slot => ({
      teacherId: req.user._id,
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime
    }));
    
    const saved = await TeacherAvailability.insertMany(newAvailabilities);
    console.log('Disponibilités sauvegardées:', saved.length);
    
    res.json({ 
      message: 'Disponibilités sauvegardées avec succès',
      count: saved.length 
    });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des disponibilités:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});

export default router; 
import express from 'express';
import TeacherAvailability from '../models/TeacherAvailability.js';
import Message from '../models/Message.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Récupérer les disponibilités d'un professeur
router.get('/availabilities', authMiddleware, async (req, res) => {
  try {
    console.log('Récupération des disponibilités pour le professeur:', req.user._id);
    const availabilities = await TeacherAvailability.find({ teacherId: req.user._id });
    console.log('Disponibilités trouvées:', availabilities);
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

    console.log('Plages horaires reçues:', availabilities.map(slot => ({
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: (new Date(`2000-01-01T${slot.endTime}`) - new Date(`2000-01-01T${slot.startTime}`)) / (1000 * 60)
    })));

    // Vérifier que chaque plage fait au moins 1h30
    const isValid = availabilities.every(slot => {
      const start = new Date(`2000-01-01T${slot.startTime}`);
      const end = new Date(`2000-01-01T${slot.endTime}`);
      const duration = (end - start) / (1000 * 60); // durée en minutes
      
      if (duration < 90) {
        console.log('Plage invalide détectée:', {
          day: slot.day,
          startTime: slot.startTime,
          endTime: slot.endTime,
          duration: duration
        });
        return false;
      }
      return true;
    });

    if (!isValid) {
      console.log('Validation échouée: plages horaires invalides');
      return res.status(400).json({ 
        message: 'Les plages horaires doivent faire au moins 1h30'
      });
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
    console.log('Disponibilités sauvegardées:', saved);
    
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

// Récupérer les messages avec le manager
router.get('/messages', authMiddleware, async (req, res) => {
  try {
    // Trouver le manager associé au professeur
    const messages = await Message.find({
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'firstName lastName role')
    .populate('receiver', 'firstName lastName role');

    res.json(messages);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des messages' });
  }
});

// Envoyer un message au manager
router.post('/messages/:managerId', authMiddleware, async (req, res) => {
  try {
    const { managerId } = req.params;
    const { content } = req.body;

    const message = new Message({
      sender: req.user._id,
      receiver: managerId,
      content
    });

    await message.save();
    
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'firstName lastName role')
      .populate('receiver', 'firstName lastName role');

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi du message' });
  }
});

// Marquer les messages comme lus
router.put('/messages/:managerId/read', authMiddleware, async (req, res) => {
  try {
    const { managerId } = req.params;
    await Message.updateMany(
      { sender: managerId, receiver: req.user._id, read: false },
      { read: true }
    );
    res.json({ message: 'Messages marqués comme lus' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des messages:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour des messages' });
  }
});

export default router; 
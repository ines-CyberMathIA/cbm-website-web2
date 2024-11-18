import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { isManager } from '../middleware/roles.js';

const router = express.Router();

// Obtenir la liste des professeurs
router.get('/teachers', authenticateToken, isManager, async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher', status: 'active' });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir la liste des professeurs en attente
router.get('/pending-teachers', authenticateToken, isManager, async (req, res) => {
  try {
    const pendingTeachers = await User.find({ role: 'teacher', status: 'pending' });
    res.json(pendingTeachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approuver un professeur
router.post('/approve-teacher/:id', authenticateToken, isManager, async (req, res) => {
  try {
    const teacher = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    );
    res.json(teacher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Rejeter un professeur
router.post('/reject-teacher/:id', authenticateToken, isManager, async (req, res) => {
  try {
    const teacher = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    res.json(teacher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtenir les disponibilités d'un professeur
router.get('/teacher/:id/availabilities', authenticateToken, isManager, async (req, res) => {
  try {
    const availabilities = await Availability.find({ teacher: req.params.id });
    res.json(availabilities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 
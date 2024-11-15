import express from 'express';
import managerController from '../controllers/managerController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import managerMiddleware from '../middleware/managerMiddleware.js';

const router = express.Router();

// Routes protégées nécessitant une authentification manager
router.get('/teachers', authMiddleware, managerMiddleware, managerController.getTeachers);
router.post('/create-teacher', authMiddleware, managerMiddleware, async (req, res) => {
  try {
    console.log('Requête reçue pour créer un professeur:', req.body);
    await managerController.createTeacher(req, res);
  } catch (error) {
    console.error('Erreur dans la route create-teacher:', error);
    res.status(500).json({
      message: 'Erreur lors de la création du professeur',
      error: error.message,
      stack: error.stack
    });
  }
});

export default router; 
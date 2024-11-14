import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Route pour créer un utilisateur
router.post('/register', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Autres routes pour gérer les utilisateurs...

export default router; 
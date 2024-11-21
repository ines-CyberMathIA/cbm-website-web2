import express from 'express';
import adminController from '../controllers/adminController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = express.Router();

// Routes publiques pour l'authentification admin
router.post('/login', adminController.login);
router.post('/verify-2fa', adminController.verifyTwoFactor);

// Routes protégées nécessitant une authentification admin
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const stats = await adminController.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
  }
});

router.get('/connections', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const connections = await adminController.getConnections();
    res.json(connections);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des connexions' });
  }
});

router.get('/users/:role', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await adminController.getUsersByRole(req.params.role);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
  }
});

router.post('/create-manager', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await adminController.createManager(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du manager' });
  }
});

router.delete('/users/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await adminController.deleteUser(req.params.userId);
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur' });
  }
});

export default router; 
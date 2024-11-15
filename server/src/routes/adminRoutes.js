import express from 'express';
import adminController from '../controllers/adminController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = express.Router();

// Routes publiques pour l'authentification admin
router.post('/login', adminController.login);
router.post('/verify-2fa', adminController.verifyTwoFactor);

// Routes protégées nécessitant une authentification admin
router.get('/stats', authMiddleware, adminMiddleware, adminController.getStats);
router.get('/connections', authMiddleware, adminMiddleware, adminController.getConnections);
router.get('/users/:role', authMiddleware, adminMiddleware, adminController.getUsersByRole);

// Ajouter cette route
router.post('/create-manager', authMiddleware, adminMiddleware, adminController.createManager);

export default router; 
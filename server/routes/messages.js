const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const messagesController = require('../controllers/messagesController');

// Routes pour les messages
router.get('/channels', auth, messagesController.getChannels); // Liste tous les canaux
router.get('/channel/:channelId', auth, messagesController.getChannelMessages); // Messages d'un canal
router.post('/channel', auth, messagesController.createChannel); // Crée un nouveau canal
router.post('/send', auth, messagesController.sendMessage); // Envoie un message
router.post('/markAsRead', auth, messagesController.markAsRead); // Marque comme lu

module.exports = router; 
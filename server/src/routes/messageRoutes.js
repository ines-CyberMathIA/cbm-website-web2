import express from 'express';
import Message from '../models/Message.js';
import MessageChannel from '../models/MessageChannel.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Récupérer les messages d'un canal
router.get('/channel/:channelId/messages', authMiddleware, async (req, res) => {
  try {
    const { channelId } = req.params;
    console.log('📨 Tentative de récupération des messages pour le canal:', channelId);

    // Vérifier que l'utilisateur a accès au canal
    const channel = await MessageChannel.findOne({
      _id: channelId,
      $or: [
        { manager: req.user.userId },
        { teacher: req.user.userId }
      ]
    });

    if (!channel) {
      console.log('❌ Canal non trouvé ou accès non autorisé');
      return res.status(403).json({ 
        message: "Accès non autorisé à ce canal",
        details: {
          channelId,
          userId: req.user.userId,
          userRole: req.user.role
        }
      });
    }

    console.log('✅ Canal trouvé, récupération des messages');

    // Récupérer les messages
    const messages = await Message.find({ channelId })
      .sort({ createdAt: -1 })
      .populate('sender', 'firstName lastName role')
      .limit(50)
      .lean(); // Pour de meilleures performances

    console.log(`📬 ${messages.length} messages trouvés`);

    // Ajouter des informations de débogage dans la réponse en développement
    if (process.env.NODE_ENV === 'development') {
      res.json({
        messages,
        debug: {
          channelId,
          userId: req.user.userId,
          userRole: req.user.role,
          messageCount: messages.length
        }
      });
    } else {
      res.json(messages);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des messages:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Créer un nouveau message
router.post('/channel/:channelId/messages', authMiddleware, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { content } = req.body;

    // Vérifier l'accès au canal
    const channel = await MessageChannel.findOne({
      _id: channelId,
      $or: [
        { manager: req.user.userId },
        { teacher: req.user.userId }
      ]
    });

    if (!channel) {
      return res.status(403).json({ message: "Accès non autorisé à ce canal" });
    }

    // Créer le message
    const message = await Message.create({
      channelId,
      sender: req.user.userId,
      content,
      readBy: [req.user.userId]
    });

    // Peupler les informations de l'expéditeur
    await message.populate('sender', 'firstName lastName role');

    // Mettre à jour le canal
    await MessageChannel.updateOne(
      { _id: channelId },
      { 
        lastMessage: new Date(),
        $inc: { 'unreadCount.teacher': 1 }
      }
    );

    res.status(201).json(message);
  } catch (error) {
    console.error('❌ Erreur lors de la création du message:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;
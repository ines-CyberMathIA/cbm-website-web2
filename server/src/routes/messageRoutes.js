import express from 'express';
import Message from '../models/Message.js';
import MessageChannel from '../models/MessageChannel.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Créer ou récupérer un canal de discussion
router.post('/channel', authMiddleware, async (req, res) => {
  try {
    const { receiverId } = req.body;
    
    // Vérifier si un canal existe déjà
    let channel = await MessageChannel.findOne({
      $or: [
        { manager: req.user.userId, teacher: receiverId },
        { manager: receiverId, teacher: req.user.userId }
      ]
    });

    // Si le canal n'existe pas, le créer
    if (!channel) {
      const isManager = req.user.role === 'manager';
      channel = new MessageChannel({
        manager: isManager ? req.user.userId : receiverId,
        teacher: isManager ? receiverId : req.user.userId,
        lastMessage: new Date(),
        unreadCount: { manager: 0, teacher: 0 }
      });
      await channel.save();
    }

    res.json(channel);
  } catch (error) {
    console.error('Erreur lors de la création/récupération du canal:', error);
    res.status(500).json({ message: "Erreur lors de la création/récupération du canal" });
  }
});

// Récupérer les messages d'un canal
router.get('/channel/:channelId', authMiddleware, async (req, res) => {
  try {
    const { channelId } = req.params;
    
    // Vérifier que l'utilisateur a accès au canal
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

    // Récupérer les messages avec leurs auteurs
    const messages = await Message.find({ channelId })
      .populate('senderId', 'firstName lastName role')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({ message: "Erreur lors de la récupération des messages" });
  }
});

// Envoyer un message
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { channelId, content } = req.body;

    // Vérifier que l'utilisateur a accès au canal
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
    const message = new Message({
      channelId,
      content,
      senderId: req.user.userId,
      receiverId: req.user.role === 'manager' ? channel.teacher : channel.manager,
      readBy: [req.user.userId] // L'expéditeur a déjà lu son propre message
    });

    await message.save();

    // Mettre à jour le dernier message du canal
    await MessageChannel.findByIdAndUpdate(channelId, {
      lastMessage: new Date(),
      $inc: {
        [`unreadCount.${req.user.role === 'manager' ? 'teacher' : 'manager'}`]: 1
      }
    });

    // Peupler les informations de l'expéditeur avant de renvoyer
    await message.populate('senderId', 'firstName lastName role');

    res.status(201).json(message);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({ message: "Erreur lors de l'envoi du message" });
  }
});

// Récupérer les messages entre le manager et le professeur
router.get('/manager', authMiddleware, async (req, res) => {
  try {
    const teacher = await User.findById(req.user.userId).populate('managerId');
    if (!teacher.managerId) {
      return res.status(404).json({ message: "Aucun manager n'est assigné" });
    }

    const messages = await Message.find({
      $or: [
        { senderId: req.user.userId, receiverId: teacher.managerId._id },
        { senderId: teacher.managerId._id, receiverId: req.user.userId }
      ]
    }).sort({ createdAt: 1 });

    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      content: msg.content,
      createdAt: msg.createdAt,
      sender: msg.senderId.equals(req.user.userId) ? 'teacher' : {
        id: teacher.managerId._id,
        role: 'manager',
        firstName: teacher.managerId.firstName,
        lastName: teacher.managerId.lastName
      }
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({ message: "Erreur serveur" });
  }
}); 

// Marquer les messages comme lus
router.post('/markAsRead', authMiddleware, async (req, res) => {
  try {
    const { channelId, messageIds } = req.body;
    
    // Vérifier que l'utilisateur a accès au canal
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

    // Marquer les messages comme lus
    await Message.updateMany(
      {
        _id: { $in: messageIds },
        channelId: channelId,
        senderId: { $ne: req.user.userId } // Ne pas marquer nos propres messages
      },
      {
        $addToSet: { readBy: req.user.userId }
      }
    );

    res.status(200).json({ message: "Messages marqués comme lus" });
  } catch (error) {
    console.error('Erreur lors du marquage des messages:', error);
    res.status(500).json({ message: "Erreur lors du marquage des messages comme lus" });
  }
});

// Marquer les messages comme lus
router.post('/read/:channelId', authMiddleware, async (req, res) => {
  try {
    await Message.updateMany(
      {
        channelId: req.params.channelId,
        receiverId: req.user.userId,
        read: false
      },
      { read: true }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors du marquage des messages comme lus:', error);
    res.status(500).json({ message: "Erreur lors du marquage des messages comme lus" });
  }
});

export default router;
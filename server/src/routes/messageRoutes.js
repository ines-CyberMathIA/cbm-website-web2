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
    const channel = await MessageChannel.findById(req.params.channelId);
    if (!channel) {
      return res.status(404).json({ message: "Canal non trouvé" });
    }

    // Vérifier que l'utilisateur a accès à ce canal
    if (channel.manager.toString() !== req.user.userId && channel.teacher.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Accès non autorisé à ce canal" });
    }

    const messages = await Message.find({ channelId: req.params.channelId })
      .populate('senderId', 'firstName lastName role')
      .populate('receiverId', 'firstName lastName role')
      .sort({ createdAt: 1 });

    // Mettre à jour le compteur de messages non lus
    if (req.user.role === 'manager') {
      await MessageChannel.findByIdAndUpdate(req.params.channelId, {
        'unreadCount.manager': 0
      });
    } else {
      await MessageChannel.findByIdAndUpdate(req.params.channelId, {
        'unreadCount.teacher': 0
      });
    }

    res.json(messages);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({ message: "Erreur lors de la récupération des messages" });
  }
});

// Envoyer un message
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { content, channelId } = req.body;
    
    const channel = await MessageChannel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Canal non trouvé" });
    }

    // Vérifier que l'utilisateur a accès à ce canal
    if (channel.manager.toString() !== req.user.userId && channel.teacher.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Accès non autorisé à ce canal" });
    }

    // Déterminer l'expéditeur et le destinataire
    const isManager = req.user.role === 'manager';
    const senderId = req.user.userId;
    const receiverId = isManager ? channel.teacher : channel.manager;

    const message = new Message({
      content,
      senderId,
      receiverId,
      channelId
    });

    const savedMessage = await message.save();

    // Mettre à jour le canal avec le dernier message
    await MessageChannel.findByIdAndUpdate(channelId, {
      lastMessage: new Date(),
      $inc: {
        [`unreadCount.${isManager ? 'teacher' : 'manager'}`]: 1
      }
    });

    // Peupler les informations de l'expéditeur et du destinataire
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate('senderId', 'firstName lastName role')
      .populate('receiverId', 'firstName lastName role');

    res.json(populatedMessage);
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
import { Server } from 'socket.io';
import Message from '../models/Message.js';
import MessageChannel from '../models/MessageChannel.js';
import jwt from 'jsonwebtoken';
import corsConfig from '../config/corsConfig.js';
import User from '../models/User.js';

let connectedUsers = new Map(); // userId -> socket

export default function initializeMessageSocket(server) {
  const io = new Server(server, {
    cors: corsConfig
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.userId;
    
    // Gérer la connexion d'un utilisateur
    socket.on('user_connected', async (data) => {
      connectedUsers.set(userId, socket.id);
      
      // Mettre à jour le statut dans la base de données
      await User.findByIdAndUpdate(userId, { 
        isOnline: true,
        lastSeen: new Date()
      });

      // Émettre la liste mise à jour des utilisateurs en ligne
      io.emit('users_status', Array.from(connectedUsers.keys()));
    });

    // Gérer la déconnexion
    socket.on('disconnect', async () => {
      connectedUsers.delete(userId);
      
      // Mettre à jour le statut dans la base de données
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date()
      });

      // Émettre la liste mise à jour
      io.emit('users_status', Array.from(connectedUsers.keys()));
    });

    // ... reste du code pour la gestion des messages
  });

  return io;
} 

const handleNewMessage = async (io, socket, data) => {
  try {
    const { message, channelId } = data;
    
    // Émettre à tous les clients dans le canal
    io.to(channelId).emit('new_message', {
      channelId,
      message: {
        ...message,
        createdAt: new Date(),
        readBy: [message.senderId]
      }
    });

    // Notifier les utilisateurs hors ligne
    const offlineUsers = await getOfflineUsersInChannel(channelId);
    for (const userId of offlineUsers) {
      await createNotification({
        userId,
        type: 'new_message',
        channelId,
        messageId: message._id
      });
    }

  } catch (error) {
    console.error('Erreur socket message:', error);
    socket.emit('message_error', { error: error.message });
  }
};

const handleMessageRead = async (io, socket, data) => {
  try {
    const { messageId, channelId, userId } = data;
    
    // Émettre la mise à jour à tous les clients dans le canal
    io.to(channelId).emit('message_updated', {
      channelId,
      messageId,
      updates: {
        readBy: userId
      }
    });

  } catch (error) {
    console.error('Erreur marquage message:', error);
  }
};

export { handleNewMessage, handleMessageRead }; 
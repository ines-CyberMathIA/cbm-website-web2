import { Server } from 'socket.io';
import Message from '../models/Message.js';
import MessageChannel from '../models/MessageChannel.js';
import jwt from 'jsonwebtoken';
import corsConfig from '../config/corsConfig.js';
import User from '../models/User.js';

let connectedUsers = new Map(); // userId -> socket

export default function initializeMessageSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket'],
    allowEIO3: true
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      console.log('🔑 Token reçu:', token ? 'présent' : 'manquant');
      
      if (!token) {
        throw new Error('Token manquant');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      console.log('👤 Utilisateur authentifié:', decoded);
      next();
    } catch (error) {
      console.error('❌ Erreur d\'authentification socket:', error);
      next(new Error('Authentification échouée'));
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 Nouvelle connexion socket:', socket.id);
    console.log('👤 Utilisateur connecté:', socket.user);

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

    // Log quand un utilisateur rejoint un canal
    socket.on('join_channel', ({ channelId }) => {
      console.log('➡️ Utilisateur rejoint le canal:', channelId);
      socket.join(channelId);
    });

    // Log des déconnexions
    socket.on('disconnect', (reason) => {
      console.log('👋 Utilisateur déconnecté:', socket.id, 'Raison:', reason);
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
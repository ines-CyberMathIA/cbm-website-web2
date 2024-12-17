import { Server } from 'socket.io';
import Message from '../models/Message.js';
import MessageChannel from '../models/MessageChannel.js';
import jwt from 'jsonwebtoken';
import corsConfig from '../config/corsConfig.js';
import User from '../models/User.js';

export default function initializeMessageSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: corsConfig.origin,
      methods: corsConfig.methods,
      credentials: corsConfig.credentials,
      allowedHeaders: corsConfig.allowedHeaders
    }
  });

  // Middleware d'authentification des sockets avec plus de logs
  io.use(async (socket, next) => {
    try {
      console.log('Socket auth attempt');
      const token = socket.handshake.auth.token || 
                   socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        console.log('No token provided');
        return next(new Error('Authentication error: No token provided'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      console.log('Socket authenticated for user:', decoded.userId);
      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error(`Authentication error: ${error.message}`));
    }
  });

  // Gestion des connexions
  io.on('connection', (socket) => {
    const userId = socket.user.userId;
    console.log(`User connected: ${userId}`);

    // Mettre à jour le statut en ligne
    User.findByIdAndUpdate(userId, { isOnline: true })
      .then(() => {
        // Informer les autres utilisateurs
        socket.broadcast.emit('user_status', {
          userId,
          status: 'online'
        });
      });

    // Rejoindre son canal personnel
    socket.join(`user_${userId}`);

    // Rejoindre le canal personnel
    socket.on('join_personal_channel', ({ userId }) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined personal channel`);
    });

    // Rejoindre un canal de discussion
    socket.on('join_channel', ({ channelId }) => {
      socket.join(`channel_${channelId}`);
      console.log(`User ${userId} joined channel ${channelId}`);
    });

    // Quitter un canal
    socket.on('leave_channel', ({ channelId }) => {
      socket.leave(`channel_${channelId}`);
    });

    // Récupérer l'historique d'un canal
    socket.on('get_channel_history', async ({ channelId }, callback) => {
      try {
        const messages = await Message.find({ channelId })
          .sort({ createdAt: 1 })
          .populate('senderId', 'firstName lastName')
          .limit(100);
        
        callback({ success: true, messages });
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // Écouter les nouveaux messages
    socket.on('send_message', async (data) => {
      try {
        const { channelId, content, receiverId } = data;
        
        // Créer le message
        const message = await Message.create({
          channelId,
          senderId: userId,
          receiverId,
          content
        });

        // Mettre à jour le canal
        await MessageChannel.updateOne(
          { _id: channelId },
          { 
            lastMessage: new Date(),
            $inc: { [`unreadCount.${receiverId === userId ? 'manager' : 'teacher'}`]: 1 }
          }
        );

        // Émettre aux destinataires
        io.to(`user_${receiverId}`).emit('new_message', {
          message,
          channelId
        });

        // Confirmation à l'émetteur
        socket.emit('message_sent', { message });

      } catch (error) {
        socket.emit('message_error', { error: error.message });
      }
    });

    // Marquer les messages comme lus
    socket.on('mark_as_read', async ({ channelId, messageIds }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $addToSet: { readBy: userId } }
        );

        // Réinitialiser le compteur de messages non lus
        const userRole = socket.user.role;
        const updateField = `unreadCount.${userRole === 'manager' ? 'manager' : 'teacher'}`;
        
        await MessageChannel.updateOne(
          { _id: channelId },
          { $set: { [updateField]: 0 } }
        );

        socket.emit('messages_marked_read', { channelId, messageIds });
      } catch (error) {
        socket.emit('mark_read_error', { error: error.message });
      }
    });

    // Gérer la déconnexion
    socket.on('disconnect', async () => {
      await User.findByIdAndUpdate(userId, { 
        isOnline: false,
        lastSeen: new Date()
      });

      // Informer les autres utilisateurs
      socket.broadcast.emit('user_status', {
        userId,
        status: 'offline',
        lastSeen: new Date()
      });
    });
  });

  return io;
} 
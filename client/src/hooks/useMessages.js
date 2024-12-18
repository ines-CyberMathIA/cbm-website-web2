import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import axios from 'axios';
import config from '../config';

export const useMessages = (channelId) => {
  const [messages, setMessages] = useState([]);
  const [pendingMessages, setPendingMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [retryCount, setRetryCount] = useState(0);
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const MAX_RETRIES = 3;

  // Charger les messages initiaux
  const loadMessages = useCallback(async () => {
    if (!channelId) return;
    
    try {
      const response = await axios.get(
        `${config.API_URL}/api/messages/channel/${channelId}`,
        {
          headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
        }
      );
      setMessages(response.data);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      addNotification({
        title: 'Erreur',
        message: 'Impossible de charger les messages',
        type: 'error'
      });
    }
  }, [channelId, addNotification]);

  // Gérer la reconnexion et les messages en attente
  useEffect(() => {
    if (!socket) return;

    const handleDisconnect = () => {
      console.log('🔴 Déconnecté du serveur');
      setConnectionStatus('disconnected');
      addNotification({
        title: 'Connexion perdue',
        message: 'Tentative de reconnexion...',
        type: 'warning'
      });
    };

    const handleReconnecting = (attempt) => {
      console.log(`🟡 Tentative de reconnexion #${attempt}`);
      setConnectionStatus('reconnecting');
    };

    const handleReconnect = async () => {
      console.log('🟢 Reconnecté au serveur');
      setConnectionStatus('connected');
      addNotification({
        title: 'Reconnecté',
        message: 'La connexion a été rétablie',
        type: 'success'
      });

      // Recharger les messages pour s'assurer de la synchronisation
      await loadMessages();

      // Renvoyer les messages en attente
      for (const msg of pendingMessages) {
        if (msg.retryCount < MAX_RETRIES) {
          try {
            await sendMessage(msg.content, msg.id);
            setPendingMessages(prev => prev.filter(m => m.id !== msg.id));
          } catch (error) {
            console.error('Erreur renvoi message:', error);
            setPendingMessages(prev =>
              prev.map(m => m.id === msg.id ? { ...m, retryCount: m.retryCount + 1 } : m)
            );
          }
        }
      }
    };

    socket.on('disconnect', handleDisconnect);
    socket.on('reconnecting', handleReconnecting);
    socket.on('reconnect', handleReconnect);

    return () => {
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnecting', handleReconnecting);
      socket.off('reconnect', handleReconnect);
    };
  }, [socket, pendingMessages, loadMessages]);

  // Gérer les messages et leur statut
  useEffect(() => {
    if (!socket || !channelId) return;

    socket.emit('join_channel', { channelId });

    const handleNewMessage = (data) => {
      if (data.channelId === channelId) {
        setMessages(prev => [...prev, { ...data.message, status: 'received' }]);
        
        // Envoyer confirmation de réception
        socket.emit('message_received', {
          messageId: data.message._id,
          channelId,
          userId: user.userId
        });

        // Ajouter une notification si le message vient de l'autre personne
        if (data.message.senderId !== user.userId) {
          const senderName = data.message.sender?.firstName 
            ? `${data.message.sender.firstName} ${data.message.sender.lastName}`
            : 'Nouveau message';

          addNotification({
            title: senderName,
            message: data.message.content.substring(0, 50) + (data.message.content.length > 50 ? '...' : ''),
            type: 'info',
            duration: 5000, // Disparaît après 5 secondes
            onClick: () => {
              // Optionnel : faire défiler jusqu'au message
              const messageElement = document.getElementById(`message-${data.message._id}`);
              messageElement?.scrollIntoView({ behavior: 'smooth' });
            }
          });

          // Jouer un son de notification (optionnel)
          const notificationSound = new Audio('/notification.mp3');
          notificationSound.play().catch(e => console.log('Erreur son notification:', e));
        }
      }
    };

    const handleMessageStatus = (data) => {
      if (data.channelId === channelId) {
        setMessages(prev =>
          prev.map(msg => 
            msg._id === data.messageId 
              ? { ...msg, status: data.status, readBy: data.readBy }
              : msg
          )
        );
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_status', handleMessageStatus);

    return () => {
      socket.emit('leave_channel', { channelId });
      socket.off('new_message', handleNewMessage);
      socket.off('message_status', handleMessageStatus);
    };
  }, [socket, channelId, user.userId]);

  // Envoyer un message avec gestion des erreurs et retries
  const sendMessage = async (content, existingId = null) => {
    if (!content.trim() || !channelId) return;

    const messageId = existingId || Date.now();
    const tempMessage = {
      id: messageId,
      content,
      senderId: user.userId,
      status: 'sending',
      timestamp: new Date(),
      retryCount: 0
    };

    // Ajouter le message à l'UI immédiatement
    setMessages(prev => [...prev, tempMessage]);

    if (!socket.connected) {
      setPendingMessages(prev => [...prev, tempMessage]);
      return;
    }

    try {
      const response = await axios.post(
        `${config.API_URL}/api/messages`,
        {
          content,
          channelId,
          tempId: messageId
        },
        {
          headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
        }
      );

      // Mettre à jour le message avec l'ID du serveur
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...response.data, status: 'sent' }
            : msg
        )
      );
    } catch (error) {
      console.error('Erreur envoi message:', error);
      setPendingMessages(prev => [...prev, { ...tempMessage, status: 'failed' }]);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, status: 'failed' }
            : msg
        )
      );
      throw error;
    }
  };

  // Marquer un message comme lu
  const markMessageAsRead = async (messageId) => {
    try {
      await axios.post(
        `${config.API_URL}/api/messages/markAsRead`,
        {
          messageIds: [messageId],
          channelId
        },
        {
          headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
        }
      );

      socket.emit('message_read', {
        messageId,
        channelId,
        userId: user.userId
      });
    } catch (error) {
      console.error('Erreur marquage message:', error);
    }
  };

  return {
    messages,
    pendingMessages,
    connectionStatus,
    sendMessage,
    markMessageAsRead,
    retryFailedMessage: (messageId) => {
      const failedMessage = pendingMessages.find(m => m.id === messageId);
      if (failedMessage) {
        sendMessage(failedMessage.content, failedMessage.id);
      }
    }
  };
}; 
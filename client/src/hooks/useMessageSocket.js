import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import axios from 'axios';
import config from '../config';

export const useMessageSocket = () => {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const { addNotification } = useNotification();

  useEffect(() => {
    const initializeMessaging = async () => {
      if (!socket || !isConnected || !user) {
        console.log('❌ Prérequis non remplis:', { socket: !!socket, isConnected, user: !!user });
        if (socket && !isConnected) {
          setTimeout(initializeMessaging, 2000);
        }
        return;
      }

      console.log('🚀 Initialisation de la messagerie pour:', user.role);

      try {
        // Pour les professeurs
        if (user.role === 'teacher') {
          // Récupérer les infos du manager
          const managerResponse = await axios.get(
            `${config.API_URL}/api/teacher/manager-info`,
            {
              headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
            }
          );
          console.log('👨‍💼 Manager trouvé:', managerResponse.data);

          // Créer/récupérer le canal
          const channelResponse = await axios.post(
            `${config.API_URL}/api/messages/channel`,
            { receiverId: managerResponse.data.id },
            {
              headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
            }
          );
          console.log('📢 Canal créé:', channelResponse.data);

          // Rejoindre le canal
          socket.emit('join_channel', { channelId: channelResponse.data._id });
        }

        // Pour les managers
        if (user.role === 'manager') {
          try {
            // Récupérer tous les canaux
            const channelsResponse = await axios.get(
              `${config.API_URL}/api/manager/message-channels`,
              {
                headers: { 
                  Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                  'Content-Type': 'application/json'
                },
                timeout: config.API_TIMEOUT
              }
            );
            
            if (!channelsResponse.data) {
              console.log('Aucun canal trouvé pour le manager');
              return;
            }

            console.log('📢 Canaux trouvés:', channelsResponse.data);

            // Rejoindre tous les canaux
            channelsResponse.data.forEach(channel => {
              console.log('Rejoindre le canal:', channel._id);
              socket.emit('join_channel', { channelId: channel._id });
            });
          } catch (error) {
            console.error('Erreur détaillée:', {
              message: error.message,
              response: error.response?.data,
              status: error.response?.status,
              config: error.config
            });
            throw error;
          }
        }

        // Écouter les nouveaux messages
        socket.on('new_message', (data) => {
          console.log('📨 Nouveau message reçu:', data);
          const { message } = data;
          
          // Ne pas notifier nos propres messages
          if (message.senderId !== user.userId) {
            addNotification({
              title: 'Nouveau message',
              message: `${message.sender?.firstName || 'Quelqu\'un'} vous a envoyé un message`,
              type: 'info'
            });
          }
        });

      } catch (error) {
        console.error('❌ Erreur initialisation messagerie:', error);
      }
    };

    initializeMessaging();

    // Cleanup
    return () => {
      if (socket) {
        socket.off('new_message');
      }
    };
  }, [socket, isConnected, user, addNotification]);
}; 
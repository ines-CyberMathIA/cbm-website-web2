import { useState, useEffect } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import config from '../config';

export const useTeacherMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState(null);
  const [managerInfo, setManagerInfo] = useState(null);
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeMessages = async () => {
      if (!socket || !isConnected || !user || isInitialized) {
        console.log('⏳ En attente des prérequis pour initialiser les messages');
        return;
      }

      try {
        console.log('🔄 Initialisation des messages...');
        setLoading(true);

        // Récupérer les infos du manager
        const managerResponse = await axios.get(
          `${config.API_URL}/api/teacher/manager-info`,
          {
            headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
          }
        );
        setManagerInfo(managerResponse.data);
        console.log('👨‍💼 Manager trouvé:', managerResponse.data);

        // Créer/récupérer le canal
        const channelResponse = await axios.post(
          `${config.API_URL}/api/messages/channel`,
          { receiverId: managerResponse.data.id },
          {
            headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
          }
        );
        setChannel(channelResponse.data);
        console.log('📢 Canal créé/récupéré:', channelResponse.data);

        // Rejoindre le canal
        socket.emit('join_channel', { channelId: channelResponse.data._id });

        // Charger les messages
        console.log('🔄 Tentative de chargement des messages pour le canal:', channelResponse.data._id);
        try {
          const messagesResponse = await axios.get(
            `${config.API_URL}/api/messages/channel/${channelResponse.data._id}/messages`,
            {
              headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
            }
          );
          console.log('✅ Messages reçus:', messagesResponse.data);
          setMessages(messagesResponse.data);
        } catch (error) {
          console.error('❌ Erreur chargement messages:', {
            error,
            channelId: channelResponse.data._id,
            status: error.response?.status,
            data: error.response?.data
          });
        }

        setLoading(false);
        setIsInitialized(true);
      } catch (error) {
        console.error('❌ Erreur initialisation messages:', error);
        setLoading(false);
      }
    };

    initializeMessages();
  }, [socket, isConnected, user, isInitialized]);

  return {
    messages,
    loading,
    channel,
    managerInfo
  };
}; 
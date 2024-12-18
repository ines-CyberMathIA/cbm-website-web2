import React, { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useMessages } from '../../hooks/useMessages';
import MessageComponent from '../shared/MessageComponent';
import axios from 'axios';
import config from '../../config';

const TeacherMessages = ({ isDarkMode }) => {
  const { isUserOnline } = useSocket();
  const [managerInfo, setManagerInfo] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const { user } = useAuth();
  const { addNotification } = useNotification();
  
  // Utiliser le hook useMessages pour la gestion temps réel
  const { messages, loading, sendMessage } = useMessages(selectedChannel?._id);
  const { socket, isConnected } = useSocket();

  // Charger les informations du manager et créer/récupérer le canal
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Récupérer les infos du manager
        const managerResponse = await axios.get(
          `${config.API_URL}/api/teacher/manager-info`,
          {
            headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
          }
        );
        setManagerInfo(managerResponse.data);

        // Créer ou récupérer le canal de discussion
        const channelResponse = await axios.post(
          `${config.API_URL}/api/messages/channel`,
          { receiverId: managerResponse.data.id },
          {
            headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
          }
        );
        setSelectedChannel(channelResponse.data);
      } catch (error) {
        console.error('Erreur initialisation chat:', error);
        addNotification({
          title: 'Erreur',
          message: 'Impossible de charger la conversation',
          type: 'error'
        });
      }
    };

    initializeChat();
  }, []);

  // Gérer l'envoi d'un nouveau message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedChannel) return;

    const content = e.target.message.value;
    if (!content.trim()) return;

    try {
      await sendMessage(content);
      e.target.reset();
    } catch (error) {
      addNotification({
        title: 'Erreur',
        message: 'Impossible d\'envoyer le message',
        type: 'error'
      });
    }
  };

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* En-tête avec les infos du manager */}
      {managerInfo && (
        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {managerInfo.firstName} {managerInfo.lastName}
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {isUserOnline(managerInfo.id) ? 'En ligne' : 'Hors ligne'}
          </p>
        </div>
      )}

      {/* Zone des messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className={`text-center text-gray-500`}>
            Chargement...
          </div>
        ) : (
          messages.map(message => (
            <MessageComponent
              key={message._id}
              message={message}
              isOwnMessage={message.senderId === user.userId}
              isDarkMode={false}
            />
          ))
        )}
      </div>

      {/* Formulaire d'envoi */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            name="message"
            className={`flex-1 p-2 rounded-lg border ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-white border-gray-300'
            }`}
            placeholder="Votre message..."
          />
          <button
            type="submit"
            className={`px-4 py-2 rounded-lg ${
              isDarkMode
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-indigo-500 hover:bg-indigo-600'
            } text-white`}
          >
            Envoyer
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeacherMessages;
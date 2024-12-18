import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useMessages } from '../../hooks/useMessages';
import MessageComponent from '../shared/MessageComponent';
import config from '../../config';

const MessagesSection = () => {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const { isUserOnline } = useSocket();
  const { user } = useAuth();
  const { addNotification } = useNotification();

  // Utiliser notre hook useMessages pour la gestion temps réel
  const { messages, loading, sendMessage } = useMessages(selectedChannel?._id);

  // Charger la liste des professeurs
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const response = await axios.get(
          `${config.API_URL}/api/manager/teachers`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setTeachers(response.data);
      } catch (error) {
        console.error('Erreur chargement professeurs:', error);
        addNotification({
          title: 'Erreur',
          message: 'Impossible de charger la liste des professeurs',
          type: 'error'
        });
      }
    };

    fetchTeachers();
  }, [addNotification]);

  // Créer/récupérer le canal quand un professeur est sélectionné
  useEffect(() => {
    const createOrGetChannel = async () => {
      if (!selectedTeacher) return;
      
      try {
        const token = sessionStorage.getItem('token');
        const response = await axios.post(
          `${config.API_URL}/api/messages/channel`,
          { receiverId: selectedTeacher._id },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setSelectedChannel(response.data);
      } catch (error) {
        console.error('Erreur création canal:', error);
        addNotification({
          title: 'Erreur',
          message: 'Impossible de créer le canal de discussion',
          type: 'error'
        });
      }
    };

    createOrGetChannel();
  }, [selectedTeacher, addNotification]);

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
    <div className="flex h-full">
      {/* Liste des professeurs */}
      <div className="w-1/4 border-r overflow-y-auto">
        {teachers.map(teacher => (
          <div
            key={teacher._id}
            onClick={() => setSelectedTeacher(teacher)}
            className={`p-4 cursor-pointer hover:bg-gray-50 ${
              selectedTeacher?._id === teacher._id ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium">
                {teacher.firstName} {teacher.lastName}
              </h3>
              <span className={`w-2 h-2 rounded-full ${
                isUserOnline(teacher._id) ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            </div>
            <p className="text-sm text-gray-500">
              {isUserOnline(teacher._id) ? 'En ligne' : 'Hors ligne'}
            </p>
          </div>
        ))}
      </div>

      {/* Zone de messages */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            {/* En-tête */}
            {selectedTeacher && (
              <div className="p-4 border-b bg-white">
                <h2 className="font-semibold">
                  {selectedTeacher.firstName} {selectedTeacher.lastName}
                </h2>
                <p className="text-sm text-gray-500">
                  {isUserOnline(selectedTeacher._id) ? 'En ligne' : 'Hors ligne'}
                </p>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="text-center text-gray-500">Chargement...</div>
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
            <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  name="message"
                  className="flex-1 p-2 border rounded"
                  placeholder="Votre message..."
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Envoyer
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Sélectionnez un professeur pour démarrer une conversation</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesSection;
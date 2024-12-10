import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import config from '../../config';

const TeacherMessages = ({ isDarkMode }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [managerInfo, setManagerInfo] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        if (!token) {
          setError("Session expirée. Veuillez vous reconnecter.");
          return;
        }

        const [managerResponse, messagesResponse] = await Promise.all([
          axios.get(`${config.API_URL}/api/teacher/manager-info`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          axios.get(`${config.API_URL}/api/messages/manager`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        setManagerInfo(managerResponse.data);
        setMessages(messagesResponse.data);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setError(error.response?.data?.message || "Une erreur est survenue");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token) return;

      const response = await axios.post(
        `${config.API_URL}/api/messages/send-to-manager`,
        { content: newMessage },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      setError("Impossible d'envoyer le message");
    }
  };

  return (
    <div className={`flex flex-col h-full rounded-lg shadow-lg ${
      isDarkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Chargement de la conversation...
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className={`text-lg text-red-500`}>
            {error}
          </div>
        </div>
      ) : (
        <>
          {/* En-tête avec les informations du manager */}
          <div className={`p-4 border-b ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <span className="text-xl">
                  {managerInfo ? managerInfo.firstName[0] + managerInfo.lastName[0] : 'M'}
                </span>
              </div>
              <div>
                <h2 className={`text-lg font-semibold ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  {managerInfo 
                    ? `${managerInfo.firstName} ${managerInfo.lastName}`
                    : 'Votre Manager'}
                </h2>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Manager
                </p>
              </div>
              <div className={`ml-2 px-2 py-1 rounded-full text-xs ${
                managerInfo?.isOnline 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {managerInfo?.isOnline ? 'En ligne' : 'Hors ligne'}
              </div>
            </div>
          </div>

          {/* Zone des messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.sender === 'teacher' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex ${message.sender === 'teacher' ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
                  {message.sender !== 'teacher' && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <span className="text-sm">
                        {managerInfo ? managerInfo.firstName[0] + managerInfo.lastName[0] : 'M'}
                      </span>
                    </div>
                  )}
                  
                  <div className={`p-3 rounded-lg max-w-[80%] ${
                    message.sender === 'teacher'
                      ? isDarkMode ? 'bg-blue-600' : 'bg-blue-100'
                      : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <div className={`text-sm font-medium mb-1 ${
                      message.sender === 'teacher'
                        ? isDarkMode ? 'text-blue-200' : 'text-blue-800'
                        : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {message.sender === 'teacher' 
                        ? 'Vous' 
                        : `${managerInfo.firstName} ${managerInfo.lastName} (Manager)`
                      }
                    </div>
                    <p className={message.sender === 'teacher'
                      ? (isDarkMode ? 'text-white' : 'text-blue-900')
                      : (isDarkMode ? 'text-gray-100' : 'text-gray-900')
                    }>
                      {message.content}
                    </p>
                    <p className={`text-xs mt-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {new Date(message.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Zone de saisie du message avec indicateur de frappe */}
          <div className={`px-4 py-2 text-xs ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {/* Ajouter ici un indicateur de frappe si nécessaire */}
          </div>

          {/* Zone de saisie du message */}
          <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Écrivez un message à ${managerInfo ? managerInfo.firstName : 'votre manager'}...`}
                className={`flex-1 p-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                  isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-900'
                }`}
              >
                <span>Envoyer</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </motion.button>
            </div>
          </form>

          {/* Message d'erreur */}
          {error && (
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-red-900/90 text-red-100' : 'bg-red-100 text-red-900'
            }`}>
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TeacherMessages; 
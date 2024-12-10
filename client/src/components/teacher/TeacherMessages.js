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
    <div className="h-full p-4">
      <div className={`flex flex-col h-full rounded-xl shadow-soft bg-opacity-80 backdrop-blur-sm ${
        isDarkMode ? 'bg-gray-900/95' : 'bg-white/95'
      }`}>
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-400"></div>
              <span className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Chargement...
              </span>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-rose-500 bg-rose-50 px-4 py-2 rounded-lg">
              {error}
            </div>
          </div>
        ) : (
          <>
            {/* En-tête avec les informations du manager */}
            <div className={`p-6 border-b ${
              isDarkMode ? 'border-gray-800' : 'border-gray-100'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${
                    isDarkMode 
                      ? 'from-teal-800/40 to-emerald-800/40 text-teal-100' 
                      : 'from-teal-50 to-emerald-50 text-teal-600'
                  } shadow-sm`}>
                    <span className="text-lg font-medium">
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
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Manager
                      </span>
                      <div className={`h-1.5 w-1.5 rounded-full ${
                        managerInfo?.isOnline ? 'bg-teal-400' : 'bg-gray-400'
                      }`}></div>
                      <span className={`text-xs ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {managerInfo?.isOnline ? 'En ligne' : 'Hors ligne'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Zone des messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'teacher' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${
                    message.sender === 'teacher'
                      ? 'ml-auto'
                      : 'mr-auto'
                  }`}>
                    <div className={`rounded-2xl px-4 py-3 ${
                      message.sender === 'teacher'
                        ? isDarkMode
                          ? 'bg-slate-700 text-slate-100'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                        : isDarkMode
                          ? 'bg-gray-800/80 text-gray-100'
                          : 'bg-gray-50 text-gray-700 border border-gray-100'
                    } shadow-sm`}>
                      {message.content}
                    </div>
                    <div className={`text-xs mt-1 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    } ${
                      message.sender === 'teacher' ? 'text-right' : 'text-left'
                    }`}>
                      {new Date(message.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Zone de saisie */}
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-100">
              <div className={`flex items-center space-x-4 rounded-xl p-2 ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className={`flex-1 bg-transparent border-0 focus:ring-0 ${
                    isDarkMode ? 'text-gray-100 placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    newMessage.trim()
                      ? isDarkMode
                        ? 'bg-slate-600 text-slate-100 hover:bg-slate-500'
                        : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-400'
                        : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  Envoyer
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherMessages;
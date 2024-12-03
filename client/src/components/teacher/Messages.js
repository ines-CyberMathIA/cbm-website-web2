import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Messages = ({ isDarkMode }) => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');

  // Données factices pour les conversations
  const conversations = [
    {
      id: 1,
      student: 'Emma Martin',
      lastMessage: 'Je serai en retard de 5 minutes au prochain cours',
      time: '14:30',
      unread: true
    },
    {
      id: 2,
      student: 'Lucas Bernard',
      lastMessage: 'Merci pour le cours d\'aujourd\'hui !',
      time: '12:15',
      unread: false
    },
    {
      id: 3,
      student: 'Julie Dubois',
      lastMessage: 'Pouvons-nous revoir les exercices de trigonométrie ?',
      time: 'Hier',
      unread: false
    }
  ];

  // Données factices pour les messages
  const messages = [
    {
      id: 1,
      sender: 'student',
      content: 'Bonjour, je serai en retard de 5 minutes au prochain cours',
      time: '14:30'
    },
    {
      id: 2,
      sender: 'teacher',
      content: 'Pas de problème, je vous attendrai',
      time: '14:32'
    },
    {
      id: 3,
      sender: 'student',
      content: 'Merci beaucoup !',
      time: '14:33'
    }
  ];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    // Ici, vous ajouteriez la logique pour envoyer le message
    console.log('Message envoyé:', newMessage);
    setNewMessage('');
  };

  return (
    <div className={`rounded-2xl ${
      isDarkMode 
        ? 'bg-[#1e293b] shadow-lg shadow-blue-500/10' 
        : 'bg-white shadow-xl'
    }`}>
      <div className="flex h-[calc(100vh-12rem)]">
        {/* Liste des conversations */}
        <div className={`w-80 border-r ${
          isDarkMode ? 'border-blue-900/30' : 'border-gray-200'
        }`}>
          <div className={`p-4 border-b ${
            isDarkMode ? 'border-blue-900/30' : 'border-gray-200'
          }`}>
            <h2 className={`text-lg font-semibold ${
              isDarkMode ? 'text-blue-300' : 'text-blue-600'
            }`}>
              Messages
            </h2>
          </div>
          <div className="overflow-y-auto h-full">
            {conversations.map((conversation) => (
              <motion.button
                key={conversation.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedConversation(conversation)}
                className={`w-full p-4 text-left transition-colors ${
                  selectedConversation?.id === conversation.id
                    ? isDarkMode
                      ? 'bg-blue-900/30'
                      : 'bg-blue-50'
                    : isDarkMode
                      ? 'hover:bg-blue-900/20'
                      : 'hover:bg-blue-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className={`font-medium ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-600'
                  }`}>
                    {conversation.student}
                  </span>
                  <span className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {conversation.time}
                  </span>
                </div>
                <p className={`text-sm mt-1 line-clamp-2 ${
                  conversation.unread
                    ? isDarkMode
                      ? 'text-gray-200 font-medium'
                      : 'text-gray-900 font-medium'
                    : isDarkMode
                      ? 'text-gray-400'
                      : 'text-gray-500'
                }`}>
                  {conversation.lastMessage}
                </p>
                {conversation.unread && (
                  <span className={`absolute top-4 right-4 w-2 h-2 rounded-full ${
                    isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                  }`} />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Zone de conversation */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* En-tête de la conversation */}
              <div className={`p-4 border-b flex items-center justify-between ${
                isDarkMode ? 'border-blue-900/30' : 'border-gray-200'
              }`}>
                <h3 className={`font-medium ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-600'
                }`}>
                  {selectedConversation.student}
                </h3>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender === 'teacher' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      message.sender === 'teacher'
                        ? isDarkMode
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-blue-100 text-blue-900'
                        : isDarkMode
                          ? 'bg-gray-800 text-gray-200'
                          : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p>{message.content}</p>
                      <span className={`text-xs mt-1 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {message.time}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Zone de saisie */}
              <form onSubmit={handleSendMessage} className="p-4">
                <div className={`flex space-x-2 rounded-xl p-2 ${
                  isDarkMode ? 'bg-blue-900/30' : 'bg-gray-100'
                }`}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Écrivez votre message..."
                    className={`flex-1 bg-transparent outline-none ${
                      isDarkMode ? 'text-gray-200 placeholder-gray-500' : 'text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className={`p-2 rounded-lg ${
                      isDarkMode
                        ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </motion.button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className={`text-lg ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Sélectionnez une conversation pour commencer
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
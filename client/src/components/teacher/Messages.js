import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { FiSend, FiSearch, FiCheck, FiClock, FiMessageCircle, FiMenu } from 'react-icons/fi';

const Messages = ({ isDarkMode }) => {
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [managerInfo, setManagerInfo] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  // Récupérer les informations du manager et créer le canal de discussion
  useEffect(() => {
    const fetchManagerInfo = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const response = await axios.get(
          'http://localhost:5000/api/teacher/manager-info',
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        console.log('Manager info:', response.data);
        setManagerInfo(response.data);
        
        // Créer ou récupérer le canal de discussion avec le manager
        if (response.data && response.data.id) {  
          const channelResponse = await axios.post(
            'http://localhost:5000/api/messages/channel',
            { receiverId: response.data.id },  
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          console.log('Channel response:', channelResponse.data);
          setActiveChannel(channelResponse.data);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des infos du manager:', error);
        setLoading(false);
      }
    };

    fetchManagerInfo();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeChannel) return;
      
      try {
        const token = sessionStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:5000/api/messages/channel/${activeChannel._id}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        console.log('Messages received:', response.data);
        setMessages(response.data);
        scrollToBottom();
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
      }
    };

    if (activeChannel) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [activeChannel]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChannel) return;

    try {
      const token = sessionStorage.getItem('token');
      console.log('Sending message:', {
        content: newMessage,
        channelId: activeChannel._id
      });
      
      const response = await axios.post(
        'http://localhost:5000/api/messages/send',
        {
          content: newMessage,
          channelId: activeChannel._id
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('Message sent:', response.data);
      setMessages([...messages, response.data]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      alert('Erreur lors de l\'envoi du message. Veuillez réessayer.');
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] p-4">
      <div className={`flex h-full overflow-hidden rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Sidebar */}
        <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 flex-shrink-0 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r overflow-hidden`}>
          <div className="h-full flex flex-col">
            {/* En-tête de la sidebar */}
            <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Messages
                </h2>
              </div>
            </div>

            {/* Liste des canaux */}
            <div className="flex-1 overflow-y-auto">
              {managerInfo && (
                <button
                  onClick={() => setActiveChannel(managerInfo)}
                  className={`w-full p-4 transition-all duration-200 ${
                    activeChannel?.id === managerInfo.id
                      ? isDarkMode
                        ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-l-4 border-l-blue-400'
                        : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-400'
                      : ''
                  } hover:${
                    isDarkMode
                      ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10'
                      : 'bg-gradient-to-r from-blue-50/70 to-indigo-50/70'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isDarkMode 
                        ? 'bg-gradient-to-r from-blue-500/30 to-indigo-500/30 border border-blue-400/30' 
                        : 'bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200'
                    }`}>
                      <span className={`text-lg font-medium ${
                        isDarkMode ? 'text-blue-100' : 'text-blue-700'
                      }`}>
                        {managerInfo.firstName[0]}{managerInfo.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <div className={`font-medium ${
                        isDarkMode ? 'text-blue-100' : 'text-blue-900'
                      }`}>
                        {managerInfo.firstName} {managerInfo.lastName}
                      </div>
                      <div className={
                        isDarkMode ? 'text-blue-300/70' : 'text-blue-600'
                      }>
                        {managerInfo.role}
                      </div>
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Zone principale */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* En-tête */}
          <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className={`p-2 rounded-lg hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                >
                  <FiMenu size={24} className={isDarkMode ? 'text-white' : 'text-gray-600'} />
                </button>
                {managerInfo && (
                  <>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-r from-cyan-400 to-blue-500`}>
                      <span className="text-white text-base font-medium">
                        {managerInfo.firstName[0]}{managerInfo.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <h2 className={`text-base font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {managerInfo.firstName} {managerInfo.lastName}
                      </h2>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Manager
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Zone des messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isCurrentUser = message.senderId === user.userId;
                return (
                  <motion.div
                    key={message._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isCurrentUser ? 'ml-auto' : 'mr-auto'}`}>
                      <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                        isCurrentUser
                          ? isDarkMode
                            ? 'bg-gradient-to-r from-violet-500/30 to-purple-500/30 text-violet-50 border border-violet-400/30'
                            : 'bg-gradient-to-r from-violet-100 to-purple-100 text-violet-900 border border-violet-200'
                          : isDarkMode
                            ? 'bg-gradient-to-r from-blue-500/30 to-indigo-500/30 text-blue-50 border border-blue-400/30'
                            : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-900 border border-blue-200'
                      }`}>
                        {message.content}
                      </div>
                      <div className={`text-xs mt-1 ${
                        isDarkMode 
                          ? isCurrentUser ? 'text-violet-300/70' : 'text-blue-300/70'
                          : isCurrentUser ? 'text-violet-400' : 'text-blue-400'
                      } ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Zone de saisie */}
          <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-t ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <form onSubmit={handleSendMessage} className="flex space-x-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrivez votre message..."
                className={`flex-1 px-4 py-2 rounded-xl border ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent`}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className={`px-6 py-2 rounded-xl transition-all ${
                  newMessage.trim()
                    ? isDarkMode
                      ? 'bg-gradient-to-r from-violet-500/40 to-purple-500/40 text-violet-50 hover:from-violet-500/50 hover:to-purple-500/50'
                      : 'bg-gradient-to-r from-violet-200 to-purple-200 text-violet-700 border border-violet-300 hover:from-violet-300 hover:to-purple-300'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-400'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                <FiSend size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
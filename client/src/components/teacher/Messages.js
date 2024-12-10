import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const Messages = ({ isDarkMode }) => {
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeChannel, setActiveChannel] = useState('manager');
  const [managerInfo, setManagerInfo] = useState(null);
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  // Récupérer les informations du manager
  useEffect(() => {
    const fetchManagerInfo = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/users/${user.managerId}`);
        setManagerInfo(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des informations du manager:', error);
      }
    };

    if (user?.managerId) {
      fetchManagerInfo();
    }
  }, [user?.managerId]);

  const channels = [
    {
      id: 'manager',
      name: managerInfo ? `${managerInfo.firstName} ${managerInfo.lastName}` : 'Manager',
      role: 'Manager',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      unreadCount: 0,
      gradient: 'from-cyan-400 to-blue-500'
    },
    {
      id: 'manager-parents',
      name: 'Manager & Parents',
      role: 'Groupe',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      unreadCount: 2,
      gradient: 'from-purple-400 to-pink-500'
    },
    {
      id: 'group',
      name: 'Groupes',
      role: 'Groupe',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      unreadCount: 5,
      gradient: 'from-green-400 to-cyan-500'
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/messages/${activeChannel}/${user.managerId}`);
        setMessages(response.data);
        setLoading(false);
        scrollToBottom();
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
        setLoading(false);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [activeChannel, user.managerId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    try {
      const response = await axios.post(`http://localhost:5000/api/messages/send`, {
        recipientId: user.managerId,
        content: newMessage,
        messageType: activeChannel
      });
      
      setMessages([...messages, response.data]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChannelTitle = () => {
    const channel = channels.find(c => c.id === activeChannel);
    if (activeChannel === 'manager' && managerInfo) {
      return `Messages avec ${managerInfo.firstName} ${managerInfo.lastName}`;
    }
    return channel ? channel.name : 'Messages';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`flex h-full ${isDarkMode ? 'bg-[#1a1b2e]' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className={`border-r backdrop-blur-lg ${
              isDarkMode 
                ? 'border-[#2a2b3d] bg-[#1e1f35]/80' 
                : 'border-gray-200 bg-white/80'
            }`}
          >
            <div className="h-full flex flex-col">
              <div className={`p-6 border-b ${
                isDarkMode ? 'border-[#2a2b3d]' : 'border-gray-200'
              }`}>
                <h2 className={`text-lg font-semibold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent`}>
                  Canaux de discussion
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto py-4">
                {channels.map(channel => (
                  <motion.button
                    key={channel.id}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveChannel(channel.id)}
                    className={`w-full flex items-center space-x-3 p-4 my-1 mx-2 rounded-xl transition-all ${
                      activeChannel === channel.id
                        ? isDarkMode
                          ? 'bg-gradient-to-r ${channel.gradient} bg-opacity-10 text-white'
                          : 'bg-gradient-to-r ${channel.gradient} bg-opacity-10 text-gray-800'
                        : isDarkMode
                          ? 'hover:bg-[#2a2b3d] text-gray-300'
                          : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${channel.gradient} ${
                      activeChannel === channel.id ? 'opacity-100' : 'opacity-70'
                    }`}>
                      {channel.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{channel.name}</div>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {channel.role}
                      </div>
                    </div>
                    {channel.unreadCount > 0 && (
                      <span className={`px-2 py-1 text-xs font-bold rounded-full bg-gradient-to-r ${channel.gradient} text-white`}>
                        {channel.unreadCount}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className={`p-6 border-b backdrop-blur-lg flex items-center justify-between ${
          isDarkMode ? 'border-[#2a2b3d] bg-[#1e1f35]/80' : 'border-gray-200 bg-white/80'
        }`}>
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'hover:bg-[#2a2b3d] text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </motion.button>
            <div>
              <h2 className={`text-xl font-semibold bg-gradient-to-r ${
                channels.find(c => c.id === activeChannel)?.gradient
              } bg-clip-text text-transparent`}>
                {getChannelTitle()}
              </h2>
              {activeChannel === 'manager' && managerInfo && (
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Manager
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <motion.div
              key={message._id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.senderId === user._id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-xl p-4 backdrop-blur-sm ${
                  message.senderId === user._id
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white'
                    : isDarkMode
                      ? 'bg-[#2a2b3d]/80 text-white'
                      : 'bg-white/80 text-gray-800'
                }`}
              >
                <p className="break-words">{message.content}</p>
                <p className={`text-xs mt-2 ${
                  message.senderId === user._id ? 'text-blue-100' : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {formatDate(message.createdAt)}
                </p>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={`p-6 border-t backdrop-blur-lg ${
          isDarkMode ? 'border-[#2a2b3d] bg-[#1e1f35]/80' : 'border-gray-200 bg-white/80'
        }`}>
          <form onSubmit={handleSendMessage} className="flex space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écrivez votre message..."
              className={`flex-1 p-4 rounded-xl border backdrop-blur-sm transition-all ${
                isDarkMode 
                  ? 'bg-[#2a2b3d]/50 border-[#2a2b3d] text-white placeholder-gray-400 focus:bg-[#2a2b3d]' 
                  : 'bg-white/50 border-gray-200 text-gray-800 placeholder-gray-400 focus:bg-white'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-6 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-medium hover:shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
            >
              Envoyer
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Messages;
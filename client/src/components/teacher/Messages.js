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
                    activeChannel ? 'bg-gradient-to-r from-cyan-400 to-blue-500' : ''
                  } hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r from-cyan-400 to-blue-500`}>
                      <span className="text-white text-lg font-medium">
                        {managerInfo.firstName[0]}{managerInfo.lastName[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {managerInfo.firstName} {managerInfo.lastName}
                      </div>
                      <div className={`text-sm truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Manager
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
              {messages.map((message, index) => (
                <div
                  key={message._id || index}
                  className={`flex ${message.senderId._id === user.userId ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${
                    message.senderId._id === user.userId
                      ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white'
                      : isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-white text-gray-900'
                  } rounded-2xl px-4 py-2 shadow-sm`}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Zone de saisie */}
          <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <form onSubmit={handleSendMessage} className="flex space-x-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrivez votre message..."
                className={`flex-1 px-4 py-2 rounded-xl ${
                  isDarkMode
                    ? 'bg-gray-700 text-white placeholder-gray-400'
                    : 'bg-gray-100 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className={`p-2 rounded-xl ${
                  newMessage.trim()
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-400'
                      : 'bg-gray-100 text-gray-400'
                } transition-all duration-200`}
              >
                <FiSend size={24} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { FiCheck, FiSearch, FiMessageCircle, FiMenu, FiSend } from 'react-icons/fi';

const MessagesSection = () => {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUnreadMarker, setShowUnreadMarker] = useState(true);
  const [firstUnreadMessageId, setFirstUnreadMessageId] = useState(null);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const messagesEndRef = useRef(null);
  const unreadMarkerRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const { darkMode } = useTheme();

  // Configuration d'axios avec le token
  const getAxiosConfig = () => {
    const token = sessionStorage.getItem('token');
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  // Charger la liste des professeurs
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          'http://localhost:5000/api/manager/my-teachers',
          getAxiosConfig()
        );
        setTeachers(response.data);
      } catch (error) {
        console.error('Erreur lors du chargement des professeurs:', error);
        if (error.response?.status === 401) {
          alert('Session expirée. Veuillez vous reconnecter.');
          window.location.href = '/login';
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  // Créer ou récupérer le canal lors de la sélection d'un professeur
  useEffect(() => {
    const createOrGetChannel = async () => {
      if (!selectedTeacher) return;
      
      try {
        const response = await axios.post(
          'http://localhost:5000/api/messages/channel',
          { receiverId: selectedTeacher._id },
          getAxiosConfig()
        );
        setSelectedChannel(response.data);
      } catch (error) {
        console.error('Erreur lors de la création du canal:', error);
      }
    };

    createOrGetChannel();
  }, [selectedTeacher]);

  // Charger les messages quand un professeur est sélectionné
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChannel) return;
      
      try {
        const response = await axios.get(
          `http://localhost:5000/api/messages/channel/${selectedChannel._id}`,
          getAxiosConfig()
        );
        
        // Trouver le premier message non lu
        const firstUnread = response.data.find(msg => 
          msg.senderId._id !== selectedTeacher._id && !msg.readBy?.includes(selectedTeacher._id)
        );

        setMessages(response.data);
        setFirstUnreadMessageId(firstUnread?._id);
        setShowUnreadMarker(true);

        // Scroll initial uniquement lors de la sélection d'un professeur
        const timer = setTimeout(() => {
          if (firstUnread) {
            scrollToUnread();
          } else {
            scrollToBottom();
          }
        }, 100);

        return () => clearTimeout(timer);
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
      }
    };

    fetchMessages();
    setUserHasScrolled(false); // Réinitialiser le scroll lors du changement de professeur

    // Mise à jour périodique sans forcer le scroll
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/messages/channel/${selectedChannel._id}`,
          getAxiosConfig()
        );
        
        // Mettre à jour les messages sans forcer le scroll
        setMessages(prevMessages => {
          // Si pas de changement, garder la même référence
          if (prevMessages.length === response.data.length &&
              prevMessages[prevMessages.length - 1]._id === response.data[response.data.length - 1]._id) {
            return prevMessages;
          }
          return response.data;
        });
      } catch (error) {
        console.error('Erreur lors de la mise à jour des messages:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedChannel, selectedTeacher]);

  // Envoyer un message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChannel) return;

    try {
      const response = await axios.post(
        'http://localhost:5000/api/messages/send',
        {
          content: newMessage,
          channelId: selectedChannel._id
        },
        getAxiosConfig()
      );

      setMessages([...messages, response.data]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    }
  };

  const handleScroll = useCallback((e) => {
    const container = e.target;
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
    setUserHasScrolled(!isAtBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current && !userHasScrolled) {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [userHasScrolled]);

  const scrollToUnread = useCallback(() => {
    if (unreadMarkerRef.current && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const unreadElement = unreadMarkerRef.current;
      container.scrollTop = unreadElement.offsetTop - 100; // 100px de marge en haut
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      if (firstUnreadMessageId) {
        scrollToUnread();
      } else {
        scrollToBottom();
      }
    }
  }, [messages, firstUnreadMessageId, scrollToBottom, scrollToUnread]);

  const markMessagesAsRead = async () => {
    if (!selectedChannel || !messages.length) return;

    try {
      const unreadMessages = messages
        .filter(msg => !msg.readBy?.includes(selectedTeacher._id) && msg.senderId._id !== selectedTeacher._id)
        .map(msg => msg._id);

      if (unreadMessages.length === 0) return;

      await axios.post(
        'http://localhost:5000/api/messages/markAsRead',
        {
          channelId: selectedChannel._id,
          messageIds: unreadMessages
        },
        getAxiosConfig()
      );
      setShowUnreadMarker(false);
    } catch (error) {
      console.error('Erreur lors du marquage des messages comme lus:', error);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Hier";
    } else {
      return messageDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  };

  const shouldShowDate = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();
    
    return currentDate !== previousDate;
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.status === 'active' &&
    `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-8rem)] mx-4 my-6">
      <div className={`flex h-full flex-col md:flex-row rounded-2xl overflow-hidden shadow-lg border ${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-100'}`}>
        {/* Sidebar des professeurs */}
        <div className={`${
          selectedTeacher ? 'hidden md:flex' : 'flex'
        } w-full md:w-80 flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'} border-r ${darkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
          {/* En-tête de la sidebar */}
          <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-700'}`}>Messages</h2>
            </div>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un professeur..."
                className={`w-full px-4 py-2 rounded-xl pl-10 ${
                  darkMode
                    ? 'bg-gray-700/80 text-gray-100 placeholder-gray-400 border-gray-600'
                    : 'bg-slate-50 text-gray-800 placeholder-gray-500 border-gray-200'
                } border focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200`}
              />
              <FiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </div>
          </div>

          {/* Liste des professeurs */}
          <div className="flex-1 overflow-y-auto">
            {teachers
              .filter(teacher =>
                `${teacher.firstName} ${teacher.lastName}`
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase())
              )
              .map((teacher, index) => (
                <button
                  key={teacher._id}
                  onClick={() => {
                    setSelectedTeacher(teacher);
                    setMessages([]);
                  }}
                  className={`w-full p-4 flex items-center gap-4 transition-all duration-200 ${
                    selectedTeacher?._id === teacher._id
                      ? darkMode
                        ? 'bg-blue-500/10 shadow-lg'
                        : 'bg-blue-50 shadow-md'
                      : darkMode
                        ? 'hover:bg-gray-700/50'
                        : 'hover:bg-slate-50'
                  } ${index === 0 ? 'rounded-t-lg' : ''}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    selectedTeacher?._id === teacher._id
                      ? darkMode
                        ? 'bg-blue-500/20'
                        : 'bg-blue-100'
                      : darkMode
                        ? 'bg-gray-700/80'
                        : 'bg-slate-100'
                  }`}>
                    <span className={`text-lg font-medium ${
                      selectedTeacher?._id === teacher._id
                        ? darkMode
                          ? 'text-blue-300'
                          : 'text-blue-600'
                        : darkMode
                          ? 'text-gray-200'
                          : 'text-gray-700'
                    }`}>
                      {`${teacher.firstName[0]}${teacher.lastName[0]}`.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium truncate ${
                      selectedTeacher?._id === teacher._id
                        ? darkMode
                          ? 'text-blue-300'
                          : 'text-blue-600'
                        : darkMode
                          ? 'text-gray-100'
                          : 'text-gray-800'
                    }`}>
                      {teacher.firstName} {teacher.lastName}
                    </div>
                    <div className={`text-sm truncate ${
                      selectedTeacher?._id === teacher._id
                        ? darkMode
                          ? 'text-blue-300/70'
                          : 'text-blue-600/70'
                        : darkMode
                          ? 'text-gray-400'
                          : 'text-gray-500'
                    }`}>
                      {teacher.speciality}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Zone des messages */}
        <div className="flex-1 flex flex-col">
          {/* En-tête fixe avec les informations de contact */}
          {selectedTeacher && (
            <div className={`sticky top-0 z-10 p-4 border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    {selectedTeacher.photoURL ? (
                      <img
                        src={selectedTeacher.photoURL}
                        alt={`${selectedTeacher.firstName} ${selectedTeacher.lastName}`}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className={`text-lg font-medium ${
                        darkMode ? 'text-white' : 'text-gray-700'
                      }`}>
                        {`${selectedTeacher.firstName[0]}${selectedTeacher.lastName[0]}`.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedTeacher.firstName} {selectedTeacher.lastName}
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {selectedTeacher.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Zone de défilement des messages */}
          <div 
            ref={messagesContainerRef}
            className={`flex-1 overflow-y-auto ${darkMode ? 'bg-gray-800/90' : 'bg-slate-50/30'} px-6 border-l ${darkMode ? 'border-gray-700/50' : 'border-gray-200'}`}
            style={{ scrollBehavior: 'smooth' }}
          >
            {selectedTeacher ? (
              <>
                {/* Messages */}
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const isCurrentUser = message.senderId.role === 'manager';
                    const isUnread = !message.readBy?.includes(selectedTeacher._id) && !isCurrentUser;
                    const isFirstUnread = message._id === firstUnreadMessageId;
                    const showDateDivider = shouldShowDate(message, messages[index - 1]);

                    return (
                      <React.Fragment key={message._id}>
                        {showDateDivider && (
                          <div className="relative flex items-center justify-center my-6">
                            <div className={`absolute w-full ${darkMode ? 'border-t border-gray-700/50' : 'border-t border-gray-200'}`}></div>
                            <span className={`px-4 py-1 text-sm font-medium z-10 rounded-full ${
                              darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'
                            }`}>
                              {formatDate(message.createdAt)}
                            </span>
                          </div>
                        )}
                        <AnimatePresence>
                          {isFirstUnread && showUnreadMarker && (
                            <motion.div
                              key="unread-marker"
                              ref={unreadMarkerRef}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ 
                                opacity: { duration: 1 }
                              }}
                              className="relative flex items-center justify-center my-6"
                            >
                              <div className={`absolute w-full ${darkMode ? 'border-t border-gray-700' : 'border-t border-gray-100'}`}></div>
                              <span className={`px-4 text-xs font-medium z-10 rounded-full ${
                                darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'
                              }`}>
                                Non lus
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`flex ${
                            isCurrentUser ? 'justify-end mr-4' : 'justify-start ml-4'
                          } mb-4`}
                        >
                          <div
                            className={`flex flex-col ${
                              isCurrentUser ? 'items-end' : 'items-start'
                            } max-w-[80%]`}
                          >
                            <div
                              className={`rounded-lg px-6 py-3 max-w-[80%] break-words ${
                                isCurrentUser
                                  ? darkMode
                                    ? 'bg-gray-700/80 text-gray-100'
                                    : 'bg-gray-100 text-gray-800'
                                  : darkMode
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-blue-500 text-white'
                              }`}>
                              <div className="mb-2">{message.content}</div>
                              <div className={`text-xs ${
                                isCurrentUser 
                                  ? darkMode 
                                    ? 'text-gray-400'
                                    : 'text-gray-500'
                                  : 'text-white/80'
                              } text-right flex items-center justify-end gap-1`}>
                                <span>{formatTime(message.createdAt)}</span>
                                {isCurrentUser && (
                                  <div className="flex items-center ml-1">
                                    {!message.readBy?.length ? (
                                      <FiCheck className="inline-block w-3 h-3" />
                                    ) : message.readBy?.length === 1 ? (
                                      <div className="flex">
                                        <FiCheck className="inline-block w-3 h-3" />
                                        <FiCheck className="inline-block w-3 h-3 -ml-1" />
                                      </div>
                                    ) : (
                                      <div className="flex">
                                        <FiCheck className="inline-block w-3 h-3" />
                                        <FiCheck className={`inline-block w-3 h-3 -ml-1 ${
                                          darkMode ? 'text-blue-400' : 'text-blue-500'
                                        }`} />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </React.Fragment>
                    );
                  })}
                  <div ref={messagesEndRef} style={{ height: '1px' }} />
                </div>

                {/* Formulaire d'envoi */}
                <div className={`p-6 ${darkMode ? 'bg-gray-800/90' : 'bg-white'} border-t border-opacity-10 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <form onSubmit={handleSendMessage} className="flex gap-4">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Écrivez votre message..."
                      className={`flex-1 px-6 py-3 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 ${
                        darkMode
                          ? 'bg-gray-700/80 border-gray-600 text-gray-100 placeholder-gray-400'
                          : 'bg-slate-50 border-gray-200 text-gray-800 placeholder-gray-500'
                      } border`}
                    />
                    <button
                      type="submit"
                      className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 ${
                        darkMode
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-blue-500 hover:bg-blue-600'
                      } text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:shadow-none`}
                      disabled={!newMessage.trim()}
                    >
                      <FiSend className="w-5 h-5" />
                      <span className="hidden sm:inline">Envoyer</span>
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className={`flex-1 flex flex-col items-center justify-center ${darkMode ? 'bg-gray-800/90' : 'bg-slate-50/30'}`}>
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <FiMessageCircle className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`} size={32} />
                </div>
                <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Sélectionnez un professeur pour démarrer une conversation
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesSection;
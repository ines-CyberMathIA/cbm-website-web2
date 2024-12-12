import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { FiSend, FiSearch, FiCheck, FiMessageCircle, FiMenu } from 'react-icons/fi';

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

  const filteredTeachers = teachers.filter(teacher =>
    teacher.status === 'active' &&
    `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-6rem)] mx-4 my-6">
      <div className="h-full flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-xl border border-opacity-10 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}">
        {/* Sidebar des professeurs */}
        <div className={`${
          selectedTeacher ? 'hidden md:flex' : 'flex'
        } flex-col w-full md:w-80 border-r border-opacity-10 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          {/* En-tête de la sidebar */}
          <div className={`p-6 border-b border-opacity-10 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Messages</h2>
              <button
                onClick={() => window.location.href = '/manager/invite'}
                className={`p-2 rounded-xl transition-colors duration-200 ${
                  darkMode 
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
                title="Inviter un professeur"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un professeur..."
                className={`w-full px-4 py-2 rounded-xl pl-10 ${
                  darkMode
                    ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600'
                    : 'bg-gray-50 text-gray-900 placeholder-gray-500 border-gray-200'
                } border focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200`}
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
                        ? 'bg-indigo-500/10 shadow-lg'
                        : 'bg-indigo-50 shadow-md'
                      : darkMode
                        ? 'hover:bg-gray-700'
                        : 'hover:bg-gray-50'
                  } ${index === 0 ? 'rounded-t-lg' : ''}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    selectedTeacher?._id === teacher._id
                      ? darkMode
                        ? 'bg-indigo-500/20'
                        : 'bg-indigo-100'
                      : darkMode
                        ? 'bg-gray-700'
                        : 'bg-gray-100'
                  }`}>
                    <span className={`text-lg font-medium ${
                      selectedTeacher?._id === teacher._id
                        ? darkMode
                          ? 'text-indigo-300'
                          : 'text-indigo-600'
                        : darkMode
                          ? 'text-gray-300'
                          : 'text-gray-600'
                    }`}>
                      {`${teacher.firstName[0]}${teacher.lastName[0]}`.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium truncate ${
                      selectedTeacher?._id === teacher._id
                        ? darkMode
                          ? 'text-indigo-300'
                          : 'text-indigo-600'
                        : darkMode
                          ? 'text-white'
                          : 'text-gray-900'
                    }`}>
                      {teacher.firstName} {teacher.lastName}
                    </div>
                    <div className={`text-sm truncate ${
                      selectedTeacher?._id === teacher._id
                        ? darkMode
                          ? 'text-indigo-300/70'
                          : 'text-indigo-600/70'
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
        <div className={`${
          !selectedTeacher ? 'hidden md:flex' : 'flex'
        } flex-1 flex-col h-full overflow-hidden`}>
          {selectedTeacher ? (
            <>
              {/* En-tête de la conversation */}
              <div className={`p-6 border-b border-opacity-10 ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center gap-4`}>
                <button
                  onClick={() => setSelectedTeacher(null)}
                  className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FiMenu className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-gray-600'}`} />
                </button>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  darkMode ? 'bg-gray-700' : 'bg-indigo-100'
                }`}>
                  <span className={`text-lg font-medium ${
                    darkMode ? 'text-white' : 'text-indigo-600'
                  }`}>
                    {`${selectedTeacher.firstName[0]}${selectedTeacher.lastName[0]}`.toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedTeacher.firstName} {selectedTeacher.lastName}
                  </h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {selectedTeacher.speciality}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-6 py-4"
                style={{ height: 'calc(100vh - 16rem)' }}
                onScroll={handleScroll}
              >
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const isCurrentUser = message.senderId.role === 'manager';
                    const isUnread = !message.readBy?.includes(selectedTeacher._id) && !isCurrentUser;
                    const isFirstUnread = message._id === firstUnreadMessageId;

                    return (
                      <React.Fragment key={message._id}>
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
                              <div className={`absolute w-full ${darkMode ? 'border-t border-gray-700' : 'border-t border-gray-200'}`}></div>
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
                            isCurrentUser ? 'justify-end' : 'justify-start'
                          } mb-4`}
                        >
                          <div
                            className={`flex flex-col ${
                              isCurrentUser ? 'items-end' : 'items-start'
                            } max-w-[80%]`}
                          >
                            <div
                              className={`rounded-2xl px-4 py-2 min-w-[120px] break-words ${
                                !isCurrentUser
                                  ? `${darkMode ? 'bg-indigo-500/90' : 'bg-indigo-400'} text-white`
                                  : `${
                                      darkMode ? 'bg-gray-700' : 'bg-gray-100'
                                    } ${darkMode ? 'text-white' : 'text-gray-900'}`
                              }`}
                            >
                              <div className="mb-2">{message.content}</div>
                              <div className={`text-xs ${isCurrentUser ? 'text-stone-700' : 'text-white/80'} text-right flex items-center justify-end gap-1`}>
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
              </div>

              {/* Formulaire d'envoi */}
              <div className={`p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-t border-opacity-10 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <form onSubmit={handleSendMessage} className="flex gap-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Écrivez votre message..."
                    className={`flex-1 px-6 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                    } border`}
                  />
                  <button
                    type="submit"
                    className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 ${
                      darkMode
                        ? 'bg-indigo-600 hover:bg-indigo-700'
                        : 'bg-indigo-500 hover:bg-indigo-600'
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
            <div className={`flex-1 flex flex-col items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
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
  );
};

export default MessagesSection;
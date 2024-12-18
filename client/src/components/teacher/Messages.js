import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import config from '../../config';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { FiSend, FiSearch, FiMessageCircle, FiMenu } from 'react-icons/fi';
import MessageComponent from '../shared/MessageComponent';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSocket } from '../../hooks/useSocket';
import { useNotification } from '../../contexts/NotificationContext';

const Messages = ({ 
  isDarkMode, 
  initialMessages,
  initialLoading,
  initialChannel,
  initialManagerInfo 
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState(initialMessages || []);
  const [loading, setLoading] = useState(initialLoading);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [managerInfo, setManagerInfo] = useState(initialManagerInfo);
  const [activeChannel, setActiveChannel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [firstUnreadMessageId, setFirstUnreadMessageId] = useState(null);
  const [showUnreadMarker, setShowUnreadMarker] = useState(false);
  const { user } = useAuth();
  const [currentUserId, setCurrentUserId] = useState(null);
  const messagesEndRef = useRef(null);
  const unreadMarkerRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const { socket, isConnected } = useSocket();
  const { addNotification } = useNotification();

  console.log('User object:', user);

  // Logs pour le débogage
  useEffect(() => {
    console.log('=== DÉBUT DU DÉBOGAGE MESSAGES ===');
    
    // Log du token
    const token = sessionStorage.getItem('token');
    console.log('Token brut:', token);
    
    if (token) {
      try {
        const [header, payload, signature] = token.split('.');
        const decodedPayload = JSON.parse(atob(payload));
        console.log('Token décodé:', {
          header: JSON.parse(atob(header)),
          payload: decodedPayload,
          userId: decodedPayload.userId
        });
      } catch (error) {
        console.error('Erreur décodage token:', error);
      }
    }

    // Log de la session storage
    console.log('Session Storage complet:', {
      keys: Object.keys(sessionStorage),
      user: sessionStorage.getItem('user'),
      token: sessionStorage.getItem('token')
    });

    // Log de l'utilisateur parsé
    try {
      const userStr = sessionStorage.getItem('user');
      if (userStr) {
        const parsedUser = JSON.parse(userStr);
        console.log('Utilisateur parsé:', parsedUser);
      }
    } catch (error) {
      console.error('Erreur parsing user:', error);
    }

    console.log('=== FIN DU DÉBOGAGE MESSAGES ===');
  }, []);

  // Récupérer l'ID de l'utilisateur depuis le token JWT
  useEffect(() => {
    console.log('=== DÉBUT RÉCUPÉRATION ID ===');
    const token = sessionStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Payload du token pour ID:', payload);
        if (payload.userId) {
          console.log('ID trouvé dans le token:', payload.userId);
          setCurrentUserId(payload.userId);
        }
      } catch (error) {
        console.error('Erreur décodage token pour ID:', error);
      }
    }
    console.log('=== FIN RÉCUPÉRATION ID ===');
  }, []);

  // Log à chaque changement de currentUserId
  useEffect(() => {
    console.log('currentUserId mis à jour:', currentUserId);
  }, [currentUserId]);

  // Ajoutons des logs au début du composant pour déboguer
  useEffect(() => {
    console.log('Auth state:', {
      user,
      userId: user?.id,
      userObject: JSON.stringify(user)
    });
  }, [user]);

  useEffect(() => {
    // Log détaillé de l'état de l'authentification
    const userFromSession = JSON.parse(sessionStorage.getItem('user'));
    console.log('Auth Debug:', {
      authUser: user,
      sessionUser: userFromSession,
      sessionStorage: Object.keys(sessionStorage),
      localStorage: Object.keys(localStorage)
    });
  }, [user]);

  // Vérification de l'état après mise à jour
  useEffect(() => {
    console.log('Current User State:', {
      currentUserId,
      user,
      isAuthenticated: !!user,
      sessionUser: JSON.parse(sessionStorage.getItem('user'))
    });
  }, [currentUserId, user]);

  // Configuration d'axios avec le token et récupération de l'ID utilisateur
  const getAxiosConfig = () => {
    const token = sessionStorage.getItem('token');
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  // Récupérer les informations du manager et créer le canal de discussion
  useEffect(() => {
    const fetchManagerInfo = async () => {
      try {
        const response = await axios.get(
          'http://localhost:5000/api/teacher/manager-info',
          getAxiosConfig()
        );
        setManagerInfo(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des informations du manager:', error);
      }
    };
    fetchManagerInfo();
  }, []);

  // Créer ou récupérer le canal lors de la sélection d'un contact
  const handleChannelSelect = async (contact) => {
    try {
      console.log('Contact sélectionné:', contact);
      const response = await axios.post(
        `${config.API_URL}/api/messages/channel`,
        { receiverId: contact.id },
        getAxiosConfig()
      );
      console.log('Canal créé/récupéré:', response.data);
      setActiveChannel(response.data);
      setUserHasScrolled(false); // Réinitialiser l'état du scroll
    } catch (error) {
      console.error('Erreur lors de la création du canal:', error);
    }
  };

  // Charger les messages du canal actif
  const fetchMessages = async () => {
    if (!activeChannel?._id || !currentUserId) return;

    try {
      const response = await axios.get(
        `${config.API_URL}/api/messages/channel/${activeChannel._id}`,
        getAxiosConfig()
      );

      // Trouver le premier message non lu
      const firstUnread = response.data.find(msg => 
        msg.senderId._id !== currentUserId && !msg.readBy?.includes(currentUserId)
      );

      // Mettre à jour les messages et le marqueur des non lus
      setMessages(response.data);
      
      if (firstUnread) {
        setFirstUnreadMessageId(firstUnread._id);
        setShowUnreadMarker(true);

        // Scroll vers les messages non lus après un court délai
        setTimeout(() => {
          scrollToUnread();
        }, 100);

        // Marquer les messages comme lus après un délai plus long
        const unreadMessages = response.data
          .filter(msg => msg.senderId._id !== currentUserId && !msg.readBy?.includes(currentUserId))
          .map(msg => msg._id);

        if (unreadMessages.length > 0) {
          setTimeout(async () => {
            try {
              await axios.post(
                `${config.API_URL}/api/messages/markAsRead`,
                {
                  messageIds: unreadMessages,
                  channelId: activeChannel._id
                },
                getAxiosConfig()
              );

              // Mettre à jour l'état local des messages avec les messages marqués comme lus
              setMessages(prevMessages => 
                prevMessages.map(msg => 
                  unreadMessages.includes(msg._id)
                    ? { ...msg, readBy: [...(msg.readBy || []), currentUserId] }
                    : msg
                )
              );
              setFirstUnreadMessageId(null);
              setShowUnreadMarker(false);
            } catch (error) {
              console.error('Erreur lors du marquage des messages comme lus:', error);
            }
          }, 3000); // Augmenté à 3 secondes pour plus de visibilité
        }
      } else {
        // S'il n'y a pas de messages non lus, scroll en bas
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    }
  };

  // Mettre à jour les messages périodiquement
  useEffect(() => {
    if (!activeChannel?._id || !currentUserId) return;

    const interval = setInterval(async () => {
      try {
        const response = await axios.get(
          `${config.API_URL}/api/messages/channel/${activeChannel._id}`,
          getAxiosConfig()
        );

        const hasNewUnreadMessages = response.data.some(msg => 
          msg.senderId._id !== currentUserId && 
          !msg.readBy?.includes(currentUserId) &&
          !messages.find(m => m._id === msg._id)
        );

        // Mettre à jour les messages
        setMessages(response.data);

        // Si nouveaux messages non lus, montrer le marqueur
        if (hasNewUnreadMessages) {
          const firstUnread = response.data.find(msg => 
            msg.senderId._id !== currentUserId && !msg.readBy?.includes(currentUserId)
          );
          if (firstUnread) {
            setFirstUnreadMessageId(firstUnread._id);
            setShowUnreadMarker(true);
          }

          // Marquer comme lu après délai
          setTimeout(async () => {
            const unreadMessages = response.data
              .filter(msg => msg.senderId._id !== currentUserId && !msg.readBy?.includes(currentUserId))
              .map(msg => msg._id);

            if (unreadMessages.length > 0) {
              try {
                await axios.post(
                  `${config.API_URL}/api/messages/markAsRead`,
                  {
                    messageIds: unreadMessages,
                    channelId: activeChannel._id
                  },
                  getAxiosConfig()
                );

                setMessages(prevMessages => 
                  prevMessages.map(msg => 
                    unreadMessages.includes(msg._id)
                      ? { ...msg, readBy: [...(msg.readBy || []), currentUserId] }
                      : msg
                  )
                );
                setFirstUnreadMessageId(null);
                setShowUnreadMarker(false);
              } catch (error) {
                console.error('Erreur lors du marquage des messages comme lus:', error);
              }
            }
          }, 3000);
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour des messages:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeChannel?._id, currentUserId, messages]);

  // Effet pour le scroll initial après chargement des messages
  useEffect(() => {
    if (messages.length > 0 && activeChannel) {
      const timer = setTimeout(() => {
        if (firstUnreadMessageId && showUnreadMarker) {
          scrollToUnread();
        } else {
          scrollToBottom(); // Défiler en bas après l'envoi d'un message
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, firstUnreadMessageId, showUnreadMarker, activeChannel]);

  // État pour suivre si l'utilisateur a scrollé manuellement
  const [userHasScrolled, setUserHasScrolled] = useState(false);

  // Fonction pour défiler vers le bas
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, []);

  // Fonction pour défiler vers le premier message non lu
  const scrollToUnread = useCallback(() => {
    if (unreadMarkerRef.current && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const unreadElement = unreadMarkerRef.current;
      container.scrollTop = unreadElement.offsetTop - 100; // 100px de marge en haut
    }
  }, []);

  // Envoyer un nouveau message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChannel?._id) return;

    console.log('🎯 Tentative d\'envoi de message:', {
      content: newMessage,
      channelId: activeChannel._id
    });

    try {
      // 1. Envoi API
      const response = await axios.post(`${config.API_URL}/api/messages/send`, {
        content: newMessage,
        channelId: activeChannel._id
      }, {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
      });

      const newMessageData = response.data;
      console.log('✅ Message sauvegardé en DB:', newMessageData);

      // 2. Émission socket
      if (socket && isConnected) {
        const socketData = {
          message: newMessageData,
          channelId: activeChannel._id,
          sender: {
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user.userId
          }
        };
        console.log('📤 Données socket à émettre:', socketData);
        socket.emit('send_message', socketData);
      } else {
        console.warn('⚠️ Socket non disponible pour l\'émission du message');
      }

      // 3. Mise à jour de l'interface
      setMessages(prev => [...prev, newMessageData]);
      setNewMessage(''); // Vider le champ de saisie
      scrollToBottom(); // Défiler vers le bas

    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi:', error);
      addNotification({
        title: 'Erreur',
        message: 'Impossible d\'envoyer le message',
        type: 'error'
      });
    }
  };

  // Fonction pour formater l'heure
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMessageDate = (date) => {
    if (isToday(new Date(date))) {
      return "Aujourd'hui";
    } else if (isYesterday(new Date(date))) {
      return 'Hier';
    }
    return format(new Date(date), 'EEEE d MMMM', { locale: fr });
  };

  // Log de l'état de la connexion
  useEffect(() => {
    console.log('🔌 État de la connexion socket (Messages):', {
      isConnected,
      socketId: socket?.id,
      channelId: activeChannel?._id
    });
  }, [isConnected, socket, activeChannel]);

  return (
    <div className="w-full h-[calc(100vh-5rem)] p-4">
      <div className="h-full flex">
        <div className={`flex-1 flex rounded-2xl overflow-hidden shadow-lg relative ${isDarkMode ? 'bg-gray-900/50 border border-gray-800' : 'bg-white/80 border border-gray-100'}`}>
          {/* Ligne de séparation verticale absolue */}
          <div className={`absolute top-0 left-80 w-[1px] h-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} ${!isSidebarOpen && 'hidden'}`}></div>
          
          {/* Sidebar avec les contacts */}
          <div className={`w-64 sm:w-80 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} flex-shrink-0 flex flex-col transition-all duration-300 ${!isSidebarOpen ? '-ml-80' : 'ml-0'}`}>
            <div className={`h-[72px] flex items-center px-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Messages
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {/* Liste des contacts */}
              {managerInfo && (
                <div 
                  onClick={() => handleChannelSelect(managerInfo)}
                  className={`relative p-4 flex items-center cursor-pointer transition-all duration-200 ${
                    activeChannel 
                      ? isDarkMode
                        ? 'bg-gray-800/50 border-l-4 border-indigo-500'
                        : 'bg-indigo-50/80 border-l-4 border-indigo-500'
                      : isDarkMode
                        ? 'hover:bg-gray-800/30'
                        : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold">
                    {managerInfo.firstName?.[0]}{managerInfo.lastName?.[0]}
                  </div>
                  <div className="ml-3">
                    <div className={`font-medium ${
                      activeChannel
                        ? isDarkMode
                          ? 'text-indigo-300'
                          : 'text-indigo-700'
                        : isDarkMode
                          ? 'text-white'
                          : 'text-gray-900'
                    }`}>
                      {managerInfo.firstName} {managerInfo.lastName}
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Manager</div>
                  </div>
                </div>
              )}
              {/* Div pour remplir l'espace restant */}
              <div className="flex-1 min-h-[200px]"></div>
            </div>
          </div>

          {/* Zone principale */}
          <div className="flex-1 flex flex-col min-w-0">
            {!activeChannel ? (
              // Page de garde
              <div className="flex-1 p-8 relative overflow-hidden">
                {/* Formes abstraites d'arrière-plan */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                  <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                  <div className="absolute -bottom-8 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>

                {/* Contenu principal */}
                <div className={`relative z-10 max-w-2xl mx-auto p-8 rounded-2xl shadow-lg backdrop-blur-sm ${
                  isDarkMode 
                    ? 'bg-gray-900/70 border border-gray-800' 
                    : 'bg-white/70 border border-gray-200'
                }`}>
                  <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                      Bienvenue dans votre espace messagerie
                    </h1>
                    <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Un espace d'échange sécurisé pour communiquer avec votre manager et vos élèves
                    </p>
                  </div>

                  {/* Cartes d'information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className={`p-6 rounded-xl shadow-sm ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/80 border border-gray-200'}`}>
                      <h2 className="text-xl font-semibold mb-4 text-indigo-500">Communication</h2>
                      <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Échangez avec bienveillance et professionnalisme avec votre manager, les familles et les élèves.
                      </p>
                    </div>
                    <div className={`p-6 rounded-xl shadow-sm ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/80 border border-gray-200'}`}>
                      <h2 className="text-xl font-semibold mb-4 text-indigo-500">Support</h2>
                      <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        En cas de besoin, contactez d'abord votre manager. Pour toute autre question : 
                        <a href="mailto:support@cybermathia.com" className="text-indigo-500 hover:text-indigo-600 ml-1">
                          support@cybermathia.com
                        </a>
                      </p>
                    </div>
                  </div>

                  {/* Règles de communication */}
                  <div className={`p-6 rounded-xl shadow-sm ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/80 border border-gray-200'}`}>
                    <h2 className="text-xl font-semibold mb-4 text-indigo-500">Règles de communication</h2>
                    <ul className={`text-left space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <li className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Restez professionnel et courtois dans vos échanges
                      </li>
                      <li className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Répondez dans un délai raisonnable
                      </li>
                      <li className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Privilégiez des messages clairs et concis
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              // Zone de chat
              <div className="flex flex-col h-full">
                {/* En-tête */}
                <div className={`flex-shrink-0 h-[72px] flex items-center px-6 ${isDarkMode ? 'bg-gray-900/70' : 'bg-white/90'} border-b backdrop-blur-sm ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                      >
                        <FiMenu className={`w-6 h-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} transition-transform duration-300 ${isSidebarOpen ? 'rotate-0' : 'rotate-180'}`} />
                      </button>
                      {managerInfo && (
                        <>
                          <div className={`w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold`}>
                            {managerInfo.firstName?.[0]}{managerInfo.lastName?.[0]}
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
                <div 
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  <div className="p-4 space-y-4">
                    {messages.map((message, index) => {
                      const isCurrentUser = message.senderId._id === currentUserId;
                      const isUnread = !message.readBy?.includes(currentUserId) && !isCurrentUser;
                      const isFirstUnread = message._id === firstUnreadMessageId;
                      const showDateSeparator = index === 0 || !isSameDay(new Date(messages[index - 1].createdAt), new Date(message.createdAt));

                      return (
                        <React.Fragment key={message._id}>
                          {showDateSeparator && (
                            <div className="flex items-center justify-center my-6">
                              <div className={`relative px-4 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
                                <span className={`relative z-10 px-3 py-1 text-sm font-medium rounded-full ${
                                  isDarkMode 
                                    ? 'bg-gray-800 text-gray-300 ring-1 ring-gray-700' 
                                    : 'bg-gray-50 text-gray-600 ring-1 ring-gray-200'
                                }`}>
                                  {formatMessageDate(message.createdAt)}
                                </span>
                                <div className={`absolute inset-0 flex items-center ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
                                  <div className={`flex-grow border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}></div>
                                </div>
                              </div>
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
                                className={`relative flex items-center justify-center my-6`}
                              >
                                <div className={`absolute w-full ${isDarkMode ? 'border-t border-gray-700' : 'border-t border-gray-200'}`}></div>
                                <span className={`px-4 text-xs font-medium z-10 ${
                                  isDarkMode ? 'bg-gray-900 text-gray-400' : 'bg-white text-gray-500'
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
                            <MessageComponent
                              message={message}
                              isCurrentUser={isCurrentUser}
                              formatTime={formatTime}
                              isDarkMode={isDarkMode}
                            />
                          </motion.div>
                        </React.Fragment>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Zone de saisie */}
                <div className={`flex-shrink-0 p-4 ${isDarkMode ? 'bg-gray-900/70' : 'bg-white/90'} border-t backdrop-blur-sm ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <form onSubmit={handleSendMessage} className="flex space-x-4">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Écrivez votre message..."
                      className={`flex-1 px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-indigo-500/50' 
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-indigo-500/50'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className={`px-4 py-2 rounded-xl flex items-center justify-center transition-colors ${
                        newMessage.trim()
                          ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                          : isDarkMode
                            ? 'bg-gray-800 text-gray-400'
                            : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <FiSend className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
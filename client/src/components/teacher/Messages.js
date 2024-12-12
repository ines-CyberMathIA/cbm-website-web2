import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import config from '../../config';
import { ThemeContext } from '../../contexts/ThemeContext';
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
  const [firstUnreadMessageId, setFirstUnreadMessageId] = useState(null);
  const [showUnreadMarker, setShowUnreadMarker] = useState(false);
  const { user } = useAuth();
  const [currentUserId, setCurrentUserId] = useState(null);
  const messagesEndRef = useRef(null);
  const unreadMarkerRef = useRef(null);
  const messagesContainerRef = useRef(null);

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
    } catch (error) {
      console.error('Erreur lors de la création du canal:', error);
    }
  };

  // Charger les messages du canal actif
  const fetchMessages = async () => {
    if (!activeChannel?._id) return;

    try {
      const response = await axios.get(
        `${config.API_URL}/api/messages/channel/${activeChannel._id}`,
        getAxiosConfig()
      );
      
      // Trouver le premier message non lu
      const firstUnread = response.data.find(msg => 
        !msg.readBy?.includes(currentUserId) && 
        msg.senderId._id !== currentUserId
      );

      setMessages(response.data);
      
      if (firstUnread) {
        console.log('Message non lu trouvé, activation du marqueur');
        setFirstUnreadMessageId(firstUnread._id);
        setShowUnreadMarker(true);

        // Programmer la disparition de la barre
        setTimeout(() => {
          console.log('Début de la disparition de la barre');
          setShowUnreadMarker(false);

          // Marquer les messages comme lus
          const unreadMessages = response.data
            .filter(msg => !msg.readBy?.includes(currentUserId) && msg.senderId._id !== currentUserId)
            .map(msg => msg._id);

          setTimeout(async () => {
            try {
              await axios.post(
                `${config.API_URL}/api/messages/markAsRead`,
                {
                  channelId: activeChannel._id,
                  messageIds: unreadMessages
                },
                getAxiosConfig()
              );
              
              console.log('Messages marqués comme lus');
              setFirstUnreadMessageId(null);
              
              setMessages(prevMessages => 
                prevMessages.map(msg => {
                  if (unreadMessages.includes(msg._id)) {
                    return {
                      ...msg,
                      readBy: [...(msg.readBy || []), currentUserId]
                    };
                  }
                  return msg;
                })
              );
            } catch (error) {
              console.error('Erreur lors du marquage des messages comme lus:', error);
            }
          }, 1000); // Attendre que l'animation de disparition soit terminée
        }, 8000); // Garder la barre visible pendant 8 secondes
      } else {
        console.log('Aucun message non lu');
        setFirstUnreadMessageId(null);
        setShowUnreadMarker(false);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    }
  };

  // Fonction pour défiler vers le bas
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fonction pour défiler vers le premier message non lu
  const scrollToUnread = useCallback(() => {
    unreadMarkerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  // Gérer le défilement initial lors du changement de canal
  useEffect(() => {
    if (!messages.length || !activeChannel?._id) return;

    // On utilise une ref pour ne scroller qu'au chargement initial du canal
    const isInitialLoad = !messagesContainerRef.current;
    if (!isInitialLoad) return;

    messagesContainerRef.current = true;

    const hasUnreadMessages = messages.some(
      msg => !msg.readBy?.includes(currentUserId) && msg.senderId._id !== currentUserId
    );

    // Attendre que le rendu soit terminé
    setTimeout(() => {
      if (hasUnreadMessages) {
        scrollToUnread();
      } else {
        scrollToBottom();
      }
    }, 100);
  }, [activeChannel?._id, messages.length, scrollToUnread, scrollToBottom, currentUserId]);

  // Réinitialiser la ref quand on change de canal
  useEffect(() => {
    messagesContainerRef.current = null;
  }, [activeChannel?._id]);

  // Mettre à jour les messages périodiquement
  useEffect(() => {
    if (activeChannel?._id) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [activeChannel?._id]);

  // Envoyer un nouveau message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChannel?._id) return;

    try {
      const response = await axios.post(
        `${config.API_URL}/api/messages/send`,
        {
          content: newMessage,
          channelId: activeChannel._id
        },
        getAxiosConfig()
      );

      setMessages(prevMessages => [...prevMessages, response.data]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    }
  };

  // Défiler vers le bas après le premier chargement des messages
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [activeChannel?._id]); // Seulement quand on change de conversation

  // Ajoutez un log pour déboguer les messages
  useEffect(() => {
    console.log('Messages:', messages);
  }, [messages]);

  useEffect(() => {
    console.log('Current user:', {
      userId: user?.userId,
      role: user?.role,
      fullUser: user
    });
  }, [user]);

  // Log de débogage pour l'utilisateur
  useEffect(() => {
    console.log('Auth user:', {
      user,
      sessionUser: JSON.parse(sessionStorage.getItem('user')),
      currentUserId
    });
  }, [user, currentUserId]);

  // Fonction pour formater l'heure
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full h-full p-2 sm:p-4">
      <div className={`h-full flex rounded-2xl overflow-hidden shadow-lg relative ${isDarkMode ? 'bg-gray-900/50 border border-gray-800' : 'bg-white/80 border border-gray-100'}`}>
        {/* Ligne de séparation verticale absolue */}
        <div className={`absolute top-0 left-80 w-[1px] h-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} ${!isSidebarOpen && 'hidden'}`}></div>
        
        {/* Sidebar avec les contacts */}
        <div className={`w-64 sm:w-80 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} h-full flex flex-col transition-all duration-300 ${!isSidebarOpen ? '-ml-80' : 'ml-0'}`}>
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
        <div className="flex-1 flex flex-col h-full overflow-hidden">
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
            <div className="flex-1 flex flex-col">
              {/* En-tête */}
              <div className={`h-[72px] flex items-center px-6 ${isDarkMode ? 'bg-gray-900/70' : 'bg-white/90'} border-b backdrop-blur-sm ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
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
                className="flex-1 overflow-y-auto p-4 max-h-[calc(100vh-16rem)]" 
                id="messages-container"
              >
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const isCurrentUser = message.senderId._id === currentUserId;
                    const isUnread = !message.readBy?.includes(currentUserId) && !isCurrentUser;
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
                          } mb-4 relative group`}
                        >
                          <div
                            className={`flex flex-col ${
                              isCurrentUser ? 'items-end' : 'items-start'
                            }`}
                          >
                            <div
                              className={`rounded-lg px-4 py-2 min-w-[120px] max-w-[80%] break-words ${
                                isCurrentUser
                                  ? `${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'} text-white`
                                  : `${
                                      isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                                    } ${isDarkMode ? 'text-white' : 'text-gray-900'}`
                              }`}
                            >
                              <div className="mb-2">{message.content}</div>
                              <div className={`text-xs ${
                                isDarkMode ? 'text-gray-300/80' : 'text-gray-500/80'
                              } text-right`}>
                                {formatTime(message.createdAt)}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </React.Fragment>
                    );
                  })}
                  <div ref={messagesEndRef} style={{ height: '1px' }} /> {/* Élément invisible pour le défilement */}
                </div>
              </div>

              {/* Zone de saisie */}
              <div className={`p-4 ${isDarkMode ? 'bg-gray-900/70' : 'bg-white/90'} border-t backdrop-blur-sm ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <form onSubmit={sendMessage} className="flex space-x-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Écrivez votre message..."
                    className={`flex-1 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 ${
                      isDarkMode
                        ? 'bg-gray-800 text-white placeholder-gray-400 focus:ring-blue-500'
                        : 'bg-white text-gray-900 placeholder-gray-500 focus:ring-blue-500'
                    }`}
                  />
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-lg flex items-center justify-center transition-colors ${
                      isDarkMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
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
  );
};

export default Messages;
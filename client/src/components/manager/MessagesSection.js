import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useTheme } from '../../contexts/ThemeContext';
import { FiSend, FiSearch, FiCheck, FiClock, FiMessageCircle } from 'react-icons/fi';

const MessagesSection = () => {
  const [teachers, setTeachers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { darkMode } = useTheme();

  // Configuration d'axios avec le token
  const getAxiosConfig = () => {
    const token = sessionStorage.getItem('token');
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  // Charger les canaux de discussion
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          'http://localhost:5000/api/manager/message-channels',
          getAxiosConfig()
        );
        setChannels(response.data);
      } catch (error) {
        console.error('Erreur lors du chargement des canaux:', error);
        if (error.response?.status === 401) {
          alert('Session expirée. Veuillez vous reconnecter.');
          window.location.href = '/login';
        } else {
          alert('Erreur lors du chargement des canaux. Veuillez réessayer.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchChannels();
  }, []);

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
        } else {
          alert('Erreur lors du chargement des professeurs. Veuillez réessayer.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  // Créer ou sélectionner un canal de discussion
  const handleTeacherSelect = async (teacher) => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        `http://localhost:5000/api/manager/message-channels/${teacher._id}`,
        {},
        getAxiosConfig()
      );
      setSelectedChannel(response.data);
      
      // Ajouter le canal à la liste s'il n'existe pas déjà
      if (!channels.find(c => c._id === response.data._id)) {
        setChannels([response.data, ...channels]);
      }
    } catch (error) {
      console.error('Erreur lors de la création du canal:', error);
      alert('Erreur lors de la création du canal. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les messages quand un canal est sélectionné
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChannel) return;
      
      try {
        const response = await axios.get(
          `http://localhost:5000/api/manager/channels/${selectedChannel._id}/messages`,
          getAxiosConfig()
        );
        setMessages(response.data);
        scrollToBottom();
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
        if (error.response?.status === 401) {
          alert('Session expirée. Veuillez vous reconnecter.');
          window.location.href = '/login';
        } else {
          alert('Erreur lors du chargement des messages. Veuillez réessayer.');
        }
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedChannel]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChannel || isLoading) return;

    try {
      setIsLoading(true);
      const response = await axios.post(
        `http://localhost:5000/api/manager/channels/${selectedChannel._id}/messages`,
        { content: newMessage },
        getAxiosConfig()
      );
      setMessages([...messages, response.data]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      if (error.response?.status === 401) {
        alert('Session expirée. Veuillez vous reconnecter.');
        window.location.href = '/login';
      } else {
        alert('Erreur lors de l\'envoi du message. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.status === 'active' &&
    `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`flex h-[calc(100vh-8rem)] ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} rounded-xl overflow-hidden shadow-xl mx-4`}>
      {/* Liste des professeurs et canaux */}
      <div className={`w-80 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-r border-opacity-10 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="p-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un professeur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
            />
            <FiSearch className={`absolute left-4 top-3.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
          </div>
        </div>

        {/* Canaux de discussion existants */}
        {channels.length > 0 && (
          <div className={`px-6 py-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm font-medium`}>
            Conversations récentes
          </div>
        )}
        <div className="px-3">
          {channels.map((channel) => (
            <button
              key={channel._id}
              onClick={() => setSelectedChannel(channel)}
              className={`w-full text-left p-4 rounded-xl transition-all duration-200 mb-2 ${
                selectedChannel?._id === channel._id
                  ? darkMode
                    ? 'bg-indigo-600 bg-opacity-20 shadow-lg'
                    : 'bg-indigo-50 shadow-md'
                  : ''
              } ${
                darkMode
                  ? 'hover:bg-gray-700'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedChannel?._id === channel._id
                    ? darkMode
                      ? 'bg-indigo-600'
                      : 'bg-indigo-100'
                    : darkMode
                      ? 'bg-gray-700'
                      : 'bg-gray-100'
                }`}>
                  <span className={`text-lg font-medium ${
                    selectedChannel?._id === channel._id
                      ? 'text-white'
                      : darkMode
                        ? 'text-indigo-400'
                        : 'text-indigo-600'
                  }`}>
                    {channel.teacher.firstName[0]}{channel.teacher.lastName[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {channel.teacher.firstName} {channel.teacher.lastName}
                  </div>
                  <div className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {channel.teacher.speciality}
                  </div>
                </div>
                {channel.unreadCount?.manager > 0 && (
                  <div className="flex-shrink-0">
                    <span className="bg-indigo-600 text-white text-xs px-2.5 py-1 rounded-full">
                      {channel.unreadCount.manager}
                    </span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Liste des professeurs */}
        {filteredTeachers.length > 0 && (
          <div className={`px-6 py-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm font-medium`}>
            Professeurs
          </div>
        )}
        <div className="px-3 pb-4">
          {filteredTeachers.map((teacher) => (
            <button
              key={teacher._id}
              onClick={() => handleTeacherSelect(teacher)}
              className={`w-full text-left p-4 rounded-xl transition-all duration-200 mb-2 hover:shadow-md ${
                darkMode
                  ? 'hover:bg-gray-700'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <span className={`text-lg font-medium ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {teacher.firstName[0]}{teacher.lastName[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {teacher.firstName} {teacher.lastName}
                  </div>
                  <div className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {teacher.speciality}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <FiMessageCircle className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-200 hover:text-indigo-500`} size={20} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Zone de chat */}
      {selectedChannel ? (
        <div className={`flex-1 flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className={`p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-b border-opacity-10 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  darkMode ? 'bg-gray-700' : 'bg-indigo-100'
                }`}>
                  <span className={`text-lg font-medium ${
                    darkMode ? 'text-white' : 'text-indigo-600'
                  }`}>
                    {selectedChannel.teacher.firstName[0]}{selectedChannel.teacher.lastName[0]}
                  </span>
                </div>
                <div>
                  <h2 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedChannel.teacher.firstName} {selectedChannel.teacher.lastName}
                  </h2>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {selectedChannel.teacher.speciality}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.sender.role === 'manager' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${message.sender.role === 'manager' ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center mb-1 space-x-2">
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {message.sender.firstName} {message.sender.lastName}
                    </span>
                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div
                    className={`rounded-2xl px-6 py-3 ${
                      message.sender.role === 'manager'
                        ? darkMode
                          ? 'bg-indigo-600 text-white'
                          : 'bg-indigo-100 text-gray-900'
                        : darkMode
                          ? 'bg-gray-700 text-white'
                          : 'bg-white text-gray-900'
                    } shadow-sm`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <div className={`flex items-center mt-1 space-x-1 text-xs ${
                    message.sender.role === 'manager' ? 'justify-end' : 'justify-start'
                  }`}>
                    {message.read ? (
                      <>
                        <FiCheck className={darkMode ? 'text-green-400' : 'text-green-600'} />
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Lu</span>
                      </>
                    ) : (
                      <>
                        <FiClock className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Envoyé</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className={`p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-t border-opacity-10 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex gap-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrivez votre message..."
                className={`flex-1 px-6 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                }`}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || isLoading}
                className={`px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-200 ${
                  darkMode
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-indigo-500 hover:bg-indigo-600'
                } text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:shadow-none`}
              >
                <FiSend size={18} />
                <span>Envoyer</span>
              </button>
            </div>
          </form>
        </div>
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
  );

};

export default MessagesSection;
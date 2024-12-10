import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { FiSend, FiSearch, FiCheck, FiClock, FiMessageCircle, FiMenu } from 'react-icons/fi';

const MessagesSection = () => {
  const [contacts, setContacts] = useState([]);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const { darkMode } = useTheme();
  const { user } = useAuth();

  const isManager = user?.role === 'manager';

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
        const endpoint = isManager 
          ? 'http://localhost:5000/api/manager/message-channels'
          : 'http://localhost:5000/api/messages/channel';
        const response = await axios.get(endpoint, getAxiosConfig());
        setChannels(isManager ? response.data : [response.data]);
      } catch (error) {
        console.error('Erreur lors du chargement des canaux:', error);
        if (error.response?.status === 401) {
          alert('Session expirée. Veuillez vous reconnecter.');
          window.location.href = '/login';
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchChannels();
  }, [isManager]);

  // Charger la liste des contacts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setIsLoading(true);
        if (isManager) {
          const response = await axios.get(
            'http://localhost:5000/api/manager/my-teachers',
            getAxiosConfig()
          );
          setContacts(response.data);
        } else {
          const response = await axios.get(
            'http://localhost:5000/api/teacher/manager-info',
            getAxiosConfig()
          );
          if (response.data) {
            // Création d'un objet contact avec les informations du manager
            const managerContact = {
              _id: response.data.id,
              firstName: response.data.firstName,
              lastName: response.data.lastName,
              name: `${response.data.firstName} ${response.data.lastName}`,
              email: response.data.email,
              isOnline: response.data.isOnline
            };
            setContacts([managerContact]);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des contacts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContacts();
  }, [isManager]);

  // Créer ou sélectionner un canal de discussion
  const handleContactSelect = async (contact) => {
    try {
      setIsLoading(true);
      const endpoint = isManager
        ? `http://localhost:5000/api/manager/message-channels/${contact._id}`
        : 'http://localhost:5000/api/messages/channel';
      const payload = isManager ? {} : { receiverId: contact._id };
      const response = await axios.post(
        endpoint,
        payload,
        getAxiosConfig()
      );
      setSelectedChannel(response.data);
      
      if (!channels.find(c => c._id === response.data._id)) {
        setChannels([response.data, ...channels]);
      }
    } catch (error) {
      console.error('Erreur lors de la création du canal:', error);
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
          `http://localhost:5000/api/messages/channel/${selectedChannel._id}`,
          getAxiosConfig()
        );
        setMessages(response.data);
        scrollToBottom();
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
      }
    };

    if (selectedChannel) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedChannel]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
      alert('Erreur lors de l\'envoi du message. Veuillez réessayer.');
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const searchTerm = searchQuery.toLowerCase();
    const name = isManager 
      ? `${contact.firstName} ${contact.lastName}`.toLowerCase()
      : contact.name.toLowerCase();
    return name.includes(searchTerm);
  });

  const getContactName = (contact) => {
    if (isManager) {
      return `${contact.firstName} ${contact.lastName}`;
    }
    return contact.name;
  };

  const getInitials = (contact) => {
    if (contact.firstName && contact.lastName) {
      return `${contact.firstName[0]}${contact.lastName[0]}`.toUpperCase();
    }
    return contact.name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className={`flex h-full ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="p-4">
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full p-2 pl-8 rounded-lg ${
                darkMode 
                  ? 'bg-gray-800 text-white border-gray-700' 
                  : 'bg-gray-100 text-gray-800 border-gray-300'
              } border`}
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          
          <div className="space-y-2">
            {filteredContacts.map((contact) => (
              <div
                key={contact._id}
                onClick={() => handleContactSelect(contact)}
                className={`flex items-center p-3 rounded-lg cursor-pointer ${
                  darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                  {getInitials(contact)}
                </div>
                <div className="ml-3">
                  <p className="font-medium">
                    {getContactName(contact)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Messages Section */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
          >
            <FiMenu />
          </button>
          {selectedChannel && (
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold mr-2">
                {selectedChannel.teacher && isManager
                  ? `${selectedChannel.teacher.firstName[0]}${selectedChannel.teacher.lastName[0]}`
                  : selectedChannel.manager?.name.split(' ').map(n => n[0]).join('')}
              </div>
              <span className="font-medium">
                {selectedChannel.teacher && isManager
                  ? `${selectedChannel.teacher.firstName} ${selectedChannel.teacher.lastName}`
                  : selectedChannel.manager?.name}
              </span>
            </div>
          )}
          <div className="w-8"></div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((message, index) => (
            <div
              key={message._id}
              className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'} mb-4`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.senderId === user.id
                    ? `${darkMode ? 'bg-blue-600' : 'bg-blue-500'} text-white`
                    : darkMode
                    ? 'bg-gray-800'
                    : 'bg-gray-100'
                }`}
              >
                <p>{message.content}</p>
                <div className="text-xs mt-1 flex items-center justify-end">
                  {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {message.senderId === user.id && (
                    <FiCheck className="ml-1" />
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}">
          <div className="flex items-center">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écrivez votre message..."
              className={`flex-1 p-2 rounded-lg mr-2 ${
                darkMode
                  ? 'bg-gray-800 text-white border-gray-700'
                  : 'bg-gray-100 text-gray-800 border-gray-300'
              } border`}
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className={`p-2 rounded-lg ${
                newMessage.trim()
                  ? 'bg-blue-500 text-white'
                  : darkMode
                  ? 'bg-gray-800 text-gray-500'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              <FiSend />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MessagesSection;

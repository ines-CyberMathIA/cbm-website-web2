import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const MessagesSection = () => {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));

  // Charger la liste des professeurs
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/manager/my-teachers', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTeachers(response.data.filter(t => t.status === 'active'));
      } catch (error) {
        console.error('Erreur lors du chargement des professeurs:', error);
      }
    };
    fetchTeachers();
  }, []);

  // Charger les messages quand un professeur est sélectionné
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedTeacher) return;
      
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:5000/api/manager/messages/${selectedTeacher._id}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setMessages(response.data);
        scrollToBottom();
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedTeacher]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTeacher) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/manager/messages/${selectedTeacher._id}`,
        { content: newMessage },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setMessages([...messages, response.data]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    }
  };

  const filteredTeachers = teachers.filter(teacher => 
    `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      {/* Liste des professeurs */}
      <div className="w-64 bg-white border-r border-gray-200">
        <div className="p-4">
          <input
            type="text"
            placeholder="Rechercher un professeur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="overflow-y-auto h-full">
          {filteredTeachers.map((teacher) => (
            <button
              key={teacher._id}
              onClick={() => setSelectedTeacher(teacher)}
              className={`w-full text-left p-4 hover:bg-gray-50 ${
                selectedTeacher?._id === teacher._id ? 'bg-indigo-50' : ''
              }`}
            >
              <div className="font-medium text-gray-900">
                {teacher.firstName} {teacher.lastName}
              </div>
              <div className="text-sm text-gray-500">{teacher.email}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Zone de chat */}
      {selectedTeacher ? (
        <div className="flex-1 flex flex-col bg-gray-50">
          <div className="p-4 bg-white border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Chat avec {selectedTeacher.firstName} {selectedTeacher.lastName}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.sender._id === user.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    message.sender._id === user.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-900 shadow'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs mt-1 opacity-75">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrivez votre message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Envoyer
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <p className="text-gray-500">Sélectionnez un professeur pour démarrer une conversation</p>
        </div>
      )}
    </div>
  );
};

export default MessagesSection; 
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [manager, setManager] = useState(null);
  const messagesEndRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Marquer les messages comme lus
  const markMessagesAsRead = async (managerId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/teacher/messages/${managerId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
    } catch (error) {
      console.error('Erreur lors du marquage des messages:', error);
    }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          'http://localhost:5000/api/teacher/messages',
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setMessages(response.data);
        
        // Identifier le manager
        const managerMessage = response.data.find(m => m.sender.role === 'manager' || m.receiver.role === 'manager');
        if (managerMessage) {
          const managerInfo = managerMessage.sender.role === 'manager' ? managerMessage.sender : managerMessage.receiver;
          setManager(managerInfo);
          // Marquer les messages comme lus
          await markMessagesAsRead(managerInfo._id);
        }
        
        scrollToBottom();
      } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error);
      }
    };

    fetchMessages();
    // Polling plus fréquent (2 secondes)
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !manager) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/teacher/messages/${manager._id}`,
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
    } finally {
      setLoading(false);
    }
  };

  // Grouper les messages par date
  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
      const date = new Date(message.createdAt).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Messages</h2>
        {manager && (
          <div className="text-sm text-gray-600">
            Discussion avec {manager.firstName} {manager.lastName} (Manager)
          </div>
        )}
      </div>
      
      <div className="h-[500px] flex flex-col">
        <div className="flex-1 overflow-y-auto mb-4 space-y-6">
          {Object.entries(messageGroups).map(([date, dateMessages]) => (
            <div key={date} className="space-y-4">
              <div className="flex justify-center">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                  {date === new Date().toLocaleDateString() ? "Aujourd'hui" : date}
                </span>
              </div>
              
              {dateMessages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${message.sender._id === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="max-w-[70%]">
                    <div className="flex items-center mb-1">
                      <span className="text-xs text-gray-500">
                        {message.sender.firstName} {message.sender.lastName}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.sender._id === user.id
                          ? 'bg-gray-100 text-gray-900'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    {message.sender._id === user.id && (
                      <div className="text-xs text-right mt-1 text-gray-500">
                        {message.read ? 'Lu' : 'Envoyé'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez votre message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading || !newMessage.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Envoi...' : 'Envoyer'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Messages; 
import React from 'react';
import { FiCheck } from 'react-icons/fi';

const MessageComponent = ({ message, isOwnMessage, isDarkMode }) => {
  return (
    <div
      id={`message-${message._id}`}
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`flex flex-col ${
          isOwnMessage ? 'items-end' : 'items-start'
        } max-w-[80%]`}
      >
        <div
          className={`rounded-lg px-4 py-2 ${
            isOwnMessage
              ? 'bg-indigo-500 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          {message.content}
        </div>
        
        <div className="text-xs mt-1 text-gray-500">
          {message.status === 'sending' && '⏳ Envoi...'}
          {message.status === 'sent' && '✓ Envoyé'}
          {message.status === 'received' && '✓✓ Reçu'}
          {message.status === 'read' && '✓✓ Lu'}
          {message.status === 'failed' && '❌ Échec'}
        </div>
      </div>
    </div>
  );
};

export default MessageComponent;

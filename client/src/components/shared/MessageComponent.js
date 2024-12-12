import React from 'react';
import { FiCheck } from 'react-icons/fi';

const MessageComponent = ({ message, isCurrentUser, formatTime, isDarkMode }) => {
  return (
    <div
      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`flex flex-col ${
          isCurrentUser ? 'items-end' : 'items-start'
        } max-w-[80%]`}
      >
        <div
          className={`rounded-lg px-4 py-2 min-w-[120px] max-w-[80%] break-words ${
            !isCurrentUser
              ? `${isDarkMode ? 'bg-indigo-500/90' : 'bg-indigo-400'} text-white`
              : `${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                } ${isDarkMode ? 'text-white' : 'text-gray-900'}`
          }`}
        >
          <div className="mb-2">{message.content}</div>
          <div className={`text-xs ${isCurrentUser ? 'text-stone-700' : 'text-white/80'} text-right flex items-center justify-end gap-1`}>
            <span>{formatTime(message.createdAt)}</span>
            {isCurrentUser && (
              <div className="flex items-center ml-1">
                {!message.readBy?.length ? (
                  // Message envoyé mais pas encore reçu
                  <FiCheck className="inline-block w-3 h-3" />
                ) : message.readBy?.length === 1 ? (
                  // Message reçu
                  <div className="flex">
                    <FiCheck className="inline-block w-3 h-3" />
                    <FiCheck className="inline-block w-3 h-3 -ml-1" />
                  </div>
                ) : (
                  // Message lu
                  <div className="flex">
                    <FiCheck className="inline-block w-3 h-3" />
                    <FiCheck className={`inline-block w-3 h-3 -ml-1 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-500'
                    }`} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageComponent;

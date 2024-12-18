import React from 'react';
import { useMessages } from '../../hooks/useMessages';
import MessageComponent from './MessageComponent';

const MessagesList = ({ channelId }) => {
  const { messages, loading, sendMessage } = useMessages(channelId);

  const handleSend = (content) => {
    sendMessage(content);
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {messages.map(message => (
          <MessageComponent key={message._id} message={message} />
        ))}
      </div>
      <MessageInput onSend={handleSend} />
    </div>
  );
};

export default MessagesList; 
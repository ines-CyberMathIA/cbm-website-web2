// Gestion en temps réel avec Socket.IO
const handleNewMessage = async (io, socket, data) => {
  try {
    const { message, channelId } = data;
    
    // Émission en temps réel aux clients du canal
    io.to(channelId).emit('new_message', {
      channelId,
      message: {
        ...message,
        createdAt: new Date(),
        readBy: [message.senderId]
      }
    });
  } catch (error) {
    console.error('Error handling new message:', error);
  }
}; 
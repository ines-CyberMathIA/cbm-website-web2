// Quand un utilisateur rejoint un canal
socket.on('join_channel', ({ channelId }) => {
  console.log('👋 Utilisateur rejoint le canal:', channelId);
  socket.join(channelId);
});

// Quand un utilisateur quitte un canal
socket.on('leave_channel', ({ channelId }) => {
  console.log('👋 Utilisateur quitte le canal:', channelId);
  socket.leave(channelId);
});

// Quand un nouveau message est créé
const handleNewMessage = async (io, socket, data) => {
  try {
    console.log('🔍 Données reçues sur le serveur:', data);
    const { message, channelId, sender } = data;

    // Vérifier les sockets dans le canal
    const room = io.sockets.adapter.rooms.get(channelId);
    const socketsInRoom = room ? Array.from(room) : [];
    console.log('📊 État du canal:', {
      channelId,
      nombreClients: socketsInRoom.length,
      sockets: socketsInRoom
    });

    // Préparer le message
    const messageToEmit = {
      message: {
        _id: message._id,
        content: message.content,
        senderId: sender._id,
        sender: {
          firstName: sender.firstName,
          lastName: sender.lastName,
          _id: sender._id
        },
        createdAt: message.createdAt
      },
      channelId
    };

    console.log('📤 Message préparé pour émission:', messageToEmit);

    // Émettre le message
    io.in(channelId).emit('new_message', messageToEmit);

    // Vérifier l'émission
    const clientsInRoom = await io.in(channelId).allSockets();
    console.log('📨 Message émis vers les clients:', {
      channelId,
      nombreDestinataires: clientsInRoom.size,
      clients: Array.from(clientsInRoom)
    });
  } catch (error) {
    console.error('❌ Erreur serveur:', error);
  }
};

module.exports = {
  handleNewMessage
}; 
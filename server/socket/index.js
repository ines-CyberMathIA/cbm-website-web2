const { handleNewMessage } = require('./messageHandlers');

io.on('connection', (socket) => {
  console.log('🔌 Nouvelle connexion socket:', socket.id);
  
  // Gérer les changements de statut
  socket.on('user_status', ({ userId, status }) => {
    console.log('👤 Changement de statut:', { userId, status });
    
    // Émettre le changement de statut à tous les clients
    io.emit('user_status', { userId, status });
  });

  // Gérer les messages
  socket.on('send_message', async (data) => {
    console.log('📨 Message reçu de', socket.id);
    try {
      await handleNewMessage(io, socket, data);
    } catch (error) {
      console.error('❌ Erreur lors du traitement du message:', error);
    }
  });

  socket.on('join_channel', ({ channelId }) => {
    console.log(`🔗 Socket ${socket.id} rejoint le canal ${channelId}`);
    socket.join(channelId);
    const rooms = Array.from(socket.rooms);
    console.log('📋 Canaux actuels pour', socket.id, ':', rooms);
  });

  socket.on('leave_channel', ({ channelId }) => {
    console.log(`👋 Socket ${socket.id} quitte le canal ${channelId}`);
    socket.leave(channelId);
  });

  socket.on('disconnect', (reason) => {
    console.log('👋 Socket déconnecté:', socket.id, 'Raison:', reason);
  });
}); 
import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { useNotification } from '../contexts/NotificationContext';

export const useTeacherSocket = () => {
  const { socket, isConnected } = useSocket();
  const { addNotification } = useNotification();
  const user = JSON.parse(sessionStorage.getItem('user'));

  useEffect(() => {
    if (!socket || !isConnected || !user) {
      console.log('⚠️ Socket ou utilisateur non prêt:', { socket: !!socket, isConnected, user: !!user });
      return;
    }

    console.log('👨‍🏫 Configuration du socket professeur');

    // Émettre le statut en ligne
    socket.emit('user_status', {
      userId: user.userId,
      status: 'online'
    });

    // Gérer la déconnexion
    const handleDisconnect = () => {
      socket.emit('user_status', {
        userId: user.userId,
        status: 'offline'
      });
    };

    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket, isConnected, user]);

  return { socket, isConnected };
}; 
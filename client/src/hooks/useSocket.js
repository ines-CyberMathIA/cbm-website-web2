import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import config from '../config';
import { useAuth } from '../contexts/AuthContext';

export const useSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const { user } = useAuth();

  const initializeSocket = useCallback(() => {
    if (!user) return;

    socketRef.current = io(config.API_URL, {
      auth: {
        token: sessionStorage.getItem('token')
      }
    });

    // Gestion de la connexion
    socketRef.current.on('connect', () => {
      console.log('🟢 Socket connecté');
      setIsConnected(true);
      
      // Émettre le statut en ligne
      socketRef.current.emit('user_connected', {
        userId: user.userId,
        role: user.role
      });
    });

    // Écouter les changements de statut des utilisateurs
    socketRef.current.on('users_status', (users) => {
      setOnlineUsers(new Set(users.map(u => u.userId)));
    });

    // Gestion de la déconnexion
    socketRef.current.on('disconnect', () => {
      console.log('🔴 Socket déconnecté');
      setIsConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  // Initialiser le socket au montage
  useEffect(() => {
    const cleanup = initializeSocket();
    return () => {
      cleanup?.();
      socketRef.current = null;
    };
  }, [initializeSocket]);

  // Fonction pour vérifier si un utilisateur est en ligne
  const isUserOnline = useCallback((userId) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  return {
    socket: socketRef.current,
    isConnected,
    isUserOnline,
    onlineUsers: Array.from(onlineUsers)
  };
}; 
import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import config from '../config';
import { useAuth } from '../contexts/AuthContext';

export const useSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const { user } = useAuth();
  const reconnectTimeoutRef = useRef(null);

  const initializeSocket = useCallback(() => {
    if (!user) {
      console.log('❌ Pas d\'utilisateur, socket non initialisé');
      return;
    }

    // Si un socket existe déjà et est connecté, ne rien faire
    if (socketRef.current?.connected) {
      console.log('✅ Socket déjà connecté et initialisé');
      return;
    }

    console.log('🔄 Initialisation du socket pour:', user);

    // Nettoyer le timeout de reconnexion existant
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    socketRef.current = io(config.API_URL, {
      auth: {
        token: sessionStorage.getItem('token')
      },
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Socket connecté, ID:', socketRef.current.id);
      setIsConnected(true);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ Erreur de connexion socket:', error.message);
      setIsConnected(false);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('🔌 Socket déconnecté, raison:', reason);
      setIsConnected(false);

      // Tenter de se reconnecter sauf si la déconnexion est volontaire
      if (reason !== 'io client disconnect' && reason !== 'io server disconnect') {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Tentative de reconnexion...');
          socketRef.current?.connect();
        }, 2000);
      }
    });

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  // Initialiser le socket au montage et le nettoyer au démontage
  useEffect(() => {
    const cleanup = initializeSocket();
    return () => {
      cleanup?.();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [initializeSocket]);

  return {
    socket: socketRef.current,
    isConnected,
    isUserOnline: useCallback((userId) => onlineUsers.has(userId), [onlineUsers]),
    onlineUsers: Array.from(onlineUsers)
  };
}; 
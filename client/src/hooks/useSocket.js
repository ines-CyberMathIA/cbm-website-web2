import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import config from '../config';

export const useSocket = () => {
  const socket = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    
    // Initialiser la connexion socket
    socket.current = io(config.API_URL, {
      auth: { token },
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    // Gestionnaire de connexion
    socket.current.on('connect', () => {
      console.log('Socket connecté');
      setIsConnected(true);
      
      // Rejoindre le canal personnel
      const userId = JSON.parse(atob(token.split('.')[1])).userId;
      socket.current.emit('join_personal_channel', { userId });
    });

    // Gestionnaire de déconnexion
    socket.current.on('disconnect', () => {
      console.log('Socket déconnecté');
      setIsConnected(false);
    });

    // Gestionnaire de messages
    socket.current.on('new_message', (message) => {
      setLastMessage(message);
    });

    // Gestionnaire d'erreurs
    socket.current.on('connect_error', (error) => {
      console.error('Erreur de connexion socket:', error);
      setIsConnected(false);
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  return { socket: socket.current, isConnected, lastMessage };
}; 
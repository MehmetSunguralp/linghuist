import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { tokenStorage } from '@/utils/tokenStorage';

// Auto-detect server URL based on current hostname
const getServerUrl = () => {
  if (import.meta.env.VITE_WEBSOCKET_URL) {
    return import.meta.env.VITE_WEBSOCKET_URL;
  }
  // Use current hostname (works for both localhost and network IP)
  const hostname = globalThis.location.hostname;
  const port = import.meta.env.VITE_SERVER_PORT || '3000';
  return `http://${hostname}:${port}`;
};

const SOCKET_URL = getServerUrl();

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const checkTokenAndConnect = () => {
      const token = tokenStorage.get();
      if (!token) {
        // Disconnect existing socket if token is removed (e.g., on logout)
        if (socketRef.current) {
          console.log('Token removed, disconnecting socket');
          socketRef.current.disconnect();
          socketRef.current = null;
          setSocket(null);
          setIsConnected(false);
        }
        return null;
      }

      // If socket already exists and is connected, don't recreate
      if (socketRef.current?.connected) {
        return socketRef.current;
      }

      // Create socket connection
      const newSocket = io(SOCKET_URL, {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('connected', (data) => {
        console.log('Socket authenticated:', data);
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
        setIsConnected(false);
      });

      return newSocket;
    };

    checkTokenAndConnect();

    // Check token periodically to handle logout
    const tokenCheckInterval = setInterval(() => {
      const token = tokenStorage.get();
      if (!token && socketRef.current) {
        console.log('Token check: No token found, disconnecting socket');
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
    }, 1000);

    return () => {
      clearInterval(tokenCheckInterval);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, []);

  return { socket, isConnected };
};

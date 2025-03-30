import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Em produção, usa o mesmo domínio do site
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin
      : 'http://localhost:3000';

    console.log('Conectando ao servidor:', baseUrl);

    const newSocket = io(baseUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      autoConnect: true
    });

    newSocket.on('connect', () => {
      console.log('Socket conectado!', newSocket.id);
      setConnected(true);
      setError(null);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Erro de conexão:', error);
      setConnected(false);
      setError('Erro ao conectar com o servidor');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket desconectado:', reason);
      setConnected(false);
      if (reason === 'io server disconnect') {
        // O servidor forçou a desconexão
        setError('Desconectado pelo servidor');
      } else if (reason === 'transport close') {
        // Conexão perdida
        setError('Conexão perdida');
      } else {
        setError('Desconectado do servidor');
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Reconectado após', attemptNumber, 'tentativas');
      setConnected(true);
      setError(null);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Erro ao reconectar:', error);
      setError('Não foi possível reconectar ao servidor');
    });

    newSocket.on('error', (error) => {
      console.error('Erro no socket:', error);
      setError('Erro na conexão com o servidor');
    });

    setSocket(newSocket);

    return () => {
      console.log('Limpando conexão do socket');
      if (newSocket) {
        newSocket.removeAllListeners();
        newSocket.close();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected, error }}>
      {children}
    </SocketContext.Provider>
  );
};

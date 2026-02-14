import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import config from '../config';

// Configuração do socket
const socket = io(config.SERVER_URL, {
  ...config.SOCKET_OPTIONS,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  timeout: 10000,
  autoConnect: true
});

// Criar o contexto
const SocketContext = createContext({ 
  socket: null,
  connected: false,
  error: null 
});

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Handler para conexão bem-sucedida
    const handleConnect = () => {
      console.log('Socket conectado com sucesso!');
      setConnected(true);
      setError(null);
      setRetryCount(0);
    };

    // Handler para desconexão
    const handleDisconnect = (reason) => {
      console.log(`Socket desconectado: ${reason}`);
      setConnected(false);
      if (reason === 'io server disconnect') {
        // O servidor desconectou o cliente, reconectar manualmente
        setTimeout(() => socket.connect(), 1000);
      }
    };

    // Handler para erros de conexão
    const handleConnectError = (err) => {
      console.error('Erro ao conectar socket:', err);
      setConnected(false);
      setError(`Falha na conexão: ${err.message || 'Erro desconhecido'}`);
      setRetryCount(prev => prev + 1);
    };

    // Registrar event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // Verificar status atual
    if (socket.connected) {
      setConnected(true);
      setError(null);
    }

    // Limpar listeners quando o componente desmontar
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected, error, retryCount }}>
      {children}
    </SocketContext.Provider>
  );
}

export default SocketContext;

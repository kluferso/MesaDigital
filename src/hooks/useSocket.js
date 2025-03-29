import { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

// Singleton do socket para evitar múltiplas conexões
let socketInstance = null;

export const useSocket = () => {
  const [socket, setSocket] = useState(socketInstance);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!socketInstance) {
      console.log('Iniciando nova conexão socket...');
      
      // Criar nova conexão
      socketInstance = io('http://localhost:5000', {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        autoConnect: true
      });

      setSocket(socketInstance);
    }

    // Configurar handlers
    const onConnect = () => {
      console.log('Socket conectado:', socketInstance.id);
      setConnected(true);
      setError(null);
    };

    const onDisconnect = (reason) => {
      console.log('Socket desconectado:', reason);
      setConnected(false);
    };

    const onError = (err) => {
      console.error('Erro no socket:', err);
      setError(err.message);
      setConnected(false);
    };

    const onReconnect = (attemptNumber) => {
      console.log('Socket reconectado após', attemptNumber, 'tentativas');
      setConnected(true);
      setError(null);
    };

    const onReconnectError = (err) => {
      console.error('Erro ao reconectar:', err);
      setError('Erro ao reconectar ao servidor');
    };

    // Registrar handlers
    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);
    socketInstance.on('error', onError);
    socketInstance.on('reconnect', onReconnect);
    socketInstance.on('reconnect_error', onReconnectError);

    // Se já estiver conectado, atualizar estado
    if (socketInstance.connected) {
      setConnected(true);
    } else {
      // Tentar conectar se não estiver conectado
      socketInstance.connect();
    }

    return () => {
      // Remover handlers
      socketInstance.off('connect', onConnect);
      socketInstance.off('disconnect', onDisconnect);
      socketInstance.off('error', onError);
      socketInstance.off('reconnect', onReconnect);
      socketInstance.off('reconnect_error', onReconnectError);
    };
  }, []);

  // Função para reconectar manualmente
  const reconnect = useCallback(() => {
    if (socketInstance && !connected) {
      console.log('Tentando reconectar manualmente...');
      socketInstance.connect();
    }
  }, [connected]);

  return { 
    socket: socketInstance,
    connected,
    error,
    reconnect
  };
};

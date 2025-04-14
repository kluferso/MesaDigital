import { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

// Singleton do socket para evitar múltiplas conexões
let socketInstance = null;

// Determinar URL do servidor com base no ambiente atual
const getServerUrl = () => {
  // Verificar se estamos no ambiente de produção (PythonAnywhere)
  const hostname = window.location.hostname;
  
  if (hostname.includes('pythonanywhere.com')) {
    // Estamos em produção no PythonAnywhere
    return `https://${hostname}`;
  } else if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    // Outro ambiente de produção
    return `https://${hostname}`;
  } else {
    // Ambiente de desenvolvimento local
    return 'http://localhost:5000';
  }
};

export const useSocket = () => {
  const [socket, setSocket] = useState(socketInstance);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  useEffect(() => {
    if (!socketInstance) {
      const serverUrl = getServerUrl();
      console.log('Iniciando nova conexão socket para:', serverUrl);
      
      // Criar nova conexão
      socketInstance = io(serverUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        autoConnect: true,
        path: hostname.includes('pythonanywhere.com') ? '/socket.io' : undefined
      });

      setSocket(socketInstance);
    }

    // Configurar handlers
    const onConnect = () => {
      console.log('Socket conectado:', socketInstance.id);
      setConnected(true);
      setError(null);
      setConnectionAttempts(0);
    };

    const onDisconnect = (reason) => {
      console.log('Socket desconectado:', reason);
      setConnected(false);
      
      // Verificar se devemos tentar a entrada em modo de emergência
      if (connectionAttempts >= 3) {
        console.warn('Múltiplas falhas de conexão socket. Considere usar o modo de emergência.');
      }
    };

    const onError = (err) => {
      console.error('Erro no socket:', err);
      setError(err.message);
      setConnected(false);
      setConnectionAttempts(prev => prev + 1);
    };

    const onReconnect = (attemptNumber) => {
      console.log('Socket reconectado após', attemptNumber, 'tentativas');
      setConnected(true);
      setError(null);
    };

    const onReconnectError = (err) => {
      console.error('Erro ao reconectar:', err);
      setError('Erro ao reconectar ao servidor');
      setConnectionAttempts(prev => prev + 1);
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
      setConnectionAttempts(prev => prev + 1);
      socketInstance.connect();
    }
  }, [connected]);

  // Função para força encerramento e nova conexão
  const forceNewConnection = useCallback(() => {
    console.log('Forçando nova conexão socket...');
    
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance.close();
      socketInstance = null;
    }
    
    const serverUrl = getServerUrl();
    socketInstance = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: true,
      path: window.location.hostname.includes('pythonanywhere.com') ? '/socket.io' : undefined
    });
    
    setSocket(socketInstance);
    socketInstance.connect();
    
    return socketInstance;
  }, []);

  return { 
    socket: socketInstance,
    connected,
    error,
    reconnect,
    forceNewConnection,
    connectionAttempts
  };
};

import React, { createContext, useContext, useState, useEffect, useCallback, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { safe, safeFilter, ensureArray, processParticipants } from '../utils/safeUtils';

// Criando contexto com valor padrão seguro
const RoomContext = createContext({
  room: null,
  users: [],
  messages: [],
  admin: null,
  isAdmin: false,
  isMuted: false,
  joinRoom: () => {},
  leaveRoom: () => {},
  sendMessage: () => {},
  kickUser: () => {},
  updateMediaStatus: () => {},
  participants: [],
  setParticipants: () => [],
});

// Reducer para gerenciar estado dos participantes de forma mais previsível
function participantsReducer(state, action) {
  switch (action.type) {
    case 'ADD_PARTICIPANT':
      if (!action.payload) return state;
      // Verificamos se o participante já existe antes de adicionar
      return state.some(p => p?.id === action.payload.id) 
        ? state 
        : [...state, action.payload];
      
    case 'REMOVE_PARTICIPANT':
      if (!action.payload?.userId) return state;
      // Usamos safeFilter para garantir que a operação é segura
      return safeFilter(state, user => user?.id !== action.payload.userId);
      
    case 'UPDATE_PARTICIPANT':
      if (!action.payload?.id) return state;
      return state.map(p => 
        p?.id === action.payload.id ? { ...p, ...action.payload } : p
      );
      
    case 'SET_PARTICIPANTS':
      return Array.isArray(action.payload) ? action.payload : [];
      
    case 'CLEAR':
      return [];
      
    default:
      return state;
  }
}

export function RoomProvider({ children }) {
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [admin, setAdmin] = useState(null);
  const { socket } = useSocket();
  const navigate = useNavigate();
  
  // Usando reducer para gerenciar participantes
  const [participants, dispatch] = useReducer(participantsReducer, []);
  
  // Função segura para atualizar participantes
  const setParticipants = useCallback((updater) => {
    if (typeof updater === 'function') {
      const result = updater(participants);
      dispatch({ type: 'SET_PARTICIPANTS', payload: ensureArray(result) });
    } else {
      dispatch({ type: 'SET_PARTICIPANTS', payload: ensureArray(updater) });
    }
  }, [participants]);

  // Verificação de administrador
  const isAdmin = useCallback(() => {
    if (!room || !admin) return false;
    return room.userId === admin.id;
  }, [room, admin]);

  // Entrar na sala com proteção contra erros
  const joinRoom = useCallback((roomId, userData) => {
    if (!socket || !roomId || !userData) {
      console.error('Erro ao entrar na sala: parâmetros inválidos', { socket, roomId, userData });
      return;
    }
    
    try {
      socket.emit('joinRoom', { roomId, userData });
    } catch (error) {
      console.error('Erro ao enviar solicitação para entrar na sala:', error);
    }
  }, [socket]);

  // Sair da sala com proteção contra erros
  const leaveRoom = useCallback(() => {
    if (!socket || !room) {
      console.error('Erro ao sair da sala: não há sala ativa');
      return;
    }
    
    try {
      socket.emit('leaveRoom', { roomId: room.id });
      dispatch({ type: 'CLEAR' });
      setRoom(null);
      setMessages([]);
      setAdmin(null);
      navigate('/');
    } catch (error) {
      console.error('Erro ao sair da sala:', error);
    }
  }, [socket, room, navigate]);

  // Enviar mensagem
  const sendMessage = useCallback((content) => {
    if (!socket || !room || !content) return;
    
    try {
      const message = {
        id: `msg_${Date.now()}`,
        content,
        sender: {
          id: room.userId,
          name: room.userName
        },
        timestamp: new Date().toISOString()
      };
      
      socket.emit('sendMessage', { roomId: room.id, message });
      
      // Adicionando otimisticamente à lista local
      setMessages(prev => [...ensureArray(prev), message]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  }, [socket, room]);

  // Expulsar usuário
  const kickUser = useCallback((userId) => {
    if (!socket || !room || !isAdmin() || !userId) return;
    
    try {
      socket.emit('kickUser', { roomId: room.id, userId });
    } catch (error) {
      console.error('Erro ao expulsar usuário:', error);
    }
  }, [socket, room, isAdmin]);

  // Atualizar status de mídia
  const updateMediaStatus = useCallback((status) => {
    if (!socket || !room) return;
    
    try {
      socket.emit('updateMediaStatus', { 
        roomId: room.id, 
        userId: room.userId,
        status 
      });
      
      // Atualizar participante local
      dispatch({ 
        type: 'UPDATE_PARTICIPANT', 
        payload: { id: room.userId, ...status } 
      });
    } catch (error) {
      console.error('Erro ao atualizar status de mídia:', error);
    }
  }, [socket, room]);

  // Efeito para configurar eventos do socket
  useEffect(() => {
    if (!socket) return;

    // Evento quando um usuário entra na sala
    const handleUserJoined = (data) => {
      if (!data) return;
      
      // Adicionar novo participante
      dispatch({ type: 'ADD_PARTICIPANT', payload: data.user });
      
      // Atualizar admin se necessário
      if (data.admin) {
        setAdmin(data.admin);
      }
      
      // Adicionar mensagem de sistema
      setMessages(prev => [
        ...ensureArray(prev),
        {
          id: `system_${Date.now()}`,
          content: `${data.user.name} entrou na sala`,
          system: true,
          timestamp: new Date().toISOString()
        }
      ]);
    };

    // Evento quando um usuário sai da sala
    const handleUserLeft = (data) => {
      if (!data || !data.userId) return;
      
      // Remover participante
      dispatch({ type: 'REMOVE_PARTICIPANT', payload: data });
      
      // Adicionar mensagem de sistema
      const userName = participants.find(p => p?.id === data.userId)?.name || 'Usuário';
      setMessages(prev => [
        ...ensureArray(prev),
        {
          id: `system_${Date.now()}`,
          content: `${userName} saiu da sala`,
          system: true,
          timestamp: new Date().toISOString()
        }
      ]);
      
      // Atualizar admin se necessário
      if (data.admin) {
        setAdmin(data.admin);
      }
    };

    // Evento quando um usuário é expulso da sala
    const handleUserKicked = (data) => {
      if (!data || !data.userId) return;
      
      // Verificar se o usuário expulso sou eu
      if (room && data.userId === room.userId) {
        setRoom(null);
        dispatch({ type: 'CLEAR' });
        setMessages([]);
        setAdmin(null);
        navigate('/', { state: { kicked: true } });
        return;
      }
      
      // Remover participante
      dispatch({ type: 'REMOVE_PARTICIPANT', payload: data });
      
      // Adicionar mensagem de sistema
      const userName = participants.find(p => p?.id === data.userId)?.name || 'Usuário';
      setMessages(prev => [
        ...ensureArray(prev),
        {
          id: `system_${Date.now()}`,
          content: `${userName} foi expulso da sala`,
          system: true,
          timestamp: new Date().toISOString()
        }
      ]);
    };

    // Evento quando uma nova mensagem chega
    const handleMessageReceived = (data) => {
      if (!data || !data.message) return;
      
      setMessages(prev => [...ensureArray(prev), data.message]);
    };

    // Evento quando o status de mídia de um usuário é atualizado
    const handleMediaStatusUpdated = (data) => {
      if (!data || !data.userId) return;
      
      dispatch({ 
        type: 'UPDATE_PARTICIPANT', 
        payload: { 
          id: data.userId, 
          ...data.status 
        } 
      });
    };

    // Evento quando entramos em uma sala
    const handleRoomJoined = (data) => {
      if (!data || !data.room) return;
      
      setRoom(data.room);
      dispatch({ type: 'SET_PARTICIPANTS', payload: ensureArray(data.participants) });
      setMessages(ensureArray(data.messages));
      setAdmin(data.admin);
    };

    // Evento quando a sala foi fechada
    const handleRoomClosed = () => {
      setRoom(null);
      dispatch({ type: 'CLEAR' });
      setMessages([]);
      setAdmin(null);
      navigate('/', { state: { roomClosed: true } });
    };

    // Evento de erro
    const handleError = (error) => {
      console.error('Erro de socket:', error);
      // Implementar lógica de tratamento de erro
    };

    // Registrando os ouvintes
    socket.on('userJoined', handleUserJoined);
    socket.on('userLeft', handleUserLeft);
    socket.on('userKicked', handleUserKicked);
    socket.on('messageReceived', handleMessageReceived);
    socket.on('mediaStatusUpdated', handleMediaStatusUpdated);
    socket.on('roomJoined', handleRoomJoined);
    socket.on('roomClosed', handleRoomClosed);
    socket.on('error', handleError);

    // Limpeza dos ouvintes
    return () => {
      socket.off('userJoined', handleUserJoined);
      socket.off('userLeft', handleUserLeft);
      socket.off('userKicked', handleUserKicked);
      socket.off('messageReceived', handleMessageReceived);
      socket.off('mediaStatusUpdated', handleMediaStatusUpdated);
      socket.off('roomJoined', handleRoomJoined);
      socket.off('roomClosed', handleRoomClosed);
      socket.off('error', handleError);
    };
  }, [socket, room, navigate, participants]);

  return (
    <RoomContext.Provider value={{
      room,
      users: participants, // Mantendo compatibilidade com a API anterior
      messages,
      admin,
      isAdmin: isAdmin(),
      joinRoom,
      leaveRoom,
      sendMessage,
      kickUser,
      updateMediaStatus,
      participants,
      setParticipants
    }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom deve ser usado dentro de um RoomProvider');
  }
  return context;
}

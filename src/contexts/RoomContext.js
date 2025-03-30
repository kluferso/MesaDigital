import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from './SocketContext';

const RoomContext = createContext();

export const useRoom = () => {
  return useContext(RoomContext);
};

export const RoomProvider = ({ children }) => {
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  
  const [room, setRoom] = useState(null);
  const [users, setUsers] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!socket) {
      console.log('Socket not available');
      return;
    }

    console.log('Setting up room event listeners');

    const handleCreateRoomSuccess = (data) => {
      console.log('Room created successfully:', data);
      setRoom(data.room);
      setUsers(data.users);
      setAdmin(data.admin);
      setError(null);
      // Adicionando um pequeno delay para garantir que o estado foi atualizado
      setTimeout(() => {
        navigate(`/room/${data.room.id}`);
      }, 100);
    };

    const handleCreateRoomError = (data) => {
      console.error('Error creating room:', data);
      setError(data.message);
    };

    const handleJoinRoomSuccess = (data) => {
      console.log('Joined room successfully:', data);
      setRoom(data.room);
      setUsers(data.users);
      setAdmin(data.admin);
      setError(null);
      navigate(`/room/${data.room.id}`);
    };

    const handleJoinRoomError = (data) => {
      console.error('Error joining room:', data);
      setError(data.message);
    };

    const handleUserJoined = (data) => {
      console.log('User joined:', data);
      setUsers(prev => {
        // Evita duplicatas
        const existingUserIndex = prev.findIndex(u => u.id === data.user.id);
        if (existingUserIndex !== -1) {
          const newUsers = [...prev];
          newUsers[existingUserIndex] = data.user;
          return newUsers;
        }
        return [...prev, data.user];
      });
    };

    const handleUserLeft = (data) => {
      console.log('User left:', data.userId, data);
      // Atualiza a lista de usuários e o admin com os dados do servidor
      if (data.remainingUsers) {
        setUsers(data.remainingUsers);
      } else {
        setUsers(prev => Array.isArray(prev) ? prev.filter(user => user && user.id !== data.userId) : []);
      }
      
      if (data.admin) {
        setAdmin(data.admin);
      }
    };

    const handleAdminChanged = (data) => {
      console.log('Admin changed:', data);
      setAdmin(data.admin);
      // Atualiza também o status de admin do usuário na lista
      setUsers(prev => prev.map(user => ({
        ...user,
        isAdmin: user.id === data.admin.id
      })));
    };

    const handleRoomClosed = (data) => {
      console.log('Room closed:', data);
      if (room?.id === data.roomId) {
        setRoom(null);
        setUsers([]);
        setAdmin(null);
        navigate('/');
      }
    };

    socket.on('create_room_success', handleCreateRoomSuccess);
    socket.on('create_room_error', handleCreateRoomError);
    socket.on('join_room_success', handleJoinRoomSuccess);
    socket.on('join_room_error', handleJoinRoomError);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('admin_changed', handleAdminChanged);
    socket.on('room_closed', handleRoomClosed);

    return () => {
      console.log('Cleaning up room event listeners');
      socket.off('create_room_success', handleCreateRoomSuccess);
      socket.off('create_room_error', handleCreateRoomError);
      socket.off('join_room_success', handleJoinRoomSuccess);
      socket.off('join_room_error', handleJoinRoomError);
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
      socket.off('admin_changed', handleAdminChanged);
      socket.off('room_closed', handleRoomClosed);
    };
  }, [socket, navigate]);

  const createRoom = async (data) => {
    return new Promise((resolve, reject) => {
      if (!socket || !connected) {
        reject(new Error('Não conectado ao servidor'));
        return;
      }

      console.log('Creating room:', data);
      
      const handleSuccess = (response) => {
        console.log('Create room success:', response);
        setRoom(response.room);
        setUsers(response.users || []);
        setAdmin(response.admin);
        setError(null);
        // Adicionando um pequeno delay para garantir que o estado foi atualizado
        setTimeout(() => {
          navigate(`/room/${response.room.id}`);
          resolve(response);
        }, 100);
      };

      const handleError = (error) => {
        console.error('Create room error:', error);
        setError(error.message);
        reject(new Error(error.message));
      };

      socket.once('create_room_success', handleSuccess);
      socket.once('create_room_error', handleError);

      socket.emit('create_room', {
        ...data,
        noMedia: !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia
      });

      // Limpar event listeners em caso de timeout
      setTimeout(() => {
        socket.off('create_room_success', handleSuccess);
        socket.off('create_room_error', handleError);
        reject(new Error('Timeout ao criar sala'));
      }, 10000);
    });
  };

  const joinRoom = async (data) => {
    return new Promise((resolve, reject) => {
      if (!socket || !connected) {
        reject(new Error('Não conectado ao servidor'));
        return;
      }

      console.log('Joining room:', data);
      
      const handleSuccess = (response) => {
        console.log('Join room success:', response);
        resolve(response);
      };

      const handleError = (error) => {
        console.error('Join room error:', error);
        reject(new Error(error.message));
      };

      socket.once('join_room_success', handleSuccess);
      socket.once('join_room_error', handleError);

      socket.emit('join_room', {
        name: data.name,
        roomId: data.room,
        instrument: data.instrument,
        mediaConfig: {
          hasVideo: data.hasVideo,
          hasAudio: data.hasAudio,
          hasInstrument: data.hasInstrument,
          videoDeviceId: data.videoDeviceId,
          audioDeviceId: data.audioDeviceId,
          instrumentInputId: data.instrumentInputId
        }
      });

      setTimeout(() => {
        socket.off('join_room_success', handleSuccess);
        socket.off('join_room_error', handleError);
        reject(new Error('Timeout ao entrar na sala'));
      }, 5000);
    });
  };

  const leaveRoom = () => {
    if (socket && room) {
      console.log('Leaving room:', room.id);
      socket.emit('leave_room', { roomId: room.id });
      setRoom(null);
      setUsers([]);
      setAdmin(null);
      navigate('/');
    }
  };

  return (
    <RoomContext.Provider
      value={{
        room,
        users,
        admin,
        error,
        createRoom,
        joinRoom,
        leaveRoom,
        connected
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

import React, { createContext, useContext } from 'react';
import io from 'socket.io-client';
import config from '../config';

const socket = io(config.SERVER_URL, {
  ...config.SOCKET_OPTIONS,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  timeout: 10000,
  autoConnect: true
});

const SocketContext = createContext({ socket });

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export default SocketContext;

const config = {
  // Use o IP público do seu servidor aqui
  SERVER_URL: 'http://localhost:5000',
  SOCKET_OPTIONS: {
    transports: ['polling', 'websocket'], // Usar polling primeiro, depois websocket
    upgrade: true, // Permitir upgrade para websocket
    forceNew: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000
  }
};

export default config;

const getSocketUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:5000';
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:5000`;
};

const config = {
  // URL dinâmica baseada no host atual (permite acesso via LAN/WiFi)
  SERVER_URL: getSocketUrl(),
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

import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, Tooltip, IconButton } from '@mui/material';
import { CenterFocusStrong } from '@mui/icons-material';
import { useWebRTC } from '../../contexts/webrtc/WebRTCContext';
import { useSocket } from '../../contexts/SocketContext';

// Tamanho do palco virtual
const STAGE_WIDTH = 600;
const STAGE_HEIGHT = 400;

const StageView = ({ roomId }) => {
  const { users, localUser } = useWebRTC();
  const { socket } = useSocket();
  const [positions, setPositions] = useState({}); // { userId: {x, y} }
  const draggingRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (socket) {
      socket.on('user_position_updated', ({ userId, position }) => {
        setPositions(prev => ({
          ...prev,
          [userId]: position
        }));
        
        // Aplicar Panning real (se tivéssemos acesso direto ao PannerNode aqui)
        // Idealmente, isso atualizaria um contexto global que o WebRTCManager escuta
        // Para este demo, é apenas visual + envio de dados
      });

      return () => {
        socket.off('user_position_updated');
      };
    }
  }, [socket]);

  // Inicializar posições padrão
  useEffect(() => {
    users.forEach((user, index) => {
      if (!positions[user.id]) {
        // Distribuir em arco
        const angle = (Math.PI / (users.length + 1)) * (index + 1);
        const r = STAGE_HEIGHT * 0.6;
        const x = 0.5 + (Math.cos(angle) * 0.4 * -1); // 0 a 1
        const y = 0.8 - (Math.sin(angle) * 0.5); // 0 a 1
        
        setPositions(prev => ({
          ...prev,
          [user.id]: { x, y }
        }));
      }
    });
  }, [users]);

  const handleMouseDown = (e, userId) => {
    if (userId !== localUser?.id) return; // Só pode mover a si mesmo por segurança/UX
    draggingRef.current = userId;
  };

  const handleMouseMove = (e) => {
    if (!draggingRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));

    const newPos = { x, y };
    
    setPositions(prev => ({
      ...prev,
      [draggingRef.current]: newPos
    }));

    // Debounce emit seria bom aqui
    socket.emit('update_user_position', { roomId, position: newPos });
  };

  const handleMouseUp = () => {
    draggingRef.current = null;
  };

  return (
    <Paper
      elevation={6}
      sx={{
        width: '100%',
        maxWidth: STAGE_WIDTH,
        height: STAGE_HEIGHT,
        position: 'relative',
        bgcolor: '#1a1a1a',
        backgroundImage: 'radial-gradient(circle at 50% 100%, #2a2a2a 0%, #1a1a1a 100%)',
        borderRadius: 4,
        overflow: 'hidden',
        mx: 'auto',
        border: '1px solid rgba(255,255,255,0.1)',
        cursor: draggingRef.current ? 'grabbing' : 'default'
      }}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <Typography 
        variant="caption" 
        sx={{ 
          position: 'absolute', 
          top: 10, 
          left: '50%', 
          transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.3)'
        }}
      >
        PALCO VIRTUAL (Arraste para posicionar o áudio estéreo)
      </Typography>

      {/* Grid Lines */}
      <Box sx={{ 
        position: 'absolute', inset: 0, 
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />

      {/* Users */}
      {users.map(user => {
        const pos = positions[user.id] || { x: 0.5, y: 0.5 };
        const isMe = user.id === localUser?.id;
        
        return (
          <Tooltip key={user.id} title={`${user.name} (${user.instrument})`}>
            <Box
              onMouseDown={(e) => handleMouseDown(e, user.id)}
              sx={{
                position: 'absolute',
                left: `${pos.x * 100}%`,
                top: `${pos.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: isMe ? 'primary.main' : 'secondary.main',
                border: '2px solid white',
                boxShadow: `0 0 20px ${isMe ? 'rgba(98, 0, 234, 0.5)' : 'rgba(3, 218, 198, 0.5)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isMe ? 'grab' : 'default',
                transition: draggingRef.current === user.id ? 'none' : 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                zIndex: 10,
                '&:hover': {
                  transform: 'translate(-50%, -50%) scale(1.1)'
                }
              }}
            >
              <Typography variant="body2" fontWeight="bold" sx={{ color: 'black' }}>
                {user.name.charAt(0).toUpperCase()}
              </Typography>
              
              {/* Panning Indicator Line */}
              <Box sx={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                height: STAGE_HEIGHT, // Long line to bottom
                width: 1,
                bgcolor: 'rgba(255,255,255,0.1)',
                pointerEvents: 'none'
              }} />
            </Box>
          </Tooltip>
        );
      })}

      {/* Center Marker */}
      <CenterFocusStrong sx={{ 
        position: 'absolute', 
        bottom: 10, 
        left: '50%', 
        transform: 'translateX(-50%)', 
        color: 'rgba(255,255,255,0.1)',
        fontSize: 40
      }} />
    </Paper>
  );
};

export default StageView;

import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { useWebRTC } from '../../contexts/webrtc/WebRTCContext';
import { ConnectionQualityIcon, ReconnectingIcon } from '../icons/ConnectionQualityIcon';

/**
 * Componente que exibe a qualidade de conexão de um usuário
 * 
 * @param {Object} props - Propriedades do componente
 * @param {string} props.userId - ID do usuário
 * @param {string} props.size - Tamanho do indicador: 'small', 'medium', 'large'
 * @param {string} props.color - Cor personalizada (opcional)
 */
const ConnectionQualityIndicator = ({ userId, size = 'medium', color = 'auto' }) => {
  const { connectionStates, userQualities } = useWebRTC();
  
  // Determinar tamanho em pixels com base no parâmetro
  const getSizeInPixels = () => {
    switch (size) {
      case 'small': return 16;
      case 'large': return 32;
      default: return 24;
    }
  };
  
  // Obter estado de conexão atual
  const connectionState = connectionStates[userId] || 'unknown';
  
  // Obter pontuação de qualidade (0-1)
  const quality = userQualities[userId]?.score || 0.5;
  
  // Renderizar indicador apropriado com base no estado
  if (connectionState === 'reconnecting') {
    return (
      <Tooltip title="Reconectando..." arrow>
        <Box sx={{ display: 'inline-flex' }}>
          <ReconnectingIcon size={getSizeInPixels()} color="#FF9800" />
        </Box>
      </Tooltip>
    );
  } else if (connectionState === 'disconnected') {
    return (
      <Tooltip title="Desconectado" arrow>
        <Box sx={{ display: 'inline-flex' }}>
          <ConnectionQualityIcon quality={0} color="#F44336" size={getSizeInPixels()} />
        </Box>
      </Tooltip>
    );
  }
  
  // Para estado conectado, mostrar ícone de qualidade
  return (
    <ConnectionQualityIcon 
      quality={quality} 
      color={color} 
      size={getSizeInPixels()} 
      showTooltip
    />
  );
};

export default ConnectionQualityIndicator;

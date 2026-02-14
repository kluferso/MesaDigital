import React from 'react';
import { Box, Tooltip } from '@mui/material';

/**
 * Ícone de qualidade de conexão com estilo semelhante a Wi-Fi
 * 
 * @param {Object} props - Propriedades do componente
 * @param {number} props.quality - Qualidade da conexão de 0 a 1
 * @param {string} props.color - Cor principal do ícone (opcional)
 * @param {number} props.size - Tamanho do ícone em pixels (opcional)
 * @param {boolean} props.showTooltip - Se deve mostrar tooltip (opcional)
 * @param {string} props.tooltipText - Texto personalizado para o tooltip (opcional)
 */
export const ConnectionQualityIcon = ({ 
  quality = 1, 
  color = '#2196f3', 
  size = 24,
  showTooltip = true,
  tooltipText = null
}) => {
  // Certificar que a qualidade está no intervalo [0, 1]
  const safeQuality = Math.max(0, Math.min(1, quality));
  
  // Definir cores baseadas na qualidade
  let barColor;
  let qualityText;
  
  if (safeQuality >= 0.8) {
    barColor = '#4CAF50'; // Verde - Excelente
    qualityText = 'Excelente';
  } else if (safeQuality >= 0.6) {
    barColor = '#8BC34A'; // Verde claro - Boa
    qualityText = 'Boa';
  } else if (safeQuality >= 0.4) {
    barColor = '#FFC107'; // Amarelo - Moderada
    qualityText = 'Moderada';
  } else if (safeQuality >= 0.2) {
    barColor = '#FF9800'; // Laranja - Fraca
    qualityText = 'Fraca';
  } else {
    barColor = '#F44336'; // Vermelho - Muito fraca
    qualityText = 'Muito fraca';
  }
  
  // Usar cor personalizada se fornecida
  const finalColor = color === 'auto' ? barColor : color;
  
  // Calcular altura das barras com base na qualidade
  const getBarHeight = (barIndex, totalBars = 4) => {
    const threshold = barIndex / totalBars;
    return safeQuality >= threshold ? '100%' : '40%';
  };
  
  // Calcular opacidade das barras com base na qualidade
  const getBarOpacity = (barIndex, totalBars = 4) => {
    const threshold = barIndex / totalBars;
    return safeQuality >= threshold ? 1 : 0.3;
  };
  
  const tooltip = tooltipText || `Qualidade de conexão: ${qualityText} (${Math.round(safeQuality * 100)}%)`;
  
  const content = (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'flex-end',
        height: size,
        gap: size / 16
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <Box
          key={i}
          sx={{
            width: size / 6,
            height: getBarHeight(i, 3),
            backgroundColor: finalColor,
            borderRadius: size / 16,
            opacity: getBarOpacity(i, 3),
            transition: 'all 0.3s ease'
          }}
        />
      ))}
    </Box>
  );
  
  return showTooltip ? (
    <Tooltip title={tooltip} arrow>
      {content}
    </Tooltip>
  ) : content;
};

/**
 * Ícone animado para indicar reconexão ou perda de conexão
 */
export const ReconnectingIcon = ({ size = 24, color = '#F44336' }) => {
  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        animation: 'pulse 1.5s infinite'
      }}
    >
      <Box
        sx={{
          '@keyframes pulse': {
            '0%': {
              transform: 'scale(0.95)',
              opacity: 0.7,
            },
            '50%': {
              transform: 'scale(1.05)',
              opacity: 1,
            },
            '100%': {
              transform: 'scale(0.95)',
              opacity: 0.7,
            },
          },
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: 'transparent',
          border: `2px solid ${color}`,
          position: 'absolute',
          animation: 'pulse 1.5s infinite',
        }}
      />
      <Box
        component="span"
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: size * 0.6,
          height: size * 0.6,
          borderRadius: '50%',
          backgroundColor: color,
          animation: 'pulse 1.5s infinite reverse',
        }}
      />
    </Box>
  );
};

export default { ConnectionQualityIcon, ReconnectingIcon };

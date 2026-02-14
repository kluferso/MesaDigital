import React from 'react';
import { Box, useTheme } from '@mui/material';

/**
 * Componente de medidor de volume (VU Meter)
 * @param {number} level - Nível de áudio (0.0 a 1.0)
 * @param {string} status - Status do áudio ('normal', 'peaking', 'silent')
 * @param {number} width - Largura do componente
 * @param {number} height - Altura do componente
 * @param {string} orientation - Orientação ('vertical' ou 'horizontal')
 */
const VUMeter = ({ level = 0, status = 'normal', width = 6, height = 40, orientation = 'vertical' }) => {
  const theme = useTheme();

  // Nível normalizado entre 0 e 1
  // Geralmente o nível de áudio vem baixo (0.0 a 0.2 para fala normal), então podemos aplicar um ganho visual
  // Ajuste para visualização mais responsiva
  const normalizedLevel = Math.min(1, level * 5); 

  let color = theme.palette.success.main;
  if (status === 'peaking' || normalizedLevel > 0.9) {
    color = theme.palette.error.main;
  } else if (normalizedLevel > 0.7) {
    color = theme.palette.warning.main;
  }

  if (orientation === 'horizontal') {
    return (
      <Box
        sx={{
          width: height, // Invertido pois width/height são dimensões da barra
          height: width, 
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderRadius: 1,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <Box
          sx={{
            width: `${normalizedLevel * 100}%`,
            height: '100%',
            bgcolor: color,
            transition: 'width 0.1s ease-out',
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: width,
        height: height,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        borderRadius: 1,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'flex-end',
        position: 'relative'
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: `${normalizedLevel * 100}%`,
          bgcolor: color,
          transition: 'height 0.1s ease-out',
        }}
      />
    </Box>
  );
};

export default VUMeter;

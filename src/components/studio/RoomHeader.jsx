import React from 'react';
import { Box, Typography, IconButton, Tooltip, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Info as InfoIcon, Share as ShareIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

/**
 * Cabeçalho da sala com informações e botões de ação
 */
const RoomHeader = ({ roomId, onInfoClick, onShareClick }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ 
        mr: 1,
        width: 40,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.primary.main,
        borderRadius: '50%'
      }}>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
          {roomId.charAt(0).toUpperCase()}
        </Typography>
      </Box>
      
      <Box>
        <Typography variant="h6" component="h1" sx={{ 
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center'
        }}>
          {t('room.studio')}
          <Chip 
            label={roomId} 
            size="small" 
            color="primary" 
            sx={{ ml: 1, height: 24 }} 
            onClick={onShareClick}
          />
        </Typography>
        
        <Typography variant="caption" color="text.secondary">
          {t('room.webrtcEnabled')}
        </Typography>
      </Box>
      
      <Box sx={{ ml: 2 }}>
        <Tooltip title={t('room.info.view')}>
          <IconButton size="small" onClick={onInfoClick}>
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title={t('room.share')}>
          <IconButton size="small" onClick={onShareClick}>
            <ShareIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default RoomHeader;

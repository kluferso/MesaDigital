import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  Chip,
  Paper,
  IconButton,
  Badge,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Person as PersonIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  VolumeUp as VolumeUpIcon,
  VolumeMute as VolumeMuteIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useWebRTC } from '../../contexts/webrtc/WebRTCContext';
import ConnectionQualityIndicator from '../audio/ConnectionQualityIndicator';

// Avatar com indicador de status
const StatusAvatar = styled(Badge)(({ theme, online, isself }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: online ? theme.palette.success.main : theme.palette.warning.main,
    color: online ? theme.palette.success.main : theme.palette.warning.main,
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      border: isself ? `2px solid ${theme.palette.primary.main}` : 'none',
      content: '""',
    },
  },
}));

/**
 * Painel que exibe a lista de participantes
 */
const ParticipantsPanel = ({ participants, localUserId, connectingUsers, qualities }) => {
  const { t } = useTranslation();
  const { toggleAudio, audioEnabled, userVolumes, setUserVolume } = useWebRTC();

  // Ordenar participantes (colocando o local primeiro)
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.id === localUserId) return -1;
    if (b.id === localUserId) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {t('participants.title')}
        </Typography>
        <Chip 
          label={`${participants.length} ${t('participants.online')}`} 
          color="primary" 
          size="small" 
          icon={<PersonIcon />}
        />
      </Box>

      <Paper variant="outlined" sx={{ mb: 3 }}>
        <List disablePadding>
          {sortedParticipants.map((participant, index) => {
            const isLocal = participant.id === localUserId;
            const isConnecting = connectingUsers.includes(participant.id);
            const quality = qualities[participant.id] || { category: 'unknown' };
            
            return (
              <React.Fragment key={participant.id}>
                {index > 0 && <Divider component="li" variant="inset" />}
                
                <ListItem
                  sx={{
                    py: 1.5,
                    backgroundColor: isLocal ? 'action.hover' : 'transparent'
                  }}
                  secondaryAction={
                    isLocal ? (
                      <IconButton
                        edge="end"
                        color={audioEnabled ? 'primary' : 'error'}
                        onClick={() => toggleAudio(!audioEnabled)}
                        size="small"
                      >
                        {audioEnabled ? <MicIcon /> : <MicOffIcon />}
                      </IconButton>
                    ) : (
                      <IconButton
                        edge="end"
                        color={userVolumes[participant.id] === 0 ? 'error' : 'default'}
                        onClick={() => {
                          const currentVolume = userVolumes[participant.id] || 1;
                          setUserVolume(participant.id, currentVolume === 0 ? 1 : 0);
                        }}
                        size="small"
                      >
                        {userVolumes[participant.id] === 0 ? <VolumeMuteIcon /> : <VolumeUpIcon />}
                      </IconButton>
                    )
                  }
                >
                  <ListItemAvatar>
                    <StatusAvatar
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      variant="dot"
                      online={!isConnecting}
                      isself={isLocal}
                    >
                      <Avatar
                        sx={{
                          bgcolor: isLocal ? 'primary.main' : 'secondary.main',
                          border: isLocal ? '2px solid' : 'none',
                          borderColor: 'primary.main'
                        }}
                      >
                        {participant.name.charAt(0).toUpperCase()}
                      </Avatar>
                    </StatusAvatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" component="span" sx={{ fontWeight: isLocal ? 'bold' : 'regular' }}>
                          {participant.name} {isLocal && `(${t('participants.you')})`}
                        </Typography>
                        <ConnectionQualityIndicator userId={participant.id} size="small" />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        <Chip
                          label={participant.instrument}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                        {isConnecting && (
                          <Chip
                            label={t('participants.connecting')}
                            size="small"
                            color="warning"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            );
          })}
          
          {participants.length === 0 && (
            <ListItem>
              <ListItemText
                primary={t('participants.noParticipants')}
                secondary={t('participants.waitingForOthers')}
              />
            </ListItem>
          )}
        </List>
      </Paper>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t('participants.connectionQuality')}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Paper variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main' }} />
            <Typography variant="caption">{t('qualityIndicator.excellent')}</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.light' }} />
            <Typography variant="caption">{t('qualityIndicator.good')}</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'warning.light' }} />
            <Typography variant="caption">{t('qualityIndicator.fair')}</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'warning.main' }} />
            <Typography variant="caption">{t('qualityIndicator.poor')}</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'error.main' }} />
            <Typography variant="caption">{t('qualityIndicator.critical')}</Typography>
          </Paper>
        </Box>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="body2" color="text.secondary">
        {t('participants.webrtcInfo')}
      </Typography>
    </Box>
  );
};

export default ParticipantsPanel;

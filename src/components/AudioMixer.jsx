import React, { useState, useEffect } from 'react';
import {
  Box,
  Slider,
  Typography,
  Paper,
  IconButton,
  Avatar,
  useTheme,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Stack,
  Divider,
  Collapse,
  Grid
} from '@mui/material';
import {
  VolumeUp,
  VolumeOff,
  VolumeMute,
  VolumeDown,
  MusicNote,
  Warning,
  GraphicEq,
  PanTool,
  SettingsInputComponent,
  ExpandMore,
  ExpandLess,
  Equalizer,
  Speed,
} from '@mui/icons-material';
import useWebRTC from '../hooks/useWebRTC';
import { useSocket } from '../contexts/SocketContext';
import { useAudioInterfaces } from '../hooks/useAudioInterfaces';
import { useTranslation } from 'react-i18next';

function AudioMixer({ users }) {
  const theme = useTheme();
  const { socket } = useSocket();
  const { 
    localStream,
    remoteStreams,
    audioEnabled,
    videoEnabled,
    volume
  } = useWebRTC();
  const { interfaces, selectedInterface, error: interfaceError, selectInterface } = useAudioInterfaces();
  const { t } = useTranslation();
  const [interfaceId, setInterfaceId] = useState('');
  const [expandedUsers, setExpandedUsers] = useState(new Set());

  // Efeito para selecionar interface quando mudar
  useEffect(() => {
    if (interfaceId) {
      selectInterface(interfaceId);
    }
  }, [interfaceId, selectInterface]);

  const handleVolumeChange = (userId, newValue) => {
    // setVolume(userId, newValue);
  };

  const handleMuteToggle = (userId) => {
    // toggleMute(userId);
  };

  const handleEQChange = (userId, band, value) => {
    // setEQ(userId, band, value);
  };

  const handleGainChange = (userId, value) => {
    // setGain(userId, value);
  };

  const handleExpandToggle = (userId) => {
    setExpandedUsers(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(userId)) {
        newExpanded.delete(userId);
      } else {
        newExpanded.add(userId);
      }
      return newExpanded;
    });
  };

  const handleInterfaceChange = (event) => {
    setInterfaceId(event.target.value);
  };

  const getVolumeIcon = (volume, muted) => {
    if (muted) return <VolumeOff />;
    if (volume === 0) return <VolumeMute />;
    if (volume < 50) return <VolumeDown />;
    return <VolumeUp />;
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        bgcolor: theme.palette.background.paper,
        borderRadius: '16px',
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        pb: 1,
        borderBottom: `2px solid ${theme.palette.primary.main}`
      }}>
        <GraphicEq color="primary" />
        <Typography variant="h6" color="primary" fontWeight="bold">
          {t('mixer.title')}
        </Typography>
      </Box>

      {/* Interface Section */}
      <Box sx={{ 
        p: 2, 
        bgcolor: theme.palette.background.default,
        borderRadius: '12px',
        border: `1px solid ${theme.palette.divider}`
      }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <SettingsInputComponent color="primary" />
          <Typography variant="subtitle1" color="primary" fontWeight="500">
            {t('mixer.interface')}
          </Typography>
        </Stack>

        <FormControl fullWidth variant="outlined" size="small">
          <Select
            value={interfaceId}
            onChange={handleInterfaceChange}
            displayEmpty
            sx={{
              bgcolor: theme.palette.background.paper,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.divider,
              },
            }}
          >
            <MenuItem value="">
              <em>{t('mixer.noInterface')}</em>
            </MenuItem>
            {interfaces.map((iface) => (
              <MenuItem key={iface.id} value={iface.id}>
                {iface.name} ({iface.channels.length} {t('mixer.channels')})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {interfaceError && (
          <Alert 
            severity="warning" 
            icon={<Warning />}
            sx={{ mt: 2 }}
          >
            {interfaceError}
          </Alert>
        )}

        {selectedInterface && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              {selectedInterface.name}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {selectedInterface.streams.map((stream, index) => (
                <Tooltip 
                  key={stream.id} 
                  title={stream.active ? t('mixer.channelActive') : t('mixer.channelInactive')}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '8px',
                      bgcolor: stream.active ? 'success.main' : 'error.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `2px solid ${theme.palette.background.paper}`,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    <Typography variant="caption" color="white" fontWeight="bold">
                      {index + 1}
                    </Typography>
                  </Box>
                </Tooltip>
              ))}
            </Stack>
          </Box>
        )}
      </Box>

      {/* Channels Section */}
      <Box 
        sx={{ 
          flex: 1,
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 2,
          p: 1,
        }}
      >
        {users
          .filter(Boolean) // Filtra apenas usuários válidos
          .map(user => {
            const hasInterface = selectedInterface?.streams.some(s => s.active);
            const isExpanded = expandedUsers.has(user.id);
            const isLocal = user.isLocal;

            return (
              <Paper
                key={user.id}
                elevation={1}
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  borderRadius: '12px',
                  transition: 'all 0.2s ease-in-out',
                  opacity: hasInterface ? 1 : 0.7,
                  border: `1px solid ${theme.palette.divider}`,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  },
                  ...(isLocal && {
                    border: `2px solid ${theme.palette.primary.main}`,
                    boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
                  }),
                }}
              >
                {/* User Info */}
                <Box sx={{ textAlign: 'center', width: '100%' }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: theme.palette.primary.main,
                        border: `3px solid ${theme.palette.background.paper}`,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                    >
                      {getInitials(user.name)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" noWrap fontWeight="500">
                        {user.name}
                      </Typography>
                      {user.instrument && (
                        <Stack 
                          direction="row" 
                          alignItems="center" 
                          spacing={0.5}
                        >
                          <MusicNote sx={{ fontSize: '0.875rem', color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {user.instrument}
                          </Typography>
                        </Stack>
                      )}
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleExpandToggle(user.id)}
                      sx={{ color: 'primary.main' }}
                    >
                      {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Stack>
                </Box>

                {/* Main Controls */}
                <Box 
                  sx={{ 
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  {/* Gain Control */}
                  <Box sx={{ width: '100%', mb: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Speed color="primary" sx={{ fontSize: '1.2rem' }} />
                      <Typography variant="caption" color="primary" fontWeight="500">
                        GAIN
                      </Typography>
                      <Box 
                        sx={{ 
                          px: 1, 
                          py: 0.25, 
                          bgcolor: 'background.default',
                          borderRadius: 1,
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        <Typography variant="caption" fontWeight="500">
                          {/* gain.toFixed(1) */}
                        </Typography>
                      </Box>
                    </Stack>
                    <Slider
                      // value={gain}
                      // onChange={(_, value) => handleGainChange(user.id, value)}
                      min={0}
                      max={2}
                      step={0.1}
                      disabled={!hasInterface}
                      size="small"
                      sx={{
                        color: theme.palette.warning.main,
                        '& .MuiSlider-thumb': {
                          width: 16,
                          height: 16,
                        },
                      }}
                    />
                  </Box>

                  {/* Volume Display */}
                  <Paper
                    sx={{
                      px: 1,
                      py: 0.5,
                      borderRadius: '4px',
                      bgcolor: theme.palette.background.default,
                      border: `1px solid ${theme.palette.divider}`,
                      minWidth: 40,
                      textAlign: 'center',
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      fontWeight="500"
                      color={'text.primary'}
                    >
                      {/* volume */}
                    </Typography>
                  </Paper>

                  {/* Vertical Fader */}
                  <Box sx={{ height: 150 }}>
                    <Slider
                      // value={volume}
                      // onChange={(_, newValue) => handleVolumeChange(user.id, newValue)}
                      disabled={!hasInterface}
                      min={0}
                      max={100}
                      orientation="vertical"
                      sx={{
                        '& .MuiSlider-thumb': {
                          width: 28,
                          height: 28,
                          bgcolor: theme.palette.background.paper,
                          border: `2px solid ${theme.palette.primary.main}`,
                          '&:hover, &.Mui-focusVisible': {
                            boxShadow: `0px 0px 0px 8px ${theme.palette.primary.main}20`,
                          },
                        },
                        '& .MuiSlider-track': {
                          width: 8,
                          borderRadius: 4,
                          bgcolor: theme.palette.primary.main,
                        },
                        '& .MuiSlider-rail': {
                          width: 8,
                          borderRadius: 4,
                          bgcolor: theme.palette.divider,
                        },
                      }}
                    />
                  </Box>

                  {/* Mute Button */}
                  <Tooltip title={'Mute'}>
                    <IconButton
                      // onClick={() => handleMuteToggle(user.id)}
                      color={'primary'}
                      disabled={!hasInterface}
                      size="small"
                      sx={{
                        border: `2px solid ${theme.palette.primary.main}`,
                        '&:hover': {
                          bgcolor: 'primary.main',
                          '& .MuiSvgIcon-root': {
                            color: 'white',
                          },
                        },
                      }}
                    >
                      <VolumeUp />
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* EQ Controls */}
                <Collapse in={isExpanded} sx={{ width: '100%' }}>
                  <Box sx={{ mt: 2, width: '100%' }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                      <Equalizer color="primary" sx={{ fontSize: '1.2rem' }} />
                      <Typography variant="caption" color="primary" fontWeight="500">
                        EQ
                      </Typography>
                    </Stack>
                    
                    {/* High */}
                    <Box sx={{ mb: 2 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          HIGH
                        </Typography>
                        <Box 
                          sx={{ 
                            px: 1, 
                            py: 0.25, 
                            bgcolor: 'background.default',
                            borderRadius: 1,
                            border: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <Typography variant="caption">
                            {/* eq.high */}
                          </Typography>
                        </Box>
                      </Stack>
                      <Slider
                        // value={eq.high}
                        // onChange={(_, value) => handleEQChange(user.id, 'high', value)}
                        min={-12}
                        max={12}
                        disabled={!hasInterface}
                        size="small"
                        sx={{
                          color: theme.palette.info.main,
                          '& .MuiSlider-thumb': {
                            width: 16,
                            height: 16,
                          },
                        }}
                      />
                    </Box>

                    {/* Mid */}
                    <Box sx={{ mb: 2 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          MID
                        </Typography>
                        <Box 
                          sx={{ 
                            px: 1, 
                            py: 0.25, 
                            bgcolor: 'background.default',
                            borderRadius: 1,
                            border: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <Typography variant="caption">
                            {/* eq.mid */}
                          </Typography>
                        </Box>
                      </Stack>
                      <Slider
                        // value={eq.mid}
                        // onChange={(_, value) => handleEQChange(user.id, 'mid', value)}
                        min={-12}
                        max={12}
                        disabled={!hasInterface}
                        size="small"
                        sx={{
                          color: theme.palette.success.main,
                          '& .MuiSlider-thumb': {
                            width: 16,
                            height: 16,
                          },
                        }}
                      />
                    </Box>

                    {/* Low */}
                    <Box>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          LOW
                        </Typography>
                        <Box 
                          sx={{ 
                            px: 1, 
                            py: 0.25, 
                            bgcolor: 'background.default',
                            borderRadius: 1,
                            border: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <Typography variant="caption">
                            {/* eq.low */}
                          </Typography>
                        </Box>
                      </Stack>
                      <Slider
                        // value={eq.low}
                        // onChange={(_, value) => handleEQChange(user.id, 'low', value)}
                        min={-12}
                        max={12}
                        disabled={!hasInterface}
                        size="small"
                        sx={{
                          color: theme.palette.error.main,
                          '& .MuiSlider-thumb': {
                            width: 16,
                            height: 16,
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </Collapse>
              </Paper>
            );
          })}
      </Box>
    </Paper>
  );
}

export default AudioMixer;

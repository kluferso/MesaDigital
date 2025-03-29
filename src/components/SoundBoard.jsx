import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Slider,
  IconButton,
  Grid,
  Avatar,
  Stack,
  Tooltip,
  Chip,
  Divider
} from '@mui/material';
import {
  VolumeUp,
  VolumeOff,
  MusicNote,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  GraphicEq as EqIcon
} from '@mui/icons-material';

const ParticipantChannel = ({ participant, onVolumeChange, onMuteToggle }) => {
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);

  const handleVolumeChange = (_, newValue) => {
    setVolume(newValue);
    onVolumeChange?.(participant.id, newValue);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    onMuteToggle?.(participant.id, !isMuted);
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 1 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            {participant.name[0].toUpperCase()}
          </Avatar>
        </Grid>
        <Grid item xs>
          <Stack spacing={0.5}>
            <Typography variant="subtitle1" fontWeight="medium">
              {participant.name}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                size="small"
                icon={<MusicNote />}
                label={participant.instrument}
                color="secondary"
              />
              {participant.isLocal && (
                <Chip size="small" label="Você" color="primary" />
              )}
              {participant.isAdmin && (
                <Chip size="small" label="Admin" color="error" />
              )}
            </Stack>
          </Stack>
        </Grid>
        <Grid item xs={12} sm>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton size="small" onClick={handleMuteToggle}>
                {isMuted ? <VolumeOff /> : <VolumeUp />}
              </IconButton>
              <Slider
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                disabled={isMuted}
                sx={{ mx: 2 }}
              />
              <Typography variant="body2" sx={{ minWidth: 35 }}>
                {isMuted ? 0 : volume}%
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} justifyContent="center">
              <Tooltip title={participant.audioEnabled ? "Microfone Ativo" : "Microfone Desativado"}>
                <span>
                  <IconButton 
                    size="small" 
                    color={participant.audioEnabled ? "primary" : "default"}
                    disabled
                  >
                    {participant.audioEnabled ? <MicIcon /> : <MicOffIcon />}
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={participant.videoEnabled ? "Câmera Ativa" : "Câmera Desativada"}>
                <span>
                  <IconButton 
                    size="small"
                    color={participant.videoEnabled ? "primary" : "default"}
                    disabled
                  >
                    {participant.videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Equalizador">
                <IconButton size="small">
                  <EqIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );
};

const SoundBoard = ({ participants = [], onVolumeChange, onMuteToggle }) => {
  // Ordenar participantes: local primeiro, depois admin, depois os demais
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.isLocal) return -1;
    if (b.isLocal) return 1;
    if (a.isAdmin) return -1;
    if (b.isAdmin) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <Box sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom sx={{ px: 2, pt: 2 }}>
        Mesa de Som
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 2 }}>
        {participants.length} participante{participants.length !== 1 ? 's' : ''}
      </Typography>
      <Divider />
      <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 2 }}>
        {sortedParticipants.map((participant) => (
          <ParticipantChannel
            key={participant.id}
            participant={participant}
            onVolumeChange={onVolumeChange}
            onMuteToggle={onMuteToggle}
          />
        ))}
      </Box>
    </Box>
  );
};

export default SoundBoard;

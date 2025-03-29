import React, { useEffect, useRef } from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { VideocamOff as VideocamOffIcon } from '@mui/icons-material';
import useWebRTC from '../hooks/useWebRTC';
import { useSocket } from '../hooks/useSocket';

const VideoTile = ({ participant }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  if (!participant.stream || !participant.videoEnabled) {
    return (
      <Paper
        sx={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          borderRadius: 1,
          p: 2
        }}
      >
        <VideocamOffIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography variant="subtitle1" color="text.primary">
          {participant.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {participant.instrument}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: 1,
        overflow: 'hidden'
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={participant.isLocal}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          p: 1,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
          color: 'white'
        }}
      >
        <Typography variant="subtitle2">
          {participant.name} {participant.isLocal && '(Você)'} - {participant.instrument}
        </Typography>
      </Box>
    </Box>
  );
};

const VideoGrid = () => {
  const { socket } = useSocket();
  const { localStream, remoteStreams, audioEnabled, videoEnabled } = useWebRTC();

  const participants = [
    ...(localStream ? [{ 
      id: socket?.id, 
      name: 'Você',
      stream: localStream,
      audioEnabled,
      videoEnabled,
      isLocal: true
    }] : []),
    ...Object.entries(remoteStreams).map(([id, stream]) => ({
      id,
      stream,
      name: 'Participante',
      audioEnabled: true,
      videoEnabled: true
    }))
  ];

  const calculateGridSize = (count) => {
    if (count <= 1) return { cols: 1, rows: 1 };
    if (count <= 2) return { cols: 2, rows: 1 };
    if (count <= 4) return { cols: 2, rows: 2 };
    if (count <= 6) return { cols: 3, rows: 2 };
    if (count <= 9) return { cols: 3, rows: 3 };
    return { cols: 4, rows: Math.ceil(count / 4) };
  };

  const { cols, rows } = calculateGridSize(participants.length);
  const height = `${100 / rows}%`;
  const minHeight = `${100 / Math.max(rows, 2)}%`;

  if (participants.length === 0) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Nenhum participante com vídeo
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', p: 1 }}>
      <Grid
        container
        spacing={1}
        sx={{
          height: '100%',
          '& .MuiGrid-item': {
            height,
            minHeight
          }
        }}
      >
        {participants.map((participant) => (
          <Grid
            key={participant.id}
            item
            xs={12 / cols}
            sx={{
              aspectRatio: '16/9'
            }}
          >
            <VideoTile participant={participant} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default VideoGrid;

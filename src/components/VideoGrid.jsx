import React, { useEffect, useRef } from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { VideocamOff as VideocamOffIcon } from '@mui/icons-material';
import useWebRTC from '../hooks/useWebRTC';
import { useSocket } from '../hooks/useSocket';

const VideoTile = ({ participant, isLocal, numberOfParticipants }) => {
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
        muted={isLocal}
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
          {participant.name} {isLocal && '(Você)'} - {participant.instrument}
        </Typography>
      </Box>
    </Box>
  );
};

const VideoGrid = () => {
  const { socket } = useSocket();
  const { localStream, remoteStreams, audioEnabled, videoEnabled, localParticipantId } = useWebRTC();

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

  const participantsCount = participants.length;

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'grid',
        gridTemplateColumns: {
          xs: participantsCount <= 1 ? '1fr' : 'repeat(2, 1fr)', 
          sm: participantsCount <= 1 ? '1fr' : participantsCount <= 4 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          md: participantsCount <= 1 ? '1fr' : participantsCount <= 4 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          lg: participantsCount <= 1 ? '1fr' : participantsCount <= 4 ? 'repeat(2, 1fr)' : participantsCount <= 6 ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)',
        },
        gridTemplateRows: {
          xs: participantsCount <= 2 ? '1fr' : 'repeat(auto-fill, 1fr)',
          sm: participantsCount <= 2 ? '1fr' : participantsCount <= 6 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          md: participantsCount <= 3 ? '1fr' : participantsCount <= 6 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          lg: participantsCount <= 4 ? '1fr' : participantsCount <= 8 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
        },
        gap: { xs: 1, sm: 2 },
        overflow: 'hidden',
        placeItems: 'center',
        placeContent: 'center',
      }}
    >
      {participants.map((participant) => (
        <VideoTile
          key={participant.id}
          participant={participant}
          isLocal={participant.id === localParticipantId}
          numberOfParticipants={participantsCount}
        />
      ))}
    </Box>
  );
};

export default VideoGrid;

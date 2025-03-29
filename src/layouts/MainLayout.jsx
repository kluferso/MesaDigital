import React from 'react';
import { Box } from '@mui/material';
import { useRoom } from '../contexts/RoomContext';
import LoginScreen from '../components/LoginScreen';
import Room from '../components/Room';

const MainLayout = () => {
  const { room } = useRoom();

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: 'background.default',
      color: 'text.primary'
    }}>
      {room ? <Room /> : <LoginScreen />}
    </Box>
  );
};

export default MainLayout;

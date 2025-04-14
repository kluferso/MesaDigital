import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import theme from './theme';
import EnhancedLoginScreen from './components/EnhancedLoginScreen';
import EnhancedStudioRoom from './components/studio/EnhancedStudioRoom';
import { SocketProvider } from './contexts/SocketContext';
import { WebRTCProvider } from './contexts/webrtc/WebRTCContext';

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SocketProvider>
          <WebRTCProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<EnhancedLoginScreen />} />
                <Route path="/room/:roomId" element={<EnhancedStudioRoom />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </WebRTCProvider>
        </SocketProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

export default App;
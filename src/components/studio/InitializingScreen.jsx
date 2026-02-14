import React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Alert
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon, 
  Error as ErrorIcon, 
  Pending as PendingIcon,
  Refresh as RefreshIcon,
  ExitToApp as ExitIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

/**
 * Tela de inicialização com passos visual
 */
const InitializingScreen = ({ 
  roomId, 
  step, 
  error, 
  attempts, 
  maxAttempts, 
  onRetry, 
  onExit 
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  // Definição dos passos
  const steps = [
    {
      label: t('initialization.step1.title'),
      description: t('initialization.step1.description'),
      icon: <PendingIcon />,
      errorIcon: <ErrorIcon />,
      successIcon: <CheckCircleIcon />
    },
    {
      label: t('initialization.step2.title'),
      description: t('initialization.step2.description'),
      icon: <PendingIcon />,
      errorIcon: <ErrorIcon />,
      successIcon: <CheckCircleIcon />
    },
    {
      label: t('initialization.step3.title'),
      description: t('initialization.step3.description'),
      icon: <PendingIcon />,
      errorIcon: <ErrorIcon />,
      successIcon: <CheckCircleIcon />
    }
  ];

  return (
    <Container maxWidth="sm" sx={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4
    }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          width: '100%',
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            {t('initialization.title')}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {t('initialization.connectingToRoom', { roomId })}
          </Typography>
        </Box>

        <Stepper activeStep={step} orientation="vertical" sx={{ mb: 4 }}>
          {steps.map((stepItem, index) => (
            <Step key={stepItem.label} completed={step > index}>
              <StepLabel
                optional={
                  index === 2 ? (
                    <Typography variant="caption">{t('initialization.finalStep')}</Typography>
                  ) : null
                }
                StepIconComponent={() => {
                  if (index < step) {
                    return stepItem.successIcon;
                  }
                  if (index === step) {
                    return error ? stepItem.errorIcon : stepItem.icon;
                  }
                  return stepItem.icon;
                }}
              >
                {stepItem.label}
                {index === 2 && step === 2 && attempts > 0 && (
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    ({t('initialization.attempt', { current: attempts + 1, max: maxAttempts })})
                  </Typography>
                )}
              </StepLabel>
              <StepContent>
                <Typography variant="body2">{stepItem.description}</Typography>
                
                {index === step && error && (
                  <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                    {error}
                  </Alert>
                )}
                
                {index === step && !error && (
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size={24} />
                  </Box>
                )}
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {error && attempts >= maxAttempts && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={onRetry}
              startIcon={<RefreshIcon />}
            >
              {t('initialization.retry')}
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              onClick={onExit}
              startIcon={<ExitIcon />}
            >
              {t('initialization.exit')}
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default InitializingScreen;

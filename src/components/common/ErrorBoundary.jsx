import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ErrorOutline, Refresh } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ error }) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 500,
          textAlign: 'center'
        }}
      >
        <ErrorOutline color="error" sx={{ fontSize: 64, mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          {t('errors.title')}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {t('errors.description')}
        </Typography>
        {error && (
          <Typography
            variant="body2"
            sx={{
              p: 2,
              mb: 3,
              bgcolor: 'background.paper',
              borderRadius: 1,
              fontFamily: 'monospace'
            }}
          >
            {error.message}
          </Typography>
        )}
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={() => window.location.reload()}
        >
          {t('errors.refresh')}
        </Button>
      </Paper>
    </Box>
  );
}

export default ErrorBoundary;

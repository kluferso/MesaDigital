import { createTheme } from '@mui/material/styles';

const lightPalette = {
  primary: {
    main: '#6200ea', // Deep Purple
    light: '#9d46ff',
    dark: '#0a00b6',
    contrastText: '#ffffff'
  },
  secondary: {
    main: '#00b0ff', // Light Blue
    light: '#69e2ff',
    dark: '#0081cb',
    contrastText: '#000000'
  },
  background: {
    default: '#f0f2f5',
    paper: '#ffffff',
    surface: '#ffffff'
  },
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)'
  },
  action: {
    active: 'rgba(0, 0, 0, 0.54)',
    hover: 'rgba(0, 0, 0, 0.04)',
    selected: 'rgba(0, 0, 0, 0.08)'
  }
};

const darkPalette = {
  primary: {
    main: '#bb86fc', // Pastel Purple
    light: '#efb7ff',
    dark: '#8858c8',
    contrastText: '#000000'
  },
  secondary: {
    main: '#03dac6', // Teal
    light: '#66fff9',
    dark: '#00a896',
    contrastText: '#000000'
  },
  background: {
    default: '#121212',
    paper: '#1e1e1e',
    surface: '#2c2c2c'
  },
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    disabled: 'rgba(255, 255, 255, 0.5)'
  },
  action: {
    active: '#ffffff',
    hover: 'rgba(255, 255, 255, 0.08)',
    selected: 'rgba(255, 255, 255, 0.16)',
    disabled: 'rgba(255, 255, 255, 0.3)',
    disabledBackground: 'rgba(255, 255, 255, 0.12)'
  },
  divider: 'rgba(255, 255, 255, 0.12)'
};

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light' ? lightPalette : darkPalette),
  },
  shape: {
    borderRadius: 12
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em'
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.01em'
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      letterSpacing: '0.01em'
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      letterSpacing: '0.01em'
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43
    },
    button: {
      fontWeight: 600,
      textTransform: 'none'
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0,0,0,0.2)'
          }
        },
        containedPrimary: {
          background: mode === 'dark' ? 'linear-gradient(45deg, #bb86fc 30%, #9d46ff 90%)' : 'linear-gradient(45deg, #6200ea 30%, #9d46ff 90%)',
          color: mode === 'dark' ? '#000000' : '#ffffff'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: mode === 'dark' ? '0px 4px 20px rgba(0, 0, 0, 0.5)' : '0px 2px 10px rgba(0, 0, 0, 0.05)'
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          backgroundColor: mode === 'dark' ? '#121212' : '#ffffff',
          color: mode === 'dark' ? '#ffffff' : '#000000'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          overflow: 'hidden'
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16
        }
      }
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          height: 6
        },
        thumb: {
          width: 16,
          height: 16,
          '&:hover, &.Mui-focusVisible': {
            boxShadow: '0px 0px 0px 8px rgba(98, 0, 234, 0.16)'
          }
        },
        track: {
          border: 'none'
        },
        rail: {
          opacity: 0.3
        }
      }
    },
    MuiCssBaseline: {
      styleOverrides: `
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(211, 47, 47, 0); }
          100% { box-shadow: 0 0 0 0 rgba(211, 47, 47, 0); }
        }
      `,
    },
  }
});

const theme = createTheme(getDesignTokens('dark')); // Default to dark mode

export { getDesignTokens };
export default theme;

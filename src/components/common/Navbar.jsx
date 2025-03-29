import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  Tooltip,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
  Settings,
  Language,
  ExitToApp
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';

function Navbar() {
  const { t, i18n } = useTranslation();
  const { mode, toggleTheme } = useTheme();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [langAnchorEl, setLangAnchorEl] = React.useState(null);

  const handleSettingsClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageClick = (event) => {
    setLangAnchorEl(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setLangAnchorEl(null);
  };

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    handleLanguageClose();
  };

  return (
    <AppBar position="sticky" elevation={1}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {t('app.title')}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={t('navbar.toggleTheme')}>
            <IconButton color="inherit" onClick={toggleTheme}>
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>

          <Tooltip title={t('navbar.language')}>
            <IconButton color="inherit" onClick={handleLanguageClick}>
              <Language />
            </IconButton>
          </Tooltip>

          <Tooltip title={t('navbar.settings')}>
            <IconButton color="inherit" onClick={handleSettingsClick}>
              <Settings />
            </IconButton>
          </Tooltip>

          <Button
            color="inherit"
            startIcon={<ExitToApp />}
            onClick={() => window.location.reload()}
          >
            {t('navbar.exit')}
          </Button>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleSettingsClose}
        >
          <MenuItem onClick={handleSettingsClose}>
            {t('settings.audio')}
          </MenuItem>
          <MenuItem onClick={handleSettingsClose}>
            {t('settings.video')}
          </MenuItem>
          <MenuItem onClick={handleSettingsClose}>
            {t('settings.notifications')}
          </MenuItem>
        </Menu>

        <Menu
          anchorEl={langAnchorEl}
          open={Boolean(langAnchorEl)}
          onClose={handleLanguageClose}
        >
          <MenuItem onClick={() => handleLanguageChange('pt-BR')}>
            Português
          </MenuItem>
          <MenuItem onClick={() => handleLanguageChange('en')}>
            English
          </MenuItem>
          <MenuItem onClick={() => handleLanguageChange('es')}>
            Español
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;

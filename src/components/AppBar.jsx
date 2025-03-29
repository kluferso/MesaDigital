import React, { useState } from 'react';
import {
  AppBar as MuiAppBar,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Settings,
  Brightness4,
  Brightness7,
  Language,
  VolumeUp,
  Mic,
  Videocam
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'pt-BR', name: 'Português' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' }
];

function AppBar() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [volume, setVolume] = useState(100);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (event) => {
    i18n.changeLanguage(event.target.value);
  };

  return (
    <MuiAppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Mesa Digital
        </Typography>

        {/* Seletor de Idioma */}
        <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
          <Select
            value={i18n.language}
            onChange={handleLanguageChange}
            variant="outlined"
            sx={{ 
              color: 'inherit',
              '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.23)' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.23)' },
              '.MuiSvgIcon-root': { color: 'inherit' }
            }}
          >
            {languages.map((lang) => (
              <MenuItem key={lang.code} value={lang.code}>
                {lang.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Botão de Tema */}
        <IconButton
          color="inherit"
          onClick={toggleTheme}
          sx={{ mr: 2 }}
        >
          {isDarkMode ? <Brightness7 /> : <Brightness4 />}
        </IconButton>

        {/* Menu de Configurações */}
        <IconButton
          color="inherit"
          onClick={handleMenu}
          edge="end"
        >
          <Settings />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem>
            <ListItemIcon>
              <Language fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t('settings.language')} />
            <Select
              value={i18n.language}
              onChange={handleLanguageChange}
              size="small"
              sx={{ ml: 2, minWidth: 100 }}
            >
              {languages.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  {lang.name}
                </MenuItem>
              ))}
            </Select>
          </MenuItem>

          <MenuItem>
            <ListItemIcon>
              {isDarkMode ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
            </ListItemIcon>
            <FormControlLabel
              control={
                <Switch
                  checked={isDarkMode}
                  onChange={toggleTheme}
                  size="small"
                />
              }
              label={t('settings.darkMode')}
            />
          </MenuItem>

          <Divider />

          <MenuItem>
            <ListItemIcon>
              <VolumeUp fontSize="small" />
            </ListItemIcon>
            <FormControlLabel
              control={
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  style={{ marginLeft: 8 }}
                />
              }
              label={t('settings.volume')}
            />
          </MenuItem>

          <MenuItem>
            <ListItemIcon>
              <Mic fontSize="small" />
            </ListItemIcon>
            <FormControlLabel
              control={
                <Switch
                  checked={audioEnabled}
                  onChange={(e) => setAudioEnabled(e.target.checked)}
                  size="small"
                />
              }
              label={t('settings.microphone')}
            />
          </MenuItem>

          <MenuItem>
            <ListItemIcon>
              <Videocam fontSize="small" />
            </ListItemIcon>
            <FormControlLabel
              control={
                <Switch
                  checked={videoEnabled}
                  onChange={(e) => setVideoEnabled(e.target.checked)}
                  size="small"
                />
              }
              label={t('settings.camera')}
            />
          </MenuItem>
        </Menu>
      </Toolbar>
    </MuiAppBar>
  );
}

export default AppBar;

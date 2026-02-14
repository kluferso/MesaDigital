import React, { useState, useEffect } from 'react';
import {
    Box,
    Fab,
    Paper,
    Typography,
    Button,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Switch,
    FormControlLabel,
    Divider,
    TextField,
    Collapse
} from '@mui/material';
import {
    BugReport as BugIcon,
    Close as CloseIcon,
    PersonAdd as PersonAddIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { useWebRTC } from '../../contexts/webrtc/WebRTCContext';

const NAMES = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi'];
const INSTRUMENTS = ['Guitar', 'Bass', 'Drums', 'Keys', 'Vocals', 'Saxophone'];

const DevTools = () => {
    const [open, setOpen] = useState(false);
    const [simulatingAudio, setSimulatingAudio] = useState(false);
    const [fakeUsers, setFakeUsers] = useState([]);

    const {
        addFakeUser,
        removeFakeUser,
        simulateAudioLevel,
        users
    } = useWebRTC();

    // Audio simulation loop
    useEffect(() => {
        if (!simulatingAudio) return;

        const interval = setInterval(() => {
            fakeUsers.forEach(user => {
                // 30% chance of speaking
                if (Math.random() > 0.7) {
                    const level = Math.random() * 0.5 + 0.1; // 0.1 to 0.6
                    simulateAudioLevel(user.id, level);
                } else {
                    simulateAudioLevel(user.id, 0);
                }
            });
        }, 200);

        return () => clearInterval(interval);
    }, [simulatingAudio, fakeUsers, simulateAudioLevel]);

    const handleAddUser = () => {
        const name = NAMES[Math.floor(Math.random() * NAMES.length)];
        const instrument = INSTRUMENTS[Math.floor(Math.random() * INSTRUMENTS.length)];
        const id = `fake-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newUser = {
            id,
            name: `${name} (Bot)`,
            instrument,
            isAdmin: false
        };

        addFakeUser(newUser);
        setFakeUsers(prev => [...prev, newUser]);
    };

    const handleRemoveUser = (userId) => {
        removeFakeUser(userId);
        setFakeUsers(prev => prev.filter(u => u.id !== userId));
    };

    const handleClearAll = () => {
        fakeUsers.forEach(u => removeFakeUser(u.id));
        setFakeUsers([]);
        setSimulatingAudio(false);
    };

    // Only show if we have access to the context (and specifically the dev methods)
    if (!addFakeUser) return null;

    return (
        <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999 }}>
            <Collapse in={!open}>
                <Fab
                    color="secondary"
                    size="medium"
                    onClick={() => setOpen(true)}
                    aria-label="dev tools"
                >
                    <BugIcon />
                </Fab>
            </Collapse>

            <Collapse in={open}>
                <Paper
                    elevation={4}
                    sx={{
                        width: 300,
                        p: 2,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider'
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" fontSize="1rem">
                            Simulador Multi-User
                        </Typography>
                        <IconButton size="small" onClick={() => setOpen(false)}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    <Button
                        variant="contained"
                        size="small"
                        fullWidth
                        startIcon={<PersonAddIcon />}
                        onClick={handleAddUser}
                        sx={{ mb: 2 }}
                    >
                        Adicionar Usuário Fake
                    </Button>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={simulatingAudio}
                                onChange={(e) => setSimulatingAudio(e.target.checked)}
                                disabled={fakeUsers.length === 0}
                                size="small"
                            />
                        }
                        label="Simular Áudio"
                        sx={{ mb: 2, display: 'block' }}
                    />

                    <Divider sx={{ mb: 1 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            {fakeUsers.length} bots ativos
                        </Typography>
                        {fakeUsers.length > 0 && (
                            <Button size="small" color="error" onClick={handleClearAll} sx={{ fontSize: '0.7rem' }}>
                                Limpar
                            </Button>
                        )}
                    </Box>

                    <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                        {fakeUsers.map(user => (
                            <ListItem
                                key={user.id}
                                secondaryAction={
                                    <IconButton edge="end" aria-label="delete" size="small" onClick={() => handleRemoveUser(user.id)}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                }
                            >
                                <ListItemText
                                    primary={user.name}
                                    secondary={user.instrument}
                                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            </Collapse>
        </Box>
    );
};

export default DevTools;

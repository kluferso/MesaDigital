import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, Slider, Paper, IconButton } from '@mui/material';
import { Play, Pause, Minus, Plus } from 'lucide-react';

const SmartMetronome = () => {
    const [bpm, setBpm] = useState(100);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioContext = useRef(null);
    const timerID = useRef(null);
    const nextNoteTime = useRef(0.0);
    const interval = 25.0; // milissegundos

    const playClick = () => {
        if (!audioContext.current) return;

        const osc = audioContext.current.createOscillator();
        const gainNode = audioContext.current.createGain();

        osc.connect(gainNode);
        gainNode.connect(audioContext.current.destination);

        osc.frequency.value = 1000;
        gainNode.gain.value = 1;

        osc.start(audioContext.current.currentTime);
        osc.stop(audioContext.current.currentTime + 0.1);
    };

    const scheduler = () => {
        while (nextNoteTime.current < audioContext.current.currentTime + 0.1) {
            playClick();
            nextNoteTime.current += 60.0 / bpm;
        }
        timerID.current = window.setTimeout(scheduler, interval);
    };

    const startMetronome = () => {
        if (!audioContext.current) {
            audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (isPlaying) {
            window.clearTimeout(timerID.current);
            setIsPlaying(false);
        } else {
            setIsPlaying(true);
            nextNoteTime.current = audioContext.current.currentTime + 0.05;
            scheduler();
        }
    };

    useEffect(() => {
        return () => {
            window.clearTimeout(timerID.current);
            if (audioContext.current) {
                audioContext.current.close().catch(e => console.error("Error closing AudioContext", e));
            }
        };
    }, []);

    return (
        <Paper elevation={3} sx={{ p: 4, borderRadius: 4, width: '100%', maxWidth: 400, mx: 'auto', textAlign: 'center' }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Smart Metronome</Typography>

            <Typography variant="h2" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3 }}>
                {bpm} <Typography component="span" variant="h6">BPM</Typography>
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 4 }}>
                <IconButton onClick={() => setBpm(b => Math.max(40, b - 1))} sx={{ bgcolor: 'action.hover' }}>
                    <Minus />
                </IconButton>
                <Slider
                    value={bpm}
                    min={40}
                    max={240}
                    onChange={(_, v) => setBpm(v)}
                    sx={{ width: 200 }}
                />
                <IconButton onClick={() => setBpm(b => Math.min(240, b + 1))} sx={{ bgcolor: 'action.hover' }}>
                    <Plus />
                </IconButton>
            </Box>

            <Button
                variant="contained"
                size="large"
                color={isPlaying ? "error" : "primary"}
                onClick={startMetronome}
                startIcon={isPlaying ? <Pause /> : <Play />}
                sx={{ borderRadius: 8, px: 6, py: 1.5, fontSize: '1.2rem' }}
            >
                {isPlaying ? 'PARAR' : 'INICIAR'}
            </Button>
        </Paper>
    );
};

export default SmartMetronome;

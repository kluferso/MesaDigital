import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, Paper, CircularProgress } from '@mui/material';
import { Mic } from 'lucide-react';

const SimpleTuner = () => {
    const [note, setNote] = useState('-');
    const [cents, setCents] = useState(0);
    const [isListening, setIsListening] = useState(false);

    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const rafIdRef = useRef(null);

    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

    const autoCorrelate = (buf, sampleRate) => {
        let SIZE = buf.length;
        let rms = 0;

        for (let i = 0; i < SIZE; i++) {
            const val = buf[i];
            rms += val * val;
        }
        rms = Math.sqrt(rms / SIZE);
        if (rms < 0.01) // not enough signal
            return -1;

        let r1 = 0, r2 = SIZE - 1, thres = 0.2;
        for (let i = 0; i < SIZE / 2; i++)
            if (Math.abs(buf[i]) < thres) { r1 = i; break; }
        for (let i = 1; i < SIZE / 2; i++)
            if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }

        buf = buf.slice(r1, r2);
        SIZE = buf.length;

        let c = new Array(SIZE).fill(0);
        for (let i = 0; i < SIZE; i++)
            for (let j = 0; j < SIZE - i; j++)
                c[i] = c[i] + buf[j] * buf[j + i];

        let d = 0; while (c[d] > c[d + 1]) d++;
        let maxval = -1, maxpos = -1;
        for (let i = d; i < SIZE; i++) {
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }
        let T0 = maxpos;

        let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
        let a = (x1 + x3 - 2 * x2) / 2;
        let b = (x3 - x1) / 2;
        if (a) T0 = T0 - b / (2 * a);

        return sampleRate / T0;
    };

    const updatePitch = () => {
        if (!analyserRef.current) return;

        const buf = new Float32Array(analyserRef.current.fftSize);
        analyserRef.current.getFloatTimeDomainData(buf);
        const ac = autoCorrelate(buf, audioContextRef.current.sampleRate);

        if (ac !== -1) {
            const pitch = ac;
            const noteNum = 12 * (Math.log(pitch / 440) / Math.log(2)) + 69;
            const roundedNote = Math.round(noteNum);
            const noteName = notes[roundedNote % 12];
            const detune = Math.floor((noteNum - roundedNote) * 100);

            setNote(noteName);
            setCents(detune);
        }

        rafIdRef.current = requestAnimationFrame(updatePitch);
    };

    const toggleTuner = async () => {
        if (isListening) {
            if (sourceRef.current) sourceRef.current.disconnect();
            if (audioContextRef.current) await audioContextRef.current.close();
            audioContextRef.current = null;
            cancelAnimationFrame(rafIdRef.current);
            setIsListening(false);
            setNote('-');
            setCents(0);
        } else {
            try {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 2048;
                sourceRef.current.connect(analyserRef.current);

                setIsListening(true);
                updatePitch();
            } catch (err) {
                console.error("Error accessing microphone", err);
                alert("Erro ao acessar microfone. Verifique as permissões.");
            }
        }
    };

    useEffect(() => {
        return () => {
            if (isListening) {
                cancelAnimationFrame(rafIdRef.current);
                if (audioContextRef.current) audioContextRef.current.close();
            }
        };
    }, []);

    // Visual helper color
    const getCentsColor = (c) => {
        if (Math.abs(c) < 5) return 'success.main';
        if (Math.abs(c) < 20) return 'warning.main';
        return 'error.main';
    };

    return (
        <Paper elevation={3} sx={{ p: 4, borderRadius: 4, width: '100%', maxWidth: 400, mx: 'auto', textAlign: 'center' }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Afinador Simples</Typography>

            <Box sx={{
                height: 150,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                mb: 3
            }}>
                <Typography variant="h1" sx={{ fontWeight: '900', color: getCentsColor(cents) }}>
                    {note}
                </Typography>
                {isListening && note !== '-' && (
                    <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
                        {cents > 0 ? `+${cents}` : cents} cents
                    </Typography>
                )}
            </Box>

            {/* Visual needle can be added here, keeping it extremely simple for now */}

            <Button
                variant="contained"
                size="large"
                color={isListening ? "error" : "primary"}
                onClick={toggleTuner}
                startIcon={<Mic />}
                sx={{ borderRadius: 8, px: 4 }}
            >
                {isListening ? 'PARAR ESCUTA' : 'INICIAR AFINADOR'}
            </Button>
        </Paper>
    );
};

export default SimpleTuner;

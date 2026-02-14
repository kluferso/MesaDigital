import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  Slider, 
  Button, 
  Tooltip,
  CircularProgress
} from '@mui/material';
import { 
  PlayArrow, 
  Stop, 
  Add, 
  Remove, 
  Speed 
} from '@mui/icons-material';
import { useSocket } from '../../contexts/SocketContext';
import TimeSyncService from '../../services/webrtc/TimeSyncService';

// Sons sintetizados (beep alto e baixo)
const createClickSound = (ctx, freq) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
};

const Metronome = ({ roomId }) => {
  const { socket } = useSocket();
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [syncing, setSyncing] = useState(true);

  // Refs para lógica de áudio
  const audioCtxRef = useRef(null);
  const timeSyncRef = useRef(null);
  const nextNoteTimeRef = useRef(0);
  const timerIDRef = useRef(null);
  const startTimeRef = useRef(0); // Tempo de início acordado (Server Time)
  const isPlayingRef = useRef(false); // Ref para acesso dentro do scheduler

  // Constants
  const LOOKAHEAD = 25; // ms
  const SCHEDULE_AHEAD_TIME = 0.1; // s

  // Inicializar TimeSync
  useEffect(() => {
    if (socket) {
      timeSyncRef.current = new TimeSyncService(socket);
      timeSyncRef.current.synchronize().then(() => {
        setSyncing(false);
      });

      // Listeners
      socket.on('metronome_started', ({ tempo: newTempo, startTime, startedBy }) => {
        setTempo(newTempo);
        startTimeRef.current = startTime;
        
        // Calcular onde estamos na música
        if (audioCtxRef.current?.state === 'suspended') {
          audioCtxRef.current.resume();
        }
        
        // Resetar agendamento
        nextNoteTimeRef.current = 0;
        isPlayingRef.current = true;
        setIsPlaying(true);
        
        // Iniciar loop
        scheduler();
      });

      socket.on('metronome_stopped', () => {
        isPlayingRef.current = false;
        setIsPlaying(false);
        if (timerIDRef.current) clearTimeout(timerIDRef.current);
      });

      socket.on('metronome_tempo_changed', ({ tempo: newTempo }) => {
        setTempo(newTempo);
      });

      return () => {
        socket.off('metronome_started');
        socket.off('metronome_stopped');
        socket.off('metronome_tempo_changed');
      };
    }
  }, [socket]);

  // Inicializar AudioContext
  useEffect(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtxRef.current = new AudioContext();
    return () => {
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  const scheduler = () => {
    if (!isPlayingRef.current || !timeSyncRef.current) return;

    // Se nextNoteTime é 0, significa que acabamos de começar
    // Precisamos calcular o primeiro beat baseado no startTime do servidor
    if (nextNoteTimeRef.current === 0) {
      const serverNow = timeSyncRef.current.getServerTime();
      const startTime = startTimeRef.current;
      
      // Se o início já passou, calculamos qual é o próximo beat
      const secondsPerBeat = 60.0 / tempo;
      const msPerBeat = secondsPerBeat * 1000;
      
      if (serverNow > startTime) {
        // Quantos beats já passaram
        const elapsed = serverNow - startTime;
        const beatsElapsed = Math.floor(elapsed / msPerBeat);
        const nextBeatServerTime = startTime + (beatsElapsed + 1) * msPerBeat;
        
        // Converter para tempo local do AudioContext
        // AC.currentTime + (ServerNext - ServerNow)/1000
        const timeToNextBeat = (nextBeatServerTime - serverNow) / 1000;
        nextNoteTimeRef.current = audioCtxRef.current.currentTime + timeToNextBeat;
      } else {
        // Começa no futuro
        const timeToStart = (startTime - serverNow) / 1000;
        nextNoteTimeRef.current = audioCtxRef.current.currentTime + timeToStart;
      }
    }

    while (nextNoteTimeRef.current < audioCtxRef.current.currentTime + SCHEDULE_AHEAD_TIME) {
      scheduleNote(nextNoteTimeRef.current);
      advanceNote();
    }
    timerIDRef.current = setTimeout(scheduler, LOOKAHEAD);
  };

  const scheduleNote = (time) => {
    // Tocar som
    // Beat 0 (primeiro do compasso 4/4) é mais agudo
    // Vamos simplificar e contar apenas 1, 2, 3, 4 visualmente
    // Mas o som é igual ou acentuado no 1
    
    // Calcular qual beat é este baseado no tempo absoluto
    // Isso requer manter um contador de beats, mas para simplificar:
    // Vamos apenas tocar o som aqui.
    
    // Visual update (usando requestAnimationFrame idealmente, mas setTimeout serve para demo)
    const delay = (time - audioCtxRef.current.currentTime) * 1000;
    setTimeout(() => {
      setCurrentBeat(prev => (prev + 1) % 4);
    }, Math.max(0, delay));

    // Audio
    createClickSound(audioCtxRef.current, 1000); // 1000Hz click
  };

  const advanceNote = () => {
    const secondsPerBeat = 60.0 / tempo;
    nextNoteTimeRef.current += secondsPerBeat;
  };

  // Handlers UI
  const handleToggle = () => {
    if (isPlaying) {
      socket.emit('metronome_stop', { roomId });
    } else {
      // Iniciar 2 segundos no futuro para dar tempo de todos receberem
      const startDelay = 2000;
      const startTime = timeSyncRef.current.getServerTime() + startDelay;
      socket.emit('metronome_start', { roomId, tempo, startTime });
    }
  };

  const handleTempoChange = (_, newVal) => {
    setTempo(newVal);
    // Debounce idealmente, mas aqui vai direto
    socket.emit('metronome_tempo_change', { roomId, tempo: newVal });
  };

  return (
    <Paper 
      sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        background: 'rgba(0,0,0,0.2)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 4
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', minWidth: 60 }}>
        <Typography variant="caption" color="text.secondary">BPM</Typography>
        <Typography variant="h4" fontWeight="bold" color="primary">{tempo}</Typography>
      </Box>

      <Box sx={{ flexGrow: 1, mx: 2 }}>
        <Slider
          value={tempo}
          min={40}
          max={240}
          onChange={handleTempoChange}
          disabled={isPlaying} // Desabilitar mudança durante play para evitar desync complexo
        />
      </Box>

      {/* Visualizador de Beat */}
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {[0, 1, 2, 3].map(i => (
          <Box
            key={i}
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: currentBeat === i && isPlaying ? 'secondary.main' : 'action.disabledBackground',
              transition: 'background-color 0.05s'
            }}
          />
        ))}
      </Box>

      <Box>
        {syncing ? (
          <CircularProgress size={24} />
        ) : (
          <IconButton 
            color={isPlaying ? 'error' : 'success'} 
            onClick={handleToggle}
            sx={{ 
              border: '2px solid',
              width: 48,
              height: 48
            }}
          >
            {isPlaying ? <Stop /> : <PlayArrow />}
          </IconButton>
        )}
      </Box>
    </Paper>
  );
};

export default Metronome;

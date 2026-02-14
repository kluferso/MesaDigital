import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { useWebRTC } from '../../contexts/webrtc/WebRTCContext';

const GlobalVisualizer = ({ height = 100 }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  
  // Vamos tentar acessar o AudioContext global ou criar um dummy
  // Idealmente, o WebRTCManager exporia um nó analisador da mixagem final
  // Como não temos isso fácil sem refatorar o mixer inteiro,
  // vamos visualizar apenas o áudio LOCAL para feedback visual imediato
  // ou tentar capturar o output do Web Audio API se possível.
  
  // Para este demo, visualizamos um áudio simulado ou local
  const { localUser } = useWebRTC();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Setup Audio Context se não existir
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    
    // Conectar ao microfone (apenas para visualização local por enquanto)
    // Em produção, isso deveria vir do MixerNode final
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        // Não conectar ao destino para evitar feedback loop!
      })
      .catch(err => console.warn("Visualizer: No mic access", err));

    analyserRef.current = analyser;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    dataArrayRef.current = dataArray;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      
      analyser.getByteFrequencyData(dataArray);
      
      ctx.fillStyle = 'rgba(18, 18, 18, 0.2)'; // Trail effect
      ctx.fillRect(0, 0, width, height);
      
      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height;
        
        // Gradiente baseado no tema Neon
        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, '#6200ea');
        gradient.addColorStop(1, '#03dac6');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };
    
    draw();
    
    return () => {
      cancelAnimationFrame(animationRef.current);
      if (audioCtx.state !== 'closed') audioCtx.close();
    };
  }, []);

  return (
    <Box 
      sx={{ 
        width: '100%', 
        height, 
        overflow: 'hidden', 
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '1px solid rgba(255,255,255,0.05)'
      }}
    >
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={height} 
        style={{ width: '100%', height: '100%' }} 
      />
    </Box>
  );
};

export default GlobalVisualizer;

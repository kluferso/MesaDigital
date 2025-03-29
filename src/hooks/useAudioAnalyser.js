import { useState, useEffect, useRef } from 'react';

export function useAudioAnalyser(stream) {
  const [volume, setVolume] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (!stream) return;

    // Cria o contexto de áudio
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = audioContext;

    // Cria o analisador
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    // Conecta o stream ao analisador
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    // Array para armazenar os dados do analisador
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    // Função para analisar o áudio
    const analyse = () => {
      analyser.getByteFrequencyData(dataArray);
      
      // Calcula o volume médio
      const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
      const normalizedVolume = Math.min(100, (average / 255) * 100);
      
      // Atualiza o estado
      setVolume(normalizedVolume);
      setSpeaking(normalizedVolume > 15); // Threshold para detectar fala
      
      // Continua a análise
      animationFrameRef.current = requestAnimationFrame(analyse);
    };

    // Inicia a análise
    analyse();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stream]);

  return {
    volume,
    speaking
  };
}

import { useState, useEffect, useRef, useCallback } from 'react';

const useWebRTC = (roomId) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [mediaError, setMediaError] = useState(null);
  const [mediaStatus, setMediaStatus] = useState('idle'); // idle | requesting | success | error
  const peerConnections = useRef({}); // Mantenha referências para conexões P2P

  // Função para inicializar mídia local (controlada externamente)
  const initializeLocalMedia = useCallback(async () => {
    if (mediaStatus === 'requesting' || mediaStatus === 'success') {
      console.log('Inicialização de mídia já em andamento ou concluída.');
      return localStream;
    }
    
    setMediaStatus('requesting');
    setMediaError(null);
    console.log('Solicitando acesso a áudio e vídeo...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });
      console.log('Mídia local (áudio/vídeo) obtida.');
      setLocalStream(stream);
      setAudioEnabled(true);
      setVideoEnabled(true);
      setMediaStatus('success');
      return stream;
    } catch (videoError) {
      console.warn('Falha ao obter vídeo, tentando apenas áudio...', videoError);
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Mídia local (apenas áudio) obtida.');
        setLocalStream(audioStream);
        setAudioEnabled(true);
        setVideoEnabled(false); // Indica que vídeo não está disponível
        setMediaStatus('success');
        setMediaError('Câmera indisponível/negada. Usando só áudio.');
        return audioStream;
      } catch (audioError) {
        console.error('Falha ao obter áudio:', audioError);
        setMediaError('Microfone indisponível ou permissão negada.');
        setMediaStatus('error');
        setLocalStream(null);
        return null;
      }
    }
  }, [mediaStatus, localStream]); // Adicionado localStream para consistência

  // Efeito para limpar a stream ao desmontar
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        console.log('Stream local liberada.');
      }
      // Limpar conexões P2P aqui se necessário
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
      console.log('Conexões P2P fechadas.')
    };
  }, [localStream]);

  // Funções para controlar mídia
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const newState = !audioEnabled;
        audioTracks.forEach(track => track.enabled = newState);
        setAudioEnabled(newState);
        console.log(`Áudio ${newState ? 'ativado' : 'desativado'}`);
      }
    }
  }, [localStream, audioEnabled]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const newState = !videoEnabled;
        videoTracks.forEach(track => track.enabled = newState);
        setVideoEnabled(newState);
        console.log(`Vídeo ${newState ? 'ativado' : 'desativado'}`);
      } else {
        console.warn('Tentativa de alternar vídeo sem faixa de vídeo disponível.');
      }
    }
  }, [localStream, videoEnabled]);

  // TODO: Implementar lógica WebRTC para P2P (offer/answer, ICE candidates)
  // Esta parte seria bem mais complexa, envolvendo o socket para sinalização

  return {
    localStream,
    remoteStreams,
    audioEnabled,
    videoEnabled,
    toggleAudio,
    toggleVideo,
    mediaError,
    mediaStatus, // Exporta o status da mídia
    initializeLocalMedia // Exporta a função para ser chamada pelo RoomScreen
  };
};

export default useWebRTC;

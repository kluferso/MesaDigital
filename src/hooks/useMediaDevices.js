import { useState, useEffect } from 'react';

export function useMediaDevices() {
  const [devices, setDevices] = useState({
    audioinput: [],
    videoinput: [],
    audiooutput: []
  });
  const [error, setError] = useState(null);

  // Atualiza a lista de dispositivos
  const updateDevices = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      
      const groupedDevices = allDevices.reduce((acc, device) => {
        if (!acc[device.kind]) {
          acc[device.kind] = [];
        }
        acc[device.kind].push({
          id: device.deviceId,
          label: device.label || `${device.kind} ${acc[device.kind].length + 1}`,
          groupId: device.groupId
        });
        return acc;
      }, {});

      setDevices(groupedDevices);
      setError(null);
    } catch (err) {
      console.error('Erro ao enumerar dispositivos:', err);
      setError('Não foi possível acessar os dispositivos de mídia');
    }
  };

  // Atualiza dispositivos quando houver mudanças
  useEffect(() => {
    // Atualiza inicialmente
    updateDevices();

    // Observa mudanças nos dispositivos
    navigator.mediaDevices.addEventListener('devicechange', updateDevices);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', updateDevices);
    };
  }, []);

  // Solicita permissão para usar os dispositivos
  const requestPermissions = async (constraints = { audio: true, video: true }) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach(track => track.stop());
      await updateDevices();
      return true;
    } catch (err) {
      console.error('Erro ao solicitar permissões:', err);
      setError('Permissão negada para acessar dispositivos de mídia');
      return false;
    }
  };

  return {
    devices,
    error,
    requestPermissions,
    updateDevices
  };
}

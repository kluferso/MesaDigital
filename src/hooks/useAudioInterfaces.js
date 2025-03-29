import { useState, useEffect } from 'react';
import { useMediaDevices } from './useMediaDevices';

export function useAudioInterfaces() {
  const { devices, updateDevices } = useMediaDevices();
  const [interfaces, setInterfaces] = useState([]);
  const [selectedInterface, setSelectedInterface] = useState(null);
  const [error, setError] = useState(null);

  // Atualiza a lista de interfaces de áudio
  useEffect(() => {
    // Filtra apenas dispositivos de entrada de áudio
    const audioInterfaces = devices.audioinput || [];
    
    // Agrupa por groupId (mesmo dispositivo físico)
    const groupedInterfaces = audioInterfaces.reduce((acc, device) => {
      const existing = acc.find(i => i.groupId === device.groupId);
      if (!existing) {
        acc.push({
          id: device.id,
          name: device.label,
          groupId: device.groupId,
          channels: [device]
        });
      } else {
        existing.channels.push(device);
      }
      return acc;
    }, []);

    setInterfaces(groupedInterfaces);
  }, [devices]);

  // Seleciona uma interface de áudio
  const selectInterface = async (interfaceId) => {
    try {
      const selectedDevice = interfaces.find(i => i.id === interfaceId);
      
      // Se não houver dispositivo selecionado, tenta usar o dispositivo padrão
      if (!selectedDevice) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            autoGainControl: { ideal: false },
            echoCancellation: { ideal: false },
            noiseSuppression: { ideal: false }
          }
        });
        
        const defaultDevice = {
          id: 'default',
          name: 'Dispositivo Padrão',
          groupId: 'default',
          channels: [{ id: 'default' }]
        };
        
        setSelectedInterface({
          ...defaultDevice,
          streams: [{
            id: 'default',
            stream,
            active: true
          }]
        });
        
        return [{ id: 'default', stream, active: true }];
      }

      // Tenta acessar todos os canais da interface
      const streams = await Promise.all(
        selectedDevice.channels.map(async (channel) => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: {
                deviceId: { exact: channel.id },
                // Configurações mais flexíveis para compatibilidade
                autoGainControl: { ideal: false },
                echoCancellation: { ideal: false },
                noiseSuppression: { ideal: false },
                latency: { ideal: 0 },
                sampleRate: { ideal: 48000 },
                channelCount: { ideal: 2 }
              }
            });
            return {
              id: channel.id,
              stream,
              active: true
            };
          } catch (err) {
            console.warn(`Canal ${channel.id} não disponível:`, err);
            return {
              id: channel.id,
              stream: null,
              active: false
            };
          }
        })
      );

      setSelectedInterface({
        ...selectedDevice,
        streams
      });
      setError(null);

      return streams.filter(s => s.active);
    } catch (err) {
      console.error('Erro ao selecionar interface:', err);
      setError('Não foi possível acessar a interface de áudio');
      setSelectedInterface(null);
      return [];
    }
  };

  // Libera os recursos da interface selecionada
  const releaseInterface = () => {
    if (selectedInterface) {
      selectedInterface.streams.forEach(({ stream }) => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      });
      setSelectedInterface(null);
    }
  };

  // Atualiza quando dispositivos mudam
  useEffect(() => {
    const handleDeviceChange = async () => {
      await updateDevices();
      
      // Se tinha uma interface selecionada, tenta reconectar
      if (selectedInterface) {
        const stillExists = interfaces.some(i => i.id === selectedInterface.id);
        if (!stillExists) {
          releaseInterface();
        } else {
          await selectInterface(selectedInterface.id);
        }
      }
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      releaseInterface();
    };
  }, [selectedInterface, interfaces, updateDevices]);

  return {
    interfaces,
    selectedInterface,
    error,
    selectInterface,
    releaseInterface
  };
}

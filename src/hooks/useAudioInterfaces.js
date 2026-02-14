import { useState, useEffect, useMemo, useCallback } from 'react';
import { safe, safeFilter, ensureArray } from '../utils/safeUtils';

export default function useAudioInterfaces() {
  const [interfaces, setInterfaces] = useState([]);
  const [selectedInterface, setSelectedInterface] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [streams, setStreams] = useState([]);

  // Função segura para carregar as interfaces de áudio
  const loadInterfaces = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Verificar se a API de navegador está disponível
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        throw new Error('A API MediaDevices não é suportada neste navegador.');
      }

      // Obter lista de dispositivos
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      // Filtrar apenas dispositivos de entrada de áudio
      const audioInputs = safeFilter(devices, device => 
        device && device.kind === 'audioinput'
      );

      // Mapear para o formato de interface
      const mappedInterfaces = audioInputs.map(device => ({
        id: device.deviceId,
        name: device.label || `Interface de Áudio ${device.deviceId.substring(0, 5)}`,
        info: device
      }));

      // Garantir que sempre temos a interface padrão
      const hasDefault = mappedInterfaces.some(i => i.id === 'default');
      if (!hasDefault && mappedInterfaces.length > 0) {
        mappedInterfaces.unshift({
          id: 'default',
          name: 'Interface Padrão',
          info: { deviceId: 'default', kind: 'audioinput', label: 'Interface Padrão' }
        });
      }

      setInterfaces(mappedInterfaces);
      
      // Selecionar a primeira interface como padrão se nenhuma estiver selecionada
      if (!selectedInterface && mappedInterfaces.length > 0) {
        setSelectedInterface(mappedInterfaces[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar interfaces de áudio:', err);
      setError(`Erro ao carregar interfaces de áudio: ${err.message}`);
      // Definir uma interface fictícia para não quebrar a UI
      setInterfaces([{
        id: 'default',
        name: 'Interface Padrão (Não disponível)',
        info: { deviceId: 'default', kind: 'audioinput', label: 'Interface Padrão' },
        disabled: true
      }]);
    } finally {
      setLoading(false);
    }
  }, [selectedInterface]);

  // Carregar interfaces quando o componente montar
  useEffect(() => {
    loadInterfaces();
    
    // Adicionar listener para quando dispositivos são conectados/desconectados
    if (navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', loadInterfaces);
      
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', loadInterfaces);
      };
    }
  }, [loadInterfaces]);

  // Função segura para selecionar uma interface
  const selectInterface = useCallback(async (interfaceId) => {
    if (!interfaceId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Encontrar a interface pelo ID
      const selectedDevice = interfaces.find(i => i.id === interfaceId);
      if (!selectedDevice) {
        throw new Error(`Interface com ID ${interfaceId} não encontrada.`);
      }
      
      // Parar streams ativos atuais
      streams.forEach(stream => {
        if (stream && stream.getTracks) {
          stream.getTracks().forEach(track => track.stop());
        }
      });
      
      // Obter novo stream
      const constraints = {
        audio: {
          deviceId: { exact: selectedDevice.id },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setSelectedInterface(selectedDevice);
      setStreams([stream]);
    } catch (err) {
      console.error('Erro ao selecionar interface de áudio:', err);
      setError(`Erro ao selecionar interface: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [interfaces, streams]);

  // Retornar apenas streams ativos
  const activeStreams = useMemo(() => {
    return safeFilter(streams, stream => stream && stream.active);
  }, [streams]);

  return {
    interfaces: ensureArray(interfaces),
    selectedInterface,
    loading,
    error,
    streams: activeStreams,
    selectInterface,
    refreshInterfaces: loadInterfaces
  };
}

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';

export const useMusicPlayer = (roomId) => {
  const { socket } = useSocket();
  const [playlist, setPlaylist] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  // Fetch playlist inicial
  useEffect(() => {
    if (socket && roomId) {
      socket.emit('get_playlist', { roomId }, (response) => {
        if (response && response.playlist) {
          setPlaylist(response.playlist);
        }
      });

      const handlePlaylistUpdated = (data) => {
        if (data.playlist) {
          setPlaylist(data.playlist);
        }
      };

      const handleNowPlaying = (data) => {
        // Encontrar a música na playlist
        // Se a lógica de 'now playing' for apenas sincronizar o início, 
        // o componente de áudio cuidará do stream.
        // Aqui apenas atualizamos o estado visual.
        // setCurrentSong(data.uuid); 
        // A lógica real de reprodução pode ser mais complexa (offsets, etc.)
        console.log('Now playing:', data);
      };

      socket.on('music_playlist_updated', handlePlaylistUpdated);
      socket.on('music_now_playing', handleNowPlaying);

      return () => {
        socket.off('music_playlist_updated', handlePlaylistUpdated);
        socket.off('music_now_playing', handleNowPlaying);
      };
    }
  }, [socket, roomId]);

  const searchMusic = useCallback(async (query) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/music/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (response.ok) {
        setSearchResults([data]); // Por enquanto retorna 1 resultado
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching music:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addSong = useCallback((song) => {
    if (socket && roomId) {
      socket.emit('music_add_song', { roomId, song });
      setSearchResults([]); // Limpar busca após adicionar
    }
  }, [socket, roomId]);

  const removeSong = useCallback((uuid) => {
    if (socket && roomId) {
      socket.emit('music_remove_song', { roomId, uuid });
    }
  }, [socket, roomId]);

  const playSong = useCallback((uuid) => {
    if (socket && roomId) {
      socket.emit('music_play', { roomId, uuid });
      // Localmente, vamos tentar obter a URL e tocar
      const song = playlist.find(s => s.uuid === uuid);
      if (song) {
        setCurrentSong(song);
        setIsPlaying(true);
      }
    }
  }, [socket, roomId, playlist]);

  return {
    playlist,
    currentSong,
    searchResults,
    loading,
    isPlaying,
    setIsPlaying,
    volume,
    setVolume,
    searchMusic,
    addSong,
    removeSong,
    playSong
  };
};

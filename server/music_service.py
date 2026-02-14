import yt_dlp
import logging
import uuid
from datetime import datetime

# Configuração de Log
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MusicService:
    def __init__(self):
        self.playlists = {}  # {room_id: [songs]}
        self.ydl_opts = {
            'format': 'bestaudio/best',
            'quiet': True,
            'no_warnings': True,
            'default_search': 'ytsearch',
            'noplaylist': True,
        }

    def get_playlist(self, room_id):
        if room_id not in self.playlists:
            self.playlists[room_id] = []
        return self.playlists[room_id]

    def search_song(self, query):
        """Pesquisa uma música no YouTube e retorna metadados."""
        try:
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                info = ydl.extract_info(f"ytsearch1:{query}", download=False)
                if 'entries' in info:
                    video = info['entries'][0]
                else:
                    video = info

                return {
                    'id': video['id'],
                    'title': video['title'],
                    'duration': video['duration'],
                    'thumbnail': video.get('thumbnail'),
                    'uploader': video.get('uploader'),
                    'url': video.get('webpage_url')
                }
        except Exception as e:
            logger.error(f"Erro ao pesquisar música: {str(e)}")
            return None

    def add_to_playlist(self, room_id, song_data):
        """Adiciona uma música à playlist da sala."""
        if room_id not in self.playlists:
            self.playlists[room_id] = []
        
        song_entry = {
            'uuid': str(uuid.uuid4()),
            'id': song_data['id'],
            'title': song_data['title'],
            'duration': song_data['duration'],
            'thumbnail': song_data['thumbnail'],
            'uploader': song_data['uploader'],
            'url': song_data['url'],
            'added_at': datetime.now().isoformat(),
            'status': 'pending'  # pending, playing, played
        }
        self.playlists[room_id].append(song_entry)
        return song_entry

    def remove_from_playlist(self, room_id, song_uuid):
        if room_id in self.playlists:
            self.playlists[room_id] = [s for s in self.playlists[room_id] if s['uuid'] != song_uuid]
            return True
        return False

    def get_stream_url(self, video_id):
        """Obtém a URL de streaming direto do áudio."""
        try:
            ydl_opts = {
                'format': 'bestaudio/best',
                'quiet': True
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(video_id, download=False)
                return info['url']
        except Exception as e:
            logger.error(f"Erro ao obter URL de stream: {str(e)}")
            return None

    def reorder_playlist(self, room_id, new_order):
        """Reordena a playlist baseada em uma lista de UUIDs."""
        if room_id in self.playlists:
            current_playlist = {s['uuid']: s for s in self.playlists[room_id]}
            new_playlist = []
            for uuid_ in new_order:
                if uuid_ in current_playlist:
                    new_playlist.append(current_playlist[uuid_])
            
            # Adicionar itens que não estavam na nova ordem (segurança)
            for s in self.playlists[room_id]:
                if s['uuid'] not in new_order:
                    new_playlist.append(s)
            
            self.playlists[room_id] = new_playlist
            return self.playlists[room_id]
        return []

# Instância global
music_service = MusicService()

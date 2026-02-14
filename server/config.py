"""
Configurações para implantação do MesaDigital no PythonAnywhere
"""

# Configurações do servidor
SERVER_CONFIG = {
    # URL base do site no PythonAnywhere
    'BASE_URL': 'https://kluferso.pythonanywhere.com',
    
    # Porta do servidor Node.js (usado internamente pelo proxy WSGI)
    'NODE_PORT': 3000,
    
    # Configurações de WebRTC
    'WEBRTC': {
        'ICE_SERVERS': [
            {'urls': 'stun:stun.l.google.com:19302'},
            {'urls': 'stun:stun1.l.google.com:19302'},
            {'urls': 'stun:stun2.l.google.com:19302'},
            {'urls': 'stun:stun3.l.google.com:19302'},
            {'urls': 'stun:stun4.l.google.com:19302'},
            {'urls': 'stun:stun.stunprotocol.org:3478'}
            # Adicione aqui servidores TURN quando disponíveis
        ],
        'ENABLE_TRICKLE_ICE': True,
        'ENABLE_DTLS': True
    },
    
    # Configurações de CORS para API e WebRTC
    'CORS': {
        'ALLOW_ORIGINS': ['*'],  # Em produção, restrinja isso para domínios específicos
        'ALLOW_METHODS': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        'ALLOW_HEADERS': ['Content-Type', 'Authorization', 'User-Agent'],
        'MAX_AGE': 86400  # 24 horas
    },
    
    # Configurações para limpeza de log
    'LOGGING': {
        'LEVEL': 'INFO',  # 'DEBUG' para desenvolvimento, 'INFO' para produção
        'ROTATE_SIZE': 10 * 1024 * 1024,  # 10 MB
        'BACKUP_COUNT': 5
    },
    
    # Configurações para cache
    'CACHE': {
        'STATIC_MAX_AGE': 86400,  # 24 horas para arquivos estáticos
        'API_MAX_AGE': 0  # Não cachear API
    }
}

# Diretórios importantes
DIR_CONFIG = {
    'PROJECT_DIR': '/home/kluferso/MesaDigital',
    'BUILD_DIR': '/home/kluferso/MesaDigital/build',
    'SERVER_DIR': '/home/kluferso/MesaDigital/server',
    'STATIC_DIR': '/home/kluferso/MesaDigital/build/static',
    'MEDIA_DIR': '/home/kluferso/MesaDigital/media'
}

# Configurações de mídia
MEDIA_CONFIG = {
    'MAX_UPLOAD_SIZE': 10 * 1024 * 1024,  # 10 MB
    'ALLOWED_TYPES': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    'THUMBNAIL_SIZES': [(200, 200), (400, 400)]
}

# Configurações de instrumentos suportados
INSTRUMENTS = [
    "Vocal",
    "Guitarra",
    "Baixo",
    "Bateria",
    "Piano/Teclado",
    "Violão",
    "Violino",
    "Saxofone",
    "Trompete",
    "Outro"
]

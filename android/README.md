# MesaDigital Mobile

Aplicativo Android nativo para MesaDigital, focado exclusivamente no instrumento "Vocal".

## Requisitos

- Android Studio Arctic Fox ou mais recente
- JDK 11
- SDK Android mínimo: API 21 (Android 5.0)
- SDK Android alvo: API 33 (Android 13)

## Configuração

1. Abra o projeto no Android Studio
2. Sincronize o projeto com o Gradle
3. Conecte um dispositivo ou inicie um emulador
4. Execute o aplicativo através do Android Studio

## Características

- Compatível com a versão web do MesaDigital
- Exclusivo para vocais (não é possível selecionar outros instrumentos)
- Layout idêntico à versão web
- Suporte completo às funcionalidades de áudio e vídeo
- Chat em tempo real na sala de colaboração

## Tecnologias Utilizadas

- Kotlin
- Jetpack Compose para UI
- Retrofit para requisições HTTP
- Socket.IO para comunicação em tempo real
- ExoPlayer para reprodução de áudio
- CameraX para captura de vídeo
- ViewModel e LiveData para gerenciamento de estado

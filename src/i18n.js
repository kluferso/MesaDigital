import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  pt: {
    translation: {
      login: {
        title: 'Mesa Digital',
        name: 'Nome',
        room: 'Sala',
        roomId: 'ID da Sala',
        instrument: 'Instrumento',
        join: 'Entrar',
        createRoom: 'Criar Nova Sala',
        joinRoom: 'Entrar na Sala',
        createAndJoin: 'Criar e Entrar',
        connecting: 'Conectando...',
        roomSection: 'Sala',
        mediaSection: 'Configurações de Mídia',
        enableVideo: 'Habilitar Vídeo',
        enableAudio: 'Habilitar Áudio',
        videoDevice: 'Câmera',
        audioDevice: 'Microfone',
        instrumentInput: 'Entrada do Instrumento',
        noInstrumentInput: 'Nenhuma interface selecionada',
        copyRoomId: 'Copiar ID da Sala',
        roomIdCopied: 'ID da sala copiado!',
        or: 'ou',
        activeRoomExists: 'Sala ativa encontrada: {{roomId}}',
        joinActiveRoom: 'Entrar na Sala Ativa',
        errors: {
          nameRequired: 'Nome é obrigatório',
          roomRequired: 'ID da sala é obrigatório',
          unknown: 'Erro desconhecido'
        }
      },
      mediaSettings: {
        detecting: 'Detectando dispositivos...'
      },
      mixer: {
        title: 'Mesa de Som',
        interface: 'Interface de Áudio',
        noInterface: 'Nenhuma interface selecionada',
        channels: 'canais',
        channelActive: 'Canal ativo',
        channelInactive: 'Canal inativo',
        mute: 'Silenciar',
        unmute: 'Ativar som'
      },
      instruments: {
        guitar: 'Guitarra',
        bass: 'Baixo',
        drums: 'Bateria',
        keyboard: 'Teclado',
        vocals: 'Vocal',
        acoustic_guitar: 'Violão',
        electric_guitar: 'Guitarra Elétrica',
        electric_bass: 'Baixo Elétrico',
        acoustic_bass: 'Baixo Acústico',
        piano: 'Piano',
        synthesizer: 'Sintetizador',
        percussion: 'Percussão',
        saxophone: 'Saxofone',
        trumpet: 'Trompete',
        trombone: 'Trombone',
        violin: 'Violino',
        viola: 'Viola',
        cello: 'Violoncelo',
        flute: 'Flauta',
        clarinet: 'Clarinete',
        harmonica: 'Gaita',
        accordion: 'Acordeão',
        other: 'Outro'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'pt',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

/**
 * Biblioteca de funções seguras para o MesaDigital
 * Elimina erros comuns como "Cannot read properties of undefined"
 */

// Versão segura para acessar propriedades
export const safe = (obj, path, defaultValue = null) => {
  if (obj === null || obj === undefined) return defaultValue;
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined) return defaultValue;
    result = result[key];
  }
  
  return result !== undefined ? result : defaultValue;
};

// Verifica se um valor é um array não vazio
export const isValidArray = (arr) => {
  return Array.isArray(arr) && arr.length > 0;
};

// Filtra um array de forma segura
export const safeFilter = (arr, predicate) => {
  if (!Array.isArray(arr)) return [];
  return arr.filter(item => {
    try {
      return item !== null && item !== undefined && predicate(item);
    } catch (e) {
      console.warn('Erro ao filtrar item:', e);
      return false;
    }
  });
};

// Mapeia um array de forma segura
export const safeMap = (arr, mapper) => {
  if (!Array.isArray(arr)) return [];
  return arr.map((item, index) => {
    try {
      return item !== null && item !== undefined ? mapper(item, index) : null;
    } catch (e) {
      console.warn('Erro ao mapear item:', e);
      return null;
    }
  }).filter(Boolean);
};

// Garante que o resultado é sempre um array
export const ensureArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
};

// Função segura para processar participantes
export const processParticipants = (participants) => {
  if (!Array.isArray(participants)) return [];
  
  return participants
    .filter(Boolean)
    .map(participant => {
      // Garante que todas as propriedades necessárias existam
      return {
        id: safe(participant, 'id', `unknown-${Math.random().toString(36).substring(2, 9)}`),
        name: safe(participant, 'name', 'Participante'),
        instrument: safe(participant, 'instrument', 'Desconhecido'),
        isLocal: safe(participant, 'isLocal', false),
        hasAudio: safe(participant, 'hasAudio', true),
        hasVideo: safe(participant, 'hasVideo', false),
        // Outras propriedades que possam ser necessárias
      };
    });
};

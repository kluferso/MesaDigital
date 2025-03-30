/**
 * Funções utilitárias seguras para manipulação de arrays
 */

/**
 * Versão segura do método filter que verifica se o valor é um array antes de chamar filter
 * @param {Array|any} array - O array a ser filtrado ou qualquer outro valor
 * @param {Function} predicate - A função de filtro
 * @returns {Array} - O array filtrado ou um array vazio se o valor não for um array
 */
export const safeFilter = (array, predicate) => {
  if (!Array.isArray(array)) return [];
  return array.filter(item => {
    // Ignora itens null/undefined para evitar erros ao acessar suas propriedades
    if (item == null) return false;
    return predicate(item);
  });
};

/**
 * Versão segura do método map que verifica se o valor é um array antes de chamar map
 * @param {Array|any} array - O array a ser mapeado ou qualquer outro valor
 * @param {Function} mapper - A função de mapeamento
 * @returns {Array} - O array mapeado ou um array vazio se o valor não for um array
 */
export const safeMap = (array, mapper) => {
  if (!Array.isArray(array)) return [];
  return array.map((item, index) => {
    // Fornece um valor padrão seguro para itens null/undefined
    if (item == null) return null;
    return mapper(item, index);
  });
};

/**
 * Garante que o valor retornado seja um array, mesmo que o valor de entrada seja null/undefined
 * @param {Array|any} value - O valor a ser garantido como array
 * @returns {Array} - O valor como array ou um array vazio
 */
export const ensureArray = (value) => {
  if (Array.isArray(value)) return value;
  return [];
};

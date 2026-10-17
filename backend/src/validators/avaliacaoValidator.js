import { ValidationError } from '../errors/AppError.js';

/**
 * Validador de Avaliação Docente por Estrelas (1 a 5) e Feedback da Telemetria A/B
 * Plataforma IAprofEPT — Tese de Doutorado PPGEM / UFJF
 * Doutorando: Maycon Luiz Amaral Magalhães
 * 
 * Tags Qualitativas Oficiais:
 * - Rigor Matemático
 * - Contextualização EPT
 * - Clareza do Gabarito
 * - Adequação à BNCC
 */

export const TAGS_QUALITATIVAS_CANONICAS = [
  'Rigor Matemático',
  'Contextualização EPT',
  'Clareza do Gabarito',
  'Adequação à BNCC',
];

export const MAPA_NORMALIZACAO_TAGS = {
  'rigor matematico': 'Rigor Matemático',
  'rigor matemático': 'Rigor Matemático',
  'rigor_matematico': 'Rigor Matemático',
  'contextualizacao ept': 'Contextualização EPT',
  'contextualização ept': 'Contextualização EPT',
  'contextualizacao_ept': 'Contextualização EPT',
  'clareza do gabarito': 'Clareza do Gabarito',
  'clareza_gabarito': 'Clareza do Gabarito',
  'clareza gabarito': 'Clareza do Gabarito',
  'adequacao a bncc': 'Adequação à BNCC',
  'adequação à bncc': 'Adequação à BNCC',
  'adequacao_bncc': 'Adequação à BNCC',
  'adequacao bncc': 'Adequação à BNCC',
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Valida e sanitiza os parâmetros de entrada para avaliação do material gerado por IA.
 * 
 * @param {Object} body
 * @returns {Object} Dados validados e normalizados
 * @throws {ValidationError}
 */
export function validarDadosAvaliacao(body = {}) {
  const invalidParams = [];

  // 1. Identificador da requisição gerada
  const rawReqId = body.requisicao_id || body.requisicaoId || body.id_requisicao;
  if (!rawReqId || typeof rawReqId !== 'string' || !UUID_REGEX.test(rawReqId.trim())) {
    invalidParams.push({
      name: 'requisicao_id',
      reason: 'O identificador requisicao_id é obrigatório e deve ser um UUID válido.',
    });
  }

  // 2. Nota em estrelas (1 a 5)
  const rawNota = body.nota !== undefined ? body.nota : (body.nota_estrelas !== undefined ? body.nota_estrelas : body.estrelas);
  const notaNum = parseInt(rawNota, 10);

  if (Number.isNaN(notaNum) || notaNum < 1 || notaNum > 5) {
    invalidParams.push({
      name: 'nota',
      reason: 'A nota deve ser um número inteiro entre 1 e 5 estrelas.',
    });
  }

  // 3. Tags qualitativas
  const rawTags = body.tags || body.tags_qualitativas || body.tagsQualitativas || [];
  if (!Array.isArray(rawTags)) {
    invalidParams.push({
      name: 'tags',
      reason: 'O campo tags deve ser um array de strings.',
    });
  }

  // 4. Comentário crítico (opcional)
  const rawComentario = body.comentario || body.comentario_critico || body.comentarioCritico || null;
  if (rawComentario !== null && typeof rawComentario !== 'string') {
    invalidParams.push({
      name: 'comentario',
      reason: 'O comentário crítico deve ser uma string com até 2000 caracteres.',
    });
  } else if (typeof rawComentario === 'string' && rawComentario.trim().length > 2000) {
    invalidParams.push({
      name: 'comentario',
      reason: 'O comentário crítico excede o limite máximo de 2000 caracteres.',
    });
  }

  if (invalidParams.length > 0) {
    throw new ValidationError('Parâmetros de avaliação docente inválidos.', invalidParams);
  }

  // Normalização das tags qualitativas
  const tagsNormalizadas = [];
  for (const tag of rawTags) {
    if (typeof tag !== 'string') continue;
    const trimmed = tag.trim();
    if (!trimmed) continue;

    const keyLower = trimmed.toLowerCase();
    if (MAPA_NORMALIZACAO_TAGS[keyLower]) {
      tagsNormalizadas.push(MAPA_NORMALIZACAO_TAGS[keyLower]);
    } else {
      // Se for uma tag pedagógica personalizada, sanitiza e inclui
      const tagSanitizada = trimmed.replace(/[<>]/g, '').slice(0, 100);
      if (tagSanitizada && !tagsNormalizadas.includes(tagSanitizada)) {
        tagsNormalizadas.push(tagSanitizada);
      }
    }
  }

  // Remove duplicatas mantendo a ordem
  const tagsUnicas = [...new Set(tagsNormalizadas)];

  // Sanitização do comentário (remove tags HTML perigosas)
  const comentarioSanitizado = rawComentario
    ? rawComentario.trim().replace(/<[^>]*>/g, '').slice(0, 2000)
    : null;

  return {
    requisicaoId: rawReqId.trim(),
    notaEstrelas: notaNum,
    tagsQualitativas: tagsUnicas,
    comentarioCritico: comentarioSanitizado || null,
  };
}

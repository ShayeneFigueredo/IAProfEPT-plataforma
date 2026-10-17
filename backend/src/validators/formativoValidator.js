import { ValidationError } from '../errors/AppError.js';

/**
 * Validador para os Parâmetros do Ambiente Formativo
 * Plataforma IAprofEPT — PPGEM / UFJF
 * Doutorando: Maycon Luiz Amaral Magalhães
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Valida o payload de atualização de progresso do docente em uma trilha
 * 
 * @param {Object} body
 * @returns {Object} Dados validados e normalizados
 * @throws {ValidationError}
 */
export function validarAtualizacaoProgresso(body = {}) {
  const invalidParams = [];

  // 1. Identificador da trilha (UUID ou código da trilha, ex: 'trilha-fundamentos')
  const rawTrilhaId = body.trilha_id || body.trilhaId || body.id_trilha;
  if (!rawTrilhaId || typeof rawTrilhaId !== 'string' || rawTrilhaId.trim().length === 0) {
    invalidParams.push({
      name: 'trilha_id',
      reason: 'O identificador da trilha (trilha_id) é obrigatório e deve ser um UUID ou código válido.',
    });
  }

  // 2. Identificador da aula/módulo concluído
  const rawAulaId = body.aula_id || body.aulaId || body.id_aula;
  if (!rawAulaId || typeof rawAulaId !== 'string' || rawAulaId.trim().length === 0) {
    invalidParams.push({
      name: 'aula_id',
      reason: 'O identificador da aula (aula_id) é obrigatório.',
    });
  }

  // 3. Status de conclusão (booleano, default true)
  let concluido = true;
  if (body.concluido !== undefined) {
    if (typeof body.concluido === 'boolean') {
      concluido = body.concluido;
    } else if (body.concluido === 'true' || body.concluido === '1' || body.concluido === 1) {
      concluido = true;
    } else if (body.concluido === 'false' || body.concluido === '0' || body.concluido === 0) {
      concluido = false;
    } else {
      invalidParams.push({
        name: 'concluido',
        reason: 'O campo concluido deve ser um valor booleano (true ou false).',
      });
    }
  }

  // 4. Tempo assistido opcional (em segundos)
  let tempoAssistidoSegundos = null;
  const rawTempo = body.tempo_assistido_segundos !== undefined ? body.tempo_assistido_segundos : body.tempoAssistidoSegundos;
  if (rawTempo !== undefined && rawTempo !== null) {
    const num = Number(rawTempo);
    if (!Number.isInteger(num) || num < 0) {
      invalidParams.push({
        name: 'tempo_assistido_segundos',
        reason: 'O tempo assistido em segundos deve ser um número inteiro não-negativo.',
      });
    } else {
      tempoAssistidoSegundos = num;
    }
  }

  if (invalidParams.length > 0) {
    throw new ValidationError('Parâmetros de rastreamento de progresso inválidos.', invalidParams);
  }

  return {
    trilhaId: rawTrilhaId.trim(),
    aulaId: rawAulaId.trim(),
    concluido,
    tempoAssistidoSegundos,
  };
}

export default {
  validarAtualizacaoProgresso,
};

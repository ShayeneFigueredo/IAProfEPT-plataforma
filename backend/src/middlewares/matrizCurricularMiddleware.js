import { validarParametrosLaboratorio } from '../validators/promptValidator.js';
import { resolverContextoCurricular } from '../config/curricularMatrix.js';

/**
 * Middleware Server-side contra a Matriz BNCC x EPT (Anti-Prompt Livre)
 * Plataforma IAprofEPT — Tese de Doutorado PPGEM / UFJF
 * 
 * Intercepta requisições ao Laboratório de IA e rejeita sumariamente:
 * 1. Qualquer tentativa de envio de comandos de texto livre ou campos de prompt aberto (ADR-001).
 * 2. Padrões de jailbreak, prompt injection ou comandos maliciosos.
 * 3. Parâmetros fora dos catálogos cadastrados na Matriz Curricular (BNCC x CNCT x Metodologias).
 * 
 * Critério de Aceite: Retorna HTTP 422 Unprocessable Entity no formato RFC 7807 para parâmetros fora dos catálogos.
 */
export function validarMatrizCurricularMiddleware(req, res, next) {
  try {
    const paramsValidados = validarParametrosLaboratorio(req.body);

    // Substitui req.body pelos parâmetros estritamente validados e normalizados
    req.body = paramsValidados;

    // Anexa contexto curricular pré-resolvido na requisição para consumo de controllers e auditores
    req.contextoCurricular = resolverContextoCurricular(paramsValidados);

    return next();
  } catch (err) {
    return next(err);
  }
}

export default validarMatrizCurricularMiddleware;

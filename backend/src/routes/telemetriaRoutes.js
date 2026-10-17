import { Router } from 'express';
import { telemetriaController } from '../controllers/TelemetriaController.js';
import { optionalAuthenticateToken, requirePesquisador } from '../middlewares/authMiddleware.js';

const telemetriaRoutes = Router();

/**
 * POST /api/telemetria/avaliacao
 * Registra a avaliação do professor para o material gerado por IA:
 * - Nota de 1 a 5 estrelas
 * - Tags qualitativas (Rigor Matemático, Contextualização EPT, Clareza do Gabarito, Adequação à BNCC)
 * - Comentário crítico opcional
 * - Vinculação automática à geração no PostgreSQL e impedimento de duplicidade (409 Conflict).
 */
telemetriaRoutes.post(
  '/avaliacao',
  optionalAuthenticateToken,
  telemetriaController.avaliarGeracao
);

/**
 * GET /api/telemetria/avaliacao/estatisticas
 * Métricas consolidadas das avaliações dos docentes para a Tese de Doutorado:
 * Média Likert de estrelas, comparativo Motor A (Groq) vs Motor B (Gemini),
 * frequência das tags qualitativas e comentários críticos anonimizados.
 */
telemetriaRoutes.get(
  '/avaliacao/estatisticas',
  telemetriaController.getEstatisticasAvaliacao
);

/**
 * GET /api/telemetria/relatorio-tese
 * Consolidação analítica e exportação dos dados empíricos do Teste A/B (Groq vs Gemini)
 * para a Tese de Doutorado de Maycon Magalhães (PPGEM/UFJF).
 * Restrito ao pesquisador e orientadores (RBAC: pesquisador_doutorado, administrador_ufjf).
 * 
 * Calcula médias ponderadas de latência, distribuição de notas (1 a 5 estrelas),
 * desvios padrões, taxas de aceitação comparadas e exporta em JSON e CSV.
 */
telemetriaRoutes.get(
  '/relatorio-tese',
  requirePesquisador,
  telemetriaController.getRelatorioTese
);

/**
 * GET /api/telemetria/status
 * Métricas de latência, vazão e integridade da fila assíncrona de telemetria A/B.
 */
telemetriaRoutes.get(
  '/status',
  telemetriaController.getStatusFila
);

export default telemetriaRoutes;


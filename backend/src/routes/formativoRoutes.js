import { Router } from 'express';
import { formativoController } from '../controllers/FormativoController.js';
import { authenticateToken, optionalAuthenticateToken } from '../middlewares/authMiddleware.js';

const formativoRoutes = Router();

/**
 * GET /api/formativo/trilhas
 * Lista as 4 trilhas formativas oficiais com contadores de aulas, carga horária
 * e porcentagem de conclusão individualizada do docente autenticado.
 */
formativoRoutes.get(
  '/trilhas',
  optionalAuthenticateToken,
  formativoController.getTrilhas
);

/**
 * GET /api/formativo/trilhas/:id
 * Retorna os detalhes pedagógicos completos da trilha (módulos, aulas, vídeos e materiais)
 * indicando quais aulas o docente já concluiu.
 */
formativoRoutes.get(
  '/trilhas/:id',
  optionalAuthenticateToken,
  formativoController.getTrilhaDetalhes
);

/**
 * POST /api/formativo/progresso
 * Atualiza e persiste o progresso do docente no PostgreSQL (aulas concluídas e porcentagem).
 * Critério de Aceite: persistência do progresso permitindo retomar trilhas entre sessões.
 */
formativoRoutes.post(
  '/progresso',
  authenticateToken,
  formativoController.atualizarProgresso
);

export default formativoRoutes;

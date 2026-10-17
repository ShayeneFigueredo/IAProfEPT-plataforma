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

/**
 * GET /api/formativo/documentos
 * Acervo oficial de documentos, relatórios internacionais e diretrizes da EPT.
 * Suporta filtragem por tag (Legislacao EPT, Relatorios UNESCO, Plano Brasileiro de IA),
 * busca textual e ano de publicação.
 * Critério de Aceite: retorno rápido com metadados completos de publicação e links funcionais.
 */
formativoRoutes.get(
  '/documentos',
  optionalAuthenticateToken,
  formativoController.getDocumentos
);

/**
 * GET /api/formativo/ebook-prompts
 * Entrega os modelos estruturados de prompts para Educação Matemática na EPT.
 * Suporta filtragem por categoria pedagógica, busca textual e eixo tecnológico.
 * Critério de Aceite: retorno rápido com metadados completos de publicação e links funcionais.
 */
formativoRoutes.get(
  '/ebook-prompts',
  optionalAuthenticateToken,
  formativoController.getEbookPrompts
);

export default formativoRoutes;


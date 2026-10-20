import { Router } from 'express';
import { formativoController } from '../controllers/FormativoController.js';
import { authenticateToken, optionalAuthenticateToken } from '../middlewares/authMiddleware.js';
import { uploadSingleAnexo } from '../middlewares/uploadMiddleware.js';

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
 */
formativoRoutes.get(
  '/documentos',
  optionalAuthenticateToken,
  formativoController.getDocumentos
);

/**
 * POST /api/formativo/documentos
 * Studio: Upload e cadastro de novo documento no acervo (com arquivo PDF opcional)
 */
formativoRoutes.post(
  '/documentos',
  optionalAuthenticateToken,
  uploadSingleAnexo,
  formativoController.criarDocumento
);

/**
 * PUT /api/formativo/documentos/:id
 * Studio: Atualização de metadados ou substituição de arquivo de documento
 */
formativoRoutes.put(
  '/documentos/:id',
  optionalAuthenticateToken,
  uploadSingleAnexo,
  formativoController.atualizarDocumento
);

/**
 * DELETE /api/formativo/documentos/:id
 * Studio: Exclusão de documento do acervo formativo
 */
formativoRoutes.delete(
  '/documentos/:id',
  optionalAuthenticateToken,
  formativoController.excluirDocumento
);

/**
 * GET /api/formativo/videos
 * Studio & Formativo: Lista todos os vídeos/palestras do ambiente
 */
formativoRoutes.get(
  '/videos',
  optionalAuthenticateToken,
  formativoController.listarVideos
);

/**
 * POST /api/formativo/videos
 * Studio: Cadastro de novo vídeo com ID ou URL do YouTube
 */
formativoRoutes.post(
  '/videos',
  optionalAuthenticateToken,
  formativoController.criarVideo
);

/**
 * PUT /api/formativo/videos/:id
 * Studio: Atualização de vídeo
 */
formativoRoutes.put(
  '/videos/:id',
  optionalAuthenticateToken,
  formativoController.atualizarVideo
);

/**
 * DELETE /api/formativo/videos/:id
 * Studio: Exclusão de vídeo
 */
formativoRoutes.delete(
  '/videos/:id',
  optionalAuthenticateToken,
  formativoController.excluirVideo
);

/**
 * POST /api/formativo/certificados/gerar
 * Studio: Geração real de certificado em PDF (Puppeteer) com download de buffer binário
 */
formativoRoutes.post(
  '/certificados/gerar',
  optionalAuthenticateToken,
  formativoController.gerarCertificado
);

/**
 * GET /api/formativo/ebook-prompts
 * Entrega os modelos estruturados de prompts para Educação Matemática na EPT.
 */
formativoRoutes.get(
  '/ebook-prompts',
  optionalAuthenticateToken,
  formativoController.getEbookPrompts
);

export default formativoRoutes;



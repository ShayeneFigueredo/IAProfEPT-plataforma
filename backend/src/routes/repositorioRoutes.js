import { Router } from 'express';
import { repositorioController } from '../controllers/RepositorioController.js';
import { anexosController } from '../controllers/AnexosController.js';
import { interacoesController } from '../controllers/InteracoesController.js';
import { authenticateToken, optionalAuthenticateToken } from '../middlewares/authMiddleware.js';
import { uploadSingleAnexo } from '../middlewares/uploadMiddleware.js';

const repositorioRoutes = Router();

/**
 * POST /api/repositorio/praticas
 * Compartilhar material pedagógico gerado por IA ou autoral.
 * Requer autenticação do docente.
 */
repositorioRoutes.post(
  '/praticas',
  authenticateToken,
  repositorioController.compartilharPratica
);

/**
 * GET /api/repositorio/praticas
 * Listagem paginada de práticas pedagógicas com metadados, filtros e busca textual.
 * Autenticação opcional (permite aos docentes visualizarem também suas práticas em rascunho).
 */
repositorioRoutes.get(
  '/praticas',
  optionalAuthenticateToken,
  repositorioController.listarPraticas
);

/**
 * GET /api/repositorio/buscar
 * Motor de busca avançada com filtros combinados: curso_tecnico, eixo_cnct,
 * habilidade_bncc, tema_matematico e termo textual via índices Trigram (pg_trgm) e FTS.
 * Suporta ordenações por mais_curtidos, mais_recentes e melhor_avaliados (< 100ms).
 */
repositorioRoutes.get(
  '/buscar',
  optionalAuthenticateToken,
  repositorioController.buscarPraticas
);

// Alias conveniente caso clientes requisitem /api/repositorio/praticas/buscar
repositorioRoutes.get(
  '/praticas/buscar',
  optionalAuthenticateToken,
  repositorioController.buscarPraticas
);

/**
 * GET /api/repositorio/praticas/:id
 * Detalhes completos da prática pedagógica com gabarito estruturado, dados do autor e habilidades BNCC.
 */
repositorioRoutes.get(
  '/praticas/:id',
  optionalAuthenticateToken,
  repositorioController.obterPraticaDetalhes
);

/**
 * PUT /api/repositorio/praticas/:id
 * Edição de prática pedagógica existente.
 * Permitido apenas ao autor original ou administradores.
 */
repositorioRoutes.put(
  '/praticas/:id',
  authenticateToken,
  repositorioController.atualizarPratica
);

/**
 * DELETE /api/repositorio/praticas/:id
 * Remoção de prática pedagógica via Soft Delete (preservando integridade e histórico de telemetria).
 * Permitido apenas ao autor original ou administradores.
 */
repositorioRoutes.delete(
  '/praticas/:id',
  authenticateToken,
  repositorioController.deletarPratica
);

/* ==========================================================================
   ROTAS DE UPLOAD E ARMAZENAMENTO SEGURO DE ANEXOS (PDFs/DOCX/IMAGENS)
   ========================================================================== */

/**
 * POST /api/repositorio/anexos
 * Upload multipart/form-data de arquivos com validação de MIME, Magic Bytes e SHA-256.
 */
repositorioRoutes.post(
  '/anexos',
  authenticateToken,
  uploadSingleAnexo,
  anexosController.uploadAnexo
);

/**
 * POST /api/repositorio/praticas/:id/anexo
 * Upload de anexo diretamente vinculado à prática pedagógica especificada.
 */
repositorioRoutes.post(
  '/praticas/:id/anexo',
  authenticateToken,
  uploadSingleAnexo,
  anexosController.uploadAnexo
);

/**
 * GET /api/repositorio/anexos/:id
 * Consulta metadados cadastrais do anexo com hash de integridade SHA-256.
 */
repositorioRoutes.get(
  '/anexos/:id',
  optionalAuthenticateToken,
  anexosController.obterDetalhesAnexo
);

/**
 * GET /api/repositorio/anexos/:id/download
 * Download e streaming seguro do anexo com cabeçalhos de proteção e ETag SHA-256.
 */
repositorioRoutes.get(
  '/anexos/:id/download',
  optionalAuthenticateToken,
  anexosController.downloadAnexo
);

/**
 * DELETE /api/repositorio/anexos/:id
 * Remoção lógica com Soft Delete de anexo do repositório (autor ou administrador).
 */
repositorioRoutes.delete(
  '/anexos/:id',
  authenticateToken,
  anexosController.deletarAnexo
);

/* ==========================================================================
   ROTAS DE INTERAÇÕES COMUNITÁRIAS (CURTIDAS, FAVORITOS, COMENTÁRIOS/RELATOS)
   ========================================================================== */

/**
 * POST /api/repositorio/praticas/:id/curtir
 * Toggle atômico de curtida com incremento/decremento seguro de contador no PostgreSQL.
 */
repositorioRoutes.post(
  '/praticas/:id/curtir',
  authenticateToken,
  interacoesController.curtirPratica
);

/**
 * POST /api/repositorio/praticas/:id/favoritar
 * Toggle atômico de favorito com incremento/decremento seguro de contador no PostgreSQL.
 */
repositorioRoutes.post(
  '/praticas/:id/favoritar',
  authenticateToken,
  interacoesController.favoritarPratica
);

/**
 * POST /api/repositorio/praticas/:id/comentarios
 * Publica comentário ou relato de experiência de aplicação em sala de aula da EPT.
 */
repositorioRoutes.post(
  '/praticas/:id/comentarios',
  authenticateToken,
  interacoesController.adicionarComentario
);

/**
 * GET /api/repositorio/praticas/:id/comentarios
 * Listagem paginada de comentários e relatos pedagógicos com metadados do autor.
 */
repositorioRoutes.get(
  '/praticas/:id/comentarios',
  optionalAuthenticateToken,
  interacoesController.listarComentarios
);

/**
 * GET /api/repositorio/praticas/:id/interacoes
 * Status de interação do usuário logado na prática (curtiu, favoritou).
 */
repositorioRoutes.get(
  '/praticas/:id/interacoes',
  optionalAuthenticateToken,
  interacoesController.obterStatusInteracoes
);

/**
 * DELETE /api/repositorio/comentarios/:comentarioId
 * Remoção lógica com Soft Delete de comentário (autor ou administrador).
 */
repositorioRoutes.delete(
  '/comentarios/:comentarioId',
  authenticateToken,
  interacoesController.deletarComentario
);

export default repositorioRoutes;



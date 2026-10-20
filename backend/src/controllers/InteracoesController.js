import { interacoesRepository } from '../repositories/InteracoesRepository.js';
import { validarUuid, validarComentarioPratica } from '../validators/repositorioValidator.js';
import { BadRequestError } from '../errors/AppError.js';

/**
 * Controller de Interações Comunitárias no Repositório de Práticas
 * Plataforma IAprofEPT — Tese de Doutorado PPGEM / UFJF
 * 
 * Gerencia:
 * - Toggle atômico de curtidas (Likes)
 * - Toggle atômico de favoritos
 * - Publicação de comentários e relatos de experiência de sala de aula
 * - Listagem e moderação comunitária
 */
export class InteracoesController {
  constructor() {
    this.curtirPratica = this.curtirPratica.bind(this);
    this.favoritarPratica = this.favoritarPratica.bind(this);
    this.adicionarComentario = this.adicionarComentario.bind(this);
    this.listarComentarios = this.listarComentarios.bind(this);
    this.deletarComentario = this.deletarComentario.bind(this);
    this.obterStatusInteracoes = this.obterStatusInteracoes.bind(this);
  }

  /**
   * POST /api/repositorio/praticas/:id/curtir
   * Alterna (toggle) curtida na prática pedagógica com contador atômico no PostgreSQL.
   */
  async curtirPratica(req, res, next) {
    try {
      const praticaId = validarUuid(req.params.id, 'id');
      const usuarioId = req.user?.id;

      if (!usuarioId) {
        throw new BadRequestError('Identificação do docente autenticado não encontrada.');
      }

      const resultado = await interacoesRepository.toggleCurtida(praticaId, usuarioId);

      return res.status(200).json({
        sucesso: true,
        mensagem: resultado.curtido
          ? 'Prática pedagógica curtida com sucesso.'
          : 'Curtida removida com sucesso.',
        praticaId: resultado.praticaId,
        curtido: resultado.curtido,
        totalCurtidas: resultado.totalCurtidas,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/repositorio/praticas/:id/favoritar
   * Alterna (toggle) favorito na prática pedagógica com contador atômico no PostgreSQL.
   */
  async favoritarPratica(req, res, next) {
    try {
      const praticaId = validarUuid(req.params.id, 'id');
      const usuarioId = req.user?.id;

      if (!usuarioId) {
        throw new BadRequestError('Identificação do docente autenticado não encontrada.');
      }

      const resultado = await interacoesRepository.toggleFavorito(praticaId, usuarioId);

      return res.status(200).json({
        sucesso: true,
        mensagem: resultado.favoritado
          ? 'Prática pedagógica adicionada aos favoritos.'
          : 'Prática pedagógica removida dos favoritos.',
        praticaId: resultado.praticaId,
        favoritado: resultado.favoritado,
        totalFavoritos: resultado.totalFavoritos,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/repositorio/praticas/:id/comentarios
   * Publica comentário ou relato de experiência de aplicação em sala de aula da EPT.
   */
  async adicionarComentario(req, res, next) {
    try {
      const praticaId = validarUuid(req.params.id, 'id');
      const usuarioId = req.user?.id;

      if (!usuarioId) {
        throw new BadRequestError('Identificação do docente autenticado não encontrada.');
      }

      const dadosValidados = validarComentarioPratica(req.body);
      const comentario = await interacoesRepository.adicionarComentario(
        praticaId,
        usuarioId,
        dadosValidados
      );

      return res.status(201).json({
        sucesso: true,
        mensagem: dadosValidados.relatoExperiencia
          ? 'Relato de experiência pedagógica compartilhado com sucesso no Repositório.'
          : 'Comentário publicado com sucesso.',
        comentario,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/repositorio/praticas/:id/comentarios
   * Retorna listagem paginada de comentários e relatos com dados do autor.
   */
  async listarComentarios(req, res, next) {
    try {
      const praticaId = validarUuid(req.params.id, 'id');
      const resultado = await interacoesRepository.listarComentarios(praticaId, req.query);

      return res.status(200).json({
        sucesso: true,
        ...resultado,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/repositorio/praticas/:id/interacoes
   * Retorna status de interação (se usuário logado curtiu ou favoritou a prática).
   */
  async obterStatusInteracoes(req, res, next) {
    try {
      const praticaId = validarUuid(req.params.id, 'id');
      const usuarioId = req.user?.id || null;

      const status = await interacoesRepository.obterStatusInteracoes(praticaId, usuarioId);

      return res.status(200).json({
        sucesso: true,
        praticaId,
        ...status,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/repositorio/comentarios/:comentarioId
   * Exclusão lógica com Soft Delete de comentário (autor ou administrador).
   */
  async deletarComentario(req, res, next) {
    try {
      const comentarioId = validarUuid(req.params.comentarioId, 'comentarioId');
      const usuarioId = req.user.id;
      const isAdm = req.user.role === 'administrador_ufjf';

      const resultado = await interacoesRepository.deletarComentario(comentarioId, usuarioId, isAdm);

      return res.status(200).json({
        sucesso: true,
        mensagem: 'Comentário removido com sucesso.',
        comentarioId: resultado.id,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const interacoesController = new InteracoesController();
export default interacoesController;

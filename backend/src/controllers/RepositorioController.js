import { repositorioPraticasRepository } from '../repositories/RepositorioPraticasRepository.js';
import {
  validarUuid,
  validarCriacaoPratica,
  validarAtualizacaoPratica,
  validarFiltrosListagem,
  validarFiltrosBuscaAvancada,
} from '../validators/repositorioValidator.js';
import { NotFoundError } from '../errors/AppError.js';

/**
 * Controller do Repositório de Práticas Docentes e Sequências Didáticas
 * Plataforma IAprofEPT — Tese de Doutorado PPGEM / UFJF
 * 
 * Gerencia rotas RESTful para compartilhamento, busca paginada, visualização detalhada,
 * atualização pelo autor e soft delete de práticas curriculares na EPT.
 */
export class RepositorioController {
  constructor() {
    this.compartilharPratica = this.compartilharPratica.bind(this);
    this.listarPraticas = this.listarPraticas.bind(this);
    this.buscarPraticas = this.buscarPraticas.bind(this);
    this.obterPraticaDetalhes = this.obterPraticaDetalhes.bind(this);
    this.atualizarPratica = this.atualizarPratica.bind(this);
    this.deletarPratica = this.deletarPratica.bind(this);
  }

  /**
   * POST /api/repositorio/praticas
   * Compartilha uma prática pedagógica (gerada por IA ou autoral) no repositório colaborativo.
   */
  async compartilharPratica(req, res, next) {
    try {
      const usuarioId = req.user.id;
      const dadosValidados = validarCriacaoPratica(req.body);

      const pratica = await repositorioPraticasRepository.criarPratica(dadosValidados, usuarioId);

      return res.status(201).json({
        sucesso: true,
        mensagem: 'Prática pedagógica compartilhada com sucesso no Repositório.',
        pratica,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/repositorio/praticas
   * Retorna a listagem paginada de práticas pedagógicas com metadados, filtros e busca textual.
   */
  async listarPraticas(req, res, next) {
    try {
      const filtros = validarFiltrosListagem(req.query);
      const solicitanteId = req.user?.id || null;
      const isAdm = req.user?.role === 'administrador_ufjf';

      const resultado = await repositorioPraticasRepository.listarPraticas(filtros, solicitanteId, isAdm);

      return res.status(200).json({
        sucesso: true,
        ...resultado,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/repositorio/buscar
   * Motor de busca avançada no Repositório com filtros combinados:
   * curso_tecnico, eixo_cnct, habilidade_bncc, tema_matematico e termo textual (pg_trgm + FTS).
   * Suporta ordenação por mais_curtidos, mais_recentes e melhor_avaliados (< 100ms).
   */
  async buscarPraticas(req, res, next) {
    try {
      const filtros = validarFiltrosBuscaAvancada(req.query);
      const solicitanteId = req.user?.id || null;
      const isAdm = req.user?.role === 'administrador_ufjf';

      const resultado = await repositorioPraticasRepository.buscarPraticasAvancada(
        filtros,
        solicitanteId,
        isAdm
      );

      return res.status(200).json({
        sucesso: true,
        tempoRespostaMs: resultado.tempoRespostaMs,
        criterioAceiteMenorQue100ms: resultado.criterioAceiteMenorQue100ms,
        paginacao: resultado.paginacao,
        filtrosAplicados: resultado.filtrosAplicados,
        resultados: resultado.resultados,
        praticas: resultado.praticas,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/repositorio/praticas/:id
   * Retorna os detalhes completos de uma prática pedagógica com gabarito estruturado e autor.
   */
  async obterPraticaDetalhes(req, res, next) {
    try {
      const id = validarUuid(req.params.id, 'id');
      const solicitanteId = req.user?.id || null;
      const isAdm = req.user?.role === 'administrador_ufjf';

      const pratica = await repositorioPraticasRepository.buscarPorId(id, solicitanteId, isAdm);

      if (!pratica) {
        throw new NotFoundError(`Prática pedagógica com ID '${id}' não encontrada ou já removida.`);
      }

      return res.status(200).json({
        sucesso: true,
        pratica,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/repositorio/praticas/:id
   * Atualiza dados de uma prática pedagógica (permitido apenas ao autor ou administradores).
   */
  async atualizarPratica(req, res, next) {
    try {
      const id = validarUuid(req.params.id, 'id');
      const usuarioId = req.user.id;
      const isAdm = req.user.role === 'administrador_ufjf';

      const camposAtualizacao = validarAtualizacaoPratica(req.body);
      const praticaAtualizada = await repositorioPraticasRepository.atualizarPratica(
        id,
        camposAtualizacao,
        usuarioId,
        isAdm
      );

      return res.status(200).json({
        sucesso: true,
        mensagem: 'Prática pedagógica atualizada com sucesso.',
        pratica: praticaAtualizada,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/repositorio/praticas/:id
   * Remove uma prática pedagógica via Soft Delete (permitido apenas ao autor ou administradores).
   */
  async deletarPratica(req, res, next) {
    try {
      const id = validarUuid(req.params.id, 'id');
      const usuarioId = req.user.id;
      const isAdm = req.user.role === 'administrador_ufjf';

      const resultado = await repositorioPraticasRepository.deletarPraticaSoft(id, usuarioId, isAdm);

      return res.status(200).json({
        sucesso: true,
        ...resultado,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const repositorioController = new RepositorioController();
export default repositorioController;

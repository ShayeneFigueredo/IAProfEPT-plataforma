import crypto from 'crypto';
import { avaliacaoTelemetriaRepository } from '../repositories/AvaliacaoTelemetriaRepository.js';
import { validarDadosAvaliacao } from '../validators/avaliacaoValidator.js';
import { telemetryAsyncService } from '../services/TelemetryAsyncService.js';
import { relatorioTeseService } from '../services/RelatorioTeseService.js';

/**
 * Controller de Telemetria A/B e Avaliação Docente
 * Plataforma IAprofEPT — PPGEM / UFJF
 * Doutorando: Maycon Luiz Amaral Magalhães
 */
export class TelemetriaController {
  constructor() {
    this.avaliarGeracao = this.avaliarGeracao.bind(this);
    this.getEstatisticasAvaliacao = this.getEstatisticasAvaliacao.bind(this);
    this.getStatusFila = this.getStatusFila.bind(this);
    this.getRelatorioTese = this.getRelatorioTese.bind(this);
  }

  /**
   * Deriva o hash anonimizado do docente conforme diretrizes de governança ética.
   * Prioriza o ID autenticado, seguido pelo ID informado no corpo/header ou fingerprint de sessão.
   */
  _obterUsuarioHash(req) {
    if (req.user?.id) {
      return crypto.createHash('sha256').update(String(req.user.id)).digest('hex');
    }

    const usuarioIdInformado = req.body.usuario_id || req.body.usuarioId;
    if (usuarioIdInformado) {
      if (typeof usuarioIdInformado === 'string' && usuarioIdInformado.length === 64 && /^[0-9a-f]{64}$/i.test(usuarioIdInformado)) {
        return usuarioIdInformado.toLowerCase();
      }
      return crypto.createHash('sha256').update(String(usuarioIdInformado)).digest('hex');
    }

    const chaveAlocacao = req.headers['x-ab-allocation-key'] || req.body.chave_alocacao || req.body.chaveAlocacao;
    if (chaveAlocacao) {
      return crypto.createHash('sha256').update(`chave-${chaveAlocacao}`).digest('hex');
    }

    // Fingerprint de sessão anônima baseada em IP e User-Agent
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const ua = req.headers['user-agent'] || 'sem-user-agent';
    return crypto.createHash('sha256').update(`anonimo-${ip}-${ua}`).digest('hex');
  }

  /**
   * POST /api/telemetria/avaliacao
   * Registra a avaliação do professor (1 a 5 estrelas, tags qualitativas e comentário crítico).
   * Impede compulsoriamente avaliações duplicadas para a mesma geração.
   */
  async avaliarGeracao(req, res, next) {
    try {
      // 1. Validação estrita dos dados da avaliação
      const dadosValidados = validarDadosAvaliacao(req.body);

      // 2. Determinação da identidade anonimizada do docente
      const usuarioIdHash = this._obterUsuarioHash(req);
      const usuarioIdOriginal = req.user?.id || req.body.usuario_id || req.body.usuarioId || null;

      // 3. Registro no repositório com verificação de unicidade
      const avaliacao = await avaliacaoTelemetriaRepository.registrarAvaliacao({
        requisicaoId: dadosValidados.requisicaoId,
        usuarioId: usuarioIdOriginal,
        usuarioIdHash,
        notaEstrelas: dadosValidados.notaEstrelas,
        tagsQualitativas: dadosValidados.tagsQualitativas,
        comentarioCritico: dadosValidados.comentarioCritico,
      });

      return res.status(201).json({
        sucesso: true,
        mensagem: 'Avaliação registrada com sucesso.',
        avaliacao,
        avisoEtico: 'Sua avaliação contribui diretamente com a pesquisa de Doutorado em Educação Matemática (PPGEM/UFJF) e com o aprimoramento contínuo dos modelos pedagógicos da plataforma.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/telemetria/avaliacao/estatisticas
   * Retorna os dados consolidados das avaliações por estrelas e tags (Groq vs Gemini)
   */
  async getEstatisticasAvaliacao(req, res, next) {
    try {
      const estatisticas = await avaliacaoTelemetriaRepository.obterEstatisticasAvaliacoes();
      return res.status(200).json({
        sucesso: true,
        ...estatisticas,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/telemetria/status
   * Diagnóstico do serviço assíncrono de telemetria e métricas de sobrecarga
   */
  async getStatusFila(req, res, next) {
    try {
      const metricasFila = telemetryAsyncService.obterMetricas();
      return res.status(200).json({
        sucesso: true,
        ...metricasFila,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/telemetria/relatorio-tese
   * Consolidação analítica e exportação dos dados empíricos do Teste A/B (Groq vs Gemini)
   * para inclusão direta no texto e relatórios da Tese de Doutorado.
   * Restrito ao pesquisador Maycon Magalhães e orientadores/administradores UFJF.
   * 
   * Suporta formatos:
   * - JSON: ?formato=json (padrão)
   * - CSV: ?formato=csv (com opções ?tipo=consolidado | avaliacoes | telemetria | tags | completo)
   */
  async getRelatorioTese(req, res, next) {
    try {
      const queryFormato = req.query.formato ? String(req.query.formato).toLowerCase() : null;
      const acceptHeader = req.headers.accept || '';
      const formato = queryFormato || (acceptHeader.includes('text/csv') ? 'csv' : 'json');

      const tipo = (req.query.tipo || 'consolidado').toLowerCase();
      const incluirAmostra = req.query.incluirAmostra !== 'false';

      const resultado = await relatorioTeseService.gerarRelatorio({
        usuarioSolicitante: req.user,
        formato,
        tipo,
        incluirAmostra,
      });

      if (formato === 'csv') {
        res.setHeader('Content-Type', resultado.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${resultado.filename}"`);
        return res.status(200).send(resultado.conteudo);
      }

      return res.status(200).json(resultado);
    } catch (err) {
      next(err);
    }
  }
}

export const telemetriaController = new TelemetriaController();
export default telemetriaController;


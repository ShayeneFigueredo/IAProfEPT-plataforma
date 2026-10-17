import { promptInjectionService } from '../services/PromptInjectionService.js';
import { groqService } from '../services/GroqService.js';
import { geminiService } from '../services/GeminiService.js';
import { aiRouterService } from '../services/AIRouterService.js';
import { abRoutingService } from '../services/ABRoutingService.js';
import { telemetryAsyncService } from '../services/TelemetryAsyncService.js';

/**
 * Controller do Laboratório de IA
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Responsável pelo motor de injeção de prompts ocultos e parametrização curricular.
 * Garante que nenhum usuário manipule caixas de texto cru (ADR-001).
 */
export class LaboratorioController {
  /**
   * POST /api/laboratorio/gerar
   * Rota Unificada e Resiliente do Laboratório de IA:
   * Gerencia as 4 modalidades: 1) Exercícios e Avaliações; 2) Atividades Interdisciplinares EPT;
   * 3) Roteiros para Podcasts Educacionais; 4) Planos de Aula Automáticos.
   * Orquestra a montagem do prompt oculto, aciona a IA pelo teste A/B com Circuit Breaker,
   * persiste telemetria no PostgreSQL e retorna resposta estruturada com gabarito, BNCC e banner ético.
   */
  async gerarAtividadeResiliente(req, res, next) {
    try {
      const resultado = await aiRouterService.gerarComResiliencia(req.body, {
        usuarioId: req.user?.id || null,
        motorPreferencial: req.body.motorPreferencial || null,
        usarPro: Boolean(req.body.usarPro),
        temperature: req.body.temperature ? parseFloat(req.body.temperature) : undefined,
        chaveAlocacao: req.body.chaveAlocacao || req.headers['x-ab-allocation-key'] || null,
        forcarExperimentoAB: req.body.forcarExperimentoAB !== undefined ? Boolean(req.body.forcarExperimentoAB) : undefined,
        estrategiaAB: req.body.estrategiaAB || null,
        manterConsistenciaUsuario: req.body.manterConsistenciaUsuario !== undefined ? Boolean(req.body.manterConsistenciaUsuario) : undefined,
        dataReferencia: req.body.dataReferencia || null,
        semente: req.body.semente || null,
        gravarBanco: req.body.gravarBanco !== undefined ? Boolean(req.body.gravarBanco) : true,
      });

      // Extrai e normaliza o gabarito para consumo estruturado conforme a modalidade
      const atividade = resultado.atividade || resultado.plano || resultado.podcast || {};
      let gabarito = null;

      if (Array.isArray(atividade.itens)) {
        // Modalidade 1: Exercícios e Avaliações
        gabarito = atividade.itens.map((item) => ({
          numero: item.numero,
          tituloItem: item.tituloItem || `Questão ${item.numero}`,
          perguntas: item.perguntas || [],
          gabaritoComentadoPassoAPasso: item.gabaritoComentadoPassoAPasso || [],
        }));
      } else if (Array.isArray(atividade.etapasInvestigacao)) {
        // Modalidade 2: Atividades Interdisciplinares
        gabarito = atividade.etapasInvestigacao.map((etapa) => ({
          etapa: etapa.etapa,
          titulo: etapa.titulo,
          comando: etapa.comando,
          etapasResolucao: etapa.etapasResolucao || [],
          gabaritoFinal: etapa.gabaritoFinal,
          interpretacaoTecnica: etapa.interpretacaoTecnica,
        }));
      } else if (atividade.desafioOuvinteComGabarito) {
        // Modalidade 3: Roteiro de Podcast
        gabarito = {
          enunciado: atividade.desafioOuvinteComGabarito.enunciadoDesafio,
          etapasResolucao: atividade.desafioOuvinteComGabarito.etapasResolucao || [],
          respostaFinal: atividade.desafioOuvinteComGabarito.respostaFinalGabarito,
          explicacaoPedagogica: atividade.desafioOuvinteComGabarito.explicacaoPedagogica,
        };
      } else if (atividade.avaliacaoFormativa) {
        // Modalidade 4: Plano de Aula
        gabarito = atividade.avaliacaoFormativa.gabaritoOrientador || atividade.avaliacaoFormativa;
      }

      // Habilidades da BNCC articuladas à EPT
      const habilidadesBNCC =
        resultado.curriculoInjetado?.habilidadesBNCC ||
        atividade.habilidadesBNCC ||
        [];

      // Alerta Ético Obrigatório da UFJF
      const alertaEtico =
        resultado.alertaEticoCompleto ||
        resultado.alertaEtico ||
        atividade.alertaEticoObrigatorio ||
        'Este material foi gerado por Inteligência Artificial e deve ser revisado, validado e adaptado pela autoridade docente antes de sua aplicação em sala de aula.';

      // Normalização canônica da modalidade
      const modalidade =
        atividade.tipoAtividade ||
        (req.body.ferramenta === 'plano_aula' ? 'plano' : req.body.ferramenta) ||
        'exercicios';

      return res.status(200).json({
        ...resultado,
        modalidade,
        gabarito,
        habilidadesBNCC,
        alertaEtico,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/laboratorio/ab-status
   * Retorna os dados diagnósticos da alocação balanceada A/B do Experimento de 30 Dias,
   * proporções entre Motor A e Motor B e validação estatística Qui-Quadrado.
   */
  async getABStatus(req, res, next) {
    try {
      const metricas = abRoutingService.obterMetricasAlocacao();
      return res.status(200).json({
        sucesso: true,
        ...metricas,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/laboratorio/telemetria-status
   * Retorna os dados diagnósticos da fila assíncrona de telemetria,
   * incluindo sobrecarga média do usuário (critério < 1ms), total de lotes e persistência no PostgreSQL.
   */
  async getTelemetriaQueueStatus(req, res, next) {
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
   * GET /api/laboratorio/circuit-breaker-status
   * Retorna os estados diagnósticos dos disjuntores de Groq e Gemini (CLOSED, OPEN, HALF_OPEN)
   * e métricas de contingência ativas.
   */
  async getCircuitBreakerStatus(req, res, next) {
    try {
      const status = aiRouterService.obterStatusCircuitos();
      return res.status(200).json(status);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/laboratorio/montar-prompt
   * Monta o prompt server-side estruturado em JSON estrito pronto para envio às LLMs.
   */
  async montarPrompt(req, res, next) {
    try {
      const resultado = promptInjectionService.montarPrompt(req.body);

      // Injeta identificador do usuário solicitante se autenticado
      if (req.user) {
        resultado.solicitante = {
          id: req.user.id,
          nome: req.user.nome,
          role: req.user.role,
        };
      }

      return res.status(200).json(resultado);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/laboratorio/gerar-groq
   * Gera a atividade curricular na íntegra via LPU Groq (LLaMA 3.3 70B Versatile),
   * com gabarito passo a passo, reflexão EMC e telemetria gravada.
   */
  async gerarAtividadeGroq(req, res, next) {
    try {
      const resultado = await groqService.gerarAtividadeCurricular(req.body, {
        usuarioId: req.user?.id || null,
      });

      return res.status(200).json(resultado);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/laboratorio/groq-benchmark
   * Avalia a saúde da conexão e a velocidade da inferência na LPU Groq.
   */
  async benchmarkGroq(req, res, next) {
    try {
      const resultado = await groqService.benchmarkLpu();
      return res.status(200).json(resultado);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/laboratorio/gerar-gemini
   * Gera a atividade interdisciplinar ou plano de aula via Google Gemini SDK (gemini-1.5-flash / gemini-1.5-pro),
   * com parametrização de Safety Settings, esquemas estruturados JSON e telemetria A/B.
   */
  async gerarAtividadeGemini(req, res, next) {
    try {
      const resultado = await geminiService.gerarAtividadeCurricular(req.body, {
        usuarioId: req.user?.id || null,
        usarPro: Boolean(req.body.usarPro),
        temperature: req.body.temperature ? parseFloat(req.body.temperature) : undefined,
      });

      return res.status(200).json(resultado);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/laboratorio/gemini-benchmark
   * Avalia a saúde da conexão e a latência de inferência na API Google Gemini.
   */
  async benchmarkGemini(req, res, next) {
    try {
      const resultado = await geminiService.benchmarkConexao();
      return res.status(200).json(resultado);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/laboratorio/parametros-curriculares
   * Retorna os metadados curriculares (áreas, cursos, eixos CNCT, metodologias e BNCC)
   * para preenchimento dos seletores do Laboratório sem expor caixas abertas.
   */
  async getParametrosCurriculares(req, res, next) {
    try {
      const parametros = promptInjectionService.obterParametrosCurricularesDisponiveis();
      return res.status(200).json({
        sucesso: true,
        versao: '1.0.0',
        ...parametros,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const laboratorioController = new LaboratorioController();
export default laboratorioController;

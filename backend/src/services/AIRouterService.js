import { CircuitBreaker, CircuitState } from './CircuitBreaker.js';
import { groqService } from './GroqService.js';
import { geminiService } from './GeminiService.js';
import { abRoutingService } from './ABRoutingService.js';
import { laboratorioRepository } from '../repositories/LaboratorioRepository.js';
import { ALERTA_ETICO_PADRAO } from '../config/curricularMatrix.js';
import { validarParametrosLaboratorio } from '../validators/promptValidator.js';
import { aiPostProcessor } from './AIPostProcessor.js';
import { AppError } from '../errors/AppError.js';

/**
 * Roteador Inteligente e Orquestrador de Resiliência de IA (Circuit Breaker & Fallback Automático)
 * Plataforma IAprofEPT — Tese de Doutorado PPGEM / UFJF
 * 
 * Atende aos requisitos:
 * 1. Padrão Circuit Breaker para Groq e Gemini com estados CLOSED, OPEN e HALF_OPEN.
 * 2. Detecção e corte de timeout de inferência (> 10s).
 * 3. Chaveamento transparente entre motor primário e secundário sem interromper o docente.
 * 4. Roteamento A/B balanceado 1:1 estatisticamente comprovado (Groq LLaMA 3.3 70B vs Google Gemini).
 * 5. Registro persistente da chave de teste e contingência na auditoria e telemetria do PostgreSQL.
 * 6. Critério de Aceite: Zero travamentos para o professor e proporção 1:1 estatisticamente validada.
 */
export class AIRouterService {
  constructor(options = {}) {
    this.timeoutMs = parseInt(process.env.IA_TIMEOUT_MS, 10) || options.timeoutMs || 10000;
    this.timeoutSecundarioMs = parseInt(process.env.IA_TIMEOUT_SECUNDARIO_MS, 10) || options.timeoutSecundarioMs || 25000;
    this.failureThreshold = parseInt(process.env.IA_FAILURE_THRESHOLD, 10) || options.failureThreshold || 3;
    this.resetTimeoutMs = parseInt(process.env.IA_RESET_TIMEOUT_MS, 10) || options.resetTimeoutMs || 30000;

    // Disjuntores isolados por provedor
    this.breakerGroq = new CircuitBreaker({
      name: 'groq',
      failureThreshold: this.failureThreshold,
      resetTimeoutMs: this.resetTimeoutMs,
      timeoutMs: this.timeoutMs,
    });

    this.breakerGemini = new CircuitBreaker({
      name: 'gemini',
      failureThreshold: this.failureThreshold,
      resetTimeoutMs: this.resetTimeoutMs,
      timeoutMs: this.timeoutMs,
    });

    this.defaultMotor = process.env.IA_MOTOR_PADRAO || 'auto'; // 'auto' ativa balanceamento A/B
    this.contingenciasTotais = 0;
  }

  /**
   * Obtém o CircuitBreaker correspondente ao motor
   */
  getBreaker(motor) {
    if (motor === 'gemini') return this.breakerGemini;
    return this.breakerGroq;
  }

  /**
   * Resolve o motor primário e secundário com base no estado de saúde dos disjuntores,
   * no motor de roteamento A/B balanceado e nas preferências da requisição.
   */
  determinarOrdemMotores(preferenciaUsuario = null, opcoes = {}) {
    const dataRef = opcoes.dataReferencia || new Date();
    const experimentoAtivo =
      Boolean(opcoes.forcarExperimentoAB) ||
      abRoutingService.isPeriodoExperimentoAtivo(dataRef) ||
      preferenciaUsuario === 'auto';

    // Se o experimento A/B estiver ativo ou a preferência for 'auto', aciona o ABRoutingService
    const deveAplicarAB =
      opcoes.forcarExperimentoAB ||
      preferenciaUsuario === 'auto' ||
      (experimentoAtivo && (!preferenciaUsuario || preferenciaUsuario === 'auto'));

    if (deveAplicarAB) {
      const alocacao = abRoutingService.alocarMotor({
        usuarioId: opcoes.usuarioId,
        chaveAlocacao: opcoes.chaveAlocacao,
        dataReferencia: dataRef,
        forcarExperimento: Boolean(opcoes.forcarExperimentoAB),
        estrategia: opcoes.estrategiaAB,
        manterConsistenciaUsuario: opcoes.manterConsistenciaUsuario,
        semente: opcoes.semente,
      });

      const motorAlocado = alocacao.motor; // 'groq' | 'gemini'
      const motorAlternativo = alocacao.motorAlternativo;

      // Verifica se o motor alocado está com circuito OPEN
      if (motorAlocado === 'groq' && this.breakerGroq.state === CircuitState.OPEN) {
        return {
          motorPrimario: 'gemini',
          motorSecundario: 'groq',
          motivoInversaoPrevia: 'Circuito Groq OPEN (contingência prévia A/B)',
          alocacaoAB: alocacao,
        };
      }

      if (motorAlocado === 'gemini' && this.breakerGemini.state === CircuitState.OPEN) {
        return {
          motorPrimario: 'groq',
          motorSecundario: 'gemini',
          motivoInversaoPrevia: 'Circuito Gemini OPEN (contingência prévia A/B)',
          alocacaoAB: alocacao,
        };
      }

      return {
        motorPrimario: motorAlocado,
        motorSecundario: motorAlternativo,
        motivoInversaoPrevia: null,
        alocacaoAB: alocacao,
      };
    }

    // Modo Manual Fora do Experimento
    const pref = preferenciaUsuario || this.defaultMotor;
    const alocacaoManual = {
      grupo: pref === 'gemini' ? 'B' : 'A',
      motor: pref === 'gemini' ? 'gemini' : 'groq',
      motorAlternativo: pref === 'gemini' ? 'groq' : 'gemini',
      chaveAlocacao: opcoes.chaveAlocacao || abRoutingService.gerarChaveAlocacao({ usuarioId: opcoes.usuarioId }),
      criterioAlocacao: 'manual_docente',
      experimentoAtivo: false,
    };

    if (pref === 'gemini') {
      if (this.breakerGemini.state === CircuitState.OPEN && this.breakerGroq.state !== CircuitState.OPEN) {
        return {
          motorPrimario: 'groq',
          motorSecundario: 'gemini',
          motivoInversaoPrevia: 'Circuito Gemini OPEN',
          alocacaoAB: alocacaoManual,
        };
      }
      return { motorPrimario: 'gemini', motorSecundario: 'groq', alocacaoAB: alocacaoManual };
    }

    if (pref === 'groq') {
      if (this.breakerGroq.state === CircuitState.OPEN && this.breakerGemini.state !== CircuitState.OPEN) {
        return {
          motorPrimario: 'gemini',
          motorSecundario: 'groq',
          motivoInversaoPrevia: 'Circuito Groq OPEN',
          alocacaoAB: alocacaoManual,
        };
      }
      return { motorPrimario: 'groq', motorSecundario: 'gemini', alocacaoAB: alocacaoManual };
    }

    return {
      motorPrimario: 'groq',
      motorSecundario: 'gemini',
      motivoInversaoPrevia: null,
      alocacaoAB: alocacaoManual,
    };
  }

  /**
   * Executa a chamada no motor específico (Groq ou Gemini)
   */
  async _executarChamadaMotor(motor, parametros, opcoes) {
    if (motor === 'gemini') {
      return geminiService.gerarAtividadeCurricular(parametros, opcoes);
    }
    return groqService.gerarAtividadeCurricular(parametros, opcoes);
  }

  /**
   * Método Principal de Geração Resiliente:
   * Orquestra a requisição com Roteamento A/B balanceado, Circuit Breaker,
   * timeout de 10s e contingência automática.
   * 
   * @param {Object} parametros - Parâmetros curriculares (sem prompt em branco)
   * @param {Object} [opcoes] - { usuarioId, motorPreferencial, gravarBanco, usarPro, forcarExperimentoAB }
   */
  async gerarComResiliencia(parametros, opcoes = {}) {
    // 1. Validação estrita inicial dos parâmetros curriculares
    const paramsValidados = validarParametrosLaboratorio(parametros);
    const motorPref = opcoes.motorPreferencial || paramsValidados.motorPreferencial;

    const tInicioTotal = performance.now();
    const { motorPrimario, motorSecundario, motivoInversaoPrevia, alocacaoAB } =
      this.determinarOrdemMotores(motorPref, opcoes);

    const breakerPrimario = this.getBreaker(motorPrimario);
    const breakerSecundario = this.getBreaker(motorSecundario);

    const opcoesCompletas = {
      ...opcoes,
      alocacaoAB,
    };

    let erroPrimario = null;
    let tInicioPrimario = performance.now();
    let latenciaPrimarioMs = 0;

    // ========================================================================
    // TENTATIVA NO MOTOR PRIMÁRIO
    // ========================================================================
    try {
      const resultadoPrimario = await breakerPrimario.execute(
        async () => {
          return this._executarChamadaMotor(motorPrimario, paramsValidados, opcoesCompletas);
        },
        { motor: motorPrimario, parametros: paramsValidados }
      );

      latenciaPrimarioMs = Math.round(performance.now() - tInicioPrimario);

      // Injeta metadados de contingência e de alocação A/B
      resultadoPrimario.contingencia = {
        acionada: Boolean(motivoInversaoPrevia),
        inversaoPrevia: motivoInversaoPrevia || null,
        motorUtilizado: motorPrimario,
        motorPrimarioOriginal: motorPrimario,
        latenciaPrimarioMs,
        latenciaTotalMs: Math.round(performance.now() - tInicioTotal),
      };
      resultadoPrimario.alocacaoAB = alocacaoAB;

      // Garante presença do alerta ético obrigatório e formatação matemática LaTeX KaTeX
      return aiPostProcessor.processar(resultadoPrimario);
    } catch (err) {
      erroPrimario = err;
      latenciaPrimarioMs = Math.round(performance.now() - tInicioPrimario);

      console.warn(
        `[AIRouterService] ⚠️ Falha detectada no motor primário "${motorPrimario}" (${erroPrimario.message}). Ativando contingência para "${motorSecundario}"...`
      );
    }

    // ========================================================================
    // CONTINGÊNCIA AUTOMÁTICA: EXECUÇÃO NO MOTOR SECUNDÁRIO
    // ========================================================================
    this.contingenciasTotais++;
    const tInicioSecundario = performance.now();
    const timeoutSecundarioMs = opcoes.timeoutSecundarioMs || this.timeoutSecundarioMs || 25000;

    try {
      const resultadoSecundario = await breakerSecundario.execute(
        async () => {
          return this._executarChamadaMotor(motorSecundario, paramsValidados, opcoesCompletas);
        },
        {
          motor: motorSecundario,
          fallbackDe: motorPrimario,
          timeoutMs: timeoutSecundarioMs,
        }
      );

      const latenciaSecundarioMs = Math.round(performance.now() - tInicioSecundario);
      const latenciaTotalMs = Math.round(performance.now() - tInicioTotal);

      // 1. Grava evento de contingência no banco de dados (Auditoria + Telemetria A/B)
      if (opcoes.gravarBanco !== false) {
        try {
          await laboratorioRepository.registrarEventoContingencia({
            usuarioId: opcoes.usuarioId || null,
            motorPrimario,
            motorSecundario,
            motivo: erroPrimario?.message || 'Falha ou Timeout no motor primário',
            latenciaPrimarioMs,
            latenciaSecundarioMs,
            latenciaTotalMs,
            estadoCircuito: breakerPrimario.state,
            requisicaoId: resultadoSecundario.requisicaoId || null,
            parametros,
          });
        } catch (dbErr) {
          console.error('[AIRouterService] Advertência ao registrar auditoria de contingência:', dbErr.message);
        }
      }

      // 2. Anexa informações de contingência transparente no retorno ao docente
      resultadoSecundario.contingencia = {
        acionada: true,
        motorPrimarioFalhou: motorPrimario,
        motorSecundarioAtivado: motorSecundario,
        motivoFalha: erroPrimario?.message || 'Timeout ou instabilidade',
        latenciaPrimarioMs,
        latenciaSecundarioMs,
        latenciaTotalMs,
        estadoCircuitoPrimario: breakerPrimario.state,
      };

      // 3. Garante rastreabilidade da alocação experimental original mesmo após contingência
      resultadoSecundario.alocacaoAB = {
        ...alocacaoAB,
        contingenciaAcionada: true,
        motorOriginalAlocado: alocacaoAB?.motor,
        motorEfetivoExecutado: motorSecundario,
      };

      // 4. Garante o alerta ético obrigatório de autoridade docente e padronização LaTeX
      resultadoSecundario.fallbackUtilizado = true;

      return aiPostProcessor.processar(resultadoSecundario);
    } catch (errSecundario) {
      // Cenário de Catástrofe: ambos os motores falharam simultaneamente
      console.error(
        `[AIRouterService] 💥 Catástrofe: Ambos os motores (${motorPrimario} e ${motorSecundario}) falharam.`
      );

      throw new AppError(
        'Indisponibilidade Temporária dos Motores de IA',
        503,
        `Não foi possível concluir a geração pedagógica. O motor primário (${motorPrimario}) falhou com: "${erroPrimario?.message}". O motor de contingência (${motorSecundario}) falhou com: "${errSecundario.message}". Por favor, tente novamente em alguns instantes.`
      );
    }
  }

  /**
   * Retorna os estados diagnósticos dos disjuntores, telemetria A/B e métricas de contingência
   */
  obterStatusCircuitos() {
    return {
      status: 'operacional',
      motorPadrao: this.defaultMotor,
      timeoutConfiguradoMs: this.timeoutMs,
      contingenciasAcionadasHistorico: this.contingenciasTotais,
      circuitos: {
        groq: this.breakerGroq.getStatus(),
        gemini: this.breakerGemini.getStatus(),
      },
      roteamentoAB: abRoutingService.obterMetricasAlocacao(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reseta todos os disjuntores para o estado normal (CLOSED)
   */
  resetarCircuitos() {
    this.breakerGroq.forceClose();
    this.breakerGemini.forceClose();
    return this.obterStatusCircuitos();
  }
}

export const aiRouterService = new AIRouterService();
export default aiRouterService;

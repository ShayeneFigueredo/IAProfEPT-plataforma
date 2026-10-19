import { Router } from 'express';
import { laboratorioController } from '../controllers/LaboratorioController.js';
import { optionalAuthenticateToken } from '../middlewares/authMiddleware.js';
import { validarMatrizCurricularMiddleware } from '../middlewares/matrizCurricularMiddleware.js';

const laboratorioRoutes = Router();

/**
 * POST /api/laboratorio/gerar
 * Rota Unificada de Geração Resiliente com Circuit Breaker e Fallback Automático.
 * Interceptada pelo middleware de validação estrita da Matriz BNCC x EPT (Anti-Prompt Livre).
 */
laboratorioRoutes.post(
  '/gerar',
  optionalAuthenticateToken,
  validarMatrizCurricularMiddleware,
  laboratorioController.gerarAtividadeResiliente.bind(laboratorioController)
);

/**
 * GET /api/laboratorio/circuit-breaker-status
 * Diagnóstico de integridade dos disjuntores Groq e Gemini (CLOSED, OPEN, HALF_OPEN)
 * e histórico de contingências registradas.
 */
laboratorioRoutes.get(
  '/circuit-breaker-status',
  laboratorioController.getCircuitBreakerStatus.bind(laboratorioController)
);

/**
 * GET /api/laboratorio/ab-status
 * Diagnóstico de telemetria e balanceamento A/B (Groq vs Gemini) do experimento de 30 dias.
 */
laboratorioRoutes.get(
  '/ab-status',
  laboratorioController.getABStatus.bind(laboratorioController)
);

/**
 * GET /api/laboratorio/telemetria-status
 * Diagnóstico de desempenho da fila assíncrona de telemetria e sobrecarga zero.
 */
laboratorioRoutes.get(
  '/telemetria-status',
  laboratorioController.getTelemetriaQueueStatus.bind(laboratorioController)
);

/**
 * POST /api/laboratorio/montar-prompt
 * Monta o prompt pedagógico oculto em estrutura JSON estrita pronta para Groq e Gemini.
 * Interceptado pelo middleware Anti-Prompt Livre (rejeição de texto cru e validação de catálogos).
 */
laboratorioRoutes.post(
  '/montar-prompt',
  optionalAuthenticateToken,
  validarMatrizCurricularMiddleware,
  laboratorioController.montarPrompt.bind(laboratorioController)
);

/**
 * POST /api/laboratorio/gerar-groq
 * Dispara inferência via LPU Groq (LLaMA 3.3 70B Versatile),
 * gerando atividade estruturada com gabarito passo a passo e reflexão EMC.
 */
laboratorioRoutes.post(
  '/gerar-groq',
  optionalAuthenticateToken,
  validarMatrizCurricularMiddleware,
  laboratorioController.gerarAtividadeGroq.bind(laboratorioController)
);

/**
 * GET /api/laboratorio/groq-benchmark
 * Diagnóstico de latência e saúde da conexão com a LPU Groq (< 2s).
 */
laboratorioRoutes.get(
  '/groq-benchmark',
  laboratorioController.benchmarkGroq.bind(laboratorioController)
);

/**
 * POST /api/laboratorio/gerar-gemini
 * Dispara inferência via Google Gemini SDK (gemini-1.5-flash / gemini-1.5-pro),
 * com esquemas JSON estruturados, safety settings e telemetria A/B no PostgreSQL.
 */
laboratorioRoutes.post(
  '/gerar-gemini',
  optionalAuthenticateToken,
  validarMatrizCurricularMiddleware,
  laboratorioController.gerarAtividadeGemini.bind(laboratorioController)
);

/**
 * GET /api/laboratorio/gemini-benchmark
 * Diagnóstico de latência e conectividade com a API Google Gemini.
 */
laboratorioRoutes.get(
  '/gemini-benchmark',
  laboratorioController.benchmarkGemini.bind(laboratorioController)
);

/**
 * GET /api/laboratorio/parametros-curriculares
 * Retorna as matrizes curriculares oficiais (BNCC, CNCT, Áreas e Metodologias)
 * para popular seletores estruturados do Laboratório de IA.
 */
laboratorioRoutes.get(
  '/parametros-curriculares',
  laboratorioController.getParametrosCurriculares.bind(laboratorioController)
);

export default laboratorioRoutes;

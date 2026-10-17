import { promptInjectionService } from './PromptInjectionService.js';
import { laboratorioRepository } from '../repositories/LaboratorioRepository.js';
import { telemetryAsyncService } from './TelemetryAsyncService.js';
import { RateLimitError, AppError } from '../errors/AppError.js';
import { ALERTA_ETICO_PADRAO } from '../config/curricularMatrix.js';
import { aiPostProcessor } from './AIPostProcessor.js';

/**
 * Cliente de Integração com a API Groq (LLaMA 3.3 70B via LPU)
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Critérios Técnicos Atendidos:
 * 1. Inferência de alta velocidade com hardware LPU da Groq (latência < 2 segundos).
 * 2. Parametrização de temperatura baixa (0.2 a 0.4) para cálculo matemático determinístico e rigor conceitual.
 * 3. Formato de saída estrito em JSON com gabarito passo a passo e reflexão da Educação Matemática Crítica.
 * 4. Tratamento resiliente de Rate Limits HTTP 429 com backoff exponencial, jitter e leitura de cabeçalhos.
 * 5. Telemetria automática para a Tese de Doutorado de Maycon Magalhães (experimento A/B).
 */
export class GroqService {
  constructor() {
    this.apiUrl =
      process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
    this.primaryModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    // Fallback operacional caso a chave temporária ou tier não tenha acesso ao modelo primário
    this.fallbackModel = process.env.GROQ_FALLBACK_MODEL || 'openai/gpt-oss-120b';
    this.activeModel = null;
    this.defaultTemperature = 0.2; // 0.2 a 0.4 para cálculo matemático preciso
    this.defaultMaxTokens = 4096;
    this.timeoutMs = 15000; // 15s timeout
    this.maxRetries = 3;
  }

  getApiKey() {
    const key = process.env.GROQ_API_KEY;
    if (!key) {
      throw new AppError(
        'Configuração de IA Ausente',
        500,
        'A variável de ambiente GROQ_API_KEY não foi configurada no servidor.'
      );
    }
    return key;
  }

  /**
   * Extrai e formata os metadados de rate limit enviados pela Groq nos cabeçalhos HTTP
   */
  extrairMetadadosRateLimit(headers) {
    return {
      remainingRequests: headers.get('x-ratelimit-remaining-requests'),
      limitRequests: headers.get('x-ratelimit-limit-requests'),
      resetRequests: headers.get('x-ratelimit-reset-requests'),
      remainingTokens: headers.get('x-ratelimit-remaining-tokens'),
      limitTokens: headers.get('x-ratelimit-limit-tokens'),
      resetTokens: headers.get('x-ratelimit-reset-tokens'),
      retryAfter: headers.get('retry-after'),
    };
  }

  /**
   * Executa chamada HTTP à API da Groq com suporte a timeout via AbortController
   */
  async executarChamadaHttp({
    payload,
    apiKey,
    timeoutMs = this.timeoutMs,
  }) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new AppError(
          'Timeout na Incerência Groq',
          504,
          `O motor de IA da Groq não respondeu no tempo limite de ${timeoutMs}ms.`
        );
      }
      throw err;
    }
  }

  /**
   * Executa uma inferência na Groq com tratamento de Rate Limit 429 e Fallback inteligente
   * 
   * @param {Object} opcoes
   * @param {Array<{ role: string, content: string }>} opcoes.messages
   * @param {string} [opcoes.model]
   * @param {number} [opcoes.temperature]
   * @param {number} [opcoes.max_tokens]
   * @param {Object} [opcoes.response_format]
   */
  async completarChat({
    messages,
    model = this.primaryModel,
    temperature = this.defaultTemperature,
    max_tokens = this.defaultMaxTokens,
    response_format = { type: 'json_object' },
  }) {
    const apiKey = this.getApiKey();

    // Validação de temperatura para cálculo matemático preciso (0.2 a 0.4 sugerido)
    const tempNormalizada = Math.max(0.0, Math.min(1.0, temperature));

    // Se o modelo padrão já sofreu fallback nesta sessão, utiliza diretamente o modelo ativo
    let modeloAtual = model;
    let fallbackUtilizado = false;
    if (model === this.primaryModel && this.activeModel) {
      modeloAtual = this.activeModel;
      fallbackUtilizado = true;
    }
    let tentativa = 0;

    while (tentativa <= this.maxRetries) {
      tentativa++;
      const tInicio = performance.now();

      const payload = {
        model: modeloAtual,
        messages,
        temperature: tempNormalizada,
        max_tokens,
        response_format,
      };

      try {
        const response = await this.executarChamadaHttp({
          payload,
          apiKey,
        });

        const tFim = performance.now();
        const latenciaMs = Math.round(tFim - tInicio);
        const rateLimits = this.extrairMetadadosRateLimit(response.headers);

        // CASO 1: Sucesso HTTP 200 OK
        if (response.status === 200) {
          const dados = await response.json();
          const conteudoRaw = dados.choices?.[0]?.message?.content || '{}';

          let conteudoJson = null;
          try {
            conteudoJson = JSON.parse(conteudoRaw);
          } catch (e) {
            // Em caso de blocos markdown ```json ... ```
            const match = conteudoRaw.match(/```json([\s\S]*?)```/);
            if (match) {
              conteudoJson = JSON.parse(match[1].trim());
            } else {
              conteudoJson = { texto: conteudoRaw };
            }
          }

          return {
            sucesso: true,
            modelo: modeloAtual,
            fallbackUtilizado,
            latenciaMs,
            atendeCriterioSub2Segundos: latenciaMs < 2000,
            usage: dados.usage || {},
            rateLimits,
            conteudoJson,
            conteudoRaw,
          };
        }

        // CASO 2: Rate Limit HTTP 429 (Too Many Requests)
        if (response.status === 429) {
          const erroBody = await response.text();
          console.warn(
            `[GroqService] Rate limit 429 detectado (tentativa ${tentativa}/${this.maxRetries}). Detalhes:`,
            erroBody
          );

          if (tentativa <= this.maxRetries) {
            // Determina tempo de espera respeitando retry-after ou backoff exponencial com jitter
            let waitMs = 1000 * Math.pow(2, tentativa) + Math.random() * 300;

            if (rateLimits.retryAfter) {
              const segundos = parseFloat(rateLimits.retryAfter);
              if (!isNaN(segundos)) {
                waitMs = Math.max(waitMs, segundos * 1000 + 100);
              }
            }

            console.warn(`[GroqService] Aguardando ${Math.round(waitMs)}ms antes de tentar novamente...`);
            await new Promise((resolve) => setTimeout(resolve, waitMs));
            continue; // Próxima tentativa
          }

          throw new RateLimitError(
            `Limite de requisições por minuto da Groq excedido (Rate Limit 429). Tente novamente após ${
              rateLimits.resetRequests || 'alguns instantes'
            }.`
          );
        }

        // CASO 3: Modelo não encontrado (404 model_not_found) -> Fallback automático
        if (response.status === 404) {
          const erroBody = await response.json();
          if (
            erroBody.error?.code === 'model_not_found' &&
            modeloAtual !== this.fallbackModel
          ) {
            console.warn(
              `[GroqService] Modelo ${modeloAtual} indisponível nesta chave. Ativando fallback para ${this.fallbackModel}...`
            );
            this.activeModel = this.fallbackModel;
            modeloAtual = this.fallbackModel;
            fallbackUtilizado = true;
            continue; // Tenta com o modelo de fallback
          }

          throw new AppError(
            'Modelo da Groq Indisponível',
            404,
            erroBody.error?.message || 'Modelo especificado não foi localizado na API da Groq.'
          );
        }

        // CASO 4: Outros erros de API (400, 401, 500, etc.)
        const erroJson = await response.json().catch(() => ({}));
        throw new AppError(
          'Falha na Incerência Groq',
          response.status >= 500 ? 502 : response.status,
          erroJson.error?.message || `A API da Groq retornou status HTTP ${response.status}.`
        );
      } catch (err) {
        // Se for erro de rede e ainda houver tentativas, tenta com backoff
        if (!(err instanceof AppError) && tentativa <= this.maxRetries) {
          const waitMs = 500 * Math.pow(2, tentativa);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }
        throw err;
      }
    }

    throw new RateLimitError('Tentativas esgotadas ao conectar com o motor Groq.');
  }

  /**
   * Método Integrador Completo:
   * Recebe os parâmetros curriculares do Laboratório, monta o System Prompt oculto,
   * dispara a inferência na LPU Groq, valida o gabarito e grava telemetria no banco.
   * 
   * @param {Object} parametrosCurriculares - { areaMatematica, nivel, quantidade, cursoTecnico, metodologia, ferramenta }
   * @param {Object} [opcoesDocente] - { usuarioId, gravarBanco }
   */
  async gerarAtividadeCurricular(parametrosCurriculares, opcoesDocente = {}) {
    // 1. Montagem do prompt server-side estruturado em JSON estrito
    const promptMontado = promptInjectionService.montarPrompt(parametrosCurriculares);

    const { groqPayload, curriculoInjetado } = promptMontado;

    // 2. Execução da inferência na LPU da Groq com temperatura para cálculo preciso
    const resultadoGroq = await this.completarChat({
      messages: groqPayload.messages,
      model: this.primaryModel,
      temperature: this.defaultTemperature, // 0.2
      max_tokens: this.defaultMaxTokens,
      response_format: groqPayload.response_format,
    });

    const conteudoJson = resultadoGroq.conteudoJson;

    // 3. Garantia do Alerta Ético Obrigatório (ADR-002) no retorno
    if (!conteudoJson.alertaEticoObrigatorio) {
      conteudoJson.alertaEticoObrigatorio = ALERTA_ETICO_PADRAO;
    }

    // 4. Registro de Telemetria no Banco de Dados (Totalmente Assíncrono - Zero Sobrecarga)
    let registroPersistido = null;
    if (opcoesDocente.gravarBanco !== false) {
      try {
        registroPersistido = telemetryAsyncService.registrarGeracaoAssincrona({
          usuarioId: opcoesDocente.usuarioId || null,
          ferramenta: parametrosCurriculares.ferramenta || 'exercicios',
          parametrosEntrada: parametrosCurriculares,
          conteudoGerado: conteudoJson,
          formatoSaida: { tipo: 'json_estrito', schema: 'draft-07' },
          habilidadesBncc: curriculoInjetado.habilidadesBNCC || [],
          avisoEticoInjetado: true,
          telemetria: {
            motorIa: 'groq',
            modeloEspecifico: resultadoGroq.modelo,
            latenciaMs: resultadoGroq.latenciaMs,
            tokensPrompt: resultadoGroq.usage.prompt_tokens,
            tokensCompletion: resultadoGroq.usage.completion_tokens,
            totalTokens: resultadoGroq.usage.total_tokens,
            statusExecucao: 'sucesso',
            fallbackUtilizado: resultadoGroq.fallbackUtilizado,
            grupoExperimental: opcoesDocente.alocacaoAB?.grupo || 'A',
            chaveAlocacao: opcoesDocente.alocacaoAB?.chaveAlocacao || null,
            criterioAlocacao: opcoesDocente.alocacaoAB?.criterioAlocacao || 'padrao_groq',
            experimentoAtivo: opcoesDocente.alocacaoAB?.experimentoAtivo !== undefined ? opcoesDocente.alocacaoAB.experimentoAtivo : true,
          },
        });
      } catch (queueErr) {
        console.error('[GroqService] Advertência ao enfileirar telemetria assíncrona:', queueErr.message);
      }
    }

    // 5. Retorno estruturado pós-processado (Sanitização, LaTeX KaTeX e Banner Ético Compulsório)
    return aiPostProcessor.processar({
      sucesso: true,
      motor: 'groq',
      modeloUtilizado: resultadoGroq.modelo,
      fallbackUtilizado: resultadoGroq.fallbackUtilizado,
      latenciaMs: resultadoGroq.latenciaMs,
      atendeCriterioSub2Segundos: resultadoGroq.atendeCriterioSub2Segundos,
      velocidadeLpu: {
        tempoRespostaSegundos: (resultadoGroq.latenciaMs / 1000).toFixed(2),
        tokensConsumidos: resultadoGroq.usage.total_tokens || 0,
        tokensPorSegundo:
          resultadoGroq.latenciaMs > 0 && resultadoGroq.usage.completion_tokens
            ? Math.round(
                (resultadoGroq.usage.completion_tokens / resultadoGroq.latenciaMs) * 1000
              )
            : 0,
      },
      curriculoInjetado,
      atividade: conteudoJson,
      alertaEtico: conteudoJson.alertaEticoObrigatorio,
      alocacaoAB: opcoesDocente.alocacaoAB || null,
      telemetriaId: registroPersistido?.telemetriaId || null,
      requisicaoId: registroPersistido?.requisicaoId || promptMontado.promptId,
      rateLimits: resultadoGroq.rateLimits,
    });
  }

  /**
   * Benchmark de latência e saúde da LPU Groq
   */
  async benchmarkLpu() {
    const tInicio = performance.now();
    const resultado = await this.completarChat({
      messages: [
        {
          role: 'system',
          content: 'Você é um validador de infraestrutura de LPU da Groq. Retorne sempre um objeto JSON válido.',
        },
        {
          role: 'user',
          content: 'Retorne exatamente o objeto JSON: {"diagnostico": "lpu_operacional"}',
        },
      ],
      max_tokens: 1024,
      temperature: 0.2,
    });
    const tFim = performance.now();
    const latenciaTotalMs = Math.round(tFim - tInicio);

    return {
      status: 'operacional',
      motor: 'groq',
      modelo: resultado.modelo,
      fallbackUtilizado: resultado.fallbackUtilizado,
      latenciaMs: latenciaTotalMs,
      atendeCriterioSub2Segundos: latenciaTotalMs < 2000,
      rateLimits: resultado.rateLimits,
      timestamp: new Date().toISOString(),
    };
  }
}

export const groqService = new GroqService();
export default groqService;

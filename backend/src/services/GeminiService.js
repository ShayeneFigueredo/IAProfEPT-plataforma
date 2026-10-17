import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import { promptInjectionService } from './PromptInjectionService.js';
import { laboratorioRepository } from '../repositories/LaboratorioRepository.js';
import { telemetryAsyncService } from './TelemetryAsyncService.js';
import { RateLimitError, AppError } from '../errors/AppError.js';
import { ALERTA_ETICO_PADRAO } from '../config/curricularMatrix.js';
import { aiPostProcessor } from './AIPostProcessor.js';

/**
 * Esquema JSON Estruturado para Atividades Interdisciplinares (Gemini)
 */
export const ESQUEMA_ATIVIDADE_INTERDISCIPLINAR = {
  type: 'object',
  required: [
    'tituloAtividade',
    'tipoAtividade',
    'eixoCNCT',
    'cursoTecnico',
    'areaMatematica',
    'nivelDificuldade',
    'habilidadesBNCC',
    'temaInterdisciplinar',
    'articulacaoCurricular',
    'situacaoProblemaAutentica',
    'etapasInvestigacao',
    'reflexaoCriticaEMC',
    'alertaEticoObrigatorio',
  ],
  properties: {
    tituloAtividade: { type: 'string' },
    tipoAtividade: { type: 'string', enum: ['interdisciplinar'] },
    eixoCNCT: { type: 'string' },
    cursoTecnico: { type: 'string' },
    areaMatematica: { type: 'string' },
    nivelDificuldade: { type: 'string' },
    habilidadesBNCC: {
      type: 'array',
      items: {
        type: 'object',
        required: ['codigo', 'descricao'],
        properties: {
          codigo: { type: 'string' },
          descricao: { type: 'string' },
          articulacaoEPT: { type: 'string' },
        },
      },
    },
    temaInterdisciplinar: { type: 'string' },
    articulacaoCurricular: {
      type: 'object',
      required: ['conceitoMatematico', 'aplicacaoMundoTrabalho', 'componentesTecnicosIntegrados'],
      properties: {
        conceitoMatematico: { type: 'string' },
        aplicacaoMundoTrabalho: { type: 'string' },
        componentesTecnicosIntegrados: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
    situacaoProblemaAutentica: {
      type: 'object',
      required: ['cenario', 'dadosTecnicos', 'desafioProfissional'],
      properties: {
        cenario: { type: 'string' },
        dadosTecnicos: { type: 'object' },
        desafioProfissional: { type: 'string' },
      },
    },
    etapasInvestigacao: {
      type: 'array',
      items: {
        type: 'object',
        required: ['etapa', 'titulo', 'comando', 'etapasResolucao', 'gabaritoFinal'],
        properties: {
          etapa: { type: 'integer' },
          titulo: { type: 'string' },
          comando: { type: 'string' },
          etapasResolucao: {
            type: 'array',
            items: { type: 'string' },
          },
          gabaritoFinal: { type: 'string' },
          interpretacaoTecnica: { type: 'string' },
        },
      },
    },
    reflexaoCriticaEMC: {
      type: 'object',
      required: ['dimensaoEticaOuSocial', 'provocacaoDocente'],
      properties: {
        dimensaoEticaOuSocial: { type: 'string' },
        provocacaoDocente: { type: 'string' },
      },
    },
    alertaEticoObrigatorio: { type: 'string' },
  },
};

/**
 * Esquema JSON Estruturado para Planejamento de Aulas Ativas (Gemini)
 */
export const ESQUEMA_PLANO_AULA = {
  type: 'object',
  required: [
    'tituloPlano',
    'tipoAtividade',
    'areaMatematica',
    'cursoTecnico',
    'metodologiaAtiva',
    'duracaoTotalMinutos',
    'objetivosAprendizagem',
    'recursosDidaticosETecnologicos',
    'momentosDaAula',
    'avaliacaoFormativa',
    'reflexaoCriticaEMC',
    'alertaEticoObrigatorio',
  ],
  properties: {
    tituloPlano: { type: 'string' },
    tipoAtividade: { type: 'string', enum: ['plano'] },
    areaMatematica: { type: 'string' },
    cursoTecnico: { type: 'string' },
    metodologiaAtiva: { type: 'string' },
    duracaoTotalMinutos: { type: 'integer' },
    objetivosAprendizagem: {
      type: 'array',
      items: {
        type: 'object',
        required: ['objetivo', 'habilidadeBNCC'],
        properties: {
          objetivo: { type: 'string' },
          habilidadeBNCC: { type: 'string' },
        },
      },
    },
    recursosDidaticosETecnologicos: {
      type: 'array',
      items: { type: 'string' },
    },
    momentosDaAula: {
      type: 'array',
      items: {
        type: 'object',
        required: ['momento', 'tempoMinutos', 'descricaoAtividade', 'papelDoDocente', 'papelDoEstudante'],
        properties: {
          momento: { type: 'string' },
          tempoMinutos: { type: 'integer' },
          descricaoAtividade: { type: 'string' },
          papelDoDocente: { type: 'string' },
          papelDoEstudante: { type: 'string' },
        },
      },
    },
    avaliacaoFormativa: {
      type: 'object',
      required: ['criteriosSucesso', 'instrumento', 'feedbackDevolutivo'],
      properties: {
        criteriosSucesso: { type: 'string' },
        instrumento: { type: 'string' },
        feedbackDevolutivo: { type: 'string' },
      },
    },
    reflexaoCriticaEMC: {
      type: 'object',
      required: ['problematizacaoSocial', 'conexaoComCidadania'],
      properties: {
        problematizacaoSocial: { type: 'string' },
        conexaoComCidadania: { type: 'string' },
      },
    },
    alertaEticoObrigatorio: { type: 'string' },
  },
};

/**
 * Esquema JSON Estruturado para Roteiros de Podcasts Educacionais (Gemini)
 */
export const ESQUEMA_ROTEIRO_PODCAST = {
  type: 'object',
  required: [
    'tituloAtividade',
    'tituloEpisodio',
    'tipoAtividade',
    'areaMatematica',
    'cursoTecnico',
    'eixoCNCT',
    'duracaoEstimadaMinutos',
    'habilidadesBNCC',
    'sinopseEpisodio',
    'personagens',
    'blocosRoteiro',
    'desafioOuvinteComGabarito',
    'reflexaoCriticaEMC',
    'alertaEticoObrigatorio',
  ],
  properties: {
    tituloAtividade: { type: 'string' },
    tituloEpisodio: { type: 'string' },
    tipoAtividade: { type: 'string', enum: ['podcast'] },
    areaMatematica: { type: 'string' },
    cursoTecnico: { type: 'string' },
    eixoCNCT: { type: 'string' },
    duracaoEstimadaMinutos: { type: 'integer' },
    habilidadesBNCC: {
      type: 'array',
      items: {
        type: 'object',
        required: ['codigo', 'descricao'],
        properties: {
          codigo: { type: 'string' },
          descricao: { type: 'string' },
          articulacaoEPT: { type: 'string' },
        },
      },
    },
    sinopseEpisodio: { type: 'string' },
    personagens: {
      type: 'array',
      items: {
        type: 'object',
        required: ['nome', 'papel'],
        properties: {
          nome: { type: 'string' },
          papel: { type: 'string' },
        },
      },
    },
    blocosRoteiro: {
      type: 'array',
      items: {
        type: 'object',
        required: ['bloco', 'titulo', 'dialogos'],
        properties: {
          bloco: { type: 'integer' },
          titulo: { type: 'string' },
          indicacaoAudioOuSFX: { type: 'string' },
          dialogos: {
            type: 'array',
            items: {
              type: 'object',
              required: ['locutor', 'fala', 'entonacao'],
              properties: {
                locutor: { type: 'string' },
                fala: { type: 'string' },
                entonacao: { type: 'string' },
              },
            },
          },
        },
      },
    },
    desafioOuvinteComGabarito: {
      type: 'object',
      required: ['enunciadoDesafio', 'etapasResolucao', 'respostaFinalGabarito'],
      properties: {
        enunciadoDesafio: { type: 'string' },
        etapasResolucao: {
          type: 'array',
          items: { type: 'string' },
        },
        respostaFinalGabarito: { type: 'string' },
        explicacaoPedagogica: { type: 'string' },
      },
    },
    reflexaoCriticaEMC: {
      type: 'object',
      required: ['impactoSocioEconomico', 'provocacaoFinal'],
      properties: {
        impactoSocioEconomico: { type: 'string' },
        provocacaoFinal: { type: 'string' },
      },
    },
    alertaEticoObrigatorio: { type: 'string' },
  },
};

/**
 * Cliente de Integração com a API do Google Gemini SDK (Gemini 1.5 Flash / Pro)
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Atende aos requisitos:
 * 1. Integração com SDK oficial @google/generative-ai.
 * 2. Suporte a gemini-1.5-flash e gemini-1.5-pro com fallback em cadeia resiliente.
 * 3. Parametrização de Safety Settings (conteúdo nocivo, assédio, ódio, sexual, perigoso).
 * 4. Parametrização de temperatura baixa e esquemas de geração JSON estruturado (interdisciplinar e planos de aula).
 * 5. Registro automático de telemetria A/B no PostgreSQL (Experimento Científico da Tese de Maycon Magalhães).
 */
export class GeminiService {
  constructor() {
    this.primaryModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    this.proModel = process.env.GEMINI_MODEL_PRO || 'gemini-1.5-pro';
    this.defaultTemperature = parseFloat(process.env.GEMINI_TEMPERATURE) || 0.3;
    this.defaultMaxTokens = parseInt(process.env.GEMINI_MAX_TOKENS, 10) || 8192;
    this.activeModel = null;
    this.maxRetries = 3;

    // Cadeia de resolução de modelos para alta disponibilidade
    this.modelChains = {
      flash: [
        this.primaryModel,
        'gemini-3-flash-preview',
        'gemini-3.6-flash',
        'gemini-3.5-flash',
        'gemini-3.5-flash-lite',
        'gemini-3.8-flash',
        'gemini-flash-latest',
      ],
      pro: [
        this.proModel,
        'gemini-3.1-pro-preview',
        'gemini-3-flash-preview',
        'gemini-3.6-flash',
        'gemini-3.5-flash',
      ],
    };
  }

  getApiKey() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new AppError(
        'Configuração do Google Gemini Ausente',
        500,
        'A variável de ambiente GEMINI_API_KEY não foi configurada no servidor.'
      );
    }
    return key;
  }

  getGenAI() {
    return new GoogleGenerativeAI(this.getApiKey());
  }

  /**
   * Configuração das Categorias de Segurança (Safety Settings)
   * Parametrização padrão institucional da UFJF
   */
  obterSafetySettingsPadrao(customThresholds = {}) {
    return [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold:
          customThresholds.harassment || HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold:
          customThresholds.hateSpeech || HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold:
          customThresholds.sexual || HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold:
          customThresholds.dangerous || HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];
  }

  /**
   * Executa a chamada no modelo Gemini com tratamento de 503 (alta demanda),
   * 429 (quota) e chaveamento transparente de modelos.
   */
  async executarComResiliencia({
    modeloAlvo,
    systemInstruction,
    prompt,
    temperature = this.defaultTemperature,
    maxOutputTokens = this.defaultMaxTokens,
    safetySettings = this.obterSafetySettingsPadrao(),
    tipoModelo = 'flash',
  }) {
    const genAI = this.getGenAI();
    const cadeia = this.modelChains[tipoModelo] || this.modelChains.flash;

    // Se já encontramos um modelo ativo na sessão, posicionamos ele em primeiro
    const modelosParaTentar = this.activeModel
      ? [this.activeModel, ...cadeia.filter((m) => m !== this.activeModel)]
      : cadeia;

    let ultimoErro = null;
    let fallbackUtilizado = false;

    for (const modelo of modelosParaTentar) {
      if (modelo !== this.primaryModel && modelo !== this.proModel) {
        fallbackUtilizado = true;
      }

      for (let tentativa = 1; tentativa <= this.maxRetries; tentativa++) {
        const tInicio = performance.now();

        try {
          const modelInstance = genAI.getGenerativeModel({
            model: modelo,
            systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
            safetySettings,
            generationConfig: {
              temperature: Math.max(0.0, Math.min(1.0, temperature)),
              responseMimeType: 'application/json',
              maxOutputTokens,
            },
          });

          const result = await modelInstance.generateContent(prompt);
          const tFim = performance.now();
          const latenciaMs = Math.round(tFim - tInicio);

          const responseText = result.response.text();
          let jsonParsed = null;

          try {
            jsonParsed = JSON.parse(responseText);
          } catch (e) {
            // Caso contenha blocos markdown ```json ... ```
            const match = responseText.match(/```json([\s\S]*?)```/);
            if (match) {
              jsonParsed = JSON.parse(match[1].trim());
            } else {
              jsonParsed = { texto: responseText };
            }
          }

          // Caching do modelo ativo que funcionou com sucesso
          this.activeModel = modelo;

          const usage = result.response.usageMetadata || {};

          return {
            sucesso: true,
            motor: 'gemini',
            modeloUtilizado: modelo,
            fallbackUtilizado,
            latenciaMs,
            conteudoJson: jsonParsed,
            conteudoRaw: responseText,
            usage: {
              promptTokens: usage.promptTokenCount || 0,
              completionTokens: usage.candidatesTokenCount || 0,
              totalTokens: usage.totalTokenCount || 0,
            },
            candidates: result.response.candidates || [],
          };
        } catch (err) {
          ultimoErro = err;
          const status = err.status || (err.message && err.message.includes('503') ? 503 : null);
          const isQuotaZero = err.message && (err.message.includes('limit: 0') || err.message.includes('limit 0'));
          const is404 = status === 404 || (err.message && err.message.includes('404'));

          // Se for 404 (modelo depreciado) ou quota zerada no projeto, pula imediatamente para o próximo modelo da cadeia
          if (is404 || isQuotaZero) {
            console.warn(
              `[GeminiService] Modelo ${modelo} indisponível (${is404 ? '404 Não Encontrado' : 'Quota 0'}). Alternando na cadeia de resiliência...`
            );
            break;
          }

          // Trata status 503 (High demand) ou 429 com backoff e failover ágil
          if (status === 503 || status === 429) {
            console.warn(
              `[GeminiService] Status ${status} em ${modelo} (tentativa ${tentativa}/${this.maxRetries}). Aplicando backoff...`
            );
            if (tentativa < 2) {
              const waitMs = 800 * Math.pow(2, tentativa) + Math.random() * 300;
              await new Promise((resolve) => setTimeout(resolve, waitMs));
              continue;
            } else {
              break; // Alterna para o próximo modelo da cadeia
            }
          }

          // Se for outro erro grave e não restarem tentativas, tenta próximo modelo
          if (tentativa >= this.maxRetries) {
            break;
          }
        }
      }
    }

    if (ultimoErro?.status === 429) {
      throw new RateLimitError(
        'Limite de requisições ou quotas da API Google Gemini atingido (429).'
      );
    }

    throw new AppError(
      'Falha na Incerência do Google Gemini',
      ultimoErro?.status || 502,
      ultimoErro?.message || 'Não foi possível obter resposta válida do serviço Google Gemini.'
    );
  }

  /**
   * Gera uma Atividade Interdisciplinar contextualizada (Eixo CNCT x Matemática x EPT)
   * 
   * @param {Object} parametros - { areaMatematica, nivel, quantidade, cursoTecnico, metodologia }
   * @param {Object} [opcoes] - { usuarioId, modelo, temperature, gravarBanco }
   */
  async gerarAtividadeInterdisciplinar(parametros, opcoes = {}) {
    const promptMontado = promptInjectionService.montarPrompt({
      ...parametros,
      ferramenta: 'interdisciplinar',
    });

    const { systemInstruction, userPrompt, curriculoInjetado } = promptMontado;

    // Instrução adicional de ancoragem interdisciplinar
    const systemPromptComEsquema = `${systemInstruction}

[ESQUEMA ESPECÍFICO DE ATIVIDADE INTERDISCIPLINAR]
A resposta DEVE retornar no seguinte formato JSON estrito:
{
  "tituloAtividade": "string",
  "tipoAtividade": "interdisciplinar",
  "eixoCNCT": "${curriculoInjetado.eixoCNCT}",
  "cursoTecnico": "${curriculoInjetado.cursoTecnico}",
  "areaMatematica": "${curriculoInjetado.areaMatematica}",
  "nivelDificuldade": "${curriculoInjetado.nivelDificuldade}",
  "habilidadesBNCC": [
    { "codigo": "string", "descricao": "string", "articulacaoEPT": "string" }
  ],
  "temaInterdisciplinar": "string",
  "articulacaoCurricular": {
    "conceitoMatematico": "string",
    "aplicacaoMundoTrabalho": "string",
    "componentesTecnicosIntegrados": ["string"]
  },
  "situacaoProblemaAutentica": {
    "cenario": "string",
    "dadosTecnicos": {},
    "desafioProfissional": "string"
  },
  "etapasInvestigacao": [
    {
      "etapa": 1,
      "titulo": "string",
      "comando": "string",
      "etapasResolucao": ["string"],
      "gabaritoFinal": "string",
      "interpretacaoTecnica": "string"
    }
  ],
  "reflexaoCriticaEMC": {
    "dimensaoEticaOuSocial": "string",
    "provocacaoDocente": "string"
  },
  "alertaEticoObrigatorio": "${ALERTA_ETICO_PADRAO}"
}`;

    const resultadoGemini = await this.executarComResiliencia({
      modeloAlvo: opcoes.modelo || this.primaryModel,
      systemInstruction: systemPromptComEsquema,
      prompt: userPrompt,
      temperature: opcoes.temperature || this.defaultTemperature,
      maxOutputTokens: this.defaultMaxTokens,
      tipoModelo: 'flash',
    });

    const conteudoJson = resultadoGemini.conteudoJson;
    conteudoJson.alertaEticoObrigatorio = ALERTA_ETICO_PADRAO;

    // Persistência no PostgreSQL
    let registroPersistido = null;
    if (opcoes.gravarBanco !== false) {
      try {
        registroPersistido = telemetryAsyncService.registrarGeracaoAssincrona({
          usuarioId: opcoes.usuarioId || null,
          ferramenta: 'interdisciplinar',
          parametrosEntrada: parametros,
          conteudoGerado: conteudoJson,
          formatoSaida: { tipo: 'json_estrito', ferramenta: 'interdisciplinar' },
          habilidadesBncc: curriculoInjetado.habilidadesBNCC || [],
          avisoEticoInjetado: true,
          telemetria: {
            motorIa: 'gemini',
            modeloEspecifico: resultadoGemini.modeloUtilizado,
            latenciaMs: resultadoGemini.latenciaMs,
            tokensPrompt: resultadoGemini.usage.promptTokens,
            tokensCompletion: resultadoGemini.usage.completionTokens,
            totalTokens: resultadoGemini.usage.totalTokens,
            statusExecucao: 'sucesso',
            fallbackUtilizado: resultadoGemini.fallbackUtilizado,
            grupoExperimental: opcoes.alocacaoAB?.grupo || 'B',
            chaveAlocacao: opcoes.alocacaoAB?.chaveAlocacao || null,
            criterioAlocacao: opcoes.alocacaoAB?.criterioAlocacao || 'padrao_gemini',
            experimentoAtivo: opcoes.alocacaoAB?.experimentoAtivo !== undefined ? opcoes.alocacaoAB.experimentoAtivo : true,
          },
        });
      } catch (err) {
        console.error('[GeminiService] Advertência ao enfileirar telemetria assíncrona:', err.message);
      }
    }

    return aiPostProcessor.processar({
      sucesso: true,
      motor: 'gemini',
      modeloUtilizado: resultadoGemini.modeloUtilizado,
      fallbackUtilizado: resultadoGemini.fallbackUtilizado,
      latenciaMs: resultadoGemini.latenciaMs,
      atividade: conteudoJson,
      curriculoInjetado,
      alertaEtico: conteudoJson.alertaEticoObrigatorio,
      alocacaoAB: opcoes.alocacaoAB || null,
      telemetriaId: registroPersistido?.telemetriaId || null,
      requisicaoId: registroPersistido?.requisicaoId || promptMontado.promptId,
      usage: resultadoGemini.usage,
    });
  }

  /**
   * Gera um Planejamento de Aula Ativa estruturado (PBL, Sala Invertida, Projetos)
   * 
   * @param {Object} parametros - { areaMatematica, nivel, quantidade, cursoTecnico, metodologia }
   * @param {Object} [opcoes] - { usuarioId, modelo, temperature, gravarBanco }
   */
  async gerarPlanoAula(parametros, opcoes = {}) {
    const promptMontado = promptInjectionService.montarPrompt({
      ...parametros,
      ferramenta: 'plano',
    });

    const { systemInstruction, userPrompt, curriculoInjetado } = promptMontado;

    const systemPromptComEsquema = `${systemInstruction}

[ESQUEMA ESPECÍFICO DE PLANO DE AULA ATIVA]
A resposta DEVE retornar no seguinte formato JSON estrito:
{
  "tituloPlano": "string",
  "tipoAtividade": "plano",
  "areaMatematica": "${curriculoInjetado.areaMatematica}",
  "cursoTecnico": "${curriculoInjetado.cursoTecnico}",
  "metodologiaAtiva": "${curriculoInjetado.metodologia.nome}",
  "duracaoTotalMinutos": 100,
  "objetivosAprendizagem": [
    { "objetivo": "string", "habilidadeBNCC": "string" }
  ],
  "recursosDidaticosETecnologicos": ["string"],
  "momentosDaAula": [
    {
      "momento": "1. Acolhimento e Provocação Inicial",
      "tempoMinutos": 20,
      "descricaoAtividade": "string",
      "papelDoDocente": "string",
      "papelDoEstudante": "string"
    },
    {
      "momento": "2. Investigação e Modelagem em Grupos",
      "tempoMinutos": 50,
      "descricaoAtividade": "string",
      "papelDoDocente": "string",
      "papelDoEstudante": "string"
    },
    {
      "momento": "3. Sistematização e Reflexão Crítica",
      "tempoMinutos": 30,
      "descricaoAtividade": "string",
      "papelDoDocente": "string",
      "papelDoEstudante": "string"
    }
  ],
  "avaliacaoFormativa": {
    "criteriosSucesso": "string",
    "instrumento": "string",
    "feedbackDevolutivo": "string"
  },
  "reflexaoCriticaEMC": {
    "problematizacaoSocial": "string",
    "conexaoComCidadania": "string"
  },
  "alertaEticoObrigatorio": "${ALERTA_ETICO_PADRAO}"
}`;

    // Planos de aula podem utilizar o modelo Pro para raciocínio instrucional mais profundo
    const modeloSelecionado = opcoes.modelo || (opcoes.usarPro ? this.proModel : this.primaryModel);

    const resultadoGemini = await this.executarComResiliencia({
      modeloAlvo: modeloSelecionado,
      systemInstruction: systemPromptComEsquema,
      prompt: userPrompt,
      temperature: opcoes.temperature || this.defaultTemperature,
      maxOutputTokens: this.defaultMaxTokens,
      tipoModelo: opcoes.usarPro ? 'pro' : 'flash',
    });

    const conteudoJson = resultadoGemini.conteudoJson;
    conteudoJson.alertaEticoObrigatorio = ALERTA_ETICO_PADRAO;

    let registroPersistido = null;
    if (opcoes.gravarBanco !== false) {
      try {
        registroPersistido = telemetryAsyncService.registrarGeracaoAssincrona({
          usuarioId: opcoes.usuarioId || null,
          ferramenta: 'plano',
          parametrosEntrada: parametros,
          conteudoGerado: conteudoJson,
          formatoSaida: { tipo: 'json_estrito', ferramenta: 'plano' },
          habilidadesBncc: curriculoInjetado.habilidadesBNCC || [],
          avisoEticoInjetado: true,
          telemetria: {
            motorIa: 'gemini',
            modeloEspecifico: resultadoGemini.modeloUtilizado,
            latenciaMs: resultadoGemini.latenciaMs,
            tokensPrompt: resultadoGemini.usage.promptTokens,
            tokensCompletion: resultadoGemini.usage.completionTokens,
            totalTokens: resultadoGemini.usage.totalTokens,
            statusExecucao: 'sucesso',
            fallbackUtilizado: resultadoGemini.fallbackUtilizado,
            grupoExperimental: opcoes.alocacaoAB?.grupo || 'B',
            chaveAlocacao: opcoes.alocacaoAB?.chaveAlocacao || null,
            criterioAlocacao: opcoes.alocacaoAB?.criterioAlocacao || 'padrao_gemini',
            experimentoAtivo: opcoes.alocacaoAB?.experimentoAtivo !== undefined ? opcoes.alocacaoAB.experimentoAtivo : true,
          },
        });
      } catch (err) {
        console.error('[GeminiService] Advertência ao enfileirar telemetria assíncrona:', err.message);
      }
    }

    return aiPostProcessor.processar({
      sucesso: true,
      motor: 'gemini',
      modeloUtilizado: resultadoGemini.modeloUtilizado,
      fallbackUtilizado: resultadoGemini.fallbackUtilizado,
      latenciaMs: resultadoGemini.latenciaMs,
      atividade: conteudoJson,
      plano: conteudoJson,
      curriculoInjetado,
      alertaEtico: conteudoJson.alertaEticoObrigatorio,
      alocacaoAB: opcoes.alocacaoAB || null,
      telemetriaId: registroPersistido?.telemetriaId || null,
      requisicaoId: registroPersistido?.requisicaoId || promptMontado.promptId,
      usage: resultadoGemini.usage,
    });
  }

  /**
   * Gera um Roteiro de Podcast Pedagógico estruturado (diálogos, SFX, desafio e gabarito)
   * 
   * @param {Object} parametros - { areaMatematica, nivel, quantidade, cursoTecnico, metodologia }
   * @param {Object} [opcoes] - { usuarioId, modelo, temperature, gravarBanco }
   */
  async gerarRoteiroPodcast(parametros, opcoes = {}) {
    const promptMontado = promptInjectionService.montarPrompt({
      ...parametros,
      ferramenta: 'podcast',
    });

    const { systemInstruction, userPrompt, curriculoInjetado } = promptMontado;

    const resultadoGemini = await this.executarComResiliencia({
      modeloAlvo: opcoes.modelo || this.primaryModel,
      systemInstruction,
      prompt: userPrompt,
      temperature: opcoes.temperature || this.defaultTemperature,
      maxOutputTokens: this.defaultMaxTokens,
      tipoModelo: 'flash',
    });

    const conteudoJson = resultadoGemini.conteudoJson;
    conteudoJson.alertaEticoObrigatorio = ALERTA_ETICO_PADRAO;

    // Persistência no PostgreSQL
    let registroPersistido = null;
    if (opcoes.gravarBanco !== false) {
      try {
        registroPersistido = telemetryAsyncService.registrarGeracaoAssincrona({
          usuarioId: opcoes.usuarioId || null,
          ferramenta: 'podcast',
          parametrosEntrada: parametros,
          conteudoGerado: conteudoJson,
          formatoSaida: { tipo: 'json_estrito', ferramenta: 'podcast' },
          habilidadesBncc: curriculoInjetado.habilidadesBNCC || [],
          avisoEticoInjetado: true,
          telemetria: {
            motorIa: 'gemini',
            modeloEspecifico: resultadoGemini.modeloUtilizado,
            latenciaMs: resultadoGemini.latenciaMs,
            tokensPrompt: resultadoGemini.usage.promptTokens,
            tokensCompletion: resultadoGemini.usage.completionTokens,
            totalTokens: resultadoGemini.usage.totalTokens,
            statusExecucao: 'sucesso',
            fallbackUtilizado: resultadoGemini.fallbackUtilizado,
            grupoExperimental: opcoes.alocacaoAB?.grupo || 'B',
            chaveAlocacao: opcoes.alocacaoAB?.chaveAlocacao || null,
            criterioAlocacao: opcoes.alocacaoAB?.criterioAlocacao || 'padrao_gemini',
            experimentoAtivo: opcoes.alocacaoAB?.experimentoAtivo !== undefined ? opcoes.alocacaoAB.experimentoAtivo : true,
          },
        });
      } catch (err) {
        console.error('[GeminiService] Advertência ao enfileirar telemetria assíncrona:', err.message);
      }
    }

    return aiPostProcessor.processar({
      sucesso: true,
      motor: 'gemini',
      modeloUtilizado: resultadoGemini.modeloUtilizado,
      fallbackUtilizado: resultadoGemini.fallbackUtilizado,
      latenciaMs: resultadoGemini.latenciaMs,
      atividade: conteudoJson,
      podcast: conteudoJson,
      curriculoInjetado,
      alertaEtico: conteudoJson.alertaEticoObrigatorio,
      alocacaoAB: opcoes.alocacaoAB || null,
      telemetriaId: registroPersistido?.telemetriaId || null,
      requisicaoId: registroPersistido?.requisicaoId || promptMontado.promptId,
      usage: resultadoGemini.usage,
    });
  }

  /**
   * Método Unificado do Laboratório: Gera qualquer modalidade (exercícios, interdisciplinar, plano, podcast)
   */
  async gerarAtividadeCurricular(parametros, opcoes = {}) {
    const ferramenta = parametros.ferramenta || 'exercicios';

    if (ferramenta === 'interdisciplinar') {
      return this.gerarAtividadeInterdisciplinar(parametros, opcoes);
    }

    if (ferramenta === 'plano') {
      return this.gerarPlanoAula(parametros, opcoes);
    }

    if (ferramenta === 'podcast') {
      return this.gerarRoteiroPodcast(parametros, opcoes);
    }

    // Default: exercícios & avaliações
    const promptMontado = promptInjectionService.montarPrompt(parametros);
    const { systemInstruction, userPrompt, curriculoInjetado } = promptMontado;

    const resultadoGemini = await this.executarComResiliencia({
      modeloAlvo: opcoes.modelo || this.primaryModel,
      systemInstruction,
      prompt: userPrompt,
      temperature: opcoes.temperature || this.defaultTemperature,
      maxOutputTokens: this.defaultMaxTokens,
      tipoModelo: 'flash',
    });

    const conteudoJson = resultadoGemini.conteudoJson;
    conteudoJson.alertaEticoObrigatorio = ALERTA_ETICO_PADRAO;

    let registroPersistido = null;
    if (opcoes.gravarBanco !== false) {
      try {
        registroPersistido = telemetryAsyncService.registrarGeracaoAssincrona({
          usuarioId: opcoes.usuarioId || null,
          ferramenta,
          parametrosEntrada: parametros,
          conteudoGerado: conteudoJson,
          formatoSaida: { tipo: 'json_estrito', ferramenta },
          habilidadesBncc: curriculoInjetado.habilidadesBNCC || [],
          avisoEticoInjetado: true,
          telemetria: {
            motorIa: 'gemini',
            modeloEspecifico: resultadoGemini.modeloUtilizado,
            latenciaMs: resultadoGemini.latenciaMs,
            tokensPrompt: resultadoGemini.usage.promptTokens,
            tokensCompletion: resultadoGemini.usage.completionTokens,
            totalTokens: resultadoGemini.usage.totalTokens,
            statusExecucao: 'sucesso',
            fallbackUtilizado: resultadoGemini.fallbackUtilizado,
            grupoExperimental: opcoes.alocacaoAB?.grupo || 'B',
            chaveAlocacao: opcoes.alocacaoAB?.chaveAlocacao || null,
            criterioAlocacao: opcoes.alocacaoAB?.criterioAlocacao || 'padrao_gemini',
            experimentoAtivo: opcoes.alocacaoAB?.experimentoAtivo !== undefined ? opcoes.alocacaoAB.experimentoAtivo : true,
          },
        });
      } catch (err) {
        console.error('[GeminiService] Advertência ao enfileirar telemetria assíncrona:', err.message);
      }
    }

    return aiPostProcessor.processar({
      sucesso: true,
      motor: 'gemini',
      modeloUtilizado: resultadoGemini.modeloUtilizado,
      fallbackUtilizado: resultadoGemini.fallbackUtilizado,
      latenciaMs: resultadoGemini.latenciaMs,
      atividade: conteudoJson,
      curriculoInjetado,
      alertaEtico: conteudoJson.alertaEticoObrigatorio,
      alocacaoAB: opcoes.alocacaoAB || null,
      telemetriaId: registroPersistido?.telemetriaId || null,
      requisicaoId: registroPersistido?.requisicaoId || promptMontado.promptId,
      usage: resultadoGemini.usage,
    });
  }

  /**
   * Benchmark de latência e saúde da API do Google Gemini
   */
  async benchmarkConexao() {
    const tInicio = performance.now();
    const resultado = await this.executarComResiliencia({
      prompt: 'Retorne exatamente o objeto JSON: {"status": "gemini_operacional"}',
      maxOutputTokens: 1024,
      temperature: 0.2,
    });
    const tFim = performance.now();
    const latenciaTotalMs = Math.round(tFim - tInicio);

    return {
      status: 'operacional',
      motor: 'gemini',
      modelo: resultado.modeloUtilizado,
      fallbackUtilizado: resultado.fallbackUtilizado,
      latenciaMs: latenciaTotalMs,
      usage: resultado.usage,
      timestamp: new Date().toISOString(),
    };
  }
}

export const geminiService = new GeminiService();
export default geminiService;

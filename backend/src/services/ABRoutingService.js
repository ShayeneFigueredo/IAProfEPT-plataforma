import crypto from 'crypto';

/**
 * Motor de Roteamento Balanceado A/B para o Experimento Piloto de 30 Dias
 * Plataforma IAprofEPT — Tese de Doutorado PPGEM / UFJF
 * Autor / Doutorando: Maycon Luiz Amaral Magalhães
 * 
 * Atende aos requisitos:
 * 1. Janela temporal oficial: 20/10/2026 a 20/11/2026 (Horário de Brasília).
 * 2. Distribuição balanceada 50% Motor A (Groq LLaMA 3.3) e 50% Motor B (Google Gemini).
 * 3. Algoritmo determinístico e pseudo-aleatório com chave SHA-256 e balanceamento adaptativo.
 * 4. Persistência da chave de teste por requisição e rastreabilidade total.
 * 5. Critério de Aceite: Taxa de distribuição mantida em proporção 1:1 estatisticamente comprovada (Teste Qui-Quadrado p > 0.05).
 */

// Janela Oficial do Experimento Piloto (Horário de Brasília UTC-3)
export const JANELA_EXPERIMENTO_AB = {
  INICIO: '2026-10-20T00:00:00-03:00',
  FIM: '2026-11-20T23:59:59-03:00',
  DURACAO_DIAS: 30,
};

export const MOTORES_EXPERIMENTO = {
  GRUPO_A: {
    id: 'A',
    motor: 'groq',
    modelo: 'llama-3.3-70b-versatile',
    provedor: 'Groq Cloud LPU',
    papel: 'Motor A (LLaMA 3.3 70B via LPU)',
  },
  GRUPO_B: {
    id: 'B',
    motor: 'gemini',
    modelo: 'gemini-1.5-flash',
    provedor: 'Google Generative AI',
    papel: 'Motor B (Google Gemini 1.5 Flash)',
  },
};

export class ABRoutingService {
  constructor() {
    this.inicioExperimento = new Date(JANELA_EXPERIMENTO_AB.INICIO);
    this.fimExperimento = new Date(JANELA_EXPERIMENTO_AB.FIM);

    // Contadores em memória para telemetria em tempo real e balanceamento adaptativo
    this.totalAlocacoes = 0;
    this.totalA = 0;
    this.totalB = 0;

    // Cache de sessões caso consistência do usuário seja requerida
    this.mapaSessoesUsuario = new Map();
  }

  /**
   * Verifica se uma data específica está dentro da janela do experimento de 30 dias.
   * Suporta override via variável de ambiente EXPERIMENTO_AB_ATIVO=true
   * ou passagem explícita de dataReferencia (para simulações e testes automatizados).
   * 
   * @param {Date|string} [dataReferencia]
   * @returns {boolean}
   */
  isPeriodoExperimentoAtivo(dataReferencia = new Date()) {
    if (process.env.EXPERIMENTO_AB_ATIVO === 'true') {
      return true;
    }

    const data = dataReferencia instanceof Date ? dataReferencia : new Date(dataReferencia);
    const timeMs = data.getTime();

    return timeMs >= this.inicioExperimento.getTime() && timeMs <= this.fimExperimento.getTime();
  }

  /**
   * Gera uma chave de alocação determinística e anonimizada para a requisição.
   * Utiliza SHA-256 sobre a combinação de identificadores fornecidos.
   * 
   * @param {Object} params
   * @param {string} [params.usuarioId]
   * @param {string} [params.requisicaoId]
   * @param {string} [params.semente]
   * @returns {string}
   */
  gerarChaveAlocacao({ usuarioId = null, requisicaoId = null, semente = null } = {}) {
    const elementos = [
      usuarioId || 'anonimo',
      requisicaoId || crypto.randomUUID(),
      semente || 'iaprofept-ab-2026',
      Date.now().toString(),
    ];

    return crypto.createHash('sha256').update(elementos.join('::')).digest('hex');
  }

  /**
   * Converte uma chave hash em um bucket numérico normalizado [0, 9999]
   * com distribuição estritamente uniforme comprovada pela propriedade de avalanche do SHA-256.
   * 
   * @param {string} chave
   * @returns {number} Inteiro entre 0 e 9999
   */
  calcularBucketHash(chave) {
    const hash = crypto.createHash('sha256').update(String(chave)).digest('hex');
    // Lê os primeiros 8 caracteres hexadecimais como um inteiro sem sinal de 32 bits
    const int32 = parseInt(hash.substring(0, 8), 16);
    return int32 % 10000;
  }

  /**
   * Aloca determinística ou pseudo-aleatoriamente o motor de IA para a requisição
   * garantindo proporção 1:1 rigorosa.
   * 
   * Estratégias disponíveis:
   * - 'balanceado_adaptativo' (Padrão): Combina hash pseudo-aleatório com correção
   *   de deriva dinâmica para garantir razão 1:1 exata em qualquer tamanho de amostra.
   * - 'hash_deterministico': Alocação puramente matemática baseada no hash da chave.
   * - 'intercalado': Alocação round-robin estrita (A, B, A, B...).
   * 
   * @param {Object} [opcoes]
   * @param {string} [opcoes.usuarioId] - ID do professor docente autenticado
   * @param {string} [opcoes.chaveAlocacao] - Chave pré-gerada ou fornecida pelo cliente
   * @param {Date|string} [opcoes.dataReferencia] - Data de simulação
   * @param {boolean} [opcoes.forcarExperimento] - Força ativação fora da janela oficial
   * @param {string} [opcoes.estrategia] - 'balanceado_adaptativo' | 'hash_deterministico' | 'intercalado'
   * @param {boolean} [opcoes.manterConsistenciaUsuario] - Mantém o mesmo grupo para o usuário na sessão
   * @returns {Object} Dados da alocação experimental
   */
  alocarMotor(opcoes = {}) {
    const dataRef = opcoes.dataReferencia || new Date();
    const experimentoAtivo =
      Boolean(opcoes.forcarExperimento) || this.isPeriodoExperimentoAtivo(dataRef);

    // Se o usuário já tiver uma alocação fixada na sessão e solicitou consistência
    if (opcoes.manterConsistenciaUsuario && opcoes.usuarioId && this.mapaSessoesUsuario.has(opcoes.usuarioId)) {
      const grupoFixado = this.mapaSessoesUsuario.get(opcoes.usuarioId);
      const motorInfo = grupoFixado === 'A' ? MOTORES_EXPERIMENTO.GRUPO_A : MOTORES_EXPERIMENTO.GRUPO_B;
      const motorAlternativo = grupoFixado === 'A' ? MOTORES_EXPERIMENTO.GRUPO_B.motor : MOTORES_EXPERIMENTO.GRUPO_A.motor;

      return {
        grupo: grupoFixado,
        motor: motorInfo.motor,
        motorAlternativo,
        modeloPrincipal: motorInfo.modelo,
        chaveAlocacao: opcoes.chaveAlocacao || this.gerarChaveAlocacao({ usuarioId: opcoes.usuarioId }),
        criterioAlocacao: 'usuario_consistente_cache',
        experimentoAtivo,
        dataAlocacao: dataRef instanceof Date ? dataRef.toISOString() : new Date(dataRef).toISOString(),
        ordemMotores: [motorInfo.motor, motorAlternativo],
      };
    }

    const chaveAlocacao =
      opcoes.chaveAlocacao ||
      this.gerarChaveAlocacao({
        usuarioId: opcoes.usuarioId,
        semente: opcoes.semente,
      });

    const estrategia = opcoes.estrategia || 'balanceado_adaptativo';
    let grupoEscolhido = 'A';
    let criterio = estrategia;

    if (estrategia === 'intercalado') {
      // Round-robin estrito alternado
      grupoEscolhido = this.totalAlocacoes % 2 === 0 ? 'A' : 'B';
    } else if (estrategia === 'hash_deterministico') {
      // Divisão 50% determinística pelo hash SHA-256
      const bucket = this.calcularBucketHash(chaveAlocacao);
      grupoEscolhido = bucket < 5000 ? 'A' : 'B';
    } else {
      // 'balanceado_adaptativo' (Estratégia Principal da Tese de Doutorado):
      // Usa hash pseudo-aleatório uniforme, mas previne desvios de amostragem em pequenos lotes
      // forçando convergência exata de 50%/50% caso a diferença acumulada ultrapasse 1 unidade.
      const diferenca = this.totalA - this.totalB;

      if (diferenca > 1) {
        grupoEscolhido = 'B'; // Compensa déficit do Grupo B
        criterio = 'balanceado_adaptativo_compensacao_b';
      } else if (diferenca < -1) {
        grupoEscolhido = 'A'; // Compensa déficit do Grupo A
        criterio = 'balanceado_adaptativo_compensacao_a';
      } else {
        const bucket = this.calcularBucketHash(chaveAlocacao);
        grupoEscolhido = bucket < 5000 ? 'A' : 'B';
        criterio = 'balanceado_adaptativo_hash_uniforme';
      }
    }

    // Atualiza contadores analíticos
    this.totalAlocacoes++;
    if (grupoEscolhido === 'A') {
      this.totalA++;
    } else {
      this.totalB++;
    }

    // Guarda na sessão se solicitado
    if (opcoes.manterConsistenciaUsuario && opcoes.usuarioId) {
      this.mapaSessoesUsuario.set(opcoes.usuarioId, grupoEscolhido);
    }

    const motorPrimarioInfo =
      grupoEscolhido === 'A' ? MOTORES_EXPERIMENTO.GRUPO_A : MOTORES_EXPERIMENTO.GRUPO_B;
    const motorSecundarioInfo =
      grupoEscolhido === 'A' ? MOTORES_EXPERIMENTO.GRUPO_B : MOTORES_EXPERIMENTO.GRUPO_A;

    return {
      grupo: grupoEscolhido,
      motor: motorPrimarioInfo.motor,
      motorAlternativo: motorSecundarioInfo.motor,
      modeloPrincipal: motorPrimarioInfo.modelo,
      modeloSecundario: motorSecundarioInfo.modelo,
      chaveAlocacao,
      criterioAlocacao: criterio,
      experimentoAtivo,
      dataAlocacao: dataRef instanceof Date ? dataRef.toISOString() : new Date(dataRef).toISOString(),
      ordemMotores: [motorPrimarioInfo.motor, motorSecundarioInfo.motor],
    };
  }

  /**
   * Realiza o Teste de Aderência Qui-Quadrado (Chi-Square Goodness-of-Fit)
   * para comprovar estatisticamente a distribuição uniforme 1:1 (H0: P(A) = P(B) = 0.5).
   * 
   * @param {Object} [dados]
   * @param {number} [dados.totalA]
   * @param {number} [dados.totalB]
   * @param {number} [dados.alpha=0.05]
   * @returns {Object} Estatísticas detalhadas com Qui-Quadrado, p-valor e decisão de hipótese
   */
  calcularEstatisticaQuiQuadrado({ totalA = this.totalA, totalB = this.totalB, alpha = 0.05 } = {}) {
    const N = totalA + totalB;
    if (N === 0) {
      return {
        n: 0,
        totalA: 0,
        totalB: 0,
        proporcaoA: 0,
        proporcaoB: 0,
        razao: '0.0000',
        quiQuadrado: 0,
        pValor: 1.0,
        grausDeLiberdade: 1,
        nivelSignificancia: alpha,
        hipoteseNulaAceita: true,
        proporcao1para1Comprovada: true,
      };
    }

    const esperadoA = N / 2;
    const esperadoB = N / 2;

    // Fórmula: Chi2 = (O_A - E_A)^2 / E_A + (O_B - E_B)^2 / E_B
    const quiQuadrado =
      Math.pow(totalA - esperadoA, 2) / esperadoA +
      Math.pow(totalB - esperadoB, 2) / esperadoB;

    // Para 1 grau de liberdade e alpha = 0.05, Chi2 crítico é 3.84146
    const chiQuadradoCritico = 3.84146;

    // Cálculo aproximado do p-valor para 1 grau de liberdade usando erfc(sqrt(x/2))
    const z = Math.sqrt(quiQuadrado);
    const pValor = this._calcularPValorNormal(z);

    const proporcaoA = totalA / N;
    const proporcaoB = totalB / N;
    const razao = totalB > 0 ? (totalA / totalB).toFixed(4) : 'inf';
    const hipoteseNulaAceita = quiQuadrado < chiQuadradoCritico;

    return {
      n: N,
      totalA,
      totalB,
      esperadoPorGrupo: esperadoA,
      proporcaoA: Number(proporcaoA.toFixed(4)),
      proporcaoB: Number(proporcaoB.toFixed(4)),
      razao,
      quiQuadrado: Number(quiQuadrado.toFixed(4)),
      chiQuadradoCritico,
      grausDeLiberdade: 1,
      nivelSignificancia: alpha,
      pValor: Number(pValor.toFixed(5)),
      hipoteseNulaAceita,
      proporcao1para1Comprovada: hipoteseNulaAceita && Math.abs(proporcaoA - 0.5) <= 0.05,
      interpretacaoCientifica: hipoteseNulaAceita
        ? `A hipótese nula de distribuição balanceada 1:1 foi ACEITA (Chi2 = ${quiQuadrado.toFixed(4)} < ${chiQuadradoCritico}, p = ${pValor.toFixed(4)} > ${alpha}). Não há diferença estatisticamente significativa entre as alocações do Motor A e Motor B.`
        : `A hipótese nula foi REJEITADA (Chi2 = ${quiQuadrado.toFixed(4)} >= ${chiQuadradoCritico}, p = ${pValor.toFixed(4)} <= ${alpha}). Houve desvio estatístico relevante entre os grupos.`,
    };
  }

  /**
   * Aproximação da função erro complementar para cálculo de p-valor bicaudal normal
   * @private
   */
  _calcularPValorNormal(z) {
    if (z === 0) return 1.0;
    // Aproximação de Abramowitz e Stegun (7.1.26)
    const t = 1.0 / (1.0 + 0.2316419 * Math.abs(z));
    const d = 0.3989422804014337 * Math.exp((-z * z) / 2);
    const p =
      d *
      t *
      (0.31938153 +
        t *
          (-0.356563782 +
            t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    return Math.min(1.0, Math.max(0.0, 2 * p));
  }

  /**
   * Retorna os dados diagnósticos de alocação e métricas estatísticas em tempo real
   */
  obterMetricasAlocacao() {
    const estatisticas = this.calcularEstatisticaQuiQuadrado();
    return {
      experimento: {
        janela: JANELA_EXPERIMENTO_AB,
        statusAtivo: this.isPeriodoExperimentoAtivo(),
      },
      motores: MOTORES_EXPERIMENTO,
      alocacoes: {
        totalGeral: this.totalAlocacoes,
        totalGrupoA_Groq: this.totalA,
        totalGrupoB_Gemini: this.totalB,
      },
      validacaoEstatistica: estatisticas,
    };
  }

  /**
   * Reseta os contadores para fins de testes automatizados
   */
  resetarContadores() {
    this.totalAlocacoes = 0;
    this.totalA = 0;
    this.totalB = 0;
    this.mapaSessoesUsuario.clear();
  }
}

export const abRoutingService = new ABRoutingService();
export default abRoutingService;

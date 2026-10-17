import { query } from '../config/database.js';

/**
 * Serviço de Consolidação Estatística e Exportação para a Tese de Doutorado
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Pesquisa: Tese de Doutorado em Educação Matemática
 * Doutorando: Maycon Luiz Amaral Magalhães
 * Orientadores: Prof. Dr. Eduardo Barrére & Prof. Dr. Manuel Cabral dos Santos Reis
 * 
 * Atende aos requisitos:
 * 1. Média ponderada de latência por tokens (LPU Groq vs Google Gemini)
 * 2. Distribuição de notas na escala Likert (1 a 5 estrelas)
 * 3. Desvio padrão amostral de latência e de avaliações
 * 4. Taxas de aceitação docente comparadas (critério CSAT pedagógico e confiabilidade técnica)
 * 5. Anonimização estrita e conformidade ética (CEP/UFJF e Resolução CNS 510/2016)
 * 6. Exportação em JSON e CSV tabular (RFC 4180 com suporte a Excel/BOM)
 */

// ============================================================================
// FUNÇÕES ESTATÍSTICAS E MATEMÁTICAS PURAS (PRECISÃO RIGOROSA)
// ============================================================================

/**
 * Média aritmética simples
 * @param {number[]} arr
 * @returns {number}
 */
export function calcularMedia(arr) {
  if (!arr || arr.length === 0) return 0;
  const soma = arr.reduce((acc, val) => acc + (Number(val) || 0), 0);
  return Number((soma / arr.length).toFixed(4));
}

/**
 * Média ponderada
 * @param {number[]} valores 
 * @param {number[]} pesos 
 * @returns {number}
 */
export function calcularMediaPonderada(valores, pesos) {
  if (!valores || valores.length === 0) return 0;
  let somaPonderada = 0;
  let somaPesos = 0;

  for (let i = 0; i < valores.length; i++) {
    const val = Number(valores[i]) || 0;
    const peso = (pesos && pesos[i] > 0) ? Number(pesos[i]) : 1;
    somaPonderada += val * peso;
    somaPesos += peso;
  }

  if (somaPesos === 0) return calcularMedia(valores);
  return Number((somaPonderada / somaPesos).toFixed(4));
}

/**
 * Desvio padrão amostral (s)
 * s = sqrt( (1 / (N - 1)) * sum( (x_i - media)^2 ) ) para N > 1, ou 0 se N <= 1
 * @param {number[]} arr 
 * @param {number} [mediaPrecalculada]
 * @returns {number}
 */
export function calcularDesvioPadraoAmostral(arr, mediaPrecalculada) {
  if (!arr || arr.length <= 1) return 0;
  const media = mediaPrecalculada !== undefined ? mediaPrecalculada : (arr.reduce((a, b) => a + b, 0) / arr.length);
  const somaQuadrados = arr.reduce((acc, val) => acc + Math.pow((Number(val) || 0) - media, 2), 0);
  const variancia = somaQuadrados / (arr.length - 1);
  return Number(Math.sqrt(variancia).toFixed(4));
}

/**
 * Erro padrão da média: SE = s / sqrt(N)
 * @param {number} desvioPadrao 
 * @param {number} n 
 * @returns {number}
 */
export function calcularErroPadrao(desvioPadrao, n) {
  if (!n || n <= 0 || !desvioPadrao) return 0;
  return Number((desvioPadrao / Math.sqrt(n)).toFixed(4));
}

/**
 * Intervalo de Confiança a 95% para a média (distribuição normal assintótica, z = 1.96)
 * @param {number} media 
 * @param {number} erroPadrao 
 * @param {number} [minLimit]
 * @param {number} [maxLimit]
 */
export function calcularIntervaloConfianca95(media, erroPadrao, minLimit = -Infinity, maxLimit = Infinity) {
  const margem = 1.96 * erroPadrao;
  const inferior = Math.max(minLimit, Number((media - margem).toFixed(2)));
  const superior = Math.min(maxLimit, Number((media + margem).toFixed(2)));
  return { inferior, superior, margemErro: Number(margem.toFixed(2)) };
}

/**
 * Mediana
 * @param {number[]} arr 
 * @returns {number}
 */
export function calcularMediana(arr) {
  if (!arr || arr.length === 0) return 0;
  const sorted = [...arr].map(Number).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
}

/**
 * Moda estatística
 * @param {number[]} arr 
 * @returns {number|null}
 */
export function calcularModa(arr) {
  if (!arr || arr.length === 0) return null;
  const freq = {};
  let maxCount = 0;
  let modaVal = arr[0];

  for (const n of arr) {
    freq[n] = (freq[n] || 0) + 1;
    if (freq[n] > maxCount) {
      maxCount = freq[n];
      modaVal = n;
    }
  }
  return modaVal;
}

/**
 * Função de erro de Gauss (erf) via aproximação polinomial de Abramowitz & Stegun 7.1.26
 * Precisão: erro absoluto máximo < 1.5e-7
 */
function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  const absX = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}

/**
 * Teste Z de diferença de duas proporções independentes (Teste A/B)
 * @param {number} x1 - Sucessos no Grupo 1 (Groq)
 * @param {number} n1 - Total no Grupo 1
 * @param {number} x2 - Sucessos no Grupo 2 (Gemini)
 * @param {number} n2 - Total no Grupo 2
 */
export function calcularTesteZProporcoes(x1, n1, x2, n2) {
  if (!n1 || !n2 || n1 <= 0 || n2 <= 0) {
    return {
      zScore: 0,
      pValue: 1.0,
      significativoAlpha005: false,
      mensagem: 'Tamanho amostral insuficiente para teste de significância assintótica.',
    };
  }

  const p1 = x1 / n1;
  const p2 = x2 / n2;
  const pPool = (x1 + x2) / (n1 + n2);

  if (pPool === 0 || pPool === 1) {
    return {
      zScore: 0,
      pValue: 1.0,
      significativoAlpha005: false,
      mensagem: 'Variância nula observada entre as proporções amostrais.',
    };
  }

  const sePool = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
  const zScore = sePool > 0 ? (p1 - p2) / sePool : 0;

  // p-valor bilateral: 2 * (1 - Phi(|z|))
  const phiAbsZ = 0.5 * (1 + erf(Math.abs(zScore) / Math.SQRT2));
  const pValue = Math.max(0, Math.min(1, 2 * (1 - phiAbsZ)));

  return {
    zScore: Number(zScore.toFixed(4)),
    pValue: Number(pValue.toFixed(4)),
    significativoAlpha005: pValue < 0.05,
    proporcao1: Number((p1 * 100).toFixed(2)),
    proporcao2: Number((p2 * 100).toFixed(2)),
    diferencaPontosPercentuais: Number(((p1 - p2) * 100).toFixed(2)),
  };
}

// ============================================================================
// ESCAPE E FORMATAÇÃO CSV (RFC 4180 COMPATÍVEL COM EXCEL/R/SPSS)
// ============================================================================

function escapeCsv(val) {
  if (val === null || val === undefined) return '';
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function montarTabelaCsv(cabecalhos, linhas) {
  const headerLine = cabecalhos.map(escapeCsv).join(',');
  const rowLines = linhas.map((row) => cabecalhos.map((c) => escapeCsv(row[c])).join(','));
  return [headerLine, ...rowLines].join('\r\n');
}

// ============================================================================
// CLASSE PRINCIPAL DO SERVIÇO
// ============================================================================

export class RelatorioTeseService {
  /**
   * Coleta dados do PostgreSQL e gera o relatório estatístico consolidado
   * @param {Object} opcoes
   * @param {Object} [opcoes.usuarioSolicitante] - Dados do pesquisador logado
   * @param {string} [opcoes.formato='json'] - 'json' ou 'csv'
   * @param {string} [opcoes.tipo='consolidado'] - Subtipo de CSV ('consolidado', 'avaliacoes', 'telemetria', 'tags', 'completo')
   * @param {boolean} [opcoes.incluirAmostra=true] - Se deve incluir amostra individual anonimizada
   */
  async gerarRelatorio({
    usuarioSolicitante = null,
    formato = 'json',
    tipo = 'consolidado',
    incluirAmostra = true,
  } = {}) {
    // 1. Busca todos os registros de telemetria de inferência do banco
    const telRes = await query(`
      SELECT 
        id,
        requisicao_ia_id,
        LEFT(usuario_id_hash, 16) AS usuario_hash_anonimizado,
        motor_ia,
        modelo_especifico,
        latencia_ms,
        tokens_prompt,
        tokens_completion,
        COALESCE(total_tokens, 0) AS total_tokens,
        status_execucao,
        fallback_utilizado,
        grupo_experimental,
        criado_em
      FROM telemetria_ab
      ORDER BY criado_em DESC;
    `);

    // 2. Busca todas as avaliações docentes do banco
    const avalRes = await query(`
      SELECT 
        id,
        requisicao_ia_id,
        telemetria_ab_id,
        LEFT(usuario_id_hash, 16) AS usuario_hash_anonimizado,
        nota_estrelas,
        tags_qualitativas,
        comentario_critico,
        motor_ia,
        modelo_especifico,
        grupo_experimental,
        created_at
      FROM avaliacoes_telemetria_ab
      ORDER BY created_at DESC;
    `);

    const registrosTelemetria = telRes.rows;
    const registrosAvaliacoes = avalRes.rows;

    // 3. Processamento estatístico computacional (Telemetria A/B)
    const statsTelemetria = this._processarTelemetria(registrosTelemetria);

    // 4. Processamento estatístico pedagógico (Avaliações Docentes)
    const statsAvaliacoes = this._processarAvaliacoes(registrosAvaliacoes);

    // 5. Comparativo direto entre motores A (Groq) e B (Gemini)
    const analiseComparativa = this._processarAnaliseComparativaAB(statsTelemetria, statsAvaliacoes);

    // 6. Processamento da frequência de tags pedagógicas
    const tagsQualitativas = this._processarTagsQualitativas(registrosAvaliacoes);

    // 7. Visão Geral Consolidada
    const visaoGeral = {
      totalRequisicoesInferencias: registrosTelemetria.length,
      totalAvaliacoesDocentes: registrosAvaliacoes.length,
      taxaEngajamentoAvaliacaoPercentual: registrosTelemetria.length > 0
        ? Number(((registrosAvaliacoes.length / registrosTelemetria.length) * 100).toFixed(2))
        : 0,
      latenciaMediaGeralMs: statsTelemetria.geral.latenciaMediaMs,
      latenciaPonderadaTokensMs: statsTelemetria.geral.latenciaPonderadaTokensMs,
      latenciaDesvioPadraoMs: statsTelemetria.geral.latenciaDesvioPadraoMs,
      mediaGeralEstrelas: statsAvaliacoes.geral.mediaEstrelas,
      desvioPadraoEstrelas: statsAvaliacoes.geral.desvioPadraoEstrelas,
      taxaAceitacaoAltaGeralPercentual: statsAvaliacoes.geral.taxaAceitacaoAltaPercentual,
      taxaAceitacaoAmplaGeralPercentual: statsAvaliacoes.geral.taxaAceitacaoAmplaPercentual,
    };

    // Metadados oficiais de governança acadêmica
    const metadadosPesquisa = {
      tituloTese: 'Plataforma IAprofEPT: Ambiente de Formação e Inteligência Artificial Generativa para Docência em Matemática na Educação Profissional e Tecnológica',
      autorPesquisador: 'Maycon Luiz Amaral Magalhães',
      programaPosGraduacao: 'Programa de Pós-Graduação em Educação Matemática (PPGEM / UFJF)',
      orientadores: [
        'Prof. Dr. Eduardo Barrére (UFJF)',
        'Prof. Dr. Manuel José Cabral dos Santos Reis (UTAD / Portugal)',
      ],
      protocoloExperimental: 'Teste A/B Empírico Comparativo de 30 Dias (Groq LLaMA 3.3 70B Versatile vs Google Gemini 1.5 Flash)',
      periodoProtocolo: '20/10/2026 a 20/11/2026',
      conformidadeEtica: 'Comitê de Ética em Pesquisa (CEP/UFJF) — Resolução CNS 510/2016',
      dataExtracao: new Date().toISOString(),
      solicitante: {
        id: usuarioSolicitante?.id || null,
        nome: usuarioSolicitante?.nome || 'Pesquisador Maycon Magalhães',
        email: usuarioSolicitante?.email || null,
        role: usuarioSolicitante?.role || 'pesquisador_doutorado',
      },
    };

    // Monta o relatório analítico final
    const relatorioJson = {
      sucesso: true,
      metadadosPesquisa,
      visaoGeral,
      motores: {
        groq: {
          motor: 'groq',
          nomeExibicao: 'Motor A: Groq (LLaMA 3.3 70B Versatile - LPU)',
          grupoExperimental: 'A',
          computacional: statsTelemetria.groq,
          pedagogico: statsAvaliacoes.groq,
        },
        gemini: {
          motor: 'gemini',
          nomeExibicao: 'Motor B: Google (Gemini 1.5 Flash)',
          grupoExperimental: 'B',
          computacional: statsTelemetria.gemini,
          pedagogico: statsAvaliacoes.gemini,
        },
      },
      analiseComparativaAB: analiseComparativa,
      distribuicaoTagsQualitativas: tagsQualitativas,
      alertaEticoObrigatorio:
        'Este material foi gerado por Inteligência Artificial e deve ser revisado, validado e adaptado pela autoridade docente antes de sua aplicação em sala de aula.',
    };

    if (incluirAmostra) {
      relatorioJson.amostraAnonimizada = {
        totalAvaliacoes: registrosAvaliacoes.length,
        totalTelemetrias: registrosTelemetria.length,
        avaliacoes: registrosAvaliacoes,
        telemetria: registrosTelemetria,
      };
    }

    // Se o formato for CSV, realiza a conversão tabular
    if (formato === 'csv') {
      return this._formatarRelatorioCsv({
        relatorio: relatorioJson,
        registrosAvaliacoes,
        registrosTelemetria,
        tagsQualitativas,
        tipo,
      });
    }

    return relatorioJson;
  }

  // ============================================================================
  // PROCESSAMENTO COMPUTACIONAL (TELEMETRIA A/B)
  // ============================================================================

  _processarTelemetria(registros) {
    const separarPorMotor = (motor) => registros.filter((r) => r.motor_ia === motor);

    const calcularMetricasMotor = (regs) => {
      const n = regs.length;
      if (n === 0) {
        return {
          totalRequisicoes: 0,
          totalSucessos: 0,
          totalFallbacks: 0,
          totalErros: 0,
          taxaSucessoPercentual: 0,
          taxaFallbackPercentual: 0,
          taxaErroPercentual: 0,
          latenciaMediaMs: 0,
          latenciaPonderadaTokensMs: 0,
          latenciaDesvioPadraoMs: 0,
          latenciaErroPadraoMs: 0,
          latenciaMinMs: 0,
          latenciaMaxMs: 0,
          latenciaMedianaMs: 0,
          totalTokensConsumidos: 0,
          mediaTokensPorRequisicao: 0,
        };
      }

      const latencias = regs.map((r) => Number(r.latencia_ms) || 0);
      const tokens = regs.map((r) => Number(r.total_tokens) || 0);

      const totalSucessos = regs.filter((r) => r.status_execucao === 'sucesso').length;
      const totalFallbacks = regs.filter((r) => r.fallback_utilizado === true || r.status_execucao === 'fallback').length;
      const totalErros = regs.filter((r) => r.status_execucao === 'erro' || r.status_execucao === 'timeout').length;

      const latMedia = calcularMedia(latencias);
      const latPonderada = calcularMediaPonderada(latencias, tokens);
      const latDesvio = calcularDesvioPadraoAmostral(latencias, latMedia);
      const latErroPadrao = calcularErroPadrao(latDesvio, n);
      const latMin = Math.min(...latencias);
      const latMax = Math.max(...latencias);
      const latMediana = calcularMediana(latencias);

      const somaTokens = tokens.reduce((acc, val) => acc + val, 0);

      return {
        totalRequisicoes: n,
        totalSucessos,
        totalFallbacks,
        totalErros,
        taxaSucessoPercentual: Number(((totalSucessos / n) * 100).toFixed(2)),
        taxaFallbackPercentual: Number(((totalFallbacks / n) * 100).toFixed(2)),
        taxaErroPercentual: Number(((totalErros / n) * 100).toFixed(2)),
        latenciaMediaMs: latMedia,
        latenciaPonderadaTokensMs: latPonderada,
        latenciaDesvioPadraoMs: latDesvio,
        latenciaErroPadraoMs: latErroPadrao,
        latenciaMinMs: latMin,
        latenciaMaxMs: latMax,
        latenciaMedianaMs: latMediana,
        totalTokensConsumidos: somaTokens,
        mediaTokensPorRequisicao: Number((somaTokens / n).toFixed(2)),
      };
    };

    return {
      geral: calcularMetricasMotor(registros),
      groq: calcularMetricasMotor(separarPorMotor('groq')),
      gemini: calcularMetricasMotor(separarPorMotor('gemini')),
    };
  }

  // ============================================================================
  // PROCESSAMENTO PEDAGÓGICO (AVALIAÇÃO DOCENTE)
  // ============================================================================

  _processarAvaliacoes(registros) {
    const separarPorMotor = (motor) => registros.filter((r) => r.motor_ia === motor);

    const calcularMetricasPedagogicas = (regs) => {
      const m = regs.length;
      if (m === 0) {
        return {
          totalAvaliacoes: 0,
          mediaEstrelas: 0,
          desvioPadraoEstrelas: 0,
          erroPadraoMedia: 0,
          intervaloConfianca95: { inferior: 0, superior: 0, margemErro: 0 },
          medianaEstrelas: 0,
          modaEstrelas: null,
          distribuicaoNotas: {
            1: { contagem: 0, percentual: 0 },
            2: { contagem: 0, percentual: 0 },
            3: { contagem: 0, percentual: 0 },
            4: { contagem: 0, percentual: 0 },
            5: { contagem: 0, percentual: 0 },
          },
          taxaAceitacaoAltaPercentual: 0,
          taxaAceitacaoAmplaPercentual: 0,
          taxaRejeicaoPercentual: 0,
          totalComentariosCriticos: 0,
        };
      }

      const notas = regs.map((r) => Number(r.nota_estrelas) || 0);

      // Distribuição absoluta e relativa das notas de 1 a 5 estrelas
      const contagemNotas = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      for (const nota of notas) {
        if (contagemNotas[nota] !== undefined) {
          contagemNotas[nota]++;
        }
      }

      const distribuicaoNotas = {
        1: { contagem: contagemNotas[1], percentual: Number(((contagemNotas[1] / m) * 100).toFixed(2)) },
        2: { contagem: contagemNotas[2], percentual: Number(((contagemNotas[2] / m) * 100).toFixed(2)) },
        3: { contagem: contagemNotas[3], percentual: Number(((contagemNotas[3] / m) * 100).toFixed(2)) },
        4: { contagem: contagemNotas[4], percentual: Number(((contagemNotas[4] / m) * 100).toFixed(2)) },
        5: { contagem: contagemNotas[5], percentual: Number(((contagemNotas[5] / m) * 100).toFixed(2)) },
      };

      const mediaEstrelas = calcularMedia(notas);
      const desvioPadraoEstrelas = calcularDesvioPadraoAmostral(notas, mediaEstrelas);
      const erroPadraoMedia = calcularErroPadrao(desvioPadraoEstrelas, m);
      const intervaloConfianca95 = calcularIntervaloConfianca95(mediaEstrelas, erroPadraoMedia, 1, 5);
      const medianaEstrelas = calcularMediana(notas);
      const modaEstrelas = calcularModa(notas);

      // Taxas de aceitação docente
      const totalAlta = contagemNotas[4] + contagemNotas[5];
      const totalAmpla = contagemNotas[3] + contagemNotas[4] + contagemNotas[5];
      const totalRejeicao = contagemNotas[1] + contagemNotas[2];

      const taxaAceitacaoAltaPercentual = Number(((totalAlta / m) * 100).toFixed(2));
      const taxaAceitacaoAmplaPercentual = Number(((totalAmpla / m) * 100).toFixed(2));
      const taxaRejeicaoPercentual = Number(((totalRejeicao / m) * 100).toFixed(2));

      const totalComentariosCriticos = regs.filter(
        (r) => r.comentario_critico && String(r.comentario_critico).trim().length > 0
      ).length;

      return {
        totalAvaliacoes: m,
        mediaEstrelas,
        desvioPadraoEstrelas,
        erroPadraoMedia,
        intervaloConfianca95,
        medianaEstrelas,
        modaEstrelas,
        distribuicaoNotas,
        taxaAceitacaoAltaPercentual,
        taxaAceitacaoAmplaPercentual,
        taxaRejeicaoPercentual,
        totalComentariosCriticos,
      };
    };

    return {
      geral: calcularMetricasPedagogicas(registros),
      groq: calcularMetricasPedagogicas(separarPorMotor('groq')),
      gemini: calcularMetricasPedagogicas(separarPorMotor('gemini')),
    };
  }

  // ============================================================================
  // ANÁLISE COMPARATIVA EXPERIMENTAL A/B (GROQ VS GEMINI)
  // ============================================================================

  _processarAnaliseComparativaAB(statsTel, statsAval) {
    const groqPed = statsAval.groq;
    const geminiPed = statsAval.gemini;
    const groqComp = statsTel.groq;
    const geminiComp = statsTel.gemini;

    // Diferenças absolutas
    const deltaAceitacaoAlta = Number((groqPed.taxaAceitacaoAltaPercentual - geminiPed.taxaAceitacaoAltaPercentual).toFixed(2));
    const deltaAceitacaoAmpla = Number((groqPed.taxaAceitacaoAmplaPercentual - geminiPed.taxaAceitacaoAmplaPercentual).toFixed(2));
    const deltaMediaEstrelas = Number((groqPed.mediaEstrelas - geminiPed.mediaEstrelas).toFixed(2));
    const deltaLatenciaMedia = Number((groqComp.latenciaMediaMs - geminiComp.latenciaMediaMs).toFixed(2));
    const deltaLatenciaPonderada = Number((groqComp.latenciaPonderadaTokensMs - geminiComp.latenciaPonderadaTokensMs).toFixed(2));

    // Teste Z para a Taxa de Aceitação Alta
    const totalAltaGroq = (groqPed.distribuicaoNotas[4]?.contagem || 0) + (groqPed.distribuicaoNotas[5]?.contagem || 0);
    const totalAltaGemini = (geminiPed.distribuicaoNotas[4]?.contagem || 0) + (geminiPed.distribuicaoNotas[5]?.contagem || 0);

    const testeZ = calcularTesteZProporcoes(
      totalAltaGroq,
      groqPed.totalAvaliacoes,
      totalAltaGemini,
      geminiPed.totalAvaliacoes
    );

    // Razão de chances (Odds Ratio) para Aceitação Alta
    let oddsRatio = null;
    if (groqPed.totalAvaliacoes > 0 && geminiPed.totalAvaliacoes > 0) {
      const a = totalAltaGroq;
      const b = groqPed.totalAvaliacoes - totalAltaGroq;
      const c = totalAltaGemini;
      const d = geminiPed.totalAvaliacoes - totalAltaGemini;

      if (b > 0 && c > 0) {
        oddsRatio = Number(((a * d) / (b * c)).toFixed(3));
      }
    }

    // Determinação dos vencedores por critério
    let vencedorPedagogico = 'empate';
    if (groqPed.totalAvaliacoes > 0 && geminiPed.totalAvaliacoes > 0) {
      if (groqPed.taxaAceitacaoAltaPercentual > geminiPed.taxaAceitacaoAltaPercentual) vencedorPedagogico = 'groq';
      else if (geminiPed.taxaAceitacaoAltaPercentual > groqPed.taxaAceitacaoAltaPercentual) vencedorPedagogico = 'gemini';
      else if (groqPed.mediaEstrelas > geminiPed.mediaEstrelas) vencedorPedagogico = 'groq';
      else if (geminiPed.mediaEstrelas > groqPed.mediaEstrelas) vencedorPedagogico = 'gemini';
    } else if (groqPed.totalAvaliacoes > 0) {
      vencedorPedagogico = 'groq';
    } else if (geminiPed.totalAvaliacoes > 0) {
      vencedorPedagogico = 'gemini';
    }

    let vencedorComputacional = 'empate';
    if (groqComp.totalRequisicoes > 0 && geminiComp.totalRequisicoes > 0) {
      if (groqComp.latenciaPonderadaTokensMs < geminiComp.latenciaPonderadaTokensMs) vencedorComputacional = 'groq';
      else if (geminiComp.latenciaPonderadaTokensMs < groqComp.latenciaPonderadaTokensMs) vencedorComputacional = 'gemini';
    } else if (groqComp.totalRequisicoes > 0) {
      vencedorComputacional = 'groq';
    } else if (geminiComp.totalRequisicoes > 0) {
      vencedorComputacional = 'gemini';
    }

    let vencedorEstabilidade = 'empate';
    if (groqComp.totalRequisicoes > 0 && geminiComp.totalRequisicoes > 0) {
      if (groqComp.taxaSucessoPercentual > geminiComp.taxaSucessoPercentual) vencedorEstabilidade = 'groq';
      else if (geminiComp.taxaSucessoPercentual > groqComp.taxaSucessoPercentual) vencedorEstabilidade = 'gemini';
    }

    return {
      diferencaTaxaAceitacaoAltaPontosPercentuais: deltaAceitacaoAlta,
      diferencaTaxaAceitacaoAmplaPontosPercentuais: deltaAceitacaoAmpla,
      diferencaMediaEstrelas: deltaMediaEstrelas,
      diferencaLatenciaMediaMs: deltaLatenciaMedia,
      diferencaLatenciaPonderadaTokensMs: deltaLatenciaPonderada,
      oddsRatioAceitacaoAlta: oddsRatio,
      testeSignificanciaZ: testeZ,
      vencedorQualidadePedagogica: vencedorPedagogico,
      vencedorEficienciaComputacional: vencedorComputacional,
      vencedorEstabilidadeTecnica: vencedorEstabilidade,
      sinteseCientifica: `No protocolo A/B, o Motor ${vencedorComputacional.toUpperCase()} liderou em velocidade de inferência (${deltaLatenciaPonderada <= 0 ? 'mais rápido' : 'mais lento'}), enquanto o Motor ${vencedorPedagogico.toUpperCase()} obteve ${deltaAceitacaoAlta >= 0 ? '+' : ''}${deltaAceitacaoAlta}% de aceitação de alta qualidade pelos professores de Matemática da RFEPCT.`,
    };
  }

  // ============================================================================
  // FREQUÊNCIA DE TAGS QUALITATIVAS DA EPT
  // ============================================================================

  _processarTagsQualitativas(registros) {
    const tagsCanonicas = [
      'Rigor Matemático',
      'Contextualização EPT',
      'Clareza do Gabarito',
      'Adequação à BNCC',
    ];

    const totalDocentes = registros.length;
    const totalGroq = registros.filter((r) => r.motor_ia === 'groq').length;
    const totalGemini = registros.filter((r) => r.motor_ia === 'gemini').length;

    const contagemPorTag = {};
    for (const tag of tagsCanonicas) {
      contagemPorTag[tag] = { total: 0, groq: 0, gemini: 0 };
    }

    for (const r of registros) {
      let tags = [];
      if (Array.isArray(r.tags_qualitativas)) {
        tags = r.tags_qualitativas;
      } else if (typeof r.tags_qualitativas === 'string') {
        try {
          tags = JSON.parse(r.tags_qualitativas);
        } catch (e) {
          tags = [];
        }
      }

      for (const t of tags) {
        if (contagemPorTag[t]) {
          contagemPorTag[t].total++;
          if (r.motor_ia === 'groq') contagemPorTag[t].groq++;
          if (r.motor_ia === 'gemini') contagemPorTag[t].gemini++;
        }
      }
    }

    return tagsCanonicas.map((tag) => {
      const d = contagemPorTag[tag];
      return {
        tag,
        frequenciaTotal: d.total,
        percentualTotal: totalDocentes > 0 ? Number(((d.total / totalDocentes) * 100).toFixed(2)) : 0,
        frequenciaGroq: d.groq,
        percentualGroq: totalGroq > 0 ? Number(((d.groq / totalGroq) * 100).toFixed(2)) : 0,
        frequenciaGemini: d.gemini,
        percentualGemini: totalGemini > 0 ? Number(((d.gemini / totalGemini) * 100).toFixed(2)) : 0,
      };
    });
  }

  // ============================================================================
  // FORMATADOR DE EXPORTAÇÃO CSV TABULAR
  // ============================================================================

  _formatarRelatorioCsv({ relatorio, registrosAvaliacoes, registrosTelemetria, tagsQualitativas, tipo }) {
    const BOM = '\uFEFF'; // Permite abertura direta no Excel sem corromper UTF-8
    let csvContent = '';

    if (tipo === 'avaliacoes') {
      const cabecalhos = [
        'id_avaliacao',
        'requisicao_ia_id',
        'usuario_hash_anonimizado',
        'motor_ia',
        'modelo_especifico',
        'grupo_experimental',
        'nota_estrelas',
        'tags_qualitativas',
        'comentario_critico',
        'created_at',
      ];
      csvContent = montarTabelaCsv(cabecalhos, registrosAvaliacoes);
      return {
        contentType: 'text/csv; charset=utf-8',
        filename: 'relatorio-tese-avaliacoes-docentes-anonimizadas.csv',
        conteudo: BOM + csvContent,
      };
    }

    if (tipo === 'telemetria') {
      const cabecalhos = [
        'id_telemetria',
        'requisicao_ia_id',
        'usuario_hash_anonimizado',
        'motor_ia',
        'modelo_especifico',
        'grupo_experimental',
        'latencia_ms',
        'tokens_prompt',
        'tokens_completion',
        'total_tokens',
        'status_execucao',
        'fallback_utilizado',
        'criado_em',
      ];
      csvContent = montarTabelaCsv(cabecalhos, registrosTelemetria);
      return {
        contentType: 'text/csv; charset=utf-8',
        filename: 'relatorio-tese-telemetria-inferencia-ab.csv',
        conteudo: BOM + csvContent,
      };
    }

    if (tipo === 'tags') {
      const cabecalhos = [
        'tag_pedagogica',
        'frequencia_total',
        'percentual_total',
        'frequencia_groq',
        'percentual_groq',
        'frequencia_gemini',
        'percentual_gemini',
      ];
      csvContent = montarTabelaCsv(
        cabecalhos,
        tagsQualitativas.map((t) => ({
          tag_pedagogica: t.tag,
          frequencia_total: t.frequenciaTotal,
          percentual_total: t.percentualTotal,
          frequencia_groq: t.frequenciaGroq,
          percentual_groq: t.percentualGroq,
          frequencia_gemini: t.frequenciaGemini,
          percentual_gemini: t.percentualGemini,
        }))
      );
      return {
        contentType: 'text/csv; charset=utf-8',
        filename: 'relatorio-tese-tags-qualitativas-ept.csv',
        conteudo: BOM + csvContent,
      };
    }

    if (tipo === 'completo') {
      // Arquivo consolidado com todas as seções demarcadas
      const secaoConsolidada = this._gerarTabelaConsolidadaLinhas(relatorio);
      const csvConsolidado = montarTabelaCsv(Object.keys(secaoConsolidada[0]), secaoConsolidada);

      const cabecalhosTags = [
        'tag_pedagogica',
        'frequencia_total',
        'percentual_total',
        'frequencia_groq',
        'percentual_groq',
        'frequencia_gemini',
        'percentual_gemini',
      ];
      const csvTags = montarTabelaCsv(
        cabecalhosTags,
        tagsQualitativas.map((t) => ({
          tag_pedagogica: t.tag,
          frequencia_total: t.frequenciaTotal,
          percentual_total: t.percentualTotal,
          frequencia_groq: t.frequenciaGroq,
          percentual_groq: t.percentualGroq,
          frequencia_gemini: t.frequenciaGemini,
          percentual_gemini: t.percentualGemini,
        }))
      );

      const cabecalhosAval = [
        'id_avaliacao',
        'requisicao_ia_id',
        'usuario_hash_anonimizado',
        'motor_ia',
        'modelo_especifico',
        'grupo_experimental',
        'nota_estrelas',
        'tags_qualitativas',
        'comentario_critico',
        'created_at',
      ];
      const csvAval = montarTabelaCsv(cabecalhosAval, registrosAvaliacoes);

      const blocoCompleto = [
        '# ============================================================================',
        '# TESE DE DOUTORADO — PPGEM / UFJF — MAYCON LUIZ AMARAL MAGALHÃES',
        '# PROTOCOLO EXPERIMENTAL A/B (GROQ LLAMA 3.3 70B vs GOOGLE GEMINI 1.5 FLASH)',
        '# CONFORMIDADE ÉTICA: CEP/UFJF & RESOLUÇÃO CNS 510/2016',
        `# EXTRAÇÃO REALIZADA EM: ${new Date().toISOString()}`,
        '# ============================================================================',
        '',
        '# --- TABELA 1: INDICADORES ESTATÍSTICOS CONSOLIDADOS (GROQ vs GEMINI) ---',
        csvConsolidado,
        '',
        '# --- TABELA 2: DISTRIBUIÇÃO DAS DIMENSÕES QUALITATIVAS DA EPT ---',
        csvTags,
        '',
        '# --- TABELA 3: AMOSTRA DE AVALIAÇÕES DOCENTES ANONIMIZADAS ---',
        csvAval,
      ].join('\r\n');

      return {
        contentType: 'text/csv; charset=utf-8',
        filename: 'relatorio-tese-completo-telemetria-ab.csv',
        conteudo: BOM + blocoCompleto,
      };
    }

    // Default: 'consolidado'
    const linhasConsolidadas = this._gerarTabelaConsolidadaLinhas(relatorio);
    const cabecalhos = Object.keys(linhasConsolidadas[0]);
    csvContent = montarTabelaCsv(cabecalhos, linhasConsolidadas);

    return {
      contentType: 'text/csv; charset=utf-8',
      filename: 'relatorio-tese-consolidado-estatistico-ab.csv',
      conteudo: BOM + csvContent,
    };
  }

  _gerarTabelaConsolidadaLinhas(relatorio) {
    const groq = relatorio.motores.groq;
    const gemini = relatorio.motores.gemini;
    const geral = relatorio.visaoGeral;

    const montarLinha = (motorNome, exibicao, grupo, comp, ped) => ({
      motor: motorNome,
      nome_exibicao: exibicao,
      grupo_experimental: grupo,
      total_requisicoes: comp.totalRequisicoes,
      latencia_media_ms: comp.latenciaMediaMs,
      latencia_ponderada_tokens_ms: comp.latenciaPonderadaTokensMs,
      latencia_desvio_padrao_ms: comp.latenciaDesvioPadraoMs,
      latencia_min_ms: comp.latenciaMinMs,
      latencia_max_ms: comp.latenciaMaxMs,
      latencia_mediana_ms: comp.latenciaMedianaMs,
      total_tokens: comp.totalTokensConsumidos,
      media_tokens_requisicao: comp.mediaTokensPorRequisicao,
      taxa_sucesso_pct: comp.taxaSucessoPercentual,
      taxa_fallback_pct: comp.taxaFallbackPercentual,
      total_avaliacoes: ped.totalAvaliacoes,
      media_estrelas: ped.mediaEstrelas,
      desvio_padrao_estrelas: ped.desvioPadraoEstrelas,
      erro_padrao_media: ped.erroPadraoMedia,
      ic95_inferior: ped.intervaloConfianca95.inferior,
      ic95_superior: ped.intervaloConfianca95.superior,
      mediana_estrelas: ped.medianaEstrelas,
      moda_estrelas: ped.modaEstrelas ?? '-',
      estrelas_1_pct: ped.distribuicaoNotas[1]?.percentual ?? 0,
      estrelas_2_pct: ped.distribuicaoNotas[2]?.percentual ?? 0,
      estrelas_3_pct: ped.distribuicaoNotas[3]?.percentual ?? 0,
      estrelas_4_pct: ped.distribuicaoNotas[4]?.percentual ?? 0,
      estrelas_5_pct: ped.distribuicaoNotas[5]?.percentual ?? 0,
      taxa_aceitacao_alta_pct: ped.taxaAceitacaoAltaPercentual,
      taxa_aceitacao_ampla_pct: ped.taxaAceitacaoAmplaPercentual,
      taxa_rejeicao_pct: ped.taxaRejeicaoPercentual,
      total_comentarios: ped.totalComentariosCriticos,
    });

    const linhaGroq = montarLinha(
      'groq',
      groq.nomeExibicao,
      groq.grupoExperimental,
      groq.computacional,
      groq.pedagogico
    );

    const linhaGemini = montarLinha(
      'gemini',
      gemini.nomeExibicao,
      gemini.grupoExperimental,
      gemini.computacional,
      gemini.pedagogico
    );

    const compGeral = {
      totalRequisicoes: geral.totalRequisicoesInferencias,
      latenciaMediaMs: geral.latenciaMediaGeralMs,
      latenciaPonderadaTokensMs: geral.latenciaPonderadaTokensMs,
      latenciaDesvioPadraoMs: geral.latenciaDesvioPadraoMs,
      latenciaMinMs: Math.min(groq.computacional.latenciaMinMs || Infinity, gemini.computacional.latenciaMinMs || Infinity),
      latenciaMaxMs: Math.max(groq.computacional.latenciaMaxMs || 0, gemini.computacional.latenciaMaxMs || 0),
      latenciaMedianaMs: '-',
      totalTokensConsumidos: (groq.computacional.totalTokensConsumidos || 0) + (gemini.computacional.totalTokensConsumidos || 0),
      mediaTokensPorRequisicao: geral.totalRequisicoesInferencias > 0
        ? Number((((groq.computacional.totalTokensConsumidos || 0) + (gemini.computacional.totalTokensConsumidos || 0)) / geral.totalRequisicoesInferencias).toFixed(2))
        : 0,
      taxaSucessoPercentual: geral.totalRequisicoesInferencias > 0
        ? Number(((((groq.computacional.totalSucessos || 0) + (gemini.computacional.totalSucessos || 0)) / geral.totalRequisicoesInferencias) * 100).toFixed(2))
        : 0,
      taxaFallbackPercentual: geral.totalRequisicoesInferencias > 0
        ? Number(((((groq.computacional.totalFallbacks || 0) + (gemini.computacional.totalFallbacks || 0)) / geral.totalRequisicoesInferencias) * 100).toFixed(2))
        : 0,
    };

    const pedGeral = {
      totalAvaliacoes: geral.totalAvaliacoesDocentes,
      mediaEstrelas: geral.mediaGeralEstrelas,
      desvioPadraoEstrelas: geral.desvioPadraoEstrelas,
      erroPadraoMedia: calcularErroPadrao(geral.desvioPadraoEstrelas, geral.totalAvaliacoesDocentes),
      intervaloConfianca95: calcularIntervaloConfianca95(
        geral.mediaGeralEstrelas,
        calcularErroPadrao(geral.desvioPadraoEstrelas, geral.totalAvaliacoesDocentes),
        1,
        5
      ),
      medianaEstrelas: '-',
      modaEstrelas: '-',
      distribuicaoNotas: {
        1: { percentual: Number(((((groq.pedagogico.distribuicaoNotas[1]?.contagem || 0) + (gemini.pedagogico.distribuicaoNotas[1]?.contagem || 0)) / Math.max(1, geral.totalAvaliacoesDocentes)) * 100).toFixed(2)) },
        2: { percentual: Number(((((groq.pedagogico.distribuicaoNotas[2]?.contagem || 0) + (gemini.pedagogico.distribuicaoNotas[2]?.contagem || 0)) / Math.max(1, geral.totalAvaliacoesDocentes)) * 100).toFixed(2)) },
        3: { percentual: Number(((((groq.pedagogico.distribuicaoNotas[3]?.contagem || 0) + (gemini.pedagogico.distribuicaoNotas[3]?.contagem || 0)) / Math.max(1, geral.totalAvaliacoesDocentes)) * 100).toFixed(2)) },
        4: { percentual: Number(((((groq.pedagogico.distribuicaoNotas[4]?.contagem || 0) + (gemini.pedagogico.distribuicaoNotas[4]?.contagem || 0)) / Math.max(1, geral.totalAvaliacoesDocentes)) * 100).toFixed(2)) },
        5: { percentual: Number(((((groq.pedagogico.distribuicaoNotas[5]?.contagem || 0) + (gemini.pedagogico.distribuicaoNotas[5]?.contagem || 0)) / Math.max(1, geral.totalAvaliacoesDocentes)) * 100).toFixed(2)) },
      },
      taxaAceitacaoAltaPercentual: geral.taxaAceitacaoAltaGeralPercentual,
      taxaAceitacaoAmplaPercentual: geral.taxaAceitacaoAmplaGeralPercentual,
      taxaRejeicaoPercentual: Number((100 - geral.taxaAceitacaoAmplaGeralPercentual).toFixed(2)),
      totalComentariosCriticos: (groq.pedagogico.totalComentariosCriticos || 0) + (gemini.pedagogico.totalComentariosCriticos || 0),
    };

    const linhaGeral = montarLinha(
      'consolidado',
      'Total Consolidado Experimento A/B',
      '-',
      compGeral,
      pedGeral
    );

    return [linhaGroq, linhaGemini, linhaGeral];
  }
}

export const relatorioTeseService = new RelatorioTeseService();
export default relatorioTeseService;

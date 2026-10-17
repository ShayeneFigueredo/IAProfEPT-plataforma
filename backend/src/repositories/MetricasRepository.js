import { BaseRepository } from './BaseRepository.js';

/**
 * Repositório de Métricas e Telemetria Científica da Tese de Doutorado
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Pesquisa: Tese de Doutorado em Educação Matemática
 * Doutorando: Maycon Luiz Amaral Magalhães
 * Orientadores: Prof. Dr. Eduardo Barrére & Prof. Dr. Manuel Cabral dos Santos Reis
 */
export class MetricasRepository extends BaseRepository {
  constructor() {
    super('telemetria_ab');
  }

  /**
   * Consolida métricas empíricas para a tese de doutorado
   * Agrega dados do Experimento A/B (Groq vs Gemini) e da amostra docente da RFEPCT
   */
  async getMetricasTese() {
    // 1. Estatísticas de Telemetria A/B por Motor
    const telemetriaRes = await this.query(`
      SELECT 
        motor_ia,
        COUNT(*) as total_requisicoes,
        ROUND(AVG(latencia_ms), 2) as latencia_media_ms,
        MIN(latencia_ms) as latencia_minima_ms,
        MAX(latencia_ms) as latencia_maxima_ms,
        SUM(COALESCE(total_tokens, 0)) as total_tokens_consumidos,
        ROUND(AVG(COALESCE(total_tokens, 0)), 1) as media_tokens_por_requisicao,
        COUNT(CASE WHEN status_execucao = 'sucesso' THEN 1 END) as total_sucessos,
        COUNT(CASE WHEN fallback_utilizado = TRUE THEN 1 END) as total_fallbacks,
        COUNT(CASE WHEN status_execucao = 'erro' THEN 1 END) as total_erros
      FROM telemetria_ab
      GROUP BY motor_ia;
    `);

    // 1.1 Estatísticas de Balanceamento por Grupo Experimental (Grupo A vs Grupo B)
    const gruposAbRes = await this.query(`
      SELECT 
        COALESCE(grupo_experimental, 'SEM_GRUPO') as grupo,
        COUNT(*) as total_alocacoes,
        ROUND(AVG(latencia_ms), 2) as latencia_media_ms,
        COUNT(CASE WHEN status_execucao = 'sucesso' THEN 1 END) as sucessos,
        COUNT(CASE WHEN fallback_utilizado = TRUE THEN 1 END) as fallbacks
      FROM telemetria_ab
      GROUP BY grupo_experimental
      ORDER BY grupo ASC;
    `);

    let totalA = 0;
    let totalB = 0;
    for (const g of gruposAbRes.rows) {
      if (g.grupo === 'A') totalA = parseInt(g.total_alocacoes, 10) || 0;
      if (g.grupo === 'B') totalB = parseInt(g.total_alocacoes, 10) || 0;
    }
    const totalN = totalA + totalB;
    const quiQuadrado = totalN > 0
      ? (Math.pow(totalA - totalN / 2, 2) / (totalN / 2) + Math.pow(totalB - totalN / 2, 2) / (totalN / 2))
      : 0;
    const proporcaoA = totalN > 0 ? (totalA / totalN) : 0;
    const proporcaoB = totalN > 0 ? (totalB / totalN) : 0;
    const chi2Valido = quiQuadrado < 3.84146;

    // 2. Estatísticas de Adoção Docente na RFEPCT
    const docentesRes = await this.query(`
      SELECT 
        COUNT(DISTINCT u.id) as total_docentes_cadastrados,
        COUNT(DISTINCT pd.uf) as total_ufs_alcancadas,
        COUNT(DISTINCT pd.instituicao_id) as total_instituicoes_alcancadas,
        COUNT(DISTINCT pd.area_atuacao) as areas_matematica_atendidas
      FROM usuarios u
      JOIN perfis_docentes pd ON pd.usuario_id = u.id
      WHERE u.role = 'docente_rfepct';
    `);

    // 3. Distribuição Geográfica de Docentes por Região / UF
    const distribuicaoUfRes = await this.query(`
      SELECT pd.uf, COUNT(*) as total_docentes
      FROM perfis_docentes pd
      GROUP BY pd.uf
      ORDER BY total_docentes DESC, pd.uf ASC
      LIMIT 10;
    `);

    // 4. Conformidade Ética e TCLE (CEP/UFJF e Resolução CNS 510/2016)
    const tcleRes = await this.query(`
      SELECT 
        COUNT(*) as total_consentimentos_registrados,
        COUNT(CASE WHEN aceito = TRUE THEN 1 END) as total_aceites_validos,
        MIN(created_at) as primeiro_consentimento_em,
        MAX(created_at) as ultimo_consentimento_em
      FROM consentimentos_tcle;
    `);

    // 5. Gerações no Laboratório por Ferramenta
    const requisicoesRes = await this.query(`
      SELECT 
        ferramenta,
        COUNT(*) as total_geracoes
      FROM requisicoes_ia
      GROUP BY ferramenta;
    `);

    return {
      metadadosPesquisa: {
        tese: 'Plataforma IAprofEPT: Ambiente de Formação e Inteligência Artificial Generativa para Docência em Matemática na Educação Profissional e Tecnológica',
        doutorando: 'Maycon Luiz Amaral Magalhães',
        programa: 'Programa de Pós-Graduação em Educação Matemática (PPGEM / UFJF)',
        orientadores: [
          'Prof. Dr. Eduardo Barrére (UFJF)',
          'Prof. Dr. Manuel José Cabral dos Santos Reis (UTAD / Portugal)',
        ],
        protocoloExperimental: 'Teste A/B Comparativo de 30 Dias (Groq LLaMA 3.3 70B vs Google Gemini 1.5 Flash)',
        conformidadeEtica: 'Comitê de Ética em Pesquisa (CEP/UFJF) — Resolução CNS 510/2016',
      },
      amostraDocenteRfepct: docentesRes.rows[0] || {
        total_docentes_cadastrados: 0,
        total_ufs_alcancadas: 0,
        total_instituicoes_alcancadas: 0,
        areas_matematica_atendidas: 0,
      },
      experimentoAB30Dias: {
        totalAlocacoesExperimento: totalN,
        grupoA_Groq: totalA,
        grupoB_Gemini: totalB,
        proporcaoA: Number(proporcaoA.toFixed(4)),
        proporcaoB: Number(proporcaoB.toFixed(4)),
        razaoDistribuicao: totalB > 0 ? (totalA / totalB).toFixed(4) : '0',
        testeQuiQuadrado: {
          estatisticaQuiQuadrado: Number(quiQuadrado.toFixed(4)),
          valorCriticoAlpha005: 3.84146,
          hipoteseNulaAceita: chi2Valido,
          criterio1para1Atendido: chi2Valido && Math.abs(proporcaoA - 0.5) <= 0.05,
        },
        distribuicaoPorGrupo: gruposAbRes.rows,
      },
      distribuicaoGeograficaUf: distribuicaoUfRes.rows,
      telemetriaMotoresIa: telemetriaRes.rows,
      geracoesLaboratorio: requisicoesRes.rows,
      auditoriaEticaTcle: tcleRes.rows[0] || {
        total_consentimentos_registrados: 0,
        total_aceites_validos: 0,
      },
      alertaEticoObrigatorio: 'Este material e suas métricas foram consolidados com rastreabilidade científica. Os materiais gerados por IA devem ser sempre revisados e validados pela autoridade docente antes de sua aplicação em sala de aula.',
      geradoEm: new Date().toISOString(),
    };
  }

  /**
   * Consulta registros brutos anonimizados de telemetria A/B
   */
  async getTelemetriaAbRaw({ limit = 50, motor = null, status = null } = {}) {
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (motor) {
      conditions.push(`motor_ia = $${paramIndex++}`);
      params.push(motor);
    }

    if (status) {
      conditions.push(`status_execucao = $${paramIndex++}`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const res = await this.query(
      `SELECT 
         id, motor_ia, modelo_especifico, latencia_ms,
         tokens_prompt, tokens_completion, total_tokens,
         status_execucao, fallback_utilizado,
         grupo_experimental, chave_alocacao, criterio_alocacao, experimento_ativo,
         criado_em
       FROM telemetria_ab
       ${whereClause}
       ORDER BY criado_em DESC
       LIMIT $${paramIndex++};`,
      [...params, limitNum]
    );

    return res.rows;
  }
}

export const metricasRepository = new MetricasRepository();
export default metricasRepository;

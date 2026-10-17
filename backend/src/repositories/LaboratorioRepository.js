import { BaseRepository } from './BaseRepository.js';
import crypto from 'crypto';

/**
 * Repositório do Laboratório de IA e Telemetria A/B
 * Plataforma IAprofEPT — PPGEM / UFJF
 */
export class LaboratorioRepository extends BaseRepository {
  constructor() {
    super('requisicoes_ia');
  }

  /**
   * Registra a requisição pedagógica gerada e sua respectiva telemetria A/B
   * em uma transação ACID atômica.
   */
  async registrarGeracaoETelemetria({
    usuarioId = null,
    ferramenta = 'exercicios',
    parametrosEntrada,
    conteudoGerado,
    formatoSaida = null,
    habilidadesBncc = [],
    avisoEticoInjetado = true,
    telemetria,
  }) {
    return this.transaction(async (client) => {
      // 1. Inserção na tabela requisicoes_ia
      const reqSql = `
        INSERT INTO requisicoes_ia (
          usuario_id,
          ferramenta,
          parametros_entrada,
          conteudo_gerado,
          formato_saida,
          habilidades_bncc,
          aviso_etico_injetado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `;
      const reqRes = await client.query(reqSql, [
        usuarioId,
        ferramenta,
        JSON.stringify(parametrosEntrada),
        typeof conteudoGerado === 'string'
          ? conteudoGerado
          : JSON.stringify(conteudoGerado),
        formatoSaida ? JSON.stringify(formatoSaida) : null,
        JSON.stringify(habilidadesBncc),
        avisoEticoInjetado,
      ]);
      const requisicao = reqRes.rows[0];

      // 2. Hash anonimizado do usuário para LGPD / CEP
      const usuarioIdHash = usuarioId
        ? crypto.createHash('sha256').update(usuarioId).digest('hex')
        : crypto.createHash('sha256').update('anonimo-' + Date.now()).digest('hex');

      // 3. Inserção na tabela telemetria_ab
      const telSql = `
        INSERT INTO telemetria_ab (
          requisicao_ia_id,
          usuario_id_hash,
          motor_ia,
          modelo_especifico,
          latencia_ms,
          tokens_prompt,
          tokens_completion,
          total_tokens,
          status_execucao,
          fallback_utilizado,
          mensagem_erro,
          parametros_curriculares,
          grupo_experimental,
          chave_alocacao,
          criterio_alocacao,
          experimento_ativo
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *;
      `;
      const telRes = await client.query(telSql, [
        requisicao.id,
        usuarioIdHash,
        telemetria.motorIa || 'groq',
        telemetria.modeloEspecifico,
        telemetria.latenciaMs,
        telemetria.tokensPrompt || null,
        telemetria.tokensCompletion || null,
        telemetria.totalTokens || null,
        telemetria.statusExecucao || 'sucesso',
        telemetria.fallbackUtilizado || false,
        telemetria.mensagemErro || null,
        JSON.stringify(parametrosEntrada),
        telemetria.grupoExperimental || telemetria.grupo || (telemetria.motorIa === 'gemini' ? 'B' : 'A'),
        telemetria.chaveAlocacao || null,
        telemetria.criterioAlocacao || 'padrao',
        telemetria.experimentoAtivo !== undefined ? telemetria.experimentoAtivo : true,
      ]);
      const telemetriaGravada = telRes.rows[0];

      return {
        requisicao,
        telemetria: telemetriaGravada,
      };
    });
  }

  /**
   * Registra falha de inferência para fins de telemetria A/B
   */
  async registrarFalhaTelemetria({
    usuarioId = null,
    motorIa = 'groq',
    modeloEspecifico,
    latenciaMs,
    mensagemErro,
    parametrosCurriculares = {},
    fallbackUtilizado = false,
    grupoExperimental = null,
    chaveAlocacao = null,
    criterioAlocacao = 'fallback_erro',
    experimentoAtivo = true,
  }) {
    const usuarioIdHash = usuarioId
      ? crypto.createHash('sha256').update(usuarioId).digest('hex')
      : crypto.createHash('sha256').update('anonimo-falha-' + Date.now()).digest('hex');

    const reqSql = `
      INSERT INTO requisicoes_ia (
        usuario_id,
        ferramenta,
        parametros_entrada,
        conteudo_gerado,
        habilidades_bncc,
        aviso_etico_injetado
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const reqRes = await this.query(reqSql, [
      usuarioId,
      parametrosCurriculares.ferramenta || 'exercicios',
      JSON.stringify(parametrosCurriculares),
      'ERRO_INFERENCIA: ' + mensagemErro,
      JSON.stringify([]),
      false,
    ]);
    const requisicao = reqRes.rows[0];

    const telSql = `
      INSERT INTO telemetria_ab (
        requisicao_ia_id,
        usuario_id_hash,
        motor_ia,
        modelo_especifico,
        latencia_ms,
        status_execucao,
        fallback_utilizado,
        mensagem_erro,
        parametros_curriculares,
        grupo_experimental,
        chave_alocacao,
        criterio_alocacao,
        experimento_ativo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;
    const telRes = await this.query(telSql, [
      requisicao.id,
      usuarioIdHash,
      motorIa,
      modeloEspecifico,
      latenciaMs,
      'erro',
      fallbackUtilizado,
      mensagemErro,
      JSON.stringify(parametrosCurriculares),
      grupoExperimental || (motorIa === 'gemini' ? 'B' : 'A'),
      chaveAlocacao || null,
      criterioAlocacao || 'fallback_erro',
      experimentoAtivo !== undefined ? experimentoAtivo : true,
    ]);

    return telRes.rows[0];
  }

  /**
   * Registra um evento formal de contingência acionado pelo Circuit Breaker
   * na tabela logs_auditoria para fins de governança e rastreabilidade científica (Tese Maycon Magalhães).
   */
  async registrarEventoContingencia({
    usuarioId = null,
    motorPrimario,
    motorSecundario,
    motivo,
    latenciaPrimarioMs = 0,
    latenciaSecundarioMs = 0,
    latenciaTotalMs = 0,
    estadoCircuito = 'OPEN',
    requisicaoId = null,
    parametros = {},
  }) {
    try {
      const payload = {
        tipo: 'FALLBACK_AUTOMATICO_CIRCUIT_BREAKER',
        motorPrimario,
        motorSecundario,
        motivo: typeof motivo === 'string' ? motivo : (motivo?.message || String(motivo)),
        latenciaPrimarioMs,
        latenciaSecundarioMs,
        latenciaTotalMs,
        estadoCircuito,
        requisicaoId,
        parametrosCurriculares: {
          areaMatematica: parametros.areaMatematica,
          cursoTecnico: parametros.cursoTecnico,
          ferramenta: parametros.ferramenta,
        },
        timestamp: new Date().toISOString(),
      };

      const auditSql = `
        INSERT INTO logs_auditoria (
          usuario_id,
          acao,
          recurso,
          payload
        ) VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
      const resAudit = await this.query(auditSql, [
        usuarioId,
        'CONTINGENCIA_CIRCUIT_BREAKER',
        'laboratorio_ia',
        JSON.stringify(payload),
      ]);

      return resAudit.rows[0];
    } catch (err) {
      console.error('[LaboratorioRepository] Erro ao gravar evento de contingência:', err.message);
      return null;
    }
  }
}

export const laboratorioRepository = new LaboratorioRepository();
export default laboratorioRepository;

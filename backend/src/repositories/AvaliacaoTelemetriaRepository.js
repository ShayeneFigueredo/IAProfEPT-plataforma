import { BaseRepository } from './BaseRepository.js';
import { NotFoundError, ConflictError } from '../errors/AppError.js';

/**
 * Repositório de Avaliação Docente por Estrelas (1 a 5) e Feedback da Telemetria A/B
 * Plataforma IAprofEPT — PPGEM / UFJF
 * Doutorando: Maycon Luiz Amaral Magalhães
 */
export class AvaliacaoTelemetriaRepository extends BaseRepository {
  constructor() {
    super('avaliacoes_telemetria_ab');
  }

  /**
   * Registra a avaliação do docente vinculando à geração pedagógica no PostgreSQL.
   * Garante impedimento de avaliações duplicadas (Critério de Aceite).
   * 
   * @param {Object} dados
   * @param {string} dados.requisicaoId
   * @param {string|null} [dados.usuarioId]
   * @param {string} dados.usuarioIdHash
   * @param {number} dados.notaEstrelas
   * @param {Array<string>} [dados.tagsQualitativas]
   * @param {string|null} [dados.comentarioCritico]
   * @returns {Promise<Object>} Avaliação registrada com metadados do experimento
   */
  async registrarAvaliacao({
    requisicaoId,
    usuarioId = null,
    usuarioIdHash,
    notaEstrelas,
    tagsQualitativas = [],
    comentarioCritico = null,
  }) {
    // 1. Verifica existência da requisição pedagógica pai
    const reqRes = await this.query(
      'SELECT id, ferramenta, created_at FROM requisicoes_ia WHERE id = $1;',
      [requisicaoId]
    );

    if (reqRes.rows.length === 0) {
      throw new NotFoundError(`Geração pedagógica com ID "${requisicaoId}" não foi encontrada no sistema.`);
    }
    const requisicao = reqRes.rows[0];

    // 2. Busca telemetria associada para desnormalização e rastreabilidade A/B
    const telRes = await this.query(
      `SELECT id, motor_ia, modelo_especifico, grupo_experimental, latencia_ms
       FROM telemetria_ab
       WHERE requisicao_ia_id = $1
       ORDER BY criado_em DESC
       LIMIT 1;`,
      [requisicaoId]
    );
    const telemetria = telRes.rows[0] || null;

    // 3. Verificação preventiva de duplicidade
    const dupCheck = await this.query(
      `SELECT id, created_at FROM avaliacoes_telemetria_ab
       WHERE requisicao_ia_id = $1 AND usuario_id_hash = $2;`,
      [requisicaoId, usuarioIdHash]
    );

    if (dupCheck.rows.length > 0) {
      throw new ConflictError('Você já avaliou esta geração pedagógica anteriormente. Não são permitidas avaliações duplicadas.');
    }

    // 4. Validação de chave estrangeira do usuário (se fornecido)
    let usuarioIdValido = null;
    const isUuid = (val) =>
      typeof val === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

    if (isUuid(usuarioId)) {
      const uCheck = await this.query('SELECT id FROM usuarios WHERE id = $1;', [usuarioId]);
      if (uCheck.rows.length > 0) {
        usuarioIdValido = usuarioId;
      }
    }

    // 5. Inserção com tratamento do erro de constraint única (PostgreSQL 23505)
    try {
      const sqlInsert = `
        INSERT INTO avaliacoes_telemetria_ab (
          requisicao_ia_id,
          telemetria_ab_id,
          usuario_id,
          usuario_id_hash,
          nota_estrelas,
          tags_qualitativas,
          comentario_critico,
          motor_ia,
          modelo_especifico,
          grupo_experimental
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
      `;

      const insertRes = await this.query(sqlInsert, [
        requisicaoId,
        telemetria?.id || null,
        usuarioIdValido,
        usuarioIdHash,
        notaEstrelas,
        JSON.stringify(tagsQualitativas),
        comentarioCritico,
        telemetria?.motor_ia || null,
        telemetria?.modelo_especifico || null,
        telemetria?.grupo_experimental || null,
      ]);

      const avaliacaoGravada = insertRes.rows[0];

      return {
        id: avaliacaoGravada.id,
        requisicaoId: avaliacaoGravada.requisicao_ia_id,
        telemetriaId: avaliacaoGravada.telemetria_ab_id,
        usuarioHash: avaliacaoGravada.usuario_id_hash,
        notaEstrelas: avaliacaoGravada.nota_estrelas,
        tagsQualitativas: avaliacaoGravada.tags_qualitativas,
        comentarioCritico: avaliacaoGravada.comentario_critico,
        motorIa: avaliacaoGravada.motor_ia,
        modeloEspecifico: avaliacaoGravada.modelo_especifico,
        grupoExperimental: avaliacaoGravada.grupo_experimental,
        createdAt: avaliacaoGravada.created_at,
        ferramentaPedagogica: requisicao.ferramenta,
      };
    } catch (err) {
      if (err.code === '23505') {
        throw new ConflictError('Você já avaliou esta geração pedagógica anteriormente. Não são permitidas avaliações duplicadas.');
      }
      throw err;
    }
  }

  /**
   * Consulta a avaliação existente de um docente para uma geração específica
   */
  async obterPorRequisicaoEUsuario(requisicaoId, usuarioIdHash) {
    const res = await this.query(
      `SELECT * FROM avaliacoes_telemetria_ab
       WHERE requisicao_ia_id = $1 AND usuario_id_hash = $2;`,
      [requisicaoId, usuarioIdHash]
    );

    return res.rows[0] || null;
  }

  /**
   * Consolida métricas estatísticas das avaliações para o relatório da Tese de Doutorado
   */
  async obterEstatisticasAvaliacoes() {
    // 1. Média geral e totais
    const geralRes = await this.query(`
      SELECT 
        COUNT(*) as total_avaliacoes,
        ROUND(AVG(nota_estrelas), 2) as media_geral_estrelas,
        MIN(nota_estrelas) as nota_minima,
        MAX(nota_estrelas) as nota_maxima,
        COUNT(CASE WHEN comentario_critico IS NOT NULL THEN 1 END) as total_comentarios
      FROM avaliacoes_telemetria_ab;
    `);

    // 2. Desempenho comparativo A/B por Motor de IA
    const motoresRes = await this.query(`
      SELECT 
        COALESCE(motor_ia, 'nao_identificado') as motor,
        COALESCE(grupo_experimental, '-') as grupo,
        COUNT(*) as total_avaliacoes,
        ROUND(AVG(nota_estrelas), 2) as media_estrelas,
        COUNT(CASE WHEN nota_estrelas = 5 THEN 1 END) as estrelas_5,
        COUNT(CASE WHEN nota_estrelas = 4 THEN 1 END) as estrelas_4,
        COUNT(CASE WHEN nota_estrelas = 3 THEN 1 END) as estrelas_3,
        COUNT(CASE WHEN nota_estrelas = 2 THEN 1 END) as estrelas_2,
        COUNT(CASE WHEN nota_estrelas = 1 THEN 1 END) as estrelas_1
      FROM avaliacoes_telemetria_ab
      GROUP BY motor_ia, grupo_experimental
      ORDER BY motor ASC;
    `);

    // 3. Frequência das tags qualitativas pedagógicas
    const tagsRes = await this.query(`
      SELECT jsonb_array_elements_text(tags_qualitativas) as tag, COUNT(*) as frequencia
      FROM avaliacoes_telemetria_ab
      GROUP BY tag
      ORDER BY frequencia DESC;
    `);

    // 4. Últimos comentários críticos anonimizados
    const comentariosRes = await this.query(`
      SELECT 
        id, nota_estrelas, tags_qualitativas, comentario_critico,
        motor_ia, grupo_experimental, created_at
      FROM avaliacoes_telemetria_ab
      WHERE comentario_critico IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 10;
    `);

    return {
      visaoGeral: geralRes.rows[0] || {
        total_avaliacoes: 0,
        media_geral_estrelas: 0,
        total_comentarios: 0,
      },
      comparativoMotoresAB: motoresRes.rows,
      tagsQualitativasFrequencia: tagsRes.rows,
      comentariosCriticosRecentes: comentariosRes.rows,
      geradoEm: new Date().toISOString(),
    };
  }
}

export const avaliacaoTelemetriaRepository = new AvaliacaoTelemetriaRepository();
export default avaliacaoTelemetriaRepository;

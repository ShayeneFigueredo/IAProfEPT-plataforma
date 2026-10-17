import { BaseRepository } from './BaseRepository.js';
import { NotFoundError } from '../errors/AppError.js';
import { TRILHAS_CONTEUDO } from '../config/trilhasContent.js';

/**
 * Repositório do Ambiente Formativo (Trilhas e Rastreamento de Progresso Docente)
 * Plataforma IAprofEPT — PPGEM / UFJF
 * Doutorando: Maycon Luiz Amaral Magalhães
 */
export class FormativoRepository extends BaseRepository {
  constructor() {
    super('trilhas_formativas');
  }

  /**
   * Lista as 4 trilhas formativas com status e percentual de progresso do docente
   * 
   * @param {string|null} [usuarioId] - UUID do docente autenticado (opcional)
   * @returns {Promise<Object>} Lista de trilhas enriquecidas e resumo geral
   */
  async listarTrilhasComProgresso(usuarioId = null) {
    let sql;
    let params = [];

    const isUuid = (val) =>
      typeof val === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

    if (usuarioId && isUuid(usuarioId)) {
      sql = `
        SELECT 
          t.id,
          t.codigo,
          t.titulo,
          t.descricao,
          t.carga_horaria,
          t.total_aulas,
          t.icone,
          t.ordem,
          t.ativo,
          p.id AS progresso_id,
          COALESCE(p.percentual_conclusao, 0.00) AS percentual_conclusao,
          COALESCE(p.aulas_concluidas, '[]'::jsonb) AS aulas_concluidas,
          p.status AS status_progresso,
          p.ultima_atividade_em
        FROM trilhas_formativas t
        LEFT JOIN progresso_trilhas p 
          ON p.trilha_id = t.id AND p.usuario_id = $1
        WHERE t.ativo = true
        ORDER BY t.ordem ASC;
      `;
      params = [usuarioId];
    } else {
      sql = `
        SELECT 
          t.id,
          t.codigo,
          t.titulo,
          t.descricao,
          t.carga_horaria,
          t.total_aulas,
          t.icone,
          t.ordem,
          t.ativo,
          NULL AS progresso_id,
          0.00 AS percentual_conclusao,
          '[]'::jsonb AS aulas_concluidas,
          NULL AS status_progresso,
          NULL AS ultima_atividade_em
        FROM trilhas_formativas t
        WHERE t.ativo = true
        ORDER BY t.ordem ASC;
      `;
      params = [];
    }

    const res = await this.query(sql, params);
    const rows = res.rows;

    let totalTrilhasConcluidas = 0;
    let somaPercentuais = 0;
    let trilhaAnteriorConcluida = true; // A primeira trilha (ordem 1) sempre começa desbloqueada

    const trilhasFormatadas = rows.map((r, index) => {
      const conteudoCanonica = TRILHAS_CONTEUDO[r.codigo] || {};
      const percentual = Number(parseFloat(r.percentual_conclusao || 0).toFixed(2));
      somaPercentuais += percentual;

      let aulasConcluidasArr = [];
      if (Array.isArray(r.aulas_concluidas)) {
        aulasConcluidasArr = r.aulas_concluidas;
      } else if (typeof r.aulas_concluidas === 'string') {
        try {
          aulasConcluidasArr = JSON.parse(r.aulas_concluidas);
        } catch (e) {
          aulasConcluidasArr = [];
        }
      }

      // Determinação inteligente de status do módulo formativo
      let statusFormativo = 'disponivel';

      if (percentual >= 100) {
        statusFormativo = 'concluido';
        totalTrilhasConcluidas++;
      } else if (percentual > 0) {
        statusFormativo = 'em_andamento';
      } else {
        // Se 0% de conclusão
        if (r.ordem === 1 || trilhaAnteriorConcluida) {
          statusFormativo = 'disponivel';
        } else {
          statusFormativo = 'bloqueado';
        }
      }

      // Atualiza controle para a próxima trilha da sequência
      trilhaAnteriorConcluida = percentual >= 100;

      return {
        id: r.id,
        codigo: r.codigo,
        moduloNumero: r.ordem,
        titulo: r.titulo,
        descricao: r.descricao,
        cargaHoraria: r.carga_horaria,
        duracaoEstimada: conteudoCanonica.duracaoEstimada || `${r.carga_horaria}h`,
        totalAulas: r.total_aulas,
        totalAulasConcluidas: aulasConcluidasArr.length,
        percentualConclusao: percentual,
        status: statusFormativo,
        icone: r.icone,
        ordem: r.ordem,
        ultimaAtividadeEm: r.ultima_atividade_em || null,
        aulasPreview: (conteudoCanonica.aulas || []).map((a) => ({
          id: a.id,
          ordem: a.ordem,
          titulo: a.titulo,
          duracaoMinutos: a.duracaoMinutos,
          tipo: a.tipo,
          concluida: aulasConcluidasArr.includes(a.id),
        })),
      };
    });

    const totalTrilhas = trilhasFormatadas.length;
    const percentualGeralPrograma = totalTrilhas > 0
      ? Number((somaPercentuais / totalTrilhas).toFixed(2))
      : 0;

    return {
      totalTrilhas,
      totalTrilhasConcluidas,
      percentualGeralPrograma,
      trilhas: trilhasFormatadas,
    };
  }

  /**
   * Busca os detalhes completos de uma trilha formativa (aulas, vídeos e materiais)
   * 
   * @param {string} idOuCodigo - UUID ou código amigável ('trilha-fundamentos') ou ordem
   * @param {string|null} [usuarioId] - UUID do docente autenticado
   * @returns {Promise<Object>} Trilha completa com aulas e status individualizado
   */
  async buscarTrilhaDetalhada(idOuCodigo, usuarioId = null) {
    const isUuid = (val) =>
      typeof val === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

    let sql;
    let params;

    if (isUuid(idOuCodigo)) {
      sql = 'SELECT * FROM trilhas_formativas WHERE id = $1 AND ativo = true LIMIT 1;';
      params = [idOuCodigo];
    } else {
      sql = 'SELECT * FROM trilhas_formativas WHERE (codigo = $1 OR ordem::text = $1) AND ativo = true LIMIT 1;';
      params = [idOuCodigo];
    }

    const res = await this.query(sql, params);
    if (res.rows.length === 0) {
      throw new NotFoundError(`Trilha formativa "${idOuCodigo}" não foi encontrada no Ambiente Formativo.`);
    }

    const trilha = res.rows[0];
    const conteudoCanonica = TRILHAS_CONTEUDO[trilha.codigo] || { aulas: [] };

    let aulasConcluidasArr = [];
    let percentualConclusao = 0.00;
    let statusProgresso = 'disponivel';
    let ultimaAtividadeEm = null;

    if (usuarioId && isUuid(usuarioId)) {
      const pRes = await this.query(
        'SELECT * FROM progresso_trilhas WHERE usuario_id = $1 AND trilha_id = $2 LIMIT 1;',
        [usuarioId, trilha.id]
      );

      if (pRes.rows.length > 0) {
        const prog = pRes.rows[0];
        percentualConclusao = Number(parseFloat(prog.percentual_conclusao || 0).toFixed(2));
        statusProgresso = prog.status || 'em_andamento';
        ultimaAtividadeEm = prog.ultima_atividade_em;

        if (Array.isArray(prog.aulas_concluidas)) {
          aulasConcluidasArr = prog.aulas_concluidas;
        } else if (typeof prog.aulas_concluidas === 'string') {
          try {
            aulasConcluidasArr = JSON.parse(prog.aulas_concluidas);
          } catch (e) {
            aulasConcluidasArr = [];
          }
        }
      }
    }

    const aulasEnriquecidas = (conteudoCanonica.aulas || []).map((aula) => ({
      ...aula,
      concluida: aulasConcluidasArr.includes(aula.id),
    }));

    return {
      id: trilha.id,
      codigo: trilha.codigo,
      moduloNumero: trilha.ordem,
      titulo: trilha.titulo,
      descricao: trilha.descricao,
      cargaHoraria: trilha.carga_horaria,
      duracaoEstimada: conteudoCanonica.duracaoEstimada || `${trilha.carga_horaria}h`,
      totalAulas: trilha.total_aulas,
      totalAulasConcluidas: aulasConcluidasArr.length,
      percentualConclusao,
      status: percentualConclusao >= 100 ? 'concluido' : (percentualConclusao > 0 ? 'em_andamento' : statusProgresso),
      ultimaAtividadeEm,
      icone: trilha.icone,
      ordem: trilha.ordem,
      aulas: aulasEnriquecidas,
    };
  }

  /**
   * Atualiza ou inicializa o progresso do docente em uma aula/trilha
   * Critério de Aceite: Persistência do progresso no PostgreSQL permitindo retomar entre sessões.
   * 
   * @param {Object} dados
   * @param {string} dados.usuarioId
   * @param {string} dados.trilhaIdentificador - UUID ou código da trilha
   * @param {string} dados.aulaId
   * @param {boolean} [dados.concluido=true]
   * @param {number|null} [dados.tempoAssistidoSegundos=null]
   * @returns {Promise<Object>} Progresso gravado com percentual recalculado
   */
  async atualizarProgressoDocente({
    usuarioId,
    trilhaIdentificador,
    aulaId,
    concluido = true,
    tempoAssistidoSegundos = null,
  }) {
    const isUuid = (val) =>
      typeof val === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

    // 1. Localiza a trilha
    let sqlTrilha;
    let paramsTrilha;
    if (isUuid(trilhaIdentificador)) {
      sqlTrilha = 'SELECT id, codigo, titulo, total_aulas FROM trilhas_formativas WHERE id = $1 AND ativo = true;';
      paramsTrilha = [trilhaIdentificador];
    } else {
      sqlTrilha = 'SELECT id, codigo, titulo, total_aulas FROM trilhas_formativas WHERE (codigo = $1 OR ordem::text = $1) AND ativo = true;';
      paramsTrilha = [trilhaIdentificador];
    }

    const tRes = await this.query(sqlTrilha, paramsTrilha);
    if (tRes.rows.length === 0) {
      throw new NotFoundError(`Trilha formativa "${trilhaIdentificador}" não encontrada.`);
    }
    const trilha = tRes.rows[0];

    // 2. Consulta progresso existente do docente
    const pRes = await this.query(
      'SELECT * FROM progresso_trilhas WHERE usuario_id = $1 AND trilha_id = $2 LIMIT 1;',
      [usuarioId, trilha.id]
    );

    let aulasSet = new Set();
    if (pRes.rows.length > 0) {
      const pRow = pRes.rows[0];
      let existingArr = [];
      if (Array.isArray(pRow.aulas_concluidas)) {
        existingArr = pRow.aulas_concluidas;
      } else if (typeof pRow.aulas_concluidas === 'string') {
        try {
          existingArr = JSON.parse(pRow.aulas_concluidas);
        } catch (e) {
          existingArr = [];
        }
      }
      existingArr.forEach((id) => aulasSet.add(id));
    }

    // 3. Atualiza o conjunto de aulas concluídas
    if (concluido) {
      aulasSet.add(aulaId);
    } else {
      aulasSet.delete(aulaId);
    }

    const aulasConcluidasArr = Array.from(aulasSet);
    const totalAulasTrilha = Math.max(1, trilha.total_aulas);
    const novoPercentual = Math.min(
      100.00,
      Number(((aulasConcluidasArr.length / totalAulasTrilha) * 100).toFixed(2))
    );

    let novoStatus = 'em_andamento';
    if (novoPercentual >= 100) {
      novoStatus = 'concluido';
    } else if (novoPercentual === 0) {
      novoStatus = 'em_andamento';
    }

    // 4. Executa UPSERT na tabela progresso_trilhas
    const upsertSql = `
      INSERT INTO progresso_trilhas (
        usuario_id,
        trilha_id,
        percentual_conclusao,
        aulas_concluidas,
        status,
        ultima_atividade_em,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())
      ON CONFLICT (usuario_id, trilha_id)
      DO UPDATE SET
        percentual_conclusao = EXCLUDED.percentual_conclusao,
        aulas_concluidas = EXCLUDED.aulas_concluidas,
        status = EXCLUDED.status,
        ultima_atividade_em = NOW(),
        updated_at = NOW()
      RETURNING *;
    `;

    const upsertRes = await this.query(upsertSql, [
      usuarioId,
      trilha.id,
      novoPercentual,
      JSON.stringify(aulasConcluidasArr),
      novoStatus,
    ]);

    const progressoGravado = upsertRes.rows[0];

    return {
      id: progressoGravado.id,
      usuarioId: progressoGravado.usuario_id,
      trilhaId: progressoGravado.trilha_id,
      trilhaCodigo: trilha.codigo,
      trilhaTitulo: trilha.titulo,
      aulaId,
      aulaConcluida: concluido,
      totalAulasConcluidas: aulasConcluidasArr.length,
      totalAulasTrilha: trilha.total_aulas,
      percentualConclusao: Number(parseFloat(progressoGravado.percentual_conclusao).toFixed(2)),
      status: progressoGravado.status,
      aulasConcluidas: aulasConcluidasArr,
      ultimaAtividadeEm: progressoGravado.ultima_atividade_em,
      tempoAssistidoSegundos,
    };
  }
}

export const formativoRepository = new FormativoRepository();
export default formativoRepository;

import { BaseRepository } from './BaseRepository.js';
import { NotFoundError, ForbiddenError } from '../errors/AppError.js';

/**
 * Repositório de Interações Comunitárias (Curtidas, Favoritos e Relatos de Experiência)
 * Plataforma IAprofEPT — Tese de Doutorado PPGEM / UFJF
 * 
 * Atende aos requisitos:
 * - Operações atômicas no PostgreSQL com FOR UPDATE para evitar condições de corrida (Race Conditions)
 * - Toggle de curtidas e favoritos com consistência referencial
 * - Comentários e relatos de experiência com atualização atômica de contadores e média de estrelas
 */
export class InteracoesRepository extends BaseRepository {
  constructor() {
    super('curtidas_praticas');
  }

  /**
   * Toggle de Curtida com incremento/decremento atômico de contadores no PostgreSQL.
   * Evita race conditions utilizando bloqueio de linha FOR UPDATE na prática.
   * 
   * @param {string} praticaId
   * @param {string} usuarioId
   * @returns {Promise<{ praticaId: string, curtido: boolean, totalCurtidas: number }>}
   */
  async toggleCurtida(praticaId, usuarioId) {
    return this.transaction(async (client) => {
      // 1. Bloqueia a linha da prática para atualização exclusiva nesta transação
      const praticaRes = await client.query(
        `SELECT id, total_curtidas FROM praticas_repositorio WHERE id = $1 AND deleted_at IS NULL FOR UPDATE;`,
        [praticaId]
      );

      if (praticaRes.rows.length === 0) {
        throw new NotFoundError(`Prática pedagógica com ID '${praticaId}' não encontrada ou já removida.`);
      }

      // 2. Verifica se o usuário já curtiu
      const checkRes = await client.query(
        `SELECT id FROM curtidas_praticas WHERE pratica_id = $1 AND usuario_id = $2;`,
        [praticaId, usuarioId]
      );

      let curtido;
      let totalCurtidas;

      if (checkRes.rows.length > 0) {
        // Descurtir (Unlike)
        await client.query(
          `DELETE FROM curtidas_praticas WHERE pratica_id = $1 AND usuario_id = $2;`,
          [praticaId, usuarioId]
        );
        const updateRes = await client.query(
          `UPDATE praticas_repositorio 
           SET total_curtidas = GREATEST(0, total_curtidas - 1), updated_at = NOW() 
           WHERE id = $1 
           RETURNING total_curtidas;`,
          [praticaId]
        );
        curtido = false;
        totalCurtidas = updateRes.rows[0].total_curtidas;
      } else {
        // Curtir (Like)
        await client.query(
          `INSERT INTO curtidas_praticas (pratica_id, usuario_id, created_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (pratica_id, usuario_id) DO NOTHING;`,
          [praticaId, usuarioId]
        );
        const updateRes = await client.query(
          `UPDATE praticas_repositorio 
           SET total_curtidas = total_curtidas + 1, updated_at = NOW() 
           WHERE id = $1 
           RETURNING total_curtidas;`,
          [praticaId]
        );
        curtido = true;
        totalCurtidas = updateRes.rows[0].total_curtidas;
      }

      return {
        praticaId,
        curtido,
        totalCurtidas,
      };
    });
  }

  /**
   * Toggle de Favorito com incremento/decremento atômico de contadores no PostgreSQL.
   * Evita race conditions utilizando bloqueio de linha FOR UPDATE na prática.
   * 
   * @param {string} praticaId
   * @param {string} usuarioId
   * @returns {Promise<{ praticaId: string, favoritado: boolean, totalFavoritos: number }>}
   */
  async toggleFavorito(praticaId, usuarioId) {
    return this.transaction(async (client) => {
      // 1. Bloqueia a linha da prática para atualização exclusiva nesta transação
      const praticaRes = await client.query(
        `SELECT id, total_favoritos FROM praticas_repositorio WHERE id = $1 AND deleted_at IS NULL FOR UPDATE;`,
        [praticaId]
      );

      if (praticaRes.rows.length === 0) {
        throw new NotFoundError(`Prática pedagógica com ID '${praticaId}' não encontrada ou já removida.`);
      }

      // 2. Verifica se o usuário já favoritou
      const checkRes = await client.query(
        `SELECT id FROM favoritos_praticas WHERE pratica_id = $1 AND usuario_id = $2;`,
        [praticaId, usuarioId]
      );

      let favoritado;
      let totalFavoritos;

      if (checkRes.rows.length > 0) {
        // Desfavoritar
        await client.query(
          `DELETE FROM favoritos_praticas WHERE pratica_id = $1 AND usuario_id = $2;`,
          [praticaId, usuarioId]
        );
        const updateRes = await client.query(
          `UPDATE praticas_repositorio 
           SET total_favoritos = GREATEST(0, total_favoritos - 1), updated_at = NOW() 
           WHERE id = $1 
           RETURNING total_favoritos;`,
          [praticaId]
        );
        favoritado = false;
        totalFavoritos = updateRes.rows[0].total_favoritos;
      } else {
        // Favoritar
        await client.query(
          `INSERT INTO favoritos_praticas (pratica_id, usuario_id, created_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (pratica_id, usuario_id) DO NOTHING;`,
          [praticaId, usuarioId]
        );
        const updateRes = await client.query(
          `UPDATE praticas_repositorio 
           SET total_favoritos = total_favoritos + 1, updated_at = NOW() 
           WHERE id = $1 
           RETURNING total_favoritos;`,
          [praticaId]
        );
        favoritado = true;
        totalFavoritos = updateRes.rows[0].total_favoritos;
      }

      return {
        praticaId,
        favoritado,
        totalFavoritos,
      };
    });
  }

  /**
   * Adiciona comentário ou relato de experiência de aplicação em sala de aula de forma atômica.
   * Se informado notaEstrelas, atualiza também a tabela avaliacoes_praticas e recalcula a média.
   * 
   * @param {string} praticaId
   * @param {string} usuarioId
   * @param {Object} dados - { texto, relatoExperiencia, turmaContexto, notaEstrelas }
   * @returns {Promise<Object>} Comentário criado com metadados do autor
   */
  async adicionarComentario(praticaId, usuarioId, dados) {
    return this.transaction(async (client) => {
      // 1. Bloqueia linha da prática
      const praticaRes = await client.query(
        `SELECT id FROM praticas_repositorio WHERE id = $1 AND deleted_at IS NULL FOR UPDATE;`,
        [praticaId]
      );

      if (praticaRes.rows.length === 0) {
        throw new NotFoundError(`Prática pedagógica com ID '${praticaId}' não encontrada ou já removida.`);
      }

      // 2. Insere comentário na tabela comentarios_praticas
      const insertSql = `
        INSERT INTO comentarios_praticas (
          pratica_id,
          usuario_id,
          texto,
          relato_experiencia,
          turma_contexto,
          nota_estrelas,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, NOW(), NOW()
        )
        RETURNING *;
      `;

      const insertParams = [
        praticaId,
        usuarioId,
        dados.texto,
        dados.relatoExperiencia || false,
        dados.turmaContexto || null,
        dados.notaEstrelas || null,
      ];

      const resInsert = await client.query(insertSql, insertParams);
      const comentario = resInsert.rows[0];

      // 3. Atualiza contador de comentários atomicamente
      await client.query(
        `UPDATE praticas_repositorio 
         SET total_comentarios = total_comentarios + 1, updated_at = NOW() 
         WHERE id = $1;`,
        [praticaId]
      );

      // 4. Se houver avaliação em estrelas (1 a 5), atualiza tabela avaliacoes_praticas e recalcula média
      if (dados.notaEstrelas && dados.notaEstrelas >= 1 && dados.notaEstrelas <= 5) {
        await client.query(
          `INSERT INTO avaliacoes_praticas (pratica_id, usuario_id, nota_estrelas, comentario, created_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (pratica_id, usuario_id) 
           DO UPDATE SET nota_estrelas = EXCLUDED.nota_estrelas, comentario = EXCLUDED.comentario;`,
          [praticaId, usuarioId, dados.notaEstrelas, dados.texto]
        );

        await client.query(
          `UPDATE praticas_repositorio p
           SET 
             media_estrelas = (
               SELECT COALESCE(ROUND(AVG(nota_estrelas)::numeric, 2), 0.00) 
               FROM avaliacoes_praticas 
               WHERE pratica_id = $1
             ),
             total_avaliacoes = (
               SELECT COUNT(*)::int 
               FROM avaliacoes_praticas 
               WHERE pratica_id = $1
             ),
             updated_at = NOW()
           WHERE p.id = $1;`,
          [praticaId]
        );
      }

      // 5. Busca dados do autor para enriquecimento da resposta
      const autorRes = await client.query(
        `SELECT u.id, u.nome, u.email, u.role, inst.nome AS instituicao, inst.campus 
         FROM usuarios u 
         LEFT JOIN perfis_docentes pd ON pd.usuario_id = u.id
         LEFT JOIN instituicoes_rfepct inst ON pd.instituicao_id = inst.id
         WHERE u.id = $1;`,
        [usuarioId]
      );

      return {
        id: comentario.id,
        praticaId: comentario.pratica_id,
        texto: comentario.texto,
        relatoExperiencia: comentario.relato_experiencia,
        turmaContexto: comentario.turma_contexto,
        notaEstrelas: comentario.nota_estrelas,
        createdAt: comentario.created_at,
        autor: autorRes.rows[0] || null,
      };
    });
  }

  /**
   * Lista comentários e relatos de experiência vinculados a uma prática.
   * 
   * @param {string} praticaId
   * @param {Object} opcoes - { page, limit, relatoExperiencia }
   * @returns {Promise<Object>}
   */
  async listarComentarios(praticaId, opcoes = {}) {
    const page = Math.max(1, parseInt(opcoes.page || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(opcoes.limit || '10', 10) || 10));
    const offset = (page - 1) * limit;

    const conditions = ['c.pratica_id = $1', 'c.deleted_at IS NULL'];
    const params = [praticaId];
    let paramIdx = 2;

    if (opcoes.relatoExperiencia !== undefined && opcoes.relatoExperiencia !== null) {
      conditions.push(`c.relato_experiencia = $${paramIdx++}`);
      params.push(Boolean(opcoes.relatoExperiencia));
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Contagem total
    const countSql = `SELECT COUNT(*)::int AS total FROM comentarios_praticas c ${whereClause};`;
    const countRes = await this.query(countSql, params);
    const totalRegistros = countRes.rows[0]?.total || 0;
    const totalPaginas = Math.ceil(totalRegistros / limit) || 1;

    // Consulta paginada
    const sql = `
      SELECT 
        c.id,
        c.pratica_id,
        c.texto,
        c.relato_experiencia,
        c.turma_contexto,
        c.nota_estrelas,
        c.created_at,
        u.id AS autor_id,
        u.nome AS autor_nome,
        u.email AS autor_email,
        u.role AS autor_role,
        inst.nome AS autor_instituicao,
        inst.campus AS autor_campus
      FROM comentarios_praticas c
      JOIN usuarios u ON u.id = c.usuario_id
      LEFT JOIN perfis_docentes pd ON pd.usuario_id = u.id
      LEFT JOIN instituicoes_rfepct inst ON pd.instituicao_id = inst.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++};
    `;

    params.push(limit, offset);
    const res = await this.query(sql, params);

    const comentarios = res.rows.map((row) => ({
      id: row.id,
      praticaId: row.pratica_id,
      texto: row.texto,
      relatoExperiencia: row.relato_experiencia,
      turmaContexto: row.turma_contexto,
      notaEstrelas: row.nota_estrelas,
      createdAt: row.created_at,
      autor: {
        id: row.autor_id,
        nome: row.autor_nome,
        email: row.autor_email,
        role: row.autor_role,
        instituicao: row.autor_instituicao || null,
        campus: row.autor_campus || null,
      },
    }));

    return {
      paginacao: {
        paginaAtual: page,
        itensPorPagina: limit,
        totalRegistros,
        totalPaginas,
        temProximaPagina: page < totalPaginas,
        temPaginaAnterior: page > 1,
      },
      comentarios,
    };
  }

  /**
   * Retorna se o usuário autenticado curtiu e/ou favoritou a prática especificada.
   * 
   * @param {string} praticaId
   * @param {string} usuarioId
   * @returns {Promise<{ curtido: boolean, favoritado: boolean }>}
   */
  async obterStatusInteracoes(praticaId, usuarioId) {
    if (!usuarioId) {
      return { curtido: false, favoritado: false };
    }

    const likeRes = await this.query(
      `SELECT 1 FROM curtidas_praticas WHERE pratica_id = $1 AND usuario_id = $2;`,
      [praticaId, usuarioId]
    );

    const favRes = await this.query(
      `SELECT 1 FROM favoritos_praticas WHERE pratica_id = $1 AND usuario_id = $2;`,
      [praticaId, usuarioId]
    );

    return {
      curtido: likeRes.rows.length > 0,
      favoritado: favRes.rows.length > 0,
    };
  }

  /**
   * Exclusão lógica com Soft Delete de comentário (apenas autor ou administrador).
   * 
   * @param {string} comentarioId
   * @param {string} usuarioId
   * @param {boolean} isAdm
   */
  async deletarComentario(comentarioId, usuarioId, isAdm = false) {
    return this.transaction(async (client) => {
      const checkRes = await client.query(
        `SELECT id, pratica_id, usuario_id FROM comentarios_praticas WHERE id = $1 AND deleted_at IS NULL FOR UPDATE;`,
        [comentarioId]
      );

      if (checkRes.rows.length === 0) {
        throw new NotFoundError(`Comentário com ID '${comentarioId}' não encontrado ou já removido.`);
      }

      const comentario = checkRes.rows[0];
      if (!isAdm && comentario.usuario_id !== usuarioId) {
        throw new ForbiddenError('Apenas o autor do comentário ou administradores podem removê-lo.');
      }

      await client.query(
        `UPDATE comentarios_praticas SET deleted_at = NOW() WHERE id = $1;`,
        [comentarioId]
      );

      await client.query(
        `UPDATE praticas_repositorio 
         SET total_comentarios = GREATEST(0, total_comentarios - 1), updated_at = NOW() 
         WHERE id = $1;`,
        [comentario.pratica_id]
      );

      return {
        id: comentarioId,
        praticaId: comentario.pratica_id,
        deletado: true,
      };
    });
  }
}

export const interacoesRepository = new InteracoesRepository();
export default interacoesRepository;

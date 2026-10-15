import { pool, query, getClient } from '../config/database.js';

/**
 * Camada de Acesso a Dados — Repositório Base
 * Plataforma IAprofEPT — PPGEM / UFJF
 */
export class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.pool = pool;
  }

  /**
   * Executa uma consulta SQL customizada
   * @param {string} text - SQL
   * @param {Array} params - Parâmetros
   */
  async query(text, params = []) {
    return query(text, params);
  }

  /**
   * Busca registro por ID (UUID)
   * @param {string} id
   */
  async findById(id) {
    const res = await query(
      `SELECT * FROM ${this.tableName} WHERE id = $1 AND (deleted_at IS NULL OR deleted_at = NULL) LIMIT 1;`,
      [id]
    );
    return res.rows[0] || null;
  }

  /**
   * Retorna contagem total de registros ativos
   */
  async count(whereClause = '1=1', params = []) {
    const res = await query(
      `SELECT COUNT(*)::int AS total FROM ${this.tableName} WHERE ${whereClause};`,
      params
    );
    return res.rows[0]?.total || 0;
  }

  /**
   * Executa operação transacional isolada (BEGIN / COMMIT / ROLLBACK)
   * @param {Function} callback - Função que recebe o client
   */
  async transaction(callback) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default BaseRepository;

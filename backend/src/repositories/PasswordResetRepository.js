import { BaseRepository } from './BaseRepository.js';

/**
 * Repositório de Tokens de Recuperação de Senha no PostgreSQL
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Regras:
 * - Tokens armazenados com hash SHA-256
 * - Validade estrita de 2 horas
 * - Uso único e revogação atômica
 */
export class PasswordResetRepository extends BaseRepository {
  constructor() {
    super('tokens_recuperacao_senha');
  }

  /**
   * Grava um novo token de recuperação de senha
   * @param {object} params
   * @param {string} params.usuarioId
   * @param {string} params.tokenHash
   * @param {Date} params.expiraEm
   * @param {string|null} [params.ipSolicitacao]
   * @param {string|null} [params.userAgentSolicitacao]
   * @returns {Promise<object>}
   */
  async create({ usuarioId, tokenHash, expiraEm, ipSolicitacao = null, userAgentSolicitacao = null }) {
    const res = await this.query(
      `INSERT INTO tokens_recuperacao_senha (
         usuario_id, token_hash, expira_em, ip_solicitacao, user_agent_solicitacao
       )
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, usuario_id, token_hash, expira_em, usado, created_at;`,
      [usuarioId, tokenHash, expiraEm, ipSolicitacao, userAgentSolicitacao]
    );
    return res.rows[0];
  }

  /**
   * Busca token pelo hash SHA-256 com dados do usuário associado
   * @param {string} tokenHash
   * @returns {Promise<object|null>}
   */
  async findByTokenHash(tokenHash) {
    const res = await this.query(
      `SELECT t.*, u.id AS user_id, u.nome, u.email, u.role, u.status
       FROM tokens_recuperacao_senha t
       JOIN usuarios u ON t.usuario_id = u.id
       WHERE t.token_hash = $1
       LIMIT 1;`,
      [tokenHash]
    );
    return res.rows[0] || null;
  }

  /**
   * Invalida o token marcando como utilizado
   * @param {string} id
   * @param {string|null} [ipUso]
   * @returns {Promise<object|null>}
   */
  async markAsUsed(id, ipUso = null) {
    const res = await this.query(
      `UPDATE tokens_recuperacao_senha
       SET usado = TRUE,
           usado_em = NOW(),
           ip_uso = $2,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, usuario_id, usado, usado_em;`,
      [id, ipUso]
    );
    return res.rows[0] || null;
  }

  /**
   * Invalida quaisquer tokens pendentes anteriores do usuário
   * @param {string} usuarioId
   * @returns {Promise<number>}
   */
  async invalidatePendingByUsuarioId(usuarioId) {
    const res = await this.query(
      `UPDATE tokens_recuperacao_senha
       SET usado = TRUE,
           updated_at = NOW()
       WHERE usuario_id = $1 AND usado = FALSE AND expira_em > NOW()
       RETURNING id;`,
      [usuarioId]
    );
    return res.rowCount;
  }
}

export const passwordResetRepository = new PasswordResetRepository();
export default passwordResetRepository;

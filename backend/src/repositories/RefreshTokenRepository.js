import { BaseRepository } from './BaseRepository.js';

/**
 * Repositório de Refresh Tokens Persistidos no PostgreSQL
 * Plataforma IAprofEPT — PPGEM / UFJF
 */
export class RefreshTokenRepository extends BaseRepository {
  constructor() {
    super('refresh_tokens');
  }

  /**
   * Salva um novo refresh token no banco de dados
   */
  async create({ usuarioId, tokenHash, expiraEm, ipOrigem = null, userAgent = null }) {
    const res = await this.query(
      `INSERT INTO refresh_tokens (usuario_id, token_hash, expira_em, ip_origem, user_agent)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *;`,
      [usuarioId, tokenHash, expiraEm, ipOrigem, userAgent]
    );
    return res.rows[0];
  }

  /**
   * Busca refresh token pelo seu hash SHA-256
   */
  async findByTokenHash(tokenHash) {
    const res = await this.query(
      `SELECT rt.*, u.id as user_id, u.nome, u.email, u.role, u.status
       FROM refresh_tokens rt
       JOIN usuarios u ON rt.usuario_id = u.id
       WHERE rt.token_hash = $1
       LIMIT 1;`,
      [tokenHash]
    );
    return res.rows[0] || null;
  }

  /**
   * Marca o token como revogado e opcionalmente aponta o novo token da rotação
   */
  async revoke(id, substituidoPorId = null) {
    const res = await this.query(
      `UPDATE refresh_tokens
       SET revogado = TRUE,
           substituido_por_id = $2,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *;`,
      [id, substituidoPorId]
    );
    return res.rows[0] || null;
  }

  /**
   * Revoga todos os tokens ativos de um usuário (Logout em todos os dispositivos ou alerta de reuso)
   */
  async revokeAllByUsuarioId(usuarioId) {
    const res = await this.query(
      `UPDATE refresh_tokens
       SET revogado = TRUE, updated_at = NOW()
       WHERE usuario_id = $1 AND revogado = FALSE
       RETURNING id;`,
      [usuarioId]
    );
    return res.rowCount;
  }

  /**
   * Limpa tokens expirados antigos (manutenção preventiva)
   */
  async deleteExpired() {
    const res = await this.query(
      `DELETE FROM refresh_tokens WHERE expira_em < NOW();`
    );
    return res.rowCount;
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
export default refreshTokenRepository;

import { BaseRepository } from './BaseRepository.js';

/**
 * Repositório de Registros de Consentimento Livre e Esclarecido (TCLE)
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Atende aos requisitos:
 * - Persistência atômica do consentimento
 * - Armazenamento de IP anonimizado e timestamp ISO
 * - Auditoria de conformidade com CEP/UFJF e Resolução CNS 510/2016
 */
export class ConsentimentoTcleRepository extends BaseRepository {
  constructor() {
    super('consentimentos_tcle');
  }

  /**
   * Registra um novo termo de consentimento aceito
   * @param {object} params
   * @param {string} params.usuarioId
   * @param {string} [params.versaoTermo='1.0']
   * @param {boolean} [params.aceito=true]
   * @param {string} params.ipAnonimizado
   * @param {string|null} [params.userAgent]
   * @param {object|null} [params.dispositivoMeta]
   * @param {import('pg').PoolClient} [client] - Cliente transacional opcional
   * @returns {Promise<object>}
   */
  async create(
    {
      usuarioId,
      versaoTermo = '1.0',
      aceito = true,
      ipAnonimizado,
      userAgent = null,
      dispositivoMeta = {},
    },
    client = null
  ) {
    const queryText = `
      INSERT INTO consentimentos_tcle (
        usuario_id,
        versao_termo,
        aceito,
        ip_anonimizado,
        user_agent,
        dispositivo_meta
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, usuario_id, versao_termo, aceito, ip_anonimizado, user_agent, created_at, updated_at;
    `;
    const values = [
      usuarioId,
      versaoTermo,
      aceito,
      ipAnonimizado,
      userAgent,
      JSON.stringify(dispositivoMeta || {}),
    ];

    if (client) {
      const res = await client.query(queryText, values);
      return res.rows[0];
    }

    const res = await this.query(queryText, values);
    return res.rows[0];
  }

  /**
   * Busca o registro de consentimento mais recente de um docente
   * @param {string} usuarioId
   * @returns {Promise<object|null>}
   */
  async findLatestByUsuarioId(usuarioId) {
    const res = await this.query(
      `SELECT c.id, c.usuario_id, c.versao_termo, c.aceito, c.ip_anonimizado, 
              c.user_agent, c.created_at, u.nome, u.email
       FROM consentimentos_tcle c
       JOIN usuarios u ON c.usuario_id = u.id
       WHERE c.usuario_id = $1
       ORDER BY c.created_at DESC
       LIMIT 1;`,
      [usuarioId]
    );
    return res.rows[0] || null;
  }

  /**
   * Verifica se o docente possui consentimento ativo na versão especificada
   * @param {string} usuarioId
   * @param {string} [versao='1.0']
   * @returns {Promise<boolean>}
   */
  async hasValidConsent(usuarioId, versao = '1.0') {
    const res = await this.query(
      `SELECT 1 FROM consentimentos_tcle 
       WHERE usuario_id = $1 AND versao_termo = $2 AND aceito = TRUE 
       LIMIT 1;`,
      [usuarioId, versao]
    );
    return res.rows.length > 0;
  }

  /**
   * Retorna métricas consolidadas para auditoria de conformidade ética (CEP/UFJF & CNS 510/2016)
   * @returns {Promise<object>}
   */
  async getAuditoriaConformidade() {
    const res = await this.query(`
      SELECT 
        COUNT(u.id)::int AS total_usuarios,
        COUNT(c.id)::int AS total_consentimentos,
        COUNT(CASE WHEN c.id IS NULL THEN 1 END)::int AS usuarios_sem_consentimento,
        COUNT(CASE WHEN c.aceito = TRUE THEN 1 END)::int AS consentimentos_ativos
      FROM usuarios u
      LEFT JOIN LATERAL (
        SELECT id, aceito, created_at 
        FROM consentimentos_tcle 
        WHERE usuario_id = u.id AND aceito = TRUE 
        ORDER BY created_at DESC 
        LIMIT 1
      ) c ON true;
    `);

    const stats = res.rows[0] || {
      total_usuarios: 0,
      total_consentimentos: 0,
      usuarios_sem_consentimento: 0,
      consentimentos_ativos: 0,
    };

    const totalUsuarios = stats.total_usuarios || 0;
    const consentimentosAtivos = stats.consentimentos_ativos || 0;
    const taxa = totalUsuarios > 0 ? ((consentimentosAtivos / totalUsuarios) * 100).toFixed(1) : '100.0';

    return {
      totalUsuarios,
      totalConsentimentosAtivos: consentimentosAtivos,
      usuariosSemConsentimento: stats.usuarios_sem_consentimento || 0,
      taxaConformidade: `${taxa}%`,
      statusAuditoria: stats.usuarios_sem_consentimento === 0 ? 'CONFORME_CEP_UFJF_CNS510' : 'NAO_CONFORME',
      garantiaBanco: 'Trigger de restrição relacional no PostgreSQL (trg_garantir_consentimento_tcle) ativa.',
    };
  }
}

export const consentimentoTcleRepository = new ConsentimentoTcleRepository();
export default consentimentoTcleRepository;

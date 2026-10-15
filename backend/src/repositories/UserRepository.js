import { BaseRepository } from './BaseRepository.js';
import { cryptoService } from '../services/CryptoService.js';
import { BadRequestError } from '../errors/AppError.js';

/**
 * Repositório de Usuários e Perfis Docentes da RFEPCT
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Regras Inegociáveis:
 * - Persistência atômica via transações no PostgreSQL
 * - NUNCA expor 'senha_hash' em consultas públicas de perfil
 */
export class UserRepository extends BaseRepository {
  constructor() {
    super('usuarios');
  }

  /**
   * Busca usuário por e-mail institucional (case-insensitive) para autenticação
   * @param {string} email
   * @returns {Promise<object|null>}
   */
  async findByEmail(email) {
    const res = await this.query(
      `SELECT id, nome, email, senha_hash, role, status,
              tentativas_login_falhas, bloqueado_ate, ultimo_login_em,
              created_at, updated_at
       FROM usuarios 
       WHERE LOWER(email) = LOWER($1) 
       LIMIT 1;`,
      [email]
    );
    return res.rows[0] || null;
  }

  /**
   * Busca docente por matrícula SIAPE e UF de atuação para autenticação
   * @param {string} siape
   * @param {string|null} [uf]
   * @returns {Promise<object|null>}
   */
  async findByMatriculaSiape(siape, uf = null) {
    if (!siape) return null;
    const res = await this.query(
      `SELECT u.id, u.nome, u.email, u.senha_hash, u.role, u.status,
              u.tentativas_login_falhas, u.bloqueado_ate, u.ultimo_login_em,
              pd.id as perfil_id, pd.uf, pd.matricula_siape, pd.instituicao_id
       FROM perfis_docentes pd
       JOIN usuarios u ON pd.usuario_id = u.id
       WHERE pd.matricula_siape = $1
         AND ($2::text IS NULL OR pd.uf = $2)
       LIMIT 1;`,
      [siape, uf || null]
    );
    return res.rows[0] || null;
  }

  /**
   * Busca instituição por ID ou por Sigla/Nome/UF
   * @param {{ id?: string, termo?: string, uf?: string, campus?: string }} params
   * @returns {Promise<object|null>}
   */
  async findInstituicao({ id = null, termo = '', uf = null, campus = null }) {
    if (id) {
      const res = await this.query(
        `SELECT id, sigla, nome, campus, uf, tipo 
         FROM instituicoes_rfepct 
         WHERE id = $1 AND ativo = TRUE 
         LIMIT 1;`,
        [id]
      );
      if (res.rows[0]) return res.rows[0];
    }

    if (!termo && !uf && !campus) return null;

    // Busca por similaridade ou exata na tabela instituicoes_rfepct
    const queryText = `
      SELECT id, sigla, nome, campus, uf, tipo
      FROM instituicoes_rfepct
      WHERE ativo = TRUE
        AND ($1::text IS NULL OR $1 = '' OR sigla ILIKE $1 OR nome ILIKE '%' || $1 || '%')
        AND ($2::text IS NULL OR uf = $2)
        AND ($3::text IS NULL OR campus ILIKE '%' || $3 || '%')
      ORDER BY 
        CASE 
          WHEN sigla ILIKE $1 THEN 1 
          WHEN nome ILIKE $1 THEN 2 
          ELSE 3 
        END
      LIMIT 1;
    `;

    const res = await this.query(queryText, [termo || null, uf || null, campus || null]);
    return res.rows[0] || null;
  }

  /**
   * Cria registro completo de Docente (usuarios + perfis_docentes + consentimentos_tcle) de forma atômica
   * @param {object} params
   * @param {object} params.userData - { nome, email, senhaHash, role, status }
   * @param {object} params.profileData - { instituicaoId, uf, matriculaSiape, areaAtuacao, cursosTecnicos, termoEticoAceito, ipOrigem }
   * @param {object} [params.consentData] - { versaoTermo, ipAnonimizado, userAgent, dispositivoMeta }
   * @returns {Promise<{ usuario: object, perfil: object, consentimento: object }>}
   */
  async createDocenteWithProfile({ userData, profileData, consentData = {} }) {
    return this.transaction(async (client) => {
      // 0. Validação do Aceite do TCLE
      if (profileData.termoEticoAceito === false) {
        throw new BadRequestError(
          'O aceite do Termo de Consentimento Livre e Esclarecido (TCLE) é obrigatório para cadastro de docente.'
        );
      }

      // 1. Inserção na tabela 'usuarios'
      const userRes = await client.query(
        `INSERT INTO usuarios (nome, email, senha_hash, role, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, nome, email, role, status, created_at, updated_at;`,
        [
          userData.nome,
          userData.email,
          userData.senhaHash,
          userData.role || 'docente_rfepct',
          userData.status || 'ativo',
        ]
      );
      const usuario = userRes.rows[0];

      // 2. Inserção na tabela 'perfis_docentes'
      const profileRes = await client.query(
        `INSERT INTO perfis_docentes (
           usuario_id,
           instituicao_id,
           uf,
           matricula_siape,
           area_atuacao,
           cursos_tecnicos,
           termo_etico_aceito,
           termo_etico_versao,
           ip_aceite_termo
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, usuario_id, instituicao_id, uf, matricula_siape, 
                   area_atuacao, cursos_tecnicos, termo_etico_aceito, 
                   termo_etico_versao, data_aceite_termo, created_at, updated_at;`,
        [
          usuario.id,
          profileData.instituicaoId || null,
          profileData.uf,
          profileData.matriculaSiape || null,
          profileData.areaAtuacao || 'Matemática',
          JSON.stringify(profileData.cursosTecnicos || []),
          profileData.termoEticoAceito !== false,
          profileData.termoEticoVersao || '1.0',
          profileData.ipOrigem || null,
        ]
      );
      const perfil = profileRes.rows[0];

      // 3. Inserção mandatória na tabela 'consentimentos_tcle' (CEP/UFJF & Resolução CNS 510/2016)
      const versaoTermo = profileData.termoEticoVersao || consentData.versaoTermo || '1.0';
      const rawIp = consentData.ipOrigem || profileData.ipOrigem || '127.0.0.1';
      const ipAnonimizado = consentData.ipAnonimizado || cryptoService.anonymizeIp(rawIp);
      const userAgent = consentData.userAgent || null;

      const consentRes = await client.query(
        `INSERT INTO consentimentos_tcle (
           usuario_id,
           versao_termo,
           aceito,
           ip_anonimizado,
           user_agent,
           dispositivo_meta
         )
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, usuario_id, versao_termo, aceito, ip_anonimizado, user_agent, created_at;`,
        [
          usuario.id,
          versaoTermo,
          true,
          ipAnonimizado,
          userAgent,
          JSON.stringify(consentData.dispositivoMeta || {}),
        ]
      );
      const consentimento = consentRes.rows[0];

      // 4. Registro no log de auditoria
      await client.query(
        `INSERT INTO logs_auditoria (usuario_id, acao, recurso, payload, ip_anonimizado, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6);`,
        [
          usuario.id,
          'auth.aceite_tcle_cadastro',
          'consentimentos_tcle',
          JSON.stringify({
            versaoTermo,
            consentimentoId: consentimento.id,
            ipAnonimizado,
            resolucaoCns510: true,
            cepUfjf: true,
          }),
          ipAnonimizado,
          userAgent,
        ]
      );

      // Busca dados da instituição se vinculada
      let instituicao = null;
      if (perfil.instituicao_id) {
        const instRes = await client.query(
          `SELECT id, sigla, nome, campus, uf, tipo FROM instituicoes_rfepct WHERE id = $1;`,
          [perfil.instituicao_id]
        );
        instituicao = instRes.rows[0] || null;
      }

      return {
        usuario,
        perfil: {
          ...perfil,
          instituicao,
        },
        consentimento,
      };
    });
  }

  /**
   * Busca perfil docente completo e higienizado por ID de usuário (Sem senha_hash)
   * @param {string} userId
   * @returns {Promise<object|null>}
   */
  async findProfileByUserId(userId) {
    const res = await this.query(
      `SELECT 
         u.id AS usuario_id,
         u.nome,
         u.email,
         u.role,
         u.status,
         u.created_at AS usuario_created_at,
         pd.id AS perfil_id,
         pd.uf,
         pd.matricula_siape,
         pd.area_atuacao,
         pd.cursos_tecnicos,
         pd.termo_etico_aceito,
         pd.termo_etico_versao,
         pd.data_aceite_termo,
         i.id AS instituicao_id,
         i.sigla AS instituicao_sigla,
         i.nome AS instituicao_nome,
         i.campus AS instituicao_campus,
         i.tipo AS instituicao_tipo
       FROM usuarios u
       JOIN perfis_docentes pd ON pd.usuario_id = u.id
       LEFT JOIN instituicoes_rfepct i ON pd.instituicao_id = i.id
       WHERE u.id = $1
       LIMIT 1;`,
      [userId]
    );

    if (!res.rows[0]) return null;

    const row = res.rows[0];
    return {
      id: row.usuario_id,
      nome: row.nome,
      email: row.email,
      role: row.role,
      status: row.status,
      perfil: {
        id: row.perfil_id,
        uf: row.uf,
        matriculaSiape: row.matricula_siape,
        areaAtuacao: row.area_atuacao,
        cursosTecnicos: row.cursos_tecnicos,
        termoEtico: {
          aceito: row.termo_etico_aceito,
          versao: row.termo_etico_versao,
          dataAceite: row.data_aceite_termo,
        },
        instituicao: row.instituicao_id
          ? {
              id: row.instituicao_id,
              sigla: row.instituicao_sigla,
              nome: row.instituicao_nome,
              campus: row.instituicao_campus,
              tipo: row.instituicao_tipo,
            }
          : null,
      },
    };
  }

  /**
   * Registra falha de login, incrementando tentativas e aplicando bloqueio temporário se atingir 5 falhas
   * @param {string} userId
   * @param {number} newCount
   * @param {boolean} shouldLock
   * @returns {Promise<object>}
   */
  async recordLoginFailure(userId, newCount, shouldLock = false) {
    const res = await this.query(
      `UPDATE usuarios
       SET tentativas_login_falhas = $2,
           bloqueado_ate = CASE WHEN $3 = TRUE THEN NOW() + INTERVAL '15 minutes' ELSE bloqueado_ate END,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, tentativas_login_falhas, bloqueado_ate;`,
      [userId, newCount, shouldLock]
    );
    return res.rows[0];
  }

  /**
   * Registra login bem-sucedido, zerando falhas e atualizando timestamp de último login
   * @param {string} userId
   * @returns {Promise<object>}
   */
  async recordLoginSuccess(userId) {
    const res = await this.query(
      `UPDATE usuarios
       SET tentativas_login_falhas = 0,
           bloqueado_ate = NULL,
           ultimo_login_em = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, ultimo_login_em;`,
      [userId]
    );
    return res.rows[0];
  }

  /**
   * Atualiza a senha de um usuário, resetando falhas e bloqueios temporários
   * @param {string} userId
   * @param {string} novaSenhaHash
   * @returns {Promise<object>}
   */
  async updatePassword(userId, novaSenhaHash) {
    const res = await this.query(
      `UPDATE usuarios
       SET senha_hash = $2,
           tentativas_login_falhas = 0,
           bloqueado_ate = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, nome, email, updated_at;`,
      [userId, novaSenhaHash]
    );
    return res.rows[0];
  }

  /**
   * Registra log de auditoria no PostgreSQL
   * @param {object} params - { usuarioId, acao, recurso, payload, ip, userAgent }
   * @returns {Promise<object>}
   */
  async recordAuditLog({ usuarioId = null, acao, recurso = 'usuarios', payload = {}, ip = null, userAgent = null }) {
    try {
      const res = await this.query(
        `INSERT INTO logs_auditoria (usuario_id, acao, recurso, payload, ip_anonimizado, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, created_at;`,
        [usuarioId, acao, recurso, JSON.stringify(payload), ip, userAgent]
      );
      return res.rows[0];
    } catch (err) {
      console.error('[Auditoria] Falha ao gravar log no banco:', err.message);
      return null;
    }
  }

  /**
   * Listagem paginada de usuários para painel administrativo UFJF (sem expor senha_hash)
   * @param {object} params
   * @param {number} [params.page]
   * @param {number} [params.limit]
   * @param {string} [params.role]
   * @param {string} [params.status]
   * @param {string} [params.search]
   * @returns {Promise<object>}
   */
  async listUsers({ page = 1, limit = 20, role = null, status = null, search = null } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (role) {
      conditions.push(`u.role = $${paramIndex++}`);
      params.push(role);
    }

    if (status) {
      conditions.push(`u.status = $${paramIndex++}`);
      params.push(status);
    }

    if (search) {
      conditions.push(`(u.nome ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await this.query(
      `SELECT COUNT(*) as total FROM usuarios u ${whereClause};`,
      params
    );
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    const queryText = `
      SELECT 
        u.id, u.nome, u.email, u.role, u.status, u.ultimo_login_em,
        u.created_at, u.updated_at,
        pd.uf, pd.matricula_siape, pd.area_atuacao,
        i.sigla AS instituicao_sigla, i.nome AS instituicao_nome, i.campus AS instituicao_campus
      FROM usuarios u
      LEFT JOIN perfis_docentes pd ON pd.usuario_id = u.id
      LEFT JOIN instituicoes_rfepct i ON pd.instituicao_id = i.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++};
    `;

    const usersRes = await this.query(queryText, [...params, limitNum, offset]);

    return {
      total,
      pagina: pageNum,
      limite: limitNum,
      totalPaginas: Math.ceil(total / limitNum) || 1,
      usuarios: usersRes.rows,
    };
  }

  /**
   * Atualiza o status de um usuário pelo Administrador UFJF
   * @param {string} userId
   * @param {string} novoStatus
   * @param {string} [adminId]
   * @returns {Promise<object|null>}
   */
  async updateUserStatus(userId, novoStatus, adminId = null) {
    const res = await this.query(
      `UPDATE usuarios 
       SET status = $2, updated_at = NOW() 
       WHERE id = $1 
       RETURNING id, nome, email, role, status, updated_at;`,
      [userId, novoStatus]
    );

    const usuarioAtualizado = res.rows[0] || null;

    if (usuarioAtualizado && adminId) {
      await this.recordAuditLog({
        usuarioId: adminId,
        acao: 'admin.alteracao_status_usuario',
        recurso: 'usuarios',
        payload: {
          alvoUsuarioId: userId,
          novoStatus,
        },
      });
    }

    return usuarioAtualizado;
  }

  /**
   * Consulta paginada aos logs de auditoria do sistema
   * @param {object} params
   * @returns {Promise<object>}
   */
  async findAuditLogs({ page = 1, limit = 20, acao = null, recurso = null, usuarioId = null } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (acao) {
      conditions.push(`l.acao ILIKE $${paramIndex++}`);
      params.push(`%${acao}%`);
    }

    if (recurso) {
      conditions.push(`l.recurso = $${paramIndex++}`);
      params.push(recurso);
    }

    if (usuarioId) {
      conditions.push(`l.usuario_id = $${paramIndex++}`);
      params.push(usuarioId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await this.query(
      `SELECT COUNT(*) as total FROM logs_auditoria l ${whereClause};`,
      params
    );
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    const queryText = `
      SELECT 
        l.id, l.usuario_id, u.nome AS usuario_nome, u.email AS usuario_email, u.role AS usuario_role,
        l.acao, l.recurso, l.payload, l.ip_anonimizado, l.user_agent, l.created_at
      FROM logs_auditoria l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++};
    `;

    const logsRes = await this.query(queryText, [...params, limitNum, offset]);

    return {
      total,
      pagina: pageNum,
      limite: limitNum,
      totalPaginas: Math.ceil(total / limitNum) || 1,
      logs: logsRes.rows,
    };
  }

  /**
   * Consolida métricas gerais do sistema para a administração UFJF
   * @returns {Promise<object>}
   */
  async getSystemStats() {
    const usuariosRes = await this.query(`
      SELECT 
        COUNT(*) as total_usuarios,
        COUNT(CASE WHEN role = 'docente_rfepct' THEN 1 END) as total_docentes,
        COUNT(CASE WHEN role = 'pesquisador_doutorado' THEN 1 END) as total_pesquisadores,
        COUNT(CASE WHEN role = 'administrador_ufjf' THEN 1 END) as total_administradores,
        COUNT(CASE WHEN status = 'ativo' THEN 1 END) as total_ativos,
        COUNT(CASE WHEN bloqueado_ate IS NOT NULL AND bloqueado_ate > NOW() THEN 1 END) as total_bloqueados
      FROM usuarios;
    `);

    const instituicoesRes = await this.query(`
      SELECT COUNT(DISTINCT instituicao_id) as total_instituicoes_atendidas,
             COUNT(DISTINCT uf) as total_ufs_atendidas
      FROM perfis_docentes;
    `);

    const consentimentosRes = await this.query(`
      SELECT COUNT(*) as total_consentimentos_tcle FROM consentimentos_tcle WHERE aceito = TRUE;
    `);

    return {
      usuarios: usuariosRes.rows[0] || {},
      adopcaoRfepct: instituicoesRes.rows[0] || {},
      tcle: consentimentosRes.rows[0] || {},
    };
  }
}

export const userRepository = new UserRepository();
export default userRepository;


import { BaseRepository } from './BaseRepository.js';
import { NotFoundError, ForbiddenError } from '../errors/AppError.js';

/**
 * Repositório de Acesso a Dados: Anexos e Arquivos do Repositório Institucional
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Atende aos requisitos:
 * - Persistência atômica e consistente no PostgreSQL
 * - Suporte a Soft Delete (deleted_at)
 * - Rastreabilidade com SHA-256 de integridade e autor docente
 * - Vínculo relacional com práticas pedagógicas
 */
export class AnexosRepository extends BaseRepository {
  constructor() {
    super('anexos_repositorio');
  }

  /**
   * Persiste os metadados do anexo no PostgreSQL de forma atômica.
   * Se informado `praticaId`, atualiza também o campo `arquivo_anexo_url` na tabela `praticas_repositorio`.
   * 
   * @param {Object} dadosAnexo
   * @returns {Promise<Object>} Registro do anexo persistido
   */
  async salvarAnexo(dadosAnexo) {
    return this.transaction(async (client) => {
      const sqlInsert = `
        INSERT INTO anexos_repositorio (
          pratica_id,
          usuario_id,
          nome_original,
          nome_armazenado,
          mime_type,
          extensao,
          tamanho_bytes,
          hash_sha256,
          storage_tipo,
          caminho_storage,
          url_protegida,
          created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
        )
        RETURNING *;
      `;

      const paramsInsert = [
        dadosAnexo.praticaId || null,
        dadosAnexo.usuarioId,
        dadosAnexo.nomeOriginal,
        dadosAnexo.nomeArmazenado,
        dadosAnexo.mimeType,
        dadosAnexo.extensao,
        dadosAnexo.tamanhoBytes,
        dadosAnexo.hashSha256,
        dadosAnexo.storageTipo || 'local',
        dadosAnexo.caminhoStorage,
        dadosAnexo.urlProtegida,
      ];

      const resInsert = await client.query(sqlInsert, paramsInsert);
      const anexo = resInsert.rows[0];

      // Se vinculado a uma prática existente, atualiza a URL do anexo na prática
      if (dadosAnexo.praticaId) {
        await client.query(
          `UPDATE praticas_repositorio 
           SET arquivo_anexo_url = $1, updated_at = NOW() 
           WHERE id = $2 AND deleted_at IS NULL;`,
          [dadosAnexo.urlProtegida, dadosAnexo.praticaId]
        );
      }

      // Busca dados do autor para enriquecimento
      const autorRes = await client.query(
        `SELECT u.id, u.nome, u.email, u.role, inst.nome AS instituicao, inst.campus 
         FROM usuarios u 
         LEFT JOIN perfis_docentes pd ON pd.usuario_id = u.id
         LEFT JOIN instituicoes_rfepct inst ON pd.instituicao_id = inst.id
         WHERE u.id = $1;`,
        [dadosAnexo.usuarioId]
      );

      return {
        ...anexo,
        autor: autorRes.rows[0] || null,
      };
    });
  }

  /**
   * Busca anexo ativo por ID (UUID) com metadados do autor e da prática vinculada.
   * 
   * @param {string} anexoId
   * @returns {Promise<Object>}
   */
  async buscarPorId(anexoId) {
    const sql = `
      SELECT 
        a.id,
        a.pratica_id,
        a.usuario_id,
        a.nome_original,
        a.nome_armazenado,
        a.mime_type,
        a.extensao,
        a.tamanho_bytes,
        a.hash_sha256,
        a.storage_tipo,
        a.caminho_storage,
        a.url_protegida,
        a.created_at,
        a.deleted_at,
        u.nome AS autor_nome,
        u.email AS autor_email,
        u.role AS autor_role,
        inst.nome AS autor_instituicao,
        inst.campus AS autor_campus,
        p.titulo AS pratica_titulo,
        p.publicado AS pratica_publicado,
        p.usuario_id AS pratica_autor_id
      FROM anexos_repositorio a
      JOIN usuarios u ON u.id = a.usuario_id
      LEFT JOIN perfis_docentes pd ON pd.usuario_id = u.id
      LEFT JOIN instituicoes_rfepct inst ON pd.instituicao_id = inst.id
      LEFT JOIN praticas_repositorio p ON p.id = a.pratica_id AND p.deleted_at IS NULL
      WHERE a.id = $1 AND a.deleted_at IS NULL;
    `;

    const res = await this.query(sql, [anexoId]);
    if (res.rows.length === 0) {
      throw new NotFoundError(`Anexo com ID '${anexoId}' não encontrado ou já removido.`);
    }

    const row = res.rows[0];
    return {
      id: row.id,
      praticaId: row.pratica_id,
      usuarioId: row.usuario_id,
      nomeOriginal: row.nome_original,
      nomeArmazenado: row.nome_armazenado,
      mimeType: row.mime_type,
      extensao: row.extensao,
      tamanhoBytes: Number(row.tamanho_bytes),
      hashSha256: row.hash_sha256,
      storageTipo: row.storage_tipo,
      caminhoStorage: row.caminho_storage,
      urlProtegida: row.url_protegida,
      createdAt: row.created_at,
      autor: {
        id: row.usuario_id,
        nome: row.autor_nome,
        email: row.autor_email,
        role: row.autor_role,
        instituicao: row.autor_instituicao || null,
        campus: row.autor_campus || null,
      },
      pratica: row.pratica_id
        ? {
            id: row.pratica_id,
            titulo: row.pratica_titulo,
            publicado: row.pratica_publicado,
            autorId: row.pratica_autor_id,
          }
        : null,
    };
  }

  /**
   * Vincula um anexo previamente enviado a uma prática pedagógica.
   * 
   * @param {string} anexoId
   * @param {string} praticaId
   * @param {string} usuarioId
   * @param {boolean} isAdm
   * @returns {Promise<Object>}
   */
  async vincularPratica(anexoId, praticaId, usuarioId, isAdm = false) {
    return this.transaction(async (client) => {
      // 1. Verifica existência do anexo e propriedade
      const anexoRes = await client.query(
        `SELECT * FROM anexos_repositorio WHERE id = $1 AND deleted_at IS NULL FOR UPDATE;`,
        [anexoId]
      );
      if (anexoRes.rows.length === 0) {
        throw new NotFoundError(`Anexo com ID '${anexoId}' não encontrado.`);
      }
      const anexo = anexoRes.rows[0];
      if (!isAdm && anexo.usuario_id !== usuarioId) {
        throw new ForbiddenError('Apenas o autor do anexo ou administradores podem vinculá-lo a uma prática.');
      }

      // 2. Verifica existência da prática
      const praticaRes = await client.query(
        `SELECT * FROM praticas_repositorio WHERE id = $1 AND deleted_at IS NULL FOR UPDATE;`,
        [praticaId]
      );
      if (praticaRes.rows.length === 0) {
        throw new NotFoundError(`Prática com ID '${praticaId}' não encontrada.`);
      }
      const pratica = praticaRes.rows[0];
      if (!isAdm && pratica.usuario_id !== usuarioId) {
        throw new ForbiddenError('Apenas o autor da prática ou administradores podem vincular anexos a ela.');
      }

      // 3. Atualiza anexo e prática
      await client.query(
        `UPDATE anexos_repositorio SET pratica_id = $1 WHERE id = $2;`,
        [praticaId, anexoId]
      );

      await client.query(
        `UPDATE praticas_repositorio SET arquivo_anexo_url = $1, updated_at = NOW() WHERE id = $2;`,
        [anexo.url_protegida, praticaId]
      );

      return {
        anexoId,
        praticaId,
        urlProtegida: anexo.url_protegida,
      };
    });
  }

  /**
   * Exclusão lógica com Soft Delete do anexo.
   * 
   * @param {string} anexoId
   * @param {string} usuarioId
   * @param {boolean} isAdm
   * @returns {Promise<{ id: string, deletedAt: string }>}
   */
  async deletarAnexoSoft(anexoId, usuarioId, isAdm = false) {
    return this.transaction(async (client) => {
      const anexoRes = await client.query(
        `SELECT * FROM anexos_repositorio WHERE id = $1 AND deleted_at IS NULL FOR UPDATE;`,
        [anexoId]
      );

      if (anexoRes.rows.length === 0) {
        throw new NotFoundError(`Anexo com ID '${anexoId}' não encontrado ou já removido.`);
      }

      const anexo = anexoRes.rows[0];
      if (!isAdm && anexo.usuario_id !== usuarioId) {
        throw new ForbiddenError('Apenas o autor do upload ou administradores podem excluir este anexo.');
      }

      const updateRes = await client.query(
        `UPDATE anexos_repositorio 
         SET deleted_at = NOW() 
         WHERE id = $1 
         RETURNING id, deleted_at, pratica_id, url_protegida;`,
        [anexoId]
      );

      // Se estiver vinculado à prática e a URL da prática for a deste anexo, desvincula da prática
      if (anexo.pratica_id) {
        await client.query(
          `UPDATE praticas_repositorio 
           SET arquivo_anexo_url = NULL, updated_at = NOW() 
           WHERE id = $1 AND arquivo_anexo_url = $2;`,
          [anexo.pratica_id, anexo.url_protegida]
        );
      }

      return {
        id: anexoId,
        caminhoStorage: anexo.caminho_storage,
        storageTipo: anexo.storage_tipo,
        deletedAt: updateRes.rows[0].deleted_at,
      };
    });
  }
}

export const anexosRepository = new AnexosRepository();
export default anexosRepository;

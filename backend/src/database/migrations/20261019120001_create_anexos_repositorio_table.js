/**
 * Migration: Tabela de Anexos do Repositório de Práticas com Rastreabilidade de Integridade SHA-256
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Atende aos requisitos:
 * - Armazenamento de metadados de anexos (PDFs, DOCX e Imagens homologadas)
 * - Registro de hash criptográfico SHA-256 para garantia de integridade
 * - Suporte a armazenamento em disco local institucional ou S3/MinIO
 * - Auditoria com soft delete (deleted_at) e vínculo relacional com usuários e práticas
 * 
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.createTable('anexos_repositorio', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Vínculo opcional com prática pedagógica
    table.uuid('pratica_id')
      .nullable()
      .references('id')
      .inTable('praticas_repositorio')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Autor do upload (docente ou pesquisador autenticado)
    table.uuid('usuario_id')
      .notNullable()
      .references('id')
      .inTable('usuarios')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    table.string('nome_original', 255).notNullable();
    table.string('nome_armazenado', 255).notNullable().unique();
    table.string('mime_type', 100).notNullable();
    table.string('extensao', 20).notNullable();
    table.bigInteger('tamanho_bytes').notNullable();
    table.string('hash_sha256', 64).notNullable();
    table.string('storage_tipo', 20).notNullable().defaultTo('local'); // 'local', 's3', 'minio'
    table.text('caminho_storage').notNullable();
    table.text('url_protegida').notNullable();

    // Auditoria e Soft Delete
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at', { useTz: true }).nullable();

    table.index(['usuario_id'], 'idx_anexos_usuario');
    table.index(['pratica_id'], 'idx_anexos_pratica');
    table.index(['hash_sha256'], 'idx_anexos_hash_sha256');
    table.index(['deleted_at'], 'idx_anexos_deleted_at');
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('anexos_repositorio');
}

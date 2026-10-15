/**
 * Migration 9: Tabela de Refresh Tokens Persistidos no PostgreSQL para Revogação e Rotação
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Atende aos requisitos:
 * - Persistência de refresh tokens com hash SHA-256
 * - Suporte a revogação explícita (logout) e detecção de reuso
 * - Expiração configurável (padrão 7 dias)
 * 
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.createTable('refresh_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // CASCADE: Se o usuário for excluído, revoga todos os seus tokens
    table.uuid('usuario_id')
      .notNullable()
      .references('id')
      .inTable('usuarios')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    // Hash SHA-256 do token para segurança em repouso
    table.string('token_hash', 64).notNullable().unique();

    table.boolean('revogado').notNullable().defaultTo(false);
    table.uuid('substituido_por_id').nullable();

    table.string('ip_origem', 64).nullable();
    table.text('user_agent').nullable();
    table.timestamp('expira_em', { useTz: true }).notNullable();

    // Auditoria
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['usuario_id'], 'idx_refresh_tokens_usuario');
    table.index(['token_hash'], 'idx_refresh_tokens_hash');
    table.index(['expira_em'], 'idx_refresh_tokens_expira');
  });

  // Trigger para updated_at
  await knex.raw(`
    CREATE TRIGGER trg_refresh_tokens_updated_at 
    BEFORE UPDATE ON refresh_tokens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.raw('DROP TRIGGER IF EXISTS trg_refresh_tokens_updated_at ON refresh_tokens;');
  await knex.schema.dropTableIfExists('refresh_tokens');
}

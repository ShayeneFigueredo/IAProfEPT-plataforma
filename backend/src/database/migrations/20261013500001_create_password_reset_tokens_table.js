/**
 * Migration 10: Tabela de Tokens de Recuperação de Senha com Uso Único e Expiração de 2 Horas
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Atende aos requisitos:
 * - Persistência de token criptografado com SHA-256
 * - Validade estrita de 2 horas
 * - Uso único com flag de invalidação imediata (usado = TRUE)
 * - Registro de IP e auditoria de solicitação e consumo
 * 
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.createTable('tokens_recuperacao_senha', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Relacionamento com usuarios: CASCADE na exclusão da conta
    table.uuid('usuario_id')
      .notNullable()
      .references('id')
      .inTable('usuarios')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    // Hash SHA-256 do token bruto para proteção em repouso
    table.string('token_hash', 64).notNullable().unique();

    // Expiração mandatória (2 horas a partir da geração)
    table.timestamp('expira_em', { useTz: true }).notNullable();

    // Flag de uso único
    table.boolean('usado').notNullable().defaultTo(false);
    table.timestamp('usado_em', { useTz: true }).nullable();

    // Auditoria de rede
    table.string('ip_solicitacao', 64).nullable();
    table.text('user_agent_solicitacao').nullable();
    table.string('ip_uso', 64).nullable();

    // Auditoria
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // Índices para busca rápida e controle de expiração
    table.index(['usuario_id'], 'idx_reset_tokens_usuario');
    table.index(['token_hash'], 'idx_reset_tokens_hash');
    table.index(['expira_em', 'usado'], 'idx_reset_tokens_status');
  });

  // Trigger para updated_at
  await knex.raw(`
    CREATE TRIGGER trg_tokens_recuperacao_updated_at 
    BEFORE UPDATE ON tokens_recuperacao_senha 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.raw('DROP TRIGGER IF EXISTS trg_tokens_recuperacao_updated_at ON tokens_recuperacao_senha;');
  await knex.schema.dropTableIfExists('tokens_recuperacao_senha');
}

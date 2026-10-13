/**
 * Migration 1: Extensões do PostgreSQL e Tabela de Instituições da RFEPCT
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  // 1. Extensões essenciais para UUIDv4 e busca por similaridade trigram
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pg_trgm";');

  // 2. Função de trigger para atualizar updated_at automaticamente
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // 3. Tabela instituicoes_rfepct
  await knex.schema.createTable('instituicoes_rfepct', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('sigla', 30).notNullable();
    table.string('nome', 255).notNullable();
    table.string('campus', 150).notNullable();
    table.specificType('uf', 'char(2)').notNullable().index();
    table.string('tipo', 40).notNullable().defaultTo('IF');
    table.boolean('ativo').notNullable().defaultTo(true);
    
    // Campos de auditoria
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // Trigger para updated_at
  await knex.raw(`
    CREATE TRIGGER trg_instituicoes_updated_at 
    BEFORE UPDATE ON instituicoes_rfepct 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.raw('DROP TRIGGER IF EXISTS trg_instituicoes_updated_at ON instituicoes_rfepct;');
  await knex.schema.dropTableIfExists('instituicoes_rfepct');
}

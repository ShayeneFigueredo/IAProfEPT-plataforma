/**
 * Migration 6: Fóruns de Reflexão Ética, Respostas em Árvore e Logs de Auditoria
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  // 1. Tabela topicos_forum
  await knex.schema.createTable('topicos_forum', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('usuario_id')
      .nullable()
      .references('id')
      .inTable('usuarios')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    table.string('titulo', 255).notNullable();
    table.text('conteudo').notNullable();
    table.string('tag_tematica', 60).notNullable();
    table.integer('total_respostas').notNullable().defaultTo(0);
    table.boolean('fixado').notNullable().defaultTo(false);

    // Auditoria
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['tag_tematica'], 'idx_topicos_tag');
    table.index(['usuario_id'], 'idx_topicos_usuario');
  });

  // Busca textual no Fórum
  await knex.raw(`
    CREATE INDEX idx_topicos_busca_trgm 
    ON topicos_forum USING GIN (titulo gin_trgm_ops);
  `);

  // 2. Tabela respostas_forum (hierarquia recursiva em árvore)
  await knex.schema.createTable('respostas_forum', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // CASCADE: se o tópico for excluído, todas as respostas vão junto
    table.uuid('topico_id')
      .notNullable()
      .references('id')
      .inTable('topicos_forum')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    table.uuid('usuario_id')
      .nullable()
      .references('id')
      .inTable('usuarios')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // CASCADE na auto-referência: se o comentário pai for excluído, respostas filhas caem em cascata
    table.uuid('resposta_pai_id')
      .nullable()
      .references('id')
      .inTable('respostas_forum')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    table.text('conteudo').notNullable();

    // Auditoria
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['topico_id'], 'idx_respostas_topico');
    table.index(['resposta_pai_id'], 'idx_respostas_pai');
  });

  // 3. Tabela logs_auditoria
  await knex.schema.createTable('logs_auditoria', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('usuario_id')
      .nullable()
      .references('id')
      .inTable('usuarios')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    table.string('acao', 120).notNullable();
    table.string('recurso', 120).notNullable();
    table.jsonb('payload').nullable();
    table.string('ip_anonimizado', 64).nullable();
    table.text('user_agent').nullable();

    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['usuario_id'], 'idx_logs_usuario');
    table.index(['acao'], 'idx_logs_acao');
    table.index(['created_at'], 'idx_logs_data');
  });

  // Triggers de updated_at
  await knex.raw(`
    CREATE TRIGGER trg_topicos_forum_updated_at 
    BEFORE UPDATE ON topicos_forum 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER trg_respostas_forum_updated_at 
    BEFORE UPDATE ON respostas_forum 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.raw('DROP TRIGGER IF EXISTS trg_respostas_forum_updated_at ON respostas_forum;');
  await knex.raw('DROP TRIGGER IF EXISTS trg_topicos_forum_updated_at ON topicos_forum;');
  await knex.raw('DROP INDEX IF EXISTS idx_topicos_busca_trgm;');
  await knex.schema.dropTableIfExists('logs_auditoria');
  await knex.schema.dropTableIfExists('respostas_forum');
  await knex.schema.dropTableIfExists('topicos_forum');
}

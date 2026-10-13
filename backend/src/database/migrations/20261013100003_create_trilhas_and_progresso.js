/**
 * Migration 3: Trilhas Formativas e Progresso Docente com Chaves Estrangeiras CASCADE
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  // 1. Tabela trilhas_formativas
  await knex.schema.createTable('trilhas_formativas', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('codigo', 60).notNullable().unique();
    table.string('titulo', 255).notNullable();
    table.text('descricao').notNullable();
    table.integer('carga_horaria').notNullable().defaultTo(40);
    table.integer('total_aulas').notNullable().defaultTo(5);
    table.string('icone', 50).notNullable().defaultTo('book');
    table.integer('ordem').notNullable().defaultTo(1);
    table.boolean('ativo').notNullable().defaultTo(true);

    // Auditoria
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['ordem'], 'idx_trilhas_ordem');
  });

  // 2. Tabela progresso_trilhas
  await knex.schema.createTable('progresso_trilhas', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('usuario_id')
      .notNullable()
      .references('id')
      .inTable('usuarios')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    table.uuid('trilha_id')
      .notNullable()
      .references('id')
      .inTable('trilhas_formativas')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    table.decimal('percentual_conclusao', 5, 2).notNullable().defaultTo(0.00);
    table.jsonb('aulas_concluidas').notNullable().defaultTo('[]');
    table.string('status', 30).notNullable().defaultTo('em_andamento');
    table.timestamp('ultima_atividade_em', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // Auditoria
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // Constraint de Unicidade Composta: um progresso por docente por trilha
    table.unique(['usuario_id', 'trilha_id'], 'uq_progresso_usuario_trilha');
  });

  // Triggers de updated_at
  await knex.raw(`
    CREATE TRIGGER trg_trilhas_updated_at 
    BEFORE UPDATE ON trilhas_formativas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER trg_progresso_trilhas_updated_at 
    BEFORE UPDATE ON progresso_trilhas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.raw('DROP TRIGGER IF EXISTS trg_progresso_trilhas_updated_at ON progresso_trilhas;');
  await knex.raw('DROP TRIGGER IF EXISTS trg_trilhas_updated_at ON trilhas_formativas;');
  await knex.schema.dropTableIfExists('progresso_trilhas');
  await knex.schema.dropTableIfExists('trilhas_formativas');
}

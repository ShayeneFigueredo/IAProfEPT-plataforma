/**
 * Migration 8: Tabelas Auxiliares de Matriz Curricular BNCC e Eixos/Cursos do CNCT
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  // 1. Tabela eixos_cnct
  await knex.schema.createTable('eixos_cnct', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('codigo', 60).notNullable().unique();
    table.string('nome', 150).notNullable();
    table.text('descricao').nullable();
    table.string('icone', 50).notNullable().defaultTo('layers');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // 2. Tabela cursos_tecnicos_cnct
  await knex.schema.createTable('cursos_tecnicos_cnct', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('eixo_id')
      .notNullable()
      .references('id')
      .inTable('eixos_cnct')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.string('codigo', 80).notNullable().unique();
    table.string('nome', 150).notNullable();
    table.text('descricao').nullable();
    table.text('perfil_profissional').nullable();
    table.integer('carga_horaria_minima').notNullable().defaultTo(1200);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['eixo_id'], 'idx_cursos_eixo');
  });

  // 3. Tabela habilidades_bncc
  await knex.schema.createTable('habilidades_bncc', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('codigo', 20).notNullable().unique(); // Ex: EM13MAT308
    table.string('area', 100).notNullable().defaultTo('Matemática e suas Tecnologias');
    table.string('campo_matematico', 100).notNullable(); // Álgebra, Geometria, etc.
    table.text('descricao').notNullable();
    table.string('etapa', 50).notNullable().defaultTo('Ensino Médio');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['campo_matematico'], 'idx_bncc_campo');
  });

  // Triggers de updated_at
  await knex.raw(`
    CREATE TRIGGER trg_eixos_updated_at 
    BEFORE UPDATE ON eixos_cnct 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER trg_cursos_updated_at 
    BEFORE UPDATE ON cursos_tecnicos_cnct 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER trg_habilidades_updated_at 
    BEFORE UPDATE ON habilidades_bncc 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.raw('DROP TRIGGER IF EXISTS trg_habilidades_updated_at ON habilidades_bncc;');
  await knex.raw('DROP TRIGGER IF EXISTS trg_cursos_updated_at ON cursos_tecnicos_cnct;');
  await knex.raw('DROP TRIGGER IF EXISTS trg_eixos_updated_at ON eixos_cnct;');
  await knex.schema.dropTableIfExists('habilidades_bncc');
  await knex.schema.dropTableIfExists('cursos_tecnicos_cnct');
  await knex.schema.dropTableIfExists('eixos_cnct');
}

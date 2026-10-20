/**
 * Migration: Tabelas de Interações Comunitárias no Repositório (Curtidas, Favoritos e Comentários/Relatos)
 * Plataforma IAprofEPT — Tese de Doutorado PPGEM / UFJF
 * 
 * Atende aos requisitos:
 * - Registro de likes com chave única (pratica_id, usuario_id) para toggle seguro
 * - Registro de favoritos com chave única (pratica_id, usuario_id) para toggle seguro
 * - Comentários e relatos de experiência docente em sala de aula da EPT
 * - Atualização atômica de contadores sem condições de corrida (Race Conditions)
 * 
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  // 1. Tabela curtidas_praticas
  await knex.schema.createTable('curtidas_praticas', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('pratica_id')
      .notNullable()
      .references('id')
      .inTable('praticas_repositorio')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.uuid('usuario_id')
      .notNullable()
      .references('id')
      .inTable('usuarios')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.unique(['pratica_id', 'usuario_id'], 'uq_curtidas_pratica_usuario');
    table.index(['pratica_id'], 'idx_curtidas_pratica');
    table.index(['usuario_id'], 'idx_curtidas_usuario');
  });

  // 2. Tabela favoritos_praticas
  await knex.schema.createTable('favoritos_praticas', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('pratica_id')
      .notNullable()
      .references('id')
      .inTable('praticas_repositorio')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.uuid('usuario_id')
      .notNullable()
      .references('id')
      .inTable('usuarios')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.unique(['pratica_id', 'usuario_id'], 'uq_favoritos_pratica_usuario');
    table.index(['pratica_id'], 'idx_favoritos_pratica');
    table.index(['usuario_id'], 'idx_favoritos_usuario');
  });

  // 3. Tabela comentarios_praticas (Comentários e Relatos de Experiência Docente na EPT)
  await knex.schema.createTable('comentarios_praticas', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('pratica_id')
      .notNullable()
      .references('id')
      .inTable('praticas_repositorio')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.uuid('usuario_id')
      .notNullable()
      .references('id')
      .inTable('usuarios')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.text('texto').notNullable();
    table.boolean('relato_experiencia').notNullable().defaultTo(false);
    table.string('turma_contexto', 150).nullable();
    table.integer('nota_estrelas').nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at', { useTz: true }).nullable(); // Soft delete

    table.index(['pratica_id'], 'idx_comentarios_pratica');
    table.index(['usuario_id'], 'idx_comentarios_usuario');
    table.index(['relato_experiencia'], 'idx_comentarios_relato');
  });

  // Adiciona coluna total_comentarios na tabela praticas_repositorio se ainda não existir
  const hasTotalComentarios = await knex.schema.hasColumn('praticas_repositorio', 'total_comentarios');
  if (!hasTotalComentarios) {
    await knex.schema.alterTable('praticas_repositorio', (table) => {
      table.integer('total_comentarios').notNullable().defaultTo(0);
    });
  }
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  const hasTotalComentarios = await knex.schema.hasColumn('praticas_repositorio', 'total_comentarios');
  if (hasTotalComentarios) {
    await knex.schema.alterTable('praticas_repositorio', (table) => {
      table.dropColumn('total_comentarios');
    });
  }
  await knex.schema.dropTableIfExists('comentarios_praticas');
  await knex.schema.dropTableIfExists('favoritos_praticas');
  await knex.schema.dropTableIfExists('curtidas_praticas');
}

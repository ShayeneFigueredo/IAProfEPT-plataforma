/**
 * Migration: Artigos Críticos e Provocações Pedagógicas
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  // Tabela para Artigos
  await knex.schema.createTable('artigos_reflexao', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('titulo', 255).notNullable();
    table.text('resumo').notNullable();
    table.text('conteudo').notNullable();
    table.string('autor', 255).notNullable();
    table.text('referencias_bibliograficas').notNullable();
    table.integer('tempo_leitura_minutos').notNullable().defaultTo(5);
    table.string('tag_tematica', 100).notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['tag_tematica'], 'idx_artigos_tag');
  });

  // Tabela para Provocações Pedagógicas (reflexões rápidas)
  await knex.schema.createTable('provocacoes_reflexao', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('titulo', 255).notNullable();
    table.text('conteudo').notNullable();
    table.string('autor', 255).notNullable();
    table.integer('tempo_leitura_minutos').notNullable().defaultTo(2);
    table.string('tag_tematica', 100).notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // Tabela de Interações (Lido / Favorito)
  await knex.schema.createTable('interacoes_reflexao', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    table.uuid('usuario_id')
      .notNullable()
      .references('id')
      .inTable('usuarios')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
      
    // Polimórfico: 'artigo' ou 'provocacao'
    table.string('tipo_item', 50).notNullable();
    table.uuid('item_id').notNullable();

    table.boolean('lido').notNullable().defaultTo(false);
    table.boolean('favorito').notNullable().defaultTo(false);
    
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // Impede múltiplas interações do mesmo usuário para o mesmo item
    table.unique(['usuario_id', 'tipo_item', 'item_id'], 'uk_usuario_item_reflexao');
  });

  // Triggers de updated_at
  await knex.raw(`
    CREATE TRIGGER trg_artigos_reflexao_updated_at 
    BEFORE UPDATE ON artigos_reflexao 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER trg_provocacoes_reflexao_updated_at 
    BEFORE UPDATE ON provocacoes_reflexao 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER trg_interacoes_reflexao_updated_at 
    BEFORE UPDATE ON interacoes_reflexao 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.raw('DROP TRIGGER IF EXISTS trg_interacoes_reflexao_updated_at ON interacoes_reflexao;');
  await knex.raw('DROP TRIGGER IF EXISTS trg_provocacoes_reflexao_updated_at ON provocacoes_reflexao;');
  await knex.raw('DROP TRIGGER IF EXISTS trg_artigos_reflexao_updated_at ON artigos_reflexao;');
  
  await knex.schema.dropTableIfExists('interacoes_reflexao');
  await knex.schema.dropTableIfExists('provocacoes_reflexao');
  await knex.schema.dropTableIfExists('artigos_reflexao');
}

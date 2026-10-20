/**
 * Migration: Tickets de Suporte e Dúvidas
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.createTable('tickets_suporte', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('usuario_id')
      .nullable() // pode ser null se o usuario não estiver logado, mas geralmente estará
      .references('id')
      .inTable('usuarios')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
      
    table.string('assunto', 255).notNullable();
    table.text('mensagem').notNullable();
    table.string('status', 50).notNullable().defaultTo('aberto'); // aberto, em_andamento, resolvido
    table.string('tipo', 50).notNullable().defaultTo('duvida'); // duvida, bug, sugestao
    
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    
    table.index(['usuario_id'], 'idx_tickets_usuario');
    table.index(['status'], 'idx_tickets_status');
  });

  await knex.raw(`
    CREATE TRIGGER trg_tickets_suporte_updated_at 
    BEFORE UPDATE ON tickets_suporte 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.raw('DROP TRIGGER IF EXISTS trg_tickets_suporte_updated_at ON tickets_suporte;');
  await knex.schema.dropTableIfExists('tickets_suporte');
}


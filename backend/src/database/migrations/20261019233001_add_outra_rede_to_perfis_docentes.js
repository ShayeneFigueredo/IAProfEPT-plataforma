/**
 * Migration: Add outra_rede to perfis_docentes
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.alterTable('perfis_docentes', (table) => {
    table.string('outra_rede', 255).nullable();
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.alterTable('perfis_docentes', (table) => {
    table.dropColumn('outra_rede');
  });
}

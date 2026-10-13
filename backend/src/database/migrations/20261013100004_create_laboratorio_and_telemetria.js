/**
 * Migration 4: Laboratório de IA e Telemetria A/B (Groq vs Gemini)
 * Base empírica para a Tese de Doutorado de Maycon Magalhães (PPGEM / UFJF)
 * 
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  // 1. Tabela requisicoes_ia
  await knex.schema.createTable('requisicoes_ia', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // SET NULL preserva a requisição e estatística pedagógica se o usuário for removido
    table.uuid('usuario_id')
      .nullable()
      .references('id')
      .inTable('usuarios')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    table.string('ferramenta', 60).notNullable();
    table.jsonb('parametros_entrada').notNullable();
    table.text('conteudo_gerado').notNullable();
    table.jsonb('formato_saida').nullable();
    table.jsonb('habilidades_bncc').notNullable().defaultTo('[]');
    
    // Princípio Ético Inegociável da tese
    table.boolean('aviso_etico_injetado').notNullable().defaultTo(true);

    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['ferramenta'], 'idx_requisicoes_ferramenta');
    table.index(['usuario_id'], 'idx_requisicoes_usuario');
  });

  // 2. Tabela telemetria_ab
  await knex.schema.createTable('telemetria_ab', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // CASCADE: se a requisição for excluída, sua telemetria também é
    table.uuid('requisicao_ia_id')
      .notNullable()
      .references('id')
      .inTable('requisicoes_ia')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    // Hash anonimizado do docente (conformidade ética / LGPD)
    table.string('usuario_id_hash', 64).notNullable();
    table.string('motor_ia', 20).notNullable(); // 'groq' | 'gemini'
    table.string('modelo_especifico', 100).notNullable();
    table.integer('latencia_ms').notNullable();
    table.integer('tokens_prompt').nullable();
    table.integer('tokens_completion').nullable();
    table.integer('total_tokens').nullable();
    table.string('status_execucao', 30).notNullable().defaultTo('sucesso');
    table.boolean('fallback_utilizado').notNullable().defaultTo(false);
    table.text('mensagem_erro').nullable();
    table.jsonb('parametros_curriculares').nullable();

    table.timestamp('criado_em', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // Índices analíticos para geração dos relatórios da tese
    table.index(['motor_ia'], 'idx_telemetria_motor');
    table.index(['criado_em'], 'idx_telemetria_data');
    table.index(['usuario_id_hash'], 'idx_telemetria_usuario_hash');
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('telemetria_ab');
  await knex.schema.dropTableIfExists('requisicoes_ia');
}

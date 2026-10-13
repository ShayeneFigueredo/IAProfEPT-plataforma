/**
 * Migration 5: Repositório de Práticas e Avaliações Comunitárias com Regras RESTRICT e CASCADE
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  // 1. Tabela praticas_repositorio
  await knex.schema.createTable('praticas_repositorio', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Regra RESTRICT: impede a deleção direta de uma conta se ela possuir materiais públicos ativos no repositório institucional
    table.uuid('usuario_id')
      .nullable()
      .references('id')
      .inTable('usuarios')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');

    table.uuid('requisicao_ia_id')
      .nullable()
      .references('id')
      .inTable('requisicoes_ia')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    table.string('titulo', 255).notNullable();
    table.text('descricao').nullable();
    table.text('conteudo_completo').notNullable();
    table.string('curso_tecnico', 150).notNullable();
    table.string('eixo_cnct', 150).notNullable();
    table.string('tema_matematico', 150).notNullable();
    table.jsonb('habilidades_bncc').notNullable().defaultTo('[]');
    table.text('arquivo_anexo_url').nullable();

    // Contadores atômicos
    table.integer('total_curtidas').notNullable().defaultTo(0);
    table.integer('total_favoritos').notNullable().defaultTo(0);
    table.integer('total_avaliacoes').notNullable().defaultTo(0);
    table.decimal('media_estrelas', 3, 2).notNullable().defaultTo(0.00);
    table.boolean('publicado').notNullable().defaultTo(true);

    // Auditoria & Soft Delete
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at', { useTz: true }).nullable();

    table.index(['curso_tecnico'], 'idx_praticas_curso');
    table.index(['eixo_cnct'], 'idx_praticas_eixo');
    table.index(['tema_matematico'], 'idx_praticas_tema');
  });

  // Índice GIN Trigram para busca textual ultra-rápida
  await knex.raw(`
    CREATE INDEX idx_praticas_busca_trgm 
    ON praticas_repositorio USING GIN (titulo gin_trgm_ops);
  `);

  // 2. Tabela avaliacoes_praticas
  await knex.schema.createTable('avaliacoes_praticas', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // CASCADE: Se a prática for removida, as avaliações são expurgadas
    table.uuid('pratica_id')
      .notNullable()
      .references('id')
      .inTable('praticas_repositorio')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    // CASCADE: Se o avaliador for removido, seu voto é removido
    table.uuid('usuario_id')
      .notNullable()
      .references('id')
      .inTable('usuarios')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    table.integer('nota_estrelas').notNullable();
    table.jsonb('tags_qualitativas').notNullable().defaultTo('[]');
    table.text('comentario').nullable();

    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // Constraint de Unicidade: cada docente avalia uma prática apenas uma vez
    table.unique(['pratica_id', 'usuario_id'], 'uq_avaliacao_pratica_usuario');
  });

  // Check constraint para nota entre 1 e 5 estrelas
  await knex.raw(`
    ALTER TABLE avaliacoes_praticas 
    ADD CONSTRAINT chk_nota_estrelas CHECK (nota_estrelas BETWEEN 1 AND 5);
  `);

  // Trigger de updated_at
  await knex.raw(`
    CREATE TRIGGER trg_praticas_updated_at 
    BEFORE UPDATE ON praticas_repositorio 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.raw('DROP TRIGGER IF EXISTS trg_praticas_updated_at ON praticas_repositorio;');
  await knex.raw('DROP INDEX IF EXISTS idx_praticas_busca_trgm;');
  await knex.schema.dropTableIfExists('avaliacoes_praticas');
  await knex.schema.dropTableIfExists('praticas_repositorio');
}

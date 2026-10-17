/**
 * Migration: Criação da Tabela de Avaliação Docente por Estrelas (1 a 5) e Feedback da Telemetria A/B
 * Plataforma IAprofEPT — Tese de Doutorado PPGEM / UFJF
 * Doutorando: Maycon Luiz Amaral Magalhães
 * 
 * Atende aos requisitos:
 * 1. Avaliação do material gerado por IA com nota de 1 a 5 estrelas.
 * 2. Tags qualitativas pedagógicas:
 *    - Rigor Matemático
 *    - Contextualização EPT
 *    - Clareza do Gabarito
 *    - Adequação à BNCC
 * 3. Comentário crítico opcional do docente.
 * 4. Vínculo relacional com a requisição de IA (requisicoes_ia) e telemetria (telemetria_ab).
 * 5. Critério de Aceite: Impedimento estrito de avaliações duplicadas via constraint de unicidade (requisicao_ia_id, usuario_id_hash).
 * 
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.createTable('avaliacoes_telemetria_ab', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Vínculo obrigatório com a requisição pedagógica gerada
    table.uuid('requisicao_ia_id')
      .notNullable()
      .references('id')
      .inTable('requisicoes_ia')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    // Vínculo opcional com o registro de telemetria de baixo nível
    table.uuid('telemetria_ab_id')
      .nullable()
      .references('id')
      .inTable('telemetria_ab')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Usuário avaliador (se autenticado)
    table.uuid('usuario_id')
      .nullable()
      .references('id')
      .inTable('usuarios')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Hash anonimizado do docente avaliador (conformidade ética / CEP/UFJF / CNS 510/2016)
    table.string('usuario_id_hash', 64).notNullable();

    // Nota em estrelas de 1 a 5
    table.integer('nota_estrelas').notNullable();

    // Tags qualitativas pedagógicas selecionadas pelo professor
    table.jsonb('tags_qualitativas').notNullable().defaultTo('[]');

    // Comentário crítico ou sugestão docente opcional
    table.text('comentario_critico').nullable();

    // Metadados desnormalizados para acelerar relatórios comparativos A/B da tese
    table.string('motor_ia', 20).nullable(); // 'groq' | 'gemini'
    table.string('modelo_especifico', 100).nullable();
    table.string('grupo_experimental', 10).nullable(); // 'A' | 'B'

    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // CONSTRAINT DE UNICIDADE (Critério de Aceite: Impedimento de avaliações duplicadas)
    table.unique(['requisicao_ia_id', 'usuario_id_hash'], 'uq_avaliacao_telemetria_docente');

    // Índices analíticos
    table.index(['requisicao_ia_id'], 'idx_aval_telemetria_requisicao');
    table.index(['usuario_id_hash'], 'idx_aval_telemetria_usuario_hash');
    table.index(['motor_ia'], 'idx_aval_telemetria_motor');
    table.index(['grupo_experimental'], 'idx_aval_telemetria_grupo');
    table.index(['nota_estrelas'], 'idx_aval_telemetria_nota');
  });

  // Check constraint para garantir nota entre 1 e 5 estrelas
  await knex.raw(`
    ALTER TABLE avaliacoes_telemetria_ab 
    ADD CONSTRAINT chk_nota_estrelas_telemetria CHECK (nota_estrelas BETWEEN 1 AND 5);
  `);
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('avaliacoes_telemetria_ab');
}

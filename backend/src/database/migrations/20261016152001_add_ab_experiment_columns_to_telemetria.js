/**
 * Migration: Adiciona colunas e índices analíticos para o Experimento A/B de 30 Dias
 * Tese de Doutorado PPGEM / UFJF — Maycon Luiz Amaral Magalhães
 * 
 * Permite a persistência da chave de teste, grupo experimental (A: Groq vs B: Gemini)
 * e critério de alocação balanceada para rastreabilidade científica dos dados.
 * 
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.alterTable('telemetria_ab', (table) => {
    // Grupo experimental: 'A' (Groq LLaMA 3.3) | 'B' (Google Gemini) | 'CONTROLE'
    table.string('grupo_experimental', 10).nullable();

    // Chave de alocação única ou persistente da requisição / sessão docente
    table.string('chave_alocacao', 128).nullable();

    // Critério algorítmico utilizado para a decisão de roteamento
    // ('hash_deterministico' | 'balanceado_intercalado' | 'fallback_contingencia' | 'manual')
    table.string('criterio_alocacao', 50).nullable();

    // Flag que indica se a requisição ocorreu durante a janela oficial do experimento
    table.boolean('experimento_ativo').notNullable().defaultTo(true);

    // Índices analíticos para geração dos relatórios estatísticos e Teste Qui-Quadrado da tese
    table.index(['grupo_experimental'], 'idx_telemetria_grupo_experimental');
    table.index(['chave_alocacao'], 'idx_telemetria_chave_alocacao');
    table.index(['experimento_ativo'], 'idx_telemetria_experimento_ativo');
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.alterTable('telemetria_ab', (table) => {
    table.dropIndex(['grupo_experimental'], 'idx_telemetria_grupo_experimental');
    table.dropIndex(['chave_alocacao'], 'idx_telemetria_chave_alocacao');
    table.dropIndex(['experimento_ativo'], 'idx_telemetria_experimento_ativo');

    table.dropColumn('grupo_experimental');
    table.dropColumn('chave_alocacao');
    table.dropColumn('criterio_alocacao');
    table.dropColumn('experimento_ativo');
  });
}

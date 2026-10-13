/**
 * Migration 7: Otimização de Índices B-Tree, GIN Trigram (pg_trgm) e Full-Text Search (FTS)
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Atende aos requisitos:
 * - Índices B-Tree nas chaves de busca frequente (usuario_id, instituicao_id, curso_tecnico, created_at)
 * - Índices GIN com extensão pg_trgm para tolerância a erros e busca por similaridade rápida
 * - Índices GIN em JSONB para filtragem ágil por habilidades da BNCC e parâmetros de IA
 * - Full-Text Search otimizado com dicionário em português
 * - Critério de aceite: queries executando em menos de 50ms
 * 
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  // 1. Garantir extensão pg_trgm
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pg_trgm";');

  // 2. ÍNDICES B-TREE EM CHAVES DE BUSCA E FILTRAGEM FREQUENTE
  await knex.raw(`
    -- Usuários & Perfis
    CREATE INDEX IF NOT EXISTS idx_usuarios_created_at ON usuarios (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_usuarios_role_status ON usuarios (role, status);
    CREATE INDEX IF NOT EXISTS idx_perfis_instituicao_id ON perfis_docentes (instituicao_id);
    CREATE INDEX IF NOT EXISTS idx_perfis_uf_siape ON perfis_docentes (uf, matricula_siape);

    -- Práticas do Repositório (filtros frequentes na interface)
    CREATE INDEX IF NOT EXISTS idx_praticas_curso_tecnico ON praticas_repositorio (curso_tecnico);
    CREATE INDEX IF NOT EXISTS idx_praticas_eixo_cnct ON praticas_repositorio (eixo_cnct);
    CREATE INDEX IF NOT EXISTS idx_praticas_tema_matematico ON praticas_repositorio (tema_matematico);
    CREATE INDEX IF NOT EXISTS idx_praticas_usuario_id ON praticas_repositorio (usuario_id);
    CREATE INDEX IF NOT EXISTS idx_praticas_created_at ON praticas_repositorio (created_at DESC);
    
    -- Índice Composto para filtros combinados do Repositório (curso + eixo + tema)
    CREATE INDEX IF NOT EXISTS idx_praticas_filtros_combo 
      ON praticas_repositorio (curso_tecnico, eixo_cnct, tema_matematico, created_at DESC) 
      WHERE deleted_at IS NULL;

    -- Índice para ordenação por melhores avaliações / destaques
    CREATE INDEX IF NOT EXISTS idx_praticas_ranking 
      ON praticas_repositorio (media_estrelas DESC, total_curtidas DESC) 
      WHERE deleted_at IS NULL;

    -- Requisições do Laboratório de IA
    CREATE INDEX IF NOT EXISTS idx_requisicoes_usuario_created ON requisicoes_ia (usuario_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_requisicoes_ferramenta_created ON requisicoes_ia (ferramenta, created_at DESC);

    -- Telemetria A/B para consultas da tese de doutorado
    CREATE INDEX IF NOT EXISTS idx_telemetria_motor_data ON telemetria_ab (motor_ia, criado_em DESC);
    CREATE INDEX IF NOT EXISTS idx_telemetria_usuario_latencia ON telemetria_ab (usuario_id_hash, latencia_ms);

    -- Fóruns e Respostas
    CREATE INDEX IF NOT EXISTS idx_topicos_tag_created ON topicos_forum (tag_tematica, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_topicos_fixado_updated ON topicos_forum (fixado DESC, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_respostas_topico_created ON respostas_forum (topico_id, created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_respostas_pai_created ON respostas_forum (resposta_pai_id, created_at ASC);

    -- Logs de Auditoria
    CREATE INDEX IF NOT EXISTS idx_logs_usuario_created ON logs_auditoria (usuario_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_logs_acao_created ON logs_auditoria (acao, created_at DESC);
  `);

  // 3. ÍNDICES GIN COM EXTENSÃO pg_trgm (BUSCA POR SIMILARIDADE E TOLERÂNCIA A ERROS)
  await knex.raw(`
    -- Práticas: busca aproximada por título, descrição e conteúdo completo
    CREATE INDEX IF NOT EXISTS idx_praticas_titulo_trgm 
      ON praticas_repositorio USING GIN (titulo gin_trgm_ops);

    CREATE INDEX IF NOT EXISTS idx_praticas_descricao_trgm 
      ON praticas_repositorio USING GIN (descricao gin_trgm_ops);

    CREATE INDEX IF NOT EXISTS idx_praticas_conteudo_trgm 
      ON praticas_repositorio USING GIN (conteudo_completo gin_trgm_ops);

    -- Fóruns de Reflexão: busca rápida nos títulos e conteúdos dos debates
    CREATE INDEX IF NOT EXISTS idx_topicos_titulo_trgm 
      ON topicos_forum USING GIN (titulo gin_trgm_ops);

    CREATE INDEX IF NOT EXISTS idx_topicos_conteudo_trgm 
      ON topicos_forum USING GIN (conteudo gin_trgm_ops);

    CREATE INDEX IF NOT EXISTS idx_respostas_conteudo_trgm 
      ON respostas_forum USING GIN (conteudo gin_trgm_ops);
  `);

  // 4. ÍNDICES FULL-TEXT SEARCH (FTS) COM DICIONÁRIO EM PORTUGUÊS
  await knex.raw(`
    -- FTS em Práticas do Repositório (Título + Descrição + Tema Matemático)
    CREATE INDEX IF NOT EXISTS idx_praticas_fts 
      ON praticas_repositorio USING GIN (
        to_tsvector('portuguese', coalesce(titulo, '') || ' ' || coalesce(descricao, '') || ' ' || coalesce(tema_matematico, ''))
      );

    -- FTS em Tópicos do Fórum
    CREATE INDEX IF NOT EXISTS idx_topicos_fts 
      ON topicos_forum USING GIN (
        to_tsvector('portuguese', coalesce(titulo, '') || ' ' || coalesce(conteudo, ''))
      );
  `);

  // 5. ÍNDICES GIN EM CAMPOS JSONB (jsonb_path_ops para alta velocidade)
  await knex.raw(`
    -- Cursos atendidos pelo docente
    CREATE INDEX IF NOT EXISTS idx_perfis_cursos_jsonb 
      ON perfis_docentes USING GIN (cursos_tecnicos jsonb_path_ops);

    -- Habilidades BNCC mapeadas nas práticas
    CREATE INDEX IF NOT EXISTS idx_praticas_bncc_jsonb 
      ON praticas_repositorio USING GIN (habilidades_bncc jsonb_path_ops);

    -- Parâmetros de entrada e habilidades BNCC nas gerações de IA
    CREATE INDEX IF NOT EXISTS idx_requisicoes_params_jsonb 
      ON requisicoes_ia USING GIN (parametros_entrada jsonb_path_ops);

    CREATE INDEX IF NOT EXISTS idx_requisicoes_bncc_jsonb 
      ON requisicoes_ia USING GIN (habilidades_bncc jsonb_path_ops);
  `);
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.raw(`
    -- Drop JSONB Indexes
    DROP INDEX IF EXISTS idx_requisicoes_bncc_jsonb;
    DROP INDEX IF EXISTS idx_requisicoes_params_jsonb;
    DROP INDEX IF EXISTS idx_praticas_bncc_jsonb;
    DROP INDEX IF EXISTS idx_perfis_cursos_jsonb;

    -- Drop Full-Text Search Indexes
    DROP INDEX IF EXISTS idx_topicos_fts;
    DROP INDEX IF EXISTS idx_praticas_fts;

    -- Drop Trigram Indexes
    DROP INDEX IF EXISTS idx_respostas_conteudo_trgm;
    DROP INDEX IF EXISTS idx_topicos_conteudo_trgm;
    DROP INDEX IF EXISTS idx_topicos_titulo_trgm;
    DROP INDEX IF EXISTS idx_praticas_conteudo_trgm;
    DROP INDEX IF EXISTS idx_praticas_descricao_trgm;
    DROP INDEX IF EXISTS idx_praticas_titulo_trgm;

    -- Drop B-Tree Indexes
    DROP INDEX IF EXISTS idx_logs_acao_created;
    DROP INDEX IF EXISTS idx_logs_usuario_created;
    DROP INDEX IF EXISTS idx_respostas_pai_created;
    DROP INDEX IF EXISTS idx_respostas_topico_created;
    DROP INDEX IF EXISTS idx_topicos_fixado_updated;
    DROP INDEX IF EXISTS idx_topicos_tag_created;
    DROP INDEX IF EXISTS idx_telemetria_usuario_latencia;
    DROP INDEX IF EXISTS idx_telemetria_motor_data;
    DROP INDEX IF EXISTS idx_requisicoes_ferramenta_created;
    DROP INDEX IF EXISTS idx_requisicoes_usuario_created;
    DROP INDEX IF EXISTS idx_praticas_ranking;
    DROP INDEX IF EXISTS idx_praticas_filtros_combo;
    DROP INDEX IF EXISTS idx_praticas_created_at;
    DROP INDEX IF EXISTS idx_praticas_usuario_id;
    DROP INDEX IF EXISTS idx_praticas_tema_matematico;
    DROP INDEX IF EXISTS idx_praticas_eixo_cnct;
    DROP INDEX IF EXISTS idx_praticas_curso_tecnico;
    DROP INDEX IF EXISTS idx_perfis_uf_siape;
    DROP INDEX IF EXISTS idx_perfis_instituicao_id;
    DROP INDEX IF EXISTS idx_usuarios_role_status;
    DROP INDEX IF EXISTS idx_usuarios_created_at;
  `);
}

-- ============================================================================
-- PLATAFORMA IAProfEPT — Esquema Relacional de Banco de Dados PostgreSQL 16+
-- Produto Educacional (PTT4) / Tese de Doutorado PPGEM-UFJF
-- Doutorando: Maycon Luiz Amaral Magalhães
-- Engenharia de Software: Shayene Figueredo & Samuel Amorim
-- Orientação: Prof. Dr. Eduardo Barrére & Prof. Dr. Manuel Cabral dos Santos Reis
-- ============================================================================

-- 1. EXTENSÕES DO POSTGRESQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. FUNÇÃO UTILITÁRIA PARA ATUALIZAÇÃO AUTOMÁTICA DE updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ENTIDADE 1: instituicoes_rfepct
-- Catálogo de Institutos Federais, CEFETs e Colégios Técnicos Vinculados
-- ============================================================================
CREATE TABLE IF NOT EXISTS instituicoes_rfepct (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sigla VARCHAR(30) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    campus VARCHAR(150) NOT NULL,
    uf CHAR(2) NOT NULL,
    tipo VARCHAR(40) NOT NULL DEFAULT 'IF' CHECK (tipo IN ('IF', 'CEFET', 'COLEGIO_TECNICO', 'OUTRO')),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instituicoes_uf ON instituicoes_rfepct (uf);
CREATE INDEX IF NOT EXISTS idx_instituicoes_sigla ON instituicoes_rfepct (sigla);

-- ============================================================================
-- ENTIDADE 2: usuarios
-- Contas de acesso de Docentes, Pesquisadores e Administradores
-- ============================================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'docente_rfepct' 
        CHECK (role IN ('docente_rfepct', 'pesquisador_doutorado', 'administrador_ufjf')),
    status VARCHAR(30) NOT NULL DEFAULT 'ativo' 
        CHECK (status IN ('ativo', 'pendente', 'suspenso', 'inativo')),
    ultimo_login_em TIMESTAMPTZ,
    tentativas_login_falhas INT NOT NULL DEFAULT 0,
    bloqueado_ate TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios (email);
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios (role);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios (status);

-- ============================================================================
-- ENTIDADE 3: perfis_docentes
-- Dados curriculares específicos da RFEPCT e consentimento ético (TCLE)
-- ============================================================================
CREATE TABLE IF NOT EXISTS perfis_docentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    instituicao_id UUID REFERENCES instituicoes_rfepct(id) ON DELETE SET NULL,
    uf CHAR(2) NOT NULL,
    matricula_siape VARCHAR(30),
    area_atuacao VARCHAR(150) NOT NULL DEFAULT 'Matemática',
    cursos_tecnicos JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de cursos atendidos (ex: Informática, Agropecuária)
    termo_etico_aceito BOOLEAN NOT NULL DEFAULT TRUE,
    termo_etico_versao VARCHAR(20) NOT NULL DEFAULT '1.0',
    data_aceite_termo TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_aceite_termo VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perfis_docentes_usuario ON perfis_docentes (usuario_id);
CREATE INDEX IF NOT EXISTS idx_perfis_docentes_instituicao ON perfis_docentes (instituicao_id);
CREATE INDEX IF NOT EXISTS idx_perfis_docentes_uf ON perfis_docentes (uf);
CREATE INDEX IF NOT EXISTS idx_perfis_docentes_cursos ON perfis_docentes USING GIN (cursos_tecnicos);

-- ============================================================================
-- ENTIDADE 4: trilhas_formativas
-- Trilhas do Ambiente Formativo (Fundamentos, Ética, Didática, Estudos de Caso)
-- ============================================================================
CREATE TABLE IF NOT EXISTS trilhas_formativas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(60) NOT NULL UNIQUE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    carga_horaria INT NOT NULL DEFAULT 40,
    total_aulas INT NOT NULL DEFAULT 5,
    icone VARCHAR(50) NOT NULL DEFAULT 'book',
    ordem INT NOT NULL DEFAULT 1,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trilhas_codigo ON trilhas_formativas (codigo);
CREATE INDEX IF NOT EXISTS idx_trilhas_ordem ON trilhas_formativas (ordem);

-- ============================================================================
-- ENTIDADE 5: progresso_trilhas
-- Acompanhamento do progresso de cada docente nas trilhas formativas
-- ============================================================================
CREATE TABLE IF NOT EXISTS progresso_trilhas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    trilha_id UUID NOT NULL REFERENCES trilhas_formativas(id) ON DELETE CASCADE,
    percentual_conclusao NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (percentual_conclusao BETWEEN 0 AND 100),
    aulas_concluidas JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de IDs de aulas concluídas
    status VARCHAR(30) NOT NULL DEFAULT 'em_andamento'
        CHECK (status IN ('nao_iniciado', 'em_andamento', 'concluido')),
    ultima_atividade_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_progresso_usuario_trilha UNIQUE (usuario_id, trilha_id)
);

CREATE INDEX IF NOT EXISTS idx_progresso_usuario ON progresso_trilhas (usuario_id);
CREATE INDEX IF NOT EXISTS idx_progresso_trilha ON progresso_trilhas (trilha_id);

-- ============================================================================
-- ENTIDADE 6: requisicoes_ia
-- Registros das gerações no Laboratório de IA (sem prompt livre)
-- ============================================================================
CREATE TABLE IF NOT EXISTS requisicoes_ia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    ferramenta VARCHAR(60) NOT NULL 
        CHECK (ferramenta IN ('exercicios', 'interdisciplinar', 'podcast', 'plano_aula')),
    parametros_entrada JSONB NOT NULL, -- { area, nivel, eixo, curso, metodologia, quantidade }
    conteudo_gerado TEXT NOT NULL,
    formato_saida JSONB, -- gabarito, passos de resolução, contexto
    habilidades_bncc JSONB NOT NULL DEFAULT '[]'::jsonb, -- Códigos e descrições das habilidades BNCC
    aviso_etico_injetado BOOLEAN NOT NULL DEFAULT TRUE, -- Princípio Ético inegociável
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requisicoes_usuario ON requisicoes_ia (usuario_id);
CREATE INDEX IF NOT EXISTS idx_requisicoes_ferramenta ON requisicoes_ia (ferramenta);
CREATE INDEX IF NOT EXISTS idx_requisicoes_parametros ON requisicoes_ia USING GIN (parametros_entrada);
CREATE INDEX IF NOT EXISTS idx_requisicoes_bncc ON requisicoes_ia USING GIN (habilidades_bncc);

-- ============================================================================
-- ENTIDADE 7: telemetria_ab
-- Dados empíricos do Teste A/B (Groq LLaMA 3.3 70B vs Google Gemini 1.5)
-- Base para a tese de doutorado de Maycon Magalhães
-- ============================================================================
CREATE TABLE IF NOT EXISTS telemetria_ab (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requisicao_ia_id UUID NOT NULL REFERENCES requisicoes_ia(id) ON DELETE CASCADE,
    usuario_id_hash VARCHAR(64) NOT NULL, -- Hash SHA-256 anônimo do docente
    motor_ia VARCHAR(20) NOT NULL CHECK (motor_ia IN ('groq', 'gemini')),
    modelo_especifico VARCHAR(100) NOT NULL, -- 'llama-3.3-70b-versatile', 'gemini-1.5-flash', etc.
    latencia_ms INT NOT NULL,
    tokens_prompt INT,
    tokens_completion INT,
    total_tokens INT,
    status_execucao VARCHAR(30) NOT NULL DEFAULT 'sucesso' 
        CHECK (status_execucao IN ('sucesso', 'erro', 'fallback', 'timeout')),
    fallback_utilizado BOOLEAN NOT NULL DEFAULT FALSE,
    mensagem_erro TEXT,
    parametros_curriculares JSONB,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetria_requisicao ON telemetria_ab (requisicao_ia_id);
CREATE INDEX IF NOT EXISTS idx_telemetria_motor ON telemetria_ab (motor_ia);
CREATE INDEX IF NOT EXISTS idx_telemetria_data ON telemetria_ab (criado_em);
CREATE INDEX IF NOT EXISTS idx_telemetria_usuario_hash ON telemetria_ab (usuario_id_hash);

-- ============================================================================
-- ENTIDADE 8: praticas_repositorio
-- Práticas pedagógicas compartilhadas no Repositório Colaborativo
-- ============================================================================
CREATE TABLE IF NOT EXISTS praticas_repositorio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    requisicao_ia_id UUID REFERENCES requisicoes_ia(id) ON DELETE SET NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    conteudo_completo TEXT NOT NULL,
    curso_tecnico VARCHAR(150) NOT NULL,
    eixo_cnct VARCHAR(150) NOT NULL,
    tema_matematico VARCHAR(150) NOT NULL,
    habilidades_bncc JSONB NOT NULL DEFAULT '[]'::jsonb,
    arquivo_anexo_url TEXT,
    total_curtidas INT NOT NULL DEFAULT 0,
    total_favoritos INT NOT NULL DEFAULT 0,
    total_avaliacoes INT NOT NULL DEFAULT 0,
    media_estrelas NUMERIC(3,2) NOT NULL DEFAULT 0.00 CHECK (media_estrelas BETWEEN 0 AND 5),
    publicado BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ -- Suporte a soft delete
);

CREATE INDEX IF NOT EXISTS idx_praticas_usuario ON praticas_repositorio (usuario_id);
CREATE INDEX IF NOT EXISTS idx_praticas_curso ON praticas_repositorio (curso_tecnico);
CREATE INDEX IF NOT EXISTS idx_praticas_eixo ON praticas_repositorio (eixo_cnct);
CREATE INDEX IF NOT EXISTS idx_praticas_tema ON praticas_repositorio (tema_matematico);
CREATE INDEX IF NOT EXISTS idx_praticas_created_at ON praticas_repositorio (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_praticas_publicado ON praticas_repositorio (publicado) WHERE deleted_at IS NULL;

-- Índice composto para filtros combinados na barra do repositório
CREATE INDEX IF NOT EXISTS idx_praticas_filtros_combo 
  ON praticas_repositorio (curso_tecnico, eixo_cnct, tema_matematico, created_at DESC) 
  WHERE deleted_at IS NULL;

-- Índice para ordenação por melhores notas e engajamento
CREATE INDEX IF NOT EXISTS idx_praticas_ranking 
  ON praticas_repositorio (media_estrelas DESC, total_curtidas DESC) 
  WHERE deleted_at IS NULL;

-- Índices Trigram (pg_trgm) para busca aproximada tolerante a erros
CREATE INDEX IF NOT EXISTS idx_praticas_titulo_trgm ON praticas_repositorio USING GIN (titulo gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_praticas_descricao_trgm ON praticas_repositorio USING GIN (descricao gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_praticas_conteudo_trgm ON praticas_repositorio USING GIN (conteudo_completo gin_trgm_ops);

-- Índice Full-Text Search (FTS) em português
CREATE INDEX IF NOT EXISTS idx_praticas_fts 
  ON praticas_repositorio USING GIN (
    to_tsvector('portuguese', coalesce(titulo, '') || ' ' || coalesce(descricao, '') || ' ' || coalesce(tema_matematico, ''))
  );

-- Índice JSONB para habilidades BNCC
CREATE INDEX IF NOT EXISTS idx_praticas_bncc_jsonb ON praticas_repositorio USING GIN (habilidades_bncc jsonb_path_ops);

-- ============================================================================
-- ENTIDADE 9: avaliacoes_praticas
-- Avaliações por estrelas (1 a 5) e feedback crítico das práticas
-- ============================================================================
CREATE TABLE IF NOT EXISTS avaliacoes_praticas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pratica_id UUID NOT NULL REFERENCES praticas_repositorio(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nota_estrelas INT NOT NULL CHECK (nota_estrelas BETWEEN 1 AND 5),
    tags_qualitativas JSONB NOT NULL DEFAULT '[]'::jsonb, -- ['Rigor Matemático', 'Adequação EPT', etc.]
    comentario TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_avaliacao_pratica_usuario UNIQUE (pratica_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_pratica ON avaliacoes_praticas (pratica_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_usuario ON avaliacoes_praticas (usuario_id);

-- ============================================================================
-- ENTIDADE 10: topicos_forum
-- Tópicos de debate no Painel de Reflexão Crítica
-- ============================================================================
CREATE TABLE IF NOT EXISTS topicos_forum (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    titulo VARCHAR(255) NOT NULL,
    conteudo TEXT NOT NULL,
    tag_tematica VARCHAR(60) NOT NULL 
        CHECK (tag_tematica IN ('avaliacao', 'vieses', 'autoria', 'etica', 'praticas', 'geral')),
    total_respostas INT NOT NULL DEFAULT 0,
    fixado BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topicos_tag ON topicos_forum (tag_tematica);
CREATE INDEX IF NOT EXISTS idx_topicos_usuario ON topicos_forum (usuario_id);
CREATE INDEX IF NOT EXISTS idx_topicos_busca_trgm ON topicos_forum USING GIN (titulo gin_trgm_ops);

-- ============================================================================
-- ENTIDADE 11: respostas_forum
-- Respostas e debates em árvore hierárquica
-- ============================================================================
CREATE TABLE IF NOT EXISTS respostas_forum (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topico_id UUID NOT NULL REFERENCES topicos_forum(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    resposta_pai_id UUID REFERENCES respostas_forum(id) ON DELETE CASCADE, -- Resposta em árvore
    conteudo TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_respostas_topico ON respostas_forum (topico_id);
CREATE INDEX IF NOT EXISTS idx_respostas_pai ON respostas_forum (resposta_pai_id);
CREATE INDEX IF NOT EXISTS idx_respostas_usuario ON respostas_forum (usuario_id);

-- ============================================================================
-- ENTIDADE 12: logs_auditoria
-- Auditoria de segurança, ações de IA e rastreabilidade científica
-- ============================================================================
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    acao VARCHAR(120) NOT NULL, -- 'login', 'logout', 'geracao_ia', 'aceite_tcle', 'avaliacao'
    recurso VARCHAR(120) NOT NULL, -- 'auth', 'laboratorio', 'repositorio', 'forum'
    payload JSONB,
    ip_anonimizado VARCHAR(64),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_usuario ON logs_auditoria (usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_acao ON logs_auditoria (acao);
CREATE INDEX IF NOT EXISTS idx_logs_data ON logs_auditoria (created_at);

-- ============================================================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA DE updated_at
-- ============================================================================
DROP TRIGGER IF EXISTS trg_instituicoes_updated_at ON instituicoes_rfepct;
CREATE TRIGGER trg_instituicoes_updated_at 
    BEFORE UPDATE ON instituicoes_rfepct 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_usuarios_updated_at ON usuarios;
CREATE TRIGGER trg_usuarios_updated_at 
    BEFORE UPDATE ON usuarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_perfis_docentes_updated_at ON perfis_docentes;
CREATE TRIGGER trg_perfis_docentes_updated_at 
    BEFORE UPDATE ON perfis_docentes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_trilhas_updated_at ON trilhas_formativas;
CREATE TRIGGER trg_trilhas_updated_at 
    BEFORE UPDATE ON trilhas_formativas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_progresso_trilhas_updated_at ON progresso_trilhas;
CREATE TRIGGER trg_progresso_trilhas_updated_at 
    BEFORE UPDATE ON progresso_trilhas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_praticas_updated_at ON praticas_repositorio;
CREATE TRIGGER trg_praticas_updated_at 
    BEFORE UPDATE ON praticas_repositorio 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_topicos_forum_updated_at ON topicos_forum;
CREATE TRIGGER trg_topicos_forum_updated_at 
    BEFORE UPDATE ON topicos_forum 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_respostas_forum_updated_at ON respostas_forum;
CREATE TRIGGER trg_respostas_forum_updated_at 
    BEFORE UPDATE ON respostas_forum 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABELAS AUXILIARES CURRICULARES (CNCT & BNCC)
-- ============================================================================
CREATE TABLE IF NOT EXISTS eixos_cnct (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(60) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    icone VARCHAR(50) NOT NULL DEFAULT 'layers',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cursos_tecnicos_cnct (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eixo_id UUID NOT NULL REFERENCES eixos_cnct(id) ON DELETE CASCADE,
    codigo VARCHAR(80) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    perfil_profissional TEXT,
    carga_horaria_minima INT NOT NULL DEFAULT 1200,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cursos_eixo ON cursos_tecnicos_cnct (eixo_id);

CREATE TABLE IF NOT EXISTS habilidades_bncc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) NOT NULL UNIQUE,
    area VARCHAR(100) NOT NULL DEFAULT 'Matemática e suas Tecnologias',
    campo_matematico VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    etapa VARCHAR(50) NOT NULL DEFAULT 'Ensino Médio',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bncc_campo ON habilidades_bncc (campo_matematico);

DROP TRIGGER IF EXISTS trg_eixos_updated_at ON eixos_cnct;
CREATE TRIGGER trg_eixos_updated_at 
    BEFORE UPDATE ON eixos_cnct 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_cursos_updated_at ON cursos_tecnicos_cnct;
CREATE TRIGGER trg_cursos_updated_at 
    BEFORE UPDATE ON cursos_tecnicos_cnct 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_habilidades_updated_at ON habilidades_bncc;
CREATE TRIGGER trg_habilidades_updated_at 
    BEFORE UPDATE ON habilidades_bncc 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

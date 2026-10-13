# 🐘 Guia do Banco de Dados PostgreSQL 16+ — Plataforma IAprofEPT
> **Documentação Técnica e Operacional do Produto Educacional (PTT4 / CAPES)**  
> **Projeto de Tese de Doutorado** — Programa de Pós-Graduação em Educação Matemática (PPGEM / UFJF)  
> **Doutorando:** Maycon Luiz Amaral Magalhães  
> **Engenharia de Software:** Shayene Figueredo & Samuel Amorim  
> **Orientação:** Prof. Dr. Eduardo Barrére | Prof. Dr. Manuel Cabral dos Santos Reis  
> **Repositório Oficial:** [IAProfEPT-plataforma](https://github.com/ShayeneFigueredo/IAProfEPT-plataforma)

---

## 📌 1. Visão Geral da Arquitetura
A camada de persistência da **Plataforma IAprofEPT** foi construída sobre o **PostgreSQL 16+**, hospedado nos servidores institucionais da **Universidade Federal de Juiz de Fora (UFJF)**.

O banco foi planejado para atender simultaneamente aos requisitos de alta disponibilidade para os docentes da Rede Federal (RFEPCT) e à coleta empírica de evidências para a tese de doutorado de Maycon Magalhães, garantindo:
1. **Codificação UTF-8 Nativa:** Proteção contra corrupção de símbolos matemáticos, equações em LaTeX e caracteres acentuados.
2. **Pool de Conexões Estável (`pg.Pool`):** Gerenciamento resiliente de conexões simultâneas com descarte automático de conexões ociosas.
3. **Busca Textual Acelerada (`pg_trgm`):** Consultas velozes e tolerantes a variações ortográficas no Repositório de Práticas e nos Fóruns.
4. **Telemetria A/B Anônima:** Persistência de métricas do teste comparativo (Groq LLaMA 3.3 70B vs Google Gemini 1.5) com hash SHA-256 anônimo do docente para conformidade ética (CEP/UFJF e LGPD).

---

## 🏛️ 2. As 12 Entidades Modeladas no Esquema Relacional

| Nº | Entidade / Tabela | Finalidade Principal | Relação com a Pesquisa / 5 Ambientes |
|:--:|---|---|---|
| **1** | `instituicoes_rfepct` | Catálogo de IFs, CEFETs e Colégios Técnicos nas 27 UFs. | Identifica o vínculo institucional e campus de atuação do professor. |
| **2** | `usuarios` | Contas de acesso e controle de papéis (RBAC). | Permissões diferenciadas: `docente_rfepct`, `pesquisador_doutorado`, `administrador_ufjf`. |
| **3** | `perfis_docentes` | Dados curriculares, cursos técnicos e aceite do TCLE. | Registra a autorização ética formal e os cursos da EPT onde o professor atua. |
| **4** | `trilhas_formativas` | Estrutura modular das 4 trilhas de capacitação continuada. | Organiza a formação em IA (Fundamentos, Ética, Didática e Estudos de Caso). |
| **5** | `progresso_trilhas` | Acompanhamento percentual de conclusão por docente. | Permite que o professor retome o estudo e obtenha sua certificação. |
| **6** | `requisicoes_ia` | Registros das gerações nas 4 ferramentas do Laboratório. | Salva os materiais com parâmetro compulsório `aviso_etico_injetado = true`. |
| **7** | `telemetria_ab` | Métricas quantitativas do experimento piloto de 30 dias. | Coleta latência (ms), tokens e motor utilizado para a tese de Maycon. |
| **8** | `praticas_repositorio` | Práticas pedagógicas e sequências didáticas compartilhadas. | Hub colaborativo com índices trigram para busca rápida por curso técnico. |
| **9** | `avaliacoes_praticas` | Avaliações por estrelas (1 a 5) e feedback qualitativo. | Curadoria comunitária por pares dos materiais produzidos com IA. |
| **10** | `topicos_forum` | Tópicos de debate crítico no Painel de Reflexão. | Discussões éticas sobre viés algorítmico, autoria docente e avaliação. |
| **11** | `respostas_forum` | Respostas e debates em árvore hierárquica. | Permite réplicas e tréplicas pedagógicas encadeadas recursivamente. |
| **12** | `logs_auditoria` | Rastreabilidade de ações, conformidade ética e segurança. | Auditoria de acessos, aceite de termos e eventos críticos do sistema. |

---

## 🚀 3. Comandos para Executar e Testar

### A. Subir o PostgreSQL Localmente com Docker Compose
Para subir o banco de dados oficial configurado com imagem PostgreSQL 16 Alpine e inicialização UTF-8:
```bash
# Iniciar o container em segundo plano
docker compose up -d postgres

# Verificar se o banco está saudável (healthy)
docker compose ps

# Visualizar logs em tempo real
docker compose logs -f postgres
```

### B. Testar a Conexão com o Banco (`npm run db:check`)
Testa o pool de conexões, verifica se a instância está ativa, exibe o charset atual (UTF-8) e o status do SSL:
```bash
npm run db:check
```
**Exemplo de Saída Esperada:**
```text
--- TESTE DE CONEXÃO COM POSTGRESQL 16+ ---
Host:     localhost
Porta:    5432
Banco:    iaprofept_db
Usuário:  postgres
SSL:      Desabilitado
Encoding: UTF8
-------------------------------------------
✅ CONEXÃO ESTABELECIDA COM SUCESSO!
   - Banco de Dados: iaprofept_db
   - Versão do PG:   PostgreSQL 16.2
   - Charset Atual:  UTF8 (Critério UTF-8 atendido)
   - Latência:       12ms
```

### C. Executar as Migrações Versionadas com Knex (`npm run db:migrate`)
Aplica a suíte modular de migrações estruturais do Knex versionando o histórico na tabela `knex_migrations`:
```bash
# Executa todas as migrações pendentes até a versão mais recente
npm run db:migrate

# Verificar status das migrações (pendentes vs aplicadas)
npm run db:status

# Reverter o último lote de migrações (Rollback controlado)
npm run db:rollback

# Testar e auditar integridade referencial (CASCADE / RESTRICT / UNIQUE)
npm run db:test
```

**Exemplo de Saída Esperada no `npm run db:migrate`:**
```text
================================================================
🚀 PLATAFORMA IAProfEPT — Knex Migrations (LATEST)
   Ambiente: development
================================================================
📡 Verificando conectividade com o PostgreSQL...
✅ Conexão ativa! Versão: PostgreSQL 16.2 | Charset: UTF8
⚡ Executando migrações pendentes (knex.migrate.latest)...
🎉 Sucesso! Batch 1 executou as seguintes migrações:
   ✔ 20261013100001_create_extensions_and_instituicoes.js
   ✔ 20261013100002_create_usuarios_and_perfis.js
   ✔ 20261013100003_create_trilhas_and_progresso.js
   ✔ 20261013100004_create_laboratorio_and_telemetria.js
   ✔ 20261013100005_create_repositorio_and_avaliacoes.js
   ✔ 20261013100006_create_forum_and_auditoria.js

🔍 Auditando integridade referencial das tabelas gerenciadas:
   ✔ Tabela 'instituicoes_rfepct' verificada e ativa.
   ✔ Tabela 'usuarios' verificada e ativa.
   ✔ Tabela 'perfis_docentes' verificada e ativa.
   ✔ Tabela 'trilhas_formativas' verificada e ativa.
   ✔ Tabela 'progresso_trilhas' verificada e ativa.
   ✔ Tabela 'requisicoes_ia' verificada e ativa.
   ✔ Tabela 'telemetria_ab' verificada e ativa.
   ✔ Tabela 'praticas_repositorio' verificada e ativa.
   ✔ Tabela 'avaliacoes_praticas' verificada e ativa.
   ✔ Tabela 'topicos_forum' verificada e ativa.
   ✔ Tabela 'respostas_forum' verificada e ativa.
   ✔ Tabela 'logs_auditoria' verificada e ativa.
================================================================
```

### D. Carga Inicial de Dados e Seeds Curriculares (`npm run db:seed`)
Executa a suíte de seeds de forma **100% idempotente**, preenchendo as tabelas auxiliares e institucionais essenciais para o funcionamento do sistema e para a tese:
```bash
npm run db:seed
```
**Dados Populados:**
1. **Catálogo Oficial da RFEPCT:** Todas as 27 UFs do Brasil (IFs, CEFETs e Colégios Técnicos).
2. **4 Trilhas Formativas:** Fundamentos da IA, Ética, Didática e Estudos de Caso na EPT.
3. **Eixos Tecnológicos e Cursos do CNCT:** Mapeamento curricular de cursos integrados (Enfermagem, Agropecuária, Informática, Administração, Edificações, Eletrotécnica, etc.).
4. **Matriz de Habilidades BNCC:** Competências e habilidades de Matemática do Ensino Médio (`EM13MAT101` a `EM13MAT504`).

### E. Benchmark e Validação de Performance de Busca (`npm run db:benchmark`)
Executa uma bateria de testes medindo o tempo de resposta das consultas com trigramas, filtros compostos e tolerância a erros de digitação:
```bash
npm run db:benchmark
```
*Critério de Aceite da Pesquisa:* Todas as consultas de busca textual executam em **menos de 50ms**, mesmo em cenários de busca com erros ortográficos (*fuzzy search*).

### F. Estratégia de Indexação Otimizada
O banco conta com 4 famílias de índices especializadas:
1. **B-Tree Composto:** Otimiza consultas frequentes por curso técnico, eixo tecnológico, tema e status ativo (`idx_praticas_filtros_combo`, `idx_praticas_ranking`).
2. **GIN Trigram (`pg_trgm`):** Acelera buscas por similaridade em títulos, descrições e conteúdos (`idx_praticas_titulo_trgm`, `idx_topicos_titulo_trgm`).
3. **Full-Text Search (FTS):** Indexação em linguagem natural com dicionário em português (`to_tsvector('portuguese', ...)`).
4. **JSONB Path Ops:** Índices velozes para busca de competências da BNCC e parâmetros de IA (`idx_praticas_bncc_jsonb`, `idx_requisicoes_params_jsonb`).

### F. Parar ou Reiniciar o Banco de Dados
```bash
# Parar o container preservando os dados persistentes
docker compose stop postgres

# Reiniciar o container
docker compose start postgres

# Parar e remover container (mantendo o volume persistente do banco)
docker compose down
```

---

## ⚙️ 4. Variáveis de Ambiente (`.env`)

Configure o arquivo `.env` na raiz do projeto (baseado em [`.env.example`](file:///c:/apps/IAProfEPT/PLATAFORMA/.env.example)):

| Variável | Padrão Local (Dev) | Produção (Servidores UFJF) | Descrição |
|---|---|---|---|
| `PGHOST` | `localhost` | `db.iaprofept.ufjf.br` | Host do servidor PostgreSQL |
| `PGPORT` | `5432` | `5432` | Porta de conexão |
| `PGUSER` | `postgres` | `iaprofept_prod` | Usuário do banco |
| `PGPASSWORD` | `postgres` | *(senha forte do cofre)* | Senha do banco |
| `PGDATABASE` | `iaprofept_db` | `iaprofept_producao` | Nome do banco de dados |
| `PGSSLMODE` | `disable` | `require` | Modo SSL (desabilitado em dev, obrigatório em prod) |
| `PGSSL_REJECT_UNAUTHORIZED` | `false` | `true` | Validação estrita de certificado SSL |
| `PG_MAX_POOL` | `20` | `50` | Limite de conexões ativas no pool |
| `PG_MIN_POOL` | `2` | `5` | Conexões mínimas reservadas ociosas |
| `PGCLIENTENCODING` | `UTF8` | `UTF8` | Codificação obrigatória de caracteres |

---

## 🛡️ 5. Rastreabilidade com a Tese & Conformidade Ética
- **ADR de Referência:** [ADR-006: Modelagem Relacional e Configuração do Banco de Dados PostgreSQL 16+](ADR_006_MODELAGEM_E_CONFIGURACAO_BANCO_POSTGRESQL).
- **Autoridade Docente:** Nenhuma saída da IA é entregue sem a marcação da autoridade docente e o aviso compulsório de validação.
- **Resolução CNS 510/2016 e LGPD:** Os dados do teste A/B gravados na tabela `telemetria_ab` são estritamente anonimizados através de hash criptográfico de via única, preservando a identidade dos professores participantes da pesquisa.

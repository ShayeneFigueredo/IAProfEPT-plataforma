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

### C. Executar as Migrações do Esquema (`npm run db:migrate`)
Aplica o arquivo DDL [`schema.sql`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/database/schema.sql) criando as 12 tabelas, índices e triggers, realizando a auditoria automática de integridade:
```bash
npm run db:migrate
```
**Exemplo de Saída Esperada:**
```text
================================================================
🚀 PLATAFORMA IAProfEPT — Inicialização do Banco PostgreSQL
================================================================
📡 1. Verificando conectividade e parâmetros do PostgreSQL...
✅ Conexão ativa com sucesso!
   - Banco de Dados: iaprofept_db
   - Versão PG:      PostgreSQL 16.2
   - Codificação:    UTF8 (Critério UTF-8 atendido)
   - Latência:       14ms

📄 2. Lendo arquivo de schema DDL: backend/src/database/schema.sql
⚡ 3. Aplicando tabelas, índices e triggers...
✅ Todas as definições de DDL foram aplicadas com sucesso!

🔍 4. Auditando integridade das 12 entidades criadas no PostgreSQL:
   ✔ [OK] Tabela 'instituicoes_rfepct' presente e íntegra.
   ✔ [OK] Tabela 'usuarios' presente e íntegra.
   ✔ [OK] Tabela 'perfis_docentes' presente e íntegra.
   ✔ [OK] Tabela 'trilhas_formativas' presente e íntegra.
   ✔ [OK] Tabela 'progresso_trilhas' presente e íntegra.
   ✔ [OK] Tabela 'requisicoes_ia' presente e íntegra.
   ✔ [OK] Tabela 'telemetria_ab' presente e íntegra.
   ✔ [OK] Tabela 'praticas_repositorio' presente e íntegra.
   ✔ [OK] Tabela 'avaliacoes_praticas' presente e íntegra.
   ✔ [OK] Tabela 'topicos_forum' presente e íntegra.
   ✔ [OK] Tabela 'respostas_forum' presente e íntegra.
   ✔ [OK] Tabela 'logs_auditoria' presente e íntegra.

🎉 SUCESSO: Todas as 12 entidades foram modeladas e migradas perfeitamente!
================================================================
```

### D. Parar ou Reiniciar o Banco de Dados
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

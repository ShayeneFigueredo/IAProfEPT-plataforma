# 🏛️ ADR-006: Modelagem Relacional e Configuração do Banco de Dados PostgreSQL 16+
> **Documento de Registro de Decisão Arquitetural (ADR)**  
> **Projeto de Tese de Doutorado** — Programa de Pós-Graduação em Educação Matemática (PPGEM / UFJF)  
> **Doutorando:** Maycon Luiz Amaral Magalhães  
> **Engenharia de Software:** Shayene Figueredo & Samuel Amorim  
> **Orientação:** Prof. Dr. Eduardo Barrére | Prof. Dr. Manuel Cabral dos Santos Reis  

---

## 📌 1. Status
**APROVADO** (Em vigor a partir de 13/10/2026)

---

## 🎯 2. Contexto & Justificativa Científica
A plataforma **IAprofEPT** atua como Produto Educacional (PTT4) voltado aos docentes de Matemática da Rede Federal de Educação Profissional, Científica e Tecnológica (RFEPCT). Para viabilizar a coleta de evidências empíricas para a tese de doutorado, o sistema necessita de uma camada de persistência robusta capaz de atender a:
1. **Integridade Referencial Estrita:** Relações consistentes entre docentes, perfis curriculares da EPT, materiais gerados, avaliações por pares e discussões em fóruns.
2. **Telemetria Científica Anônima (Teste A/B):** Registro de métricas de inferência dos motores Groq LLaMA 3.3 e Google Gemini 1.5 (tempo de latência em milissegundos, consumo de tokens de prompt e completion, notas docentes de 1 a 5 estrelas) com pseudonimização/hash criptográfico dos identificadores para conformidade com a LGPD e o CEP/UFJF.
3. **Preservação de Fórmulas e Notação Matemática:** O banco de dados deve utilizar compulsoriamente a codificação de caracteres **UTF-8** para evitar qualquer corrupção em símbolos matemáticos, notações em LaTeX e caracteres da língua portuguesa.
4. **Busca Textual Otimizada:** Consulta veloz no Repositório de Práticas utilizando índices baseados em trigramas (`pg_trgm`).

---

## 💡 3. Decisão Arquitetural
Adota-se o **PostgreSQL 16+** como Sistema de Gerenciamento de Banco de Dados Relacional oficial da plataforma, hospedado nos servidores institucionais da **UFJF**.

### A. Política de Conexão e Pool
- Utilização de driver nativo `pg` com `Pool` de conexões.
- **Tamanho do Pool:** Mínimo de 2 conexões ociosas e máximo configurável de 20 conexões concorrentes (`PG_MAX_POOL`).
- **Timeouts:** `connectionTimeoutMillis = 5000` (5s) e `idleTimeoutMillis = 30000` (30s).
- **Charset:** `client_encoding` explicitamente forçado como `'UTF8'` em cada handshake de conexão.
- **SSL:** Suporte dinâmico (`disable` para Docker local; `require` com certificado CA para os servidores da UFJF em produção).

### B. As 12 Entidades Modeladas
1. `instituicoes_rfepct`: Catálogo de IFs, CEFETs e Colégios Técnicos (27 UFs).
2. `usuarios`: Contas com controle de papéis (RBAC: `docente_rfepct`, `pesquisador_doutorado`, `administrador_ufjf`).
3. `perfis_docentes`: Dados curriculares, cursos técnicos atendidos e registro de aceite do TCLE.
4. `trilhas_formativas`: Estrutura das 4 trilhas de capacitação continuada.
5. `progresso_trilhas`: Rastreamento percentual do avanço do professor nas aulas.
6. `requisicoes_ia`: Materiais gerados pelas 4 ferramentas guiadas do Laboratório, com flag obrigatória de aviso ético injetado.
7. `telemetria_ab`: Métricas quantitativas do experimento piloto de 30 dias (Groq vs Gemini).
8. `praticas_repositorio`: Práticas didáticas publicadas com suporte a busca textual por trigramas.
9. `avaliacoes_praticas`: Avaliação comunitária por estrelas (1 a 5) e dimensões pedagógicas.
10. `topicos_forum`: Tópicos de debate crítico no Painel de Reflexão.
11. `respostas_forum`: Discussões com suporte a encadeamento recursivo em árvore.
12. `logs_auditoria`: Rastreabilidade de ações, conformidade ética e segurança.

---

## ⚡ 4. Consequências & Benefícios
- **Rastreabilidade Científica:** Todos os dados gerados no teste piloto estarão normalizados e prontos para agregação estatística direta no texto da tese.
- **Desempenho & Concorrência:** O pool de conexões mitiga gargalos durante os acessos simultâneos dos professores da RFEPCT.
- **Portabilidade:** A infraestrutura pode ser iniciada localmente via `docker compose up -d` ou no ambiente bare-metal/VM da UFJF com total paridade.
- **Conformidade Ética:** O aceite do TCLE e o banner ético são gravados compulsoriamente em nível de schema relacional.

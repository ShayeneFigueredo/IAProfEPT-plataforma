# 🧠 Wiki Científica & Técnica — Plataforma IAprofEPT
> **Documentação Oficial do Produto Educacional (PTT4 / CAPES)**  
> **Tese de Doutorado em Educação Matemática** — PPGEM / UFJF  
> **Doutorando:** Maycon Luiz Amaral Magalhães  
> **Engenharia de Software:** Shayene Figueredo & Samuel Amorim  
> **Orientador:** Prof. Dr. Eduardo Barrére | **Coorientador:** Prof. Dr. Manuel José Cabral dos Santos Reis  
> **Repositório Oficial:** [IAProfEPT-plataforma](https://github.com/ShayeneFigueredo/IAProfEPT-plataforma)

---

## 🏛️ 1. Registros de Decisões Arquiteturais e Pedagógicas (ADRs)
Documentos formais que fundamentam as escolhas técnicas do software à luz da pesquisa acadêmica de doutorado:

- 📄 [ADR-001: Proibição de Caixas de Prompt em Branco e Adoção da Engenharia de Prompts Oculta](./ADR_001_ENGENHARIA_PROMPT_OCULTA_SEM_PROMPT_EM_BRANCO.md)
- 📄 [ADR-002: Princípio da Autoridade Docente Insubstituível e Banner Obrigatório de Validação Ética](./ADR_002_PRINCIPIO_AUTORIDADE_DOCENTE_E_VALIDACAO_ETICA.md)
- 📄 [ADR-003: Arquitetura de IA Dupla (Groq LLaMA 3.3 vs Google Gemini 1.5) e Protocolo Experimental do Teste A/B](./ADR_003_ARQUITETURA_IA_DUPLA_E_PROTOCOLO_TESTE_AB.md)
- 📄 [ADR-004: Implementação do Design System Institucional: Tokens Visuais, Tipografia Oficial, Grid Responsivo e Acessibilidade WCAG AA](./ADR_004_DESIGN_SYSTEM_TOKENS_E_ESTILOS_GLOBAIS.md)
- 📄 [ADR-005: Fluxo de Autenticação, Cadastro Institucional da RFEPCT e Onboarding Pedagógico dos 5 Ambientes](./ADR_005_AUTENTICACAO_ONBOARDING_ACOLHIMENTO_DOCENTE_RFEPCT.md)
- 📄 [ADR-006: Modelagem Relacional e Configuração do Banco de Dados PostgreSQL 16+](./ADR_006_MODELAGEM_E_CONFIGURACAO_BANCO_POSTGRESQL.md)
- 📄 [ADR-007: Fluxo Seguro de Recuperação e Redefinição de Senha com Tokens de Uso Único](./ADR_007_RECUPERACAO_E_REDEFINICAO_SEGURA_DE_SENHA.md)
- 📄 [ADR-008: Registro de Consentimento Livre e Esclarecido (TCLE) e Governança Ética CEP/UFJF](./ADR_008_REGISTRO_CONSENTIMENTO_TCLE_CEP_UFJF.md)
- 📄 [ADR-009: Middleware de Autorização e Controle de Acesso Baseado em Papéis (RBAC)](./ADR_009_CONTROLE_DE_ACESSO_BASEADO_EM_PAPEIS_RBAC.md)
- 📄 [ADR-010: Motor Server-Side de Injeção de Prompts Ocultos, Parametrização Curricular (BNCC x EPT) e Educação Matemática Crítica](./ADR_010_MOTOR_SERVER_SIDE_INJECAO_PROMPTS_PARAMETRIZADOS.md)
- 📄 [ADR-011: Integração com a API Groq (LLaMA 3.3 70B via LPU), Parametrização para Cálculo Matemático Preciso e Tratamento de Rate Limits (429)](./ADR_011_INTEGRACAO_GROQ_LLAMA33_LPU_INFERENCIA.md)
- 📄 [ADR-012: Integração com a API Google Gemini (SDK Oficial), Configuração de Safety Settings, Temperatura e Esquemas JSON Estruturados (Interdisciplinar e Planos de Aula)](./ADR_012_INTEGRACAO_GOOGLE_GEMINI_SAFETY_SETTINGS_JSON_ESTRUTURADO.md)
- 📄 [ADR-013: Roteador Inteligente de IA, Padrão Circuit Breaker com Timeout de 10s e Mecanismo de Fallback Automático entre Motores (Groq vs Gemini)](./ADR_013_ROTEADOR_INTELIGENTE_CIRCUIT_BREAKER_FALLBACK_ENTRE_MOTORES.md)
- 📄 [ADR-014: Motor de Roteamento Balanceado para o Experimento Piloto A/B de 30 Dias (Groq vs Gemini)](./ADR_014_MOTOR_ROTEAMENTO_BALANCEADO_EXPERIMENTO_AB_30_DIAS.md)
- 📄 [ADR-015: Instrumentação de Avaliação Docente por Estrelas (1 a 5) e Feedback Qualitativo da Telemetria A/B](./ADR_015_AVALIACAO_DOCENTE_POR_ESTRELAS_E_FEEDBACK_QUALITATIVO.md)
- 📄 [ADR-016: Consolidação Estatística e Exportação Analítica para a Tese de Doutorado](./ADR_016_CONSOLIDACAO_ESTATISTICA_E_EXPORTACAO_TESE_DOUTORADO.md)
- 📄 [ADR-017: API de Trilhas Formativas, Módulos e Rastreamento de Progresso Docente](./ADR_017_API_TRILHAS_FORMATIVAS_E_RASTREAMENTO_PROGRESSO_DOCENTE.md)
- 📄 [ADR-018: API de Gestão do Acervo de Documentos Oficiais e E-book de Prompts para Educação Matemática na EPT](./ADR_018_ACERVO_DOCUMENTOS_OFICIAIS_E_EBOOK_PROMPTS.md)
- 📄 [ADR-019: Endpoint Unificado de Geração Parametrizada do Laboratório de IA (POST /api/laboratorio/gerar)](./ADR_019_ENDPOINT_UNIFICADO_GERACAO_PARAMETRIZADA_LABORATORIO.md)
- 📄 [ADR-020: Validação Server-side contra a Matriz Curricular BNCC x EPT e Bloqueio Estrito Anti-Prompt Livre](./ADR_020_VALIDACAO_SERVER_SIDE_MATRIZ_BNCC_EPT_ANTI_PROMPT.md)

---

## 🗺️ 2. Matrizes Curriculares e Pedagógicas
- 📐 [Matriz de Alinhamento Curricular: Matemática x EPT x BNCC](./MATRIZ_CURRICULAR_BNCC_CNCT_EPT.md)
- 📊 [Estrutura de Tarefas e Backlog do Jira Cloud (Fases 1 a 5)](../ESTRUTURA_TASKS_JIRA.md)

---

## 📖 3. Guias Técnicos & Diário de Bordo do Desenvolvimento
- 🐘 [Guia de Arquitetura e Comandos do Banco de Dados PostgreSQL 16+](./GUIA_BANCO_DE_DADOS_POSTGRESQL.md)
- 🚀 [Diário de Bordo — Fase 1 (MVP Front-end dos 5 Ambientes)](./DIARIO_DE_BORDO_FASE1_MVP.md)
- 📋 [Diretrizes de Documentação e Rastreabilidade para IAs](../DIRETRIZES_DOCUMENTACAO_IA.md)

---

## 📅 4. Cronograma Geral das Fases da Tese (22/09 a 15/12/2026)
| Fase | Período | Foco Principal | Status |
|---|---|---|---|
| **Fase 1** | 22/09 a 05/10/2026 | Arquitetura, Design System & MVP Front-end dos 5 Ambientes | **Concluído** |
| **Fase 2** | 06/10 a 19/10/2026 | Engenharia de Prompts Ocultos, Backend IA Dupla & Prof. mAIcon | Planejado |
| **Fase 3** | 20/10 a 20/11/2026 | Deploy Piloto & Teste Comparativo A/B de 30 Dias na RFEPCT | Planejado |
| **Fase 4** | 21/11 a 05/12/2026 | Consolidação Estatística & Relatório Técnico da Tese | Planejado |
| **Fase 5** | 06/12 a 15/12/2026 | Homologação Final & Deploy nos Servidores da UFJF | Planejado |

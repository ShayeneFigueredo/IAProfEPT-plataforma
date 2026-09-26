# 📋 Estrutura Completa de Tasks & Épicos para o Jira
> **Projeto:** Plataforma IAprofEPT (PTT4 / Doutorado PPGEM-UFJF)  
> **Chave Sugerida no Jira:** `IAPROF`  
> **Período:** 22/09/2026 a 15/12/2026  

Abaixo está o backlog estruturado em **5 Épicos (correspondentes às 5 Fases do Cronograma Executivo)**, contendo Stories e Tarefas Técnicas com critérios de aceite prontos para copiar e colar no Jira.

---

## 🏛️ ÉPICO 1: `[IAPROF-E1] Fase 1 — Alinhamento, Arquitetura & MVP Front-end Navegável`
- **Período:** 22/09/2026 a 05/10/2026 (2 semanas)
- **Meta:** MVP com os 5 ambientes 100% navegáveis, botões funcionais e design system institucional.

### 📌 Story 1.1: `[IAPROF-1]` Apresentação e Alinhamento do Cronograma Executivo
- **Tipo:** Task | **Prioridade:** Alta | **Status:** Concluído (22/09)
- **Descrição:** Alinhamento de escopo, prazos, critérios de aceite e arquitetura de IA dupla com Maycon e orientadores.

### 📌 Story 1.2: `[IAPROF-2]` Implementação do Design System & Layout Base
- **Tipo:** Story | **Prioridade:** Alta
- **Descrição:** Desenvolver o layout responsivo e moderno seguindo a paleta de cores oficial (`#064E3B`, `#10B981`, `#DC2626`, `#F8FAFC`).
- **Sub-tasks:**
  - `[IAPROF-2.1]` Configurar variáveis CSS (cores, tipografia Outfit/Plus Jakarta Sans, espaçamentos e sombras).
  - `[IAPROF-2.2]` Construir a barra de navegação superior com logo e atalhos rápidos dos 5 ambientes.
  - `[IAPROF-2.3]` Construir o banner de compromisso ético e validação pedagógica obrigatória.

### 📌 Story 1.3: `[IAPROF-3]` Construção das Telas dos 5 Ambientes (Front-end)
- **Tipo:** Story | **Prioridade:** Alta
- **Critério de Aceite:** Todas as 5 abas acessíveis e com layout conforme protótipo Figma.
- **Sub-tasks:**
  - `[IAPROF-3.1]` Ambiente Formativo (cards de trilhas modulares, acervo de PDFs e player de vídeos).
  - `[IAPROF-3.2]` Laboratório de IA (formulário com seletores curriculares: Eixo CNCT, Curso Técnico, BNCC).
  - `[IAPROF-3.3]` Repositório de Práticas (grid de materiais, filtros por tags e botões de download).
  - `[IAPROF-3.4]` Painel de Reflexão Crítica (fóruns temáticos e leitor de artigos de ética).
  - `[IAPROF-3.5]` Canal de Suporte / Prof. mAIcon (gaveta de chat flutuante e atalhos de ajuda).

---

## 🤖 ÉPICO 2: `[IAPROF-E2] Fase 2 — Engenharia de Prompts Ocultos & Backend de IA Dupla`
- **Período:** 06/10/2026 a 19/10/2026 (2 semanas)
- **Meta:** Motor de IA gerando planos e exercícios via Groq e Gemini com alternância dinâmica.

### 📌 Story 2.1: `[IAPROF-4]` Motor de Injeção de Prompts Ocultos (System Prompts)
- **Tipo:** Story | **Prioridade:** Blocker / Crítica
- **Descrição:** Desenvolver o gerador dinâmico de prompts no backend para evitar campos de texto vazios, injetando parâmetros curriculares da BNCC/EPT.

### 📌 Story 2.2: `[IAPROF-5]` Integração com Groq API (LLaMA 3.3 70B via LPU)
- **Tipo:** Task | **Prioridade:** Alta
- **Descrição:** Configurar cliente Groq para inferência de alta velocidade (< 1s) para geração de itens e listas de exercícios.

### 📌 Story 2.3: `[IAPROF-6]` Integração com Google Gemini API (Gemini 1.5)
- **Tipo:** Task | **Prioridade:** Alta
- **Descrição:** Configurar cliente Gemini para geração de sequências didáticas longas e análise de PPCs.

### 📌 Story 2.4: `[IAPROF-7]` Implementação do Assistente Virtual "Prof. mAIcon"
- **Tipo:** Story | **Prioridade:** Média
- **Descrição:** Conectar o chatbot flutuante a um system prompt pedagógico especializado em suporte e uso ético.

### 📌 Story 2.5: `[IAPROF-8]` Módulo de Exportação e Persistência (PDF/DOCX)
- **Tipo:** Task | **Prioridade:** Alta
- **Descrição:** Permitir salvar o material no Repositório e gerar download formatado com cabeçalho institucional e banner ético.

---

## 🧪 ÉPICO 3: `[IAPROF-E3] Fase 3 — Implantação Piloto & Teste A/B com Professores (30 Dias)`
- **Período:** 20/10/2026 a 20/11/2026 (30 dias)
- **Meta:** Coleta contínua de dados empíricos com professores da Rede Federal (RFEPCT).

### 📌 Story 3.1: `[IAPROF-9]` Deploy de Homologação em Servidor UFJF
- **Tipo:** DevOps | **Prioridade:** Alta
- **Descrição:** Configurar ambiente de teste com HTTPS, variáveis seguras e acesso aos professores pilotos.

### 📌 Story 3.2: `[IAPROF-10]` Telemetria e Registro de Dados do Experimento A/B
- **Tipo:** Story | **Prioridade:** Alta
- **Descrição:** Registrar no banco de dados de forma anônima: modelo utilizado, latência, quantidade de tokens e avaliação docente (1 a 5 estrelas).

### 📌 Story 3.3: `[IAPROF-11]` Monitoramento e Suporte Contínuo aos Docentes
- **Tipo:** Task | **Prioridade:** Média
- **Descrição:** Plantão de monitoramento de logs e resolução de eventuais erros de requisição durante os 30 dias.

---

## 📊 ÉPICO 4: `[IAPROF-E4] Fase 4 — Consolidação dos Dados, Refinamentos & Documentação`
- **Período:** 21/11/2026 a 05/12/2026 (2 semanas)
- **Meta:** Release Candidate lapidado, relatório estatístico da tese e manual técnico final.

### 📌 Story 4.1: `[IAPROF-12]` Análise Comparativa Final: Groq vs Google Gemini
- **Tipo:** Task | **Prioridade:** Alta
- **Descrição:** Processar dados do teste A/B gerando tabelas e gráficos comparativos para a tese de Maycon.

### 📌 Story 4.2: `[IAPROF-13]` Refinamentos de Usabilidade Pós-Feedback dos Docentes
- **Tipo:** Story | **Prioridade:** Média
- **Descrição:** Aplicar melhorias solicitadas pelos professores durante o piloto.

### 📌 Story 4.3: `[IAPROF-14]` Elaboração do Pacote Documental & Manual do Usuário
- **Tipo:** Docs | **Prioridade:** Alta
- **Descrição:** Finalizar Manual de Instalação, Dicionário de Dados e Guia Pedagógico do Produto Educacional.

---

## 🏆 ÉPICO 5: `[IAPROF-E5] Fase 5 — Homologação Final, Deploy de Produção & Entrega Oficial`
- **Período:** 06/12/2026 a 15/12/2026 (1.5 semanas)
- **Meta:** Sistema 100% entregue e rodando nos servidores institucionais da UFJF.

### 📌 Story 5.1: `[IAPROF-15]` Auditoria de Acessibilidade (WCAG) & Responsividade
- **Tipo:** QA | **Prioridade:** Alta
- **Descrição:** Testar conformidade em smartphones, tablets e desktops.

### 📌 Story 5.2: `[IAPROF-16]` Deploy Definitivo nos Servidores e Domínio da UFJF
- **Tipo:** DevOps | **Prioridade:** Blocker / Crítica
- **Descrição:** Configurar produção definitiva no domínio e servidores cedidos pela universidade.

### 📌 Story 5.3: `[IAPROF-17]` Ensaio Geral e Entrega Definitiva do Produto Educacional (15/12/2026)
- **Tipo:** Milestone | **Prioridade:** Blocker / Crítica
- **Descrição:** Homologação final com Maycon e Orientação para apresentação à banca e submissão CAPES.

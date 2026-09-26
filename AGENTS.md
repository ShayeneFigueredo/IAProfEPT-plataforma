# 🧠 Regras & Diretrizes de Atuação para IA — Plataforma IAprofEPT
> **Documento de Governança e Rastreabilidade Científico-Tecnológica**  
> **Projeto de Tese de Doutorado** — Programa de Pós-Graduação em Educação Matemática (PPGEM / UFJF)  
> **Autor / Doutorando:** Maycon Luiz Amaral Magalhães  
> **Engenharia de Software:** Shayene Figueredo & Samuel Amorim  
> **Orientador:** Prof. Dr. Eduardo Barrére | **Coorientador:** Prof. Dr. Manuel José Cabral dos Santos Reis  
> **Repositório Oficial:** [IAProfEPT-plataforma](https://github.com/ShayeneFigueredo/IAProfEPT-plataforma)

---

## 🎯 1. Princípios Inegociáveis do Projeto (Diretrizes Centrais)

Qualquer Inteligência Artificial (IA) ou desenvolvedor atuando neste repositório DEVE obrigatoriamente seguir estes princípios:

1. **Rigor Científico & Rastreabilidade de Doutorado:**
   - Cada decisão arquitetural, prompt oculto implementado, modelo matemático ou alteração estrutural deve ser formalmente registrada como um **ADR (Architectural Decision Record)** ou registro no Diário de Bordo Técnico.
   - O código-fonte é parte integrante do **Produto Educacional (PTT4)** para a CAPES e comporá a tese de doutorado.

2. **Proibição de "Caixas de Prompt em Branco" no Laboratório:**
   - O sistema **NÃO** deve apresentar campos de prompt abertos/crus para os professores de Matemática da EPT.
   - Toda interação com IA generativa deve ser **estruturada e parametrizada** via seletores (Eixo Tecnológico CNCT, Curso Técnico, Componente Curricular, Nível BNCC, Tipo de Atividade e Metodologia).

3. **Compromisso Ético & Alerta Obrigatório:**
   - **Toda e qualquer saída gerada por IA** no software deve conter o banner de alerta ético com o texto padrão:
     > *"Este material foi gerado por Inteligência Artificial e deve ser revisado, validado e adaptado pela autoridade docente antes de sua aplicação em sala de aula."*
   - O software deve promover a **autonomia docente e o pensamento crítico**, jamais a substituição do professor.

4. **Arquitetura de IA Dupla (Groq LLaMA 3.3 70B vs Google Gemini 1.5):**
   - A plataforma deve suportar chaveamento transparente para o **Teste A/B empírico de 30 dias** (20/10 a 20/11/2026).
   - Deve haver telemetria e fallback automático (contingência) caso um dos provedores oscile.

5. **Identidade Visual & Servidores Institucionais UFJF:**
   - Paleta oficial: Verde Floresta Institucional (`#064E3B`), Verde Acento (`#10B981`), Alerta Vermelho (`#DC2626`), Cinzas Neutros (`#F8FAFC`, `#0F172A`).
   - Servidores de aplicação, banco de dados e domínio são fornecidos pela **UFJF**.

---

## 📝 2. Como a IA Deve Documentar Qualquer Ação

Sempre que a IA realizar uma tarefa ou propor alterações, ela deve:

### A. Estrutura Padrão de Documentação Técnica
- **Contexto & Justificativa:** Por que essa mudança está sendo feita e a qual Fase/Requisito do cronograma ela atende.
- **Impacto no Produto Educacional:** Como isso afeta os 5 Ambientes da plataforma ou os dados para a tese de Maycon.
- **Relação com Prompts & Parâmetros:** Registrar qualquer modificação em `system prompts`, temperatura ou templates de extração.
- **Verificação de Acessibilidade & UX:** Garantir compatibilidade responsiva e contraste WCAG AA.

### B. Convenção de Commits Semânticos com Rastreabilidade
Os commits devem seguir o padrão:
```
<tipo>(<escopo>): <descrição curta no imperativo>

[Corpo detalhado explicando o motivo da mudança e impacto acadêmico/técnico]

Ref: #<ID_JIRA_OU_GITHUB_ISSUE> | Fase: <1|2|3|4|5>
```

Tipos permitidos:
- `feat`: Nova funcionalidade em um dos 5 ambientes.
- `prompt`: Alteração ou criação de engenharia de prompts ocultos e system prompts.
- `ai`: Integração, telemetria ou fallback dos motores Groq/Gemini.
- `docs`: Documentação na Wiki, Markdown, manuais técnicos ou relatórios da tese.
- `fix`: Correção de bugs ou ajustes derivados dos testes com professores.
- `style`: Ajustes na identidade visual, CSS e acessibilidade.
- `refactor`: Refatoração estrutural sem alterar comportamento.
- `test`: Testes unitários, testes de carga ou scripts do protocolo A/B.

---

## 🏛️ 3. Mapa dos 5 Ambientes da Plataforma

| Nº | Ambiente | Finalidade | Tecnologias Chave |
|---|---|---|---|
| **1** | **Ambiente Formativo** | Trilhas de aprendizagem, vídeos explicativos, acervo de legislação e E-book de Prompts. | Frontend modular, Player YouTube, Viewer PDF. |
| **2** | **Laboratório de IA** | Motor gerador parametrizado (exercícios, planos de aula, sequências didáticas e avaliações). | Formulários guiados, Motor de Prompt Oculto, Groq API & Gemini API. |
| **3** | **Repositório de Práticas** | Hub comunitário para compartilhamento, curadoria entre pares, busca e exportação (PDF/DOCX). | Banco de dados, Sistema de Avaliação (1 a 5 estrelas), Exportadores. |
| **4** | **Painel de Reflexão** | Espaço para problematização ética, artigos críticos sobre IA na educação e fóruns de debate. | Fóruns temáticos, Leitor de artigos, Alertas críticos. |
| **5** | **Suporte / Prof. mAIcon** | Assistente virtual embutido para auxílio pedagógico, navegação e integração com NotebookLM. | Chatbot contextual, System prompt pedagógico. |

---

## 📅 4. Cronograma Oficial das Fases (22/09 a 15/12/2026)

- **Fase 1 (22/09 a 05/10):** Alinhamento, Arquitetura & MVP Front-end Navegável dos 5 Ambientes.
- **Fase 2 (06/10 a 19/10):** Engenharia de Prompts Ocultos, Backend IA Dupla (Groq + Gemini) & Prof. mAIcon.
- **Fase 3 (20/10 a 20/11):** Deploy Piloto & Teste Comparativo A/B de 30 Dias na RFEPCT.
- **Fase 4 (21/11 a 05/12):** Consolidação Estatística, Relatório da Tese e Documentação Técnica.
- **Fase 5 (06/12 a 15/12):** Homologação Final, Deploy de Produção nos Servidores da UFJF e Entrega Definitiva.

---

## 🛡️ 5. Checklist Pré-Commit para Agentes de IA
Antes de finalizar qualquer modificação no código:
- [ ] O código segue a paleta de cores e tipografia oficial?
- [ ] Todas as saídas de IA possuem o aviso de validação docente em destaque?
- [ ] Não há caixa de prompt vazia exposta ao usuário no Laboratório?
- [ ] A Wiki do GitHub e as Tasks do Jira foram atualizadas com o progresso correspondente?
- [ ] O código não expõe chaves de API sensíveis (uso estrito de variáveis de ambiente `.env`)?

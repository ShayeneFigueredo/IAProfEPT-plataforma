# 🏛️ Documento de Decisão Arquitetural (ADR-010)
## Motor Server-Side de Injeção de Prompts Ocultos, Parametrização Curricular (BNCC x EPT) e Educação Matemática Crítica

- **Status:** Aprovado / Implementado
- **Data da Decisão:** Outubro / 2026
- **Contexto da Pesquisa:** Tese de Doutorado em Educação Matemática (PPGEM / UFJF)
- **Autor / Doutorando:** Maycon Luiz Amaral Magalhães
- **Engenharia de Software:** Shayene Figueredo & Samuel Amorim
- **Orientadores:** Prof. Dr. Eduardo Barrére | Prof. Dr. Manuel José Cabral dos Santos Reis
- **Classificação CAPES:** Produto Técnico-Tecnológico (PTT4 - Software/Plataforma Educacional)
- **Referência Jira:** `[IA Engine]` / `[Prompt Injection]` | **Fase:** 2

---

## 🎯 1. Contexto do Problema & Justificativa Científica

A utilização de Modelos de Linguagem de Grande Porte (LLMs) na docência em Matemática para a Educação Profissional e Tecnológica (EPT) impõe desafios metodológicos intransponíveis quando mediada por interfaces convencionais de "chat aberto" ou caixas de texto em branco (UNESCO, 2021; SKOVSMOSE, 2022).

### A. Limitações Críticas de Caixas de Prompt em Branco na EPT
1. **Sobrecarga Cognitiva Docente:** O professor de Matemática não é (e não deve ser obrigado a ser) engenheiro de prompt. A necessidade de formular comandos elaborados gera fadiga, insegurança e subtilização da tecnologia.
2. **Descolamento Curricular e Descontextualização:** Prompts abertos produzem listas de exercícios mecânicos, abstratos e desprovidos de vínculo com o perfil profissional e o mundo do trabalho preconizados pelo **Catálogo Nacional de Cursos Técnicos (CNCT)**.
3. **Ausência de Conhecimento Reflexivo:** LLMs genéricas tendem a fornecer respostas dogmáticas e puramente calculatórias, omitindo a reflexão ética, social e humana exigida pela **Educação Matemática Crítica (EMC)**.

---

## 💡 2. Decisão Arquitetural: O Motor Server-Side de Montagem Estruturada

Fica formalmente implementado o **Motor Server-Side de Injeção de Prompts Ocultos e Parametrização Curricular**, consolidando a diretriz de design da [ADR-001](ADR_001_ENGENHARIA_PROMPT_OCULTA_SEM_PROMPT_EM_BRANCO.md) e o princípio ético da [ADR-002](ADR_002_PRINCIPIO_AUTORIDADE_DOCENTE_E_VALIDACAO_ETICA.md).

### A. Princípio da Parametrização Fechada
O professor manipula **exclusivamente 5 parâmetros curriculares** estruturados através de seletores guiados:
1. **Área da Matemática:** (ex: Funções Afins e Quadráticas, Geometria Espacial, Trigonometria, Matemática Financeira, etc.);
2. **Nível de Complexidade:** Inicial (1º Ano Integrado), Intermediário (2º Ano Integrado) ou Avançado (3º Ano / Subsequente);
3. **Quantidade de Itens:** 1, 3, 5 ou 10 questões progressivas com gabarito comentado;
4. **Curso Técnico de Destino:** Enfermagem, Agropecuária, Informática, Administração, Edificações, Eletrotécnica, Química, Mecânica;
5. **Metodologia Pedagógica:** PBL, Modelagem Matemática da Realidade, Sala de Aula Invertida, Projetos Integradores, etc.

O backend **proíbe terminantemente** e rejeita qualquer campo de prompt em branco ou comando de texto livre (`prompt`, `rawPrompt`, `comando`) com código HTTP **422 Unprocessable Entity (RFC 7807)**.

```
[Seletores do Professor] ──► [Validador Zod & Anti-Prompt Livre] ──► [Matriz Curricular BNCC x CNCT]
                                                                               │
[Groq LLaMA 3.3] ◄── [Payload JSON Estrito] ◄── [Injeção Oculta Skovsmose + Ética]
[Google Gemini]  ◄──
```

### B. Elementos Injetados Server-Side no System Prompt:
1. **Papel Pedagógico Especializado:** Docente e pesquisador em Educação Matemática na EPT e Educação Matemática Crítica.
2. **Diretrizes de Ole Skovsmose (2022):**
   - *Matemática em Ação (Formatting Power):* Reconhecimento de que os modelos matemáticos formatam decisões produtivas e sociais reais.
   - *Conhecimento Reflexivo:* O estudante não apenas calcula, mas avalia criticamente as consequências éticas e sociais do resultado.
   - *Pedagogia da Incerteza:* Análise de tolerâncias dimensionais, margens de erro e variáveis do mundo real.
3. **Ancoragem Curricular BNCC:** Injeção automática das habilidades oficiais do Ensino Médio/EPT com código (`EM13MAT401`, `EM13MAT308`, `EM13MAT103`, etc.) e descrição integral.
4. **Contexto Autêntico do Mundo do Trabalho (CNCT):** Injeção de situações autênticas específicas do curso técnico (ex: diluição medicamentosa em Enfermagem, cubagem de silos em Agropecuária, amortização SAC/Price em Administração, rampas NBR 9050 em Edificações).
5. **Banner Ético de Autoridade Docente Obrigatório:**
   > *"Este material foi gerado por Inteligência Artificial e deve ser revisado, validado e adaptado pela autoridade docente antes de sua aplicação em sala de aula."*
6. **Formato de Saída Estrito em JSON:** A LLM é instruída a retornar **única e exclusivamente um objeto JSON** aderente a um JSON Schema formal.

---

## ⚙️ 3. Critério de Aceite Atendido: Estrutura JSON Estrita para LLMs

O serviço gera um objeto JSON contendo os payloads específicos prontos para envio às APIs:

1. **`groqPayload` (Groq API - LLaMA 3.3 70B Versatile):**
   - `model: 'llama-3.3-70b-versatile'`
   - `temperature: 0.4`
   - `response_format: { type: 'json_object' }`
   - Mensagens estruturadas `system` e `user`.

2. **`geminiPayload` (Google Gemini 1.5 Flash):**
   - `model: 'gemini-1.5-flash'`
   - `generationConfig: { temperature: 0.4, responseMimeType: 'application/json' }`
   - `systemInstruction: { parts: [{ text: ... }] }`
   - `contents: [{ role: 'user', parts: [{ text: ... }] }]`

3. **`schemaSaidaEsperada`:** JSON Schema padronizado que governa o formato da resposta das LLMs.

4. **`telemetriaMeta`:** Metadados de rastreabilidade (UUID, hash SHA-256 dos parâmetros, estimativa de tokens, conformidade ética).

---

## 🔍 4. Rastreabilidade no Repositório

| Componente | Arquivo | Finalidade |
|---|---|---|
| **Matriz Curricular EPT/BNCC** | [`backend/src/config/curricularMatrix.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/config/curricularMatrix.js) | Catálogo de Eixos CNCT, Cursos, Habilidades BNCC, Skovsmose e Situações Reais de Trabalho. |
| **Validador Zod & Anti-Prompt Livre** | [`backend/src/validators/promptValidator.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/validators/promptValidator.js) | Validação estrita dos parâmetros e rejeição compulsória de campos de texto livre. |
| **Motor de Injeção de Prompts** | [`backend/src/services/PromptInjectionService.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/services/PromptInjectionService.js) | Montagem de System Instruction, User Prompt, JSON Schema e payloads para Groq e Gemini. |
| **Controller do Laboratório** | [`backend/src/controllers/LaboratorioController.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/controllers/LaboratorioController.js) | Endpoints HTTP `POST /api/laboratorio/montar-prompt` e `GET /api/laboratorio/parametros-curriculares`. |
| **Rotas da API** | [`backend/src/routes/laboratorioRoutes.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/routes/laboratorioRoutes.js) | Exposição RESTful no roteador principal `/api`. |
| **Suite de Testes Automatizados** | [`backend/src/test-prompt-injection.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/test-prompt-injection.js) | 13 casos de teste unitários e de integração HTTP cobrindo 100% dos critérios de aceite. |
| **Interface do Laboratório** | [`src/views/LaboratorioView.jsx`](file:///c:/apps/IAProfEPT/PLATAFORMA/src/views/LaboratorioView.jsx) | Interface com os 5 seletores parametrizados e pré-visualização da injeção curricular. |

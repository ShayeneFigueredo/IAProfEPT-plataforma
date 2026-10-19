# 📄 ADR-020: Validação Server-side contra a Matriz Curricular BNCC x EPT e Bloqueio Estrito Anti-Prompt Livre

> **Status:** Aprovado  
> **Data de Decisão:** 19 de Outubro de 2026  
> **Contexto:** Tese de Doutorado em Educação Matemática — PPGEM / UFJF  
> **Doutorando:** Maycon Luiz Amaral Magalhães  
> **Engenharia de Software:** Shayene Figueredo & Samuel Amorim  
> **Orientadores:** Prof. Dr. Eduardo Barrére | Prof. Dr. Manuel José Cabral dos Santos Reis  
> **Ambiente Relacionado:** Ambiente 2 — Laboratório de IA  
> **Fase do Cronograma:** Fase 2 — Engenharia de Prompts Ocultos e Resiliência  

---

## 🎯 1. Contexto e Problema de Pesquisa

A Plataforma **IAprofEPT** fundamenta-se no princípio inegociável da **proibição de caixas de prompt em branco** ([ADR-001](./ADR_001_ENGENHARIA_PROMPT_OCULTA_SEM_PROMPT_EM_BRANCO.md)), garantindo que docentes de Matemática da Educação Profissional e Tecnológica (EPT) não precisem atuar como "engenheiros de prompt", nem sejam expostos a interações descontextualizadas ou alucinações das LLMs.

Contudo, existia a necessidade de uma barreira de segurança defensiva em profundidade (*defense-in-depth*) a nível de middleware HTTP:
1. **Tentativas de Jailbreak / Prompt Injection:** Usuários maliciosos ou scripts automatizados poderiam tentar injetar comandos como `"ignore previous instructions"`, `"DAN mode"`, ou delimitadores de controle de LLM (`<|im_start|>`, `### System:`) dentro de parâmetros válidos ou campos adicionais.
2. **Parâmetros Fora dos Catálogos Homologados:** Se um cliente HTTP enviasse cursos fictícios (ex: `"Curso de Magia"`), áreas descontextualizadas (ex: `"Astrologia"`) ou ferramentas inexistentes (ex: `"chat_livre"`), esses parâmetros não podiam ser aceitos nem cair em fallbacks silenciosos arbitrários que comprometessem o rigor científico do experimento de 30 dias.
3. **Padrão de Erro RFC 7807:** Qualquer desconformidade curricular ou tentativa de envio de texto livre deve ser rejeitada sumariamente com **HTTP 422 Unprocessable Entity** e formato estruturado `application/problem+json`, discriminando os parâmetros inválidos.

---

## ⚖️ 2. Decisão Arquitetural

Implementou-se o middleware unificado `validarMatrizCurricularMiddleware` em [`backend/src/middlewares/matrizCurricularMiddleware.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/middlewares/matrizCurricularMiddleware.js), acoplado às rotas `POST` do Laboratório de IA:

### A. Lista Negra Estrita de Propriedades de Texto Livre (ADR-001)
Rejeição imediata se qualquer uma das seguintes propriedades estiver presente no corpo da requisição:
- `prompt`, `rawPrompt`, `customPrompt`, `instrucaoLivre`, `textoLivre`, `mensagemLivre`, `comando`, `systemPromptCustomizado`, `userPrompt`, `freeText`, `instrucao`, `inputPrompt`, `query`, `mensagem`, `texto`, `chat`.

### B. Detecção Heurística de Jailbreaks e Injeções de Controle
Varredura de todas as strings da requisição contra padrões maliciosos conhecidos:
- Desvio de diretrizes (`ignore all instructions`, `desconsidere as instruções`);
- Delimitadores de controle (`system:`, `<|im_start|>`, `[INST]`, `### System:`);
- Modos não autorizados (`DAN mode`, `developer mode`, `jailbreak`);
- Personificação (`você agora é`, `you are now`, `finja que`, `act as`);
- Payloads de código (`<script>`, `javascript:`, `eval()`, `DROP TABLE`).

### C. Resolução Estrita contra Catálogos Curriculares Homologados
Cada parâmetro é validado contra as matrizes oficiais em [`backend/src/config/curricularMatrix.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/config/curricularMatrix.js):
- **Cursos Técnicos CNCT:** Validados contra `CURSOS_TECNICOS_DETALHADOS` e seus aliases catalogados (8 cursos do CNCT 4ª edição);
- **Áreas da Matemática BNCC:** Validadas contra `HABILIDADES_BNCC_DETALHADAS` (10 áreas centrais);
- **Metodologias Pedagógicas:** Validadas contra `METODOLOGIAS_PEDAGOGICAS` (PBL, MMR, Sala Invertida, Projetos, etc.);
- **Níveis de Dificuldade:** Validados contra `NIVEIS_DIFICULDADE` (Inicial, Intermediário, Avançado e anos integrados);
- **Ferramentas / Modalidades:** Estritamente limitadas a `['exercicios', 'interdisciplinar', 'podcast', 'plano', 'plano_aula']`.

---

## 🛡️ 3. Critérios de Aceite e Verificação

| Critério | Comportamento Esperado | Status |
|---|---|---|
| Parâmetro fora do catálogo | Retorna HTTP 422 com `application/problem+json` e array `invalidParams` | **Aprovado** |
| Campo de prompt livre enviado | Retorna HTTP 422 informando violação da ADR-001 | **Aprovado** |
| Jailbreak heurístico detectado | Retorna HTTP 422 informando violação de segurança | **Aprovado** |
| Parâmetros homologados enviados | Transforma e normaliza para rótulos canônicos com HTTP 200 OK | **Aprovado** |

---

## 🧪 4. Suíte de Testes Automatizados

A suíte [`backend/src/test-matriz-anti-prompt.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/test-matriz-anti-prompt.js) executa 18 testes de validação cobrindo:
1. Resolução estrita dos catálogos curriculares;
2. Interceptação server-side com HTTP 422 para cursos, áreas, metodologias, níveis e ferramentas inválidas;
3. Bloqueio de campos de texto livre (`prompt`, `rawPrompt`, etc.);
4. Detecção de jailbreak (`DAN mode`, `ignore previous instructions`);
5. Rejeição de campos desconhecidos arbitrários;
6. Aplicação em todas as rotas POST do Laboratório (`/gerar`, `/montar-prompt`, `/gerar-groq`, `/gerar-gemini`);
7. Execução com sucesso para parâmetros curriculares válidos.

Comando para execução:
```bash
npm run test:matriz
```

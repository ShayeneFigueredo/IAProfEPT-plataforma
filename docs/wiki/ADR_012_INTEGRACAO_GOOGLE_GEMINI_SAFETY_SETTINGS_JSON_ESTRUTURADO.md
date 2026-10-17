# 🏛️ Documento de Decisão Arquitetural (ADR-012)
## Integração com a API Google Gemini (SDK Oficial), Configuração de Safety Settings, Temperatura e Esquemas JSON Estruturados (Interdisciplinar e Planos de Aula)

- **Status:** Aprovado / Implementado
- **Data da Decisão:** Outubro / 2026
- **Contexto da Pesquisa:** Tese de Doutorado em Educação Matemática (PPGEM / UFJF)
- **Autor / Doutorando:** Maycon Luiz Amaral Magalhães
- **Engenharia de Software:** Shayene Figueredo & Samuel Amorim
- **Orientadores:** Prof. Dr. Eduardo Barrére | Prof. Dr. Manuel José Cabral dos Santos Reis
- **Classificação CAPES:** Produto Técnico-Tecnológico (PTT4 - Software/Plataforma Educacional)
- **Referência Jira:** `[IA Engine]` / `[Gemini SDK Integration]` | **Fase:** 2

---

## 🎯 1. Contexto Científico & Justificativa do Experimento A/B

Em conformidade com a [ADR-003](ADR_003_ARQUITETURA_IA_DUPLA_E_PROTOCOLO_TESTE_AB.md), a tese de Maycon Magalhães estabelece uma avaliação empírica comparativa entre dois paradigmas de Inteligência Artificial Generativa aplicados à Educação Matemática na EPT:
- **Motor A (Groq LPU / LLaMA 3.3 70B):** Arquitetura aberta voltada à ultra-baixa latência e cálculo aritmético estrito.
- **Motor B (Google Gemini 1.5 Flash / Pro):** Ecossistema de ponta multimodal do Google DeepMind, projetado para raciocínio contextual ampliado, grande janela de contexto, articulações interdisciplinares complexas e sequenciamento de planos de aula.

### Desafios de Engenharia & Pedagógicos Resolvidos:
1. **Filtros de Segurança Institucionais (Safety Settings):** Em ambientes escolares da Rede Federal (RFEPCT), é mandatório bloquear qualquer viés discriminatório, discurso de ódio, assédio, violência ou conteúdo perigoso. O Google Gemini SDK oferece configurações granulares de segurança (`HarmCategory` e `HarmBlockThreshold`).
2. **Esquemas JSON Estruturados para Interdisciplinaridade e Metodologias Ativas:**
   - **Atividades Interdisciplinares:** Articulação entre o Eixo Tecnológico do CNCT, os conceitos matemáticos da BNCC e situações-problema autênticas do mundo do trabalho.
   - **Planos de Aula Ativa:** Sequenciamento temporal (momentos da aula), diferenciação entre papéis do docente e do estudante (PBL/Sala Invertida/Projetos) e instrumentos de avaliação formativa com devolução reflexiva.
3. **Resiliência a Picos de Demanda (HTTP 503) e Depreciação de Modelos (404 / Quotas):** O ecossistema de APIs de LLMs evolui rapidamente. A solução implementada precisava garantir continuidade do serviço através de cadeias de resolução e chaveamento transparente de modelos (*graceful degradation / fallback*).
4. **Alerta Ético Obrigatório (ADR-002 / AGENTS.md):** Injeção inegociável do banner de validação docente em 100% das respostas estruturadas.

---

## ⚙️ 2. Arquitetura da Solução Implementada

### A. Cliente com SDK Oficial (`GeminiService.js`)
Localizado em [`backend/src/services/GeminiService.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/services/GeminiService.js):
- **SDK Oficial:** Utiliza `@google/generative-ai` com chave de API injetada exclusivamente via variáveis de ambiente (`GEMINI_API_KEY`), garantindo segurança das credenciais (ADR-002).
- **Temperatura Calibrada:** Parametrizada entre `0.2` e `0.4` (padrão `0.3`) para equilibrar rigor lógico e riqueza de articulações curriculares.
- **Configuração de Resposta JSON:** `generationConfig: { responseMimeType: "application/json" }` para garantir conformidade imediata com os esquemas da plataforma.

### B. Parametrização Granular de Safety Settings
Configuradas institucionalmente no método `obterSafetySettingsPadrao()`:
| Categoria de Risco (`HarmCategory`) | Limiar de Bloqueio (`HarmBlockThreshold`) | Justificativa Pedagógica |
|---|---|---|
| `HARM_CATEGORY_HARASSMENT` | `BLOCK_MEDIUM_AND_ABOVE` | Prevenção de assédio e coação no discurso pedagógico. |
| `HARM_CATEGORY_HATE_SPEECH` | `BLOCK_MEDIUM_AND_ABOVE` | Bloqueio de capacitismo, racismo ou discriminação social. |
| `HARM_CATEGORY_SEXUALLY_EXPLICIT` | `BLOCK_MEDIUM_AND_ABOVE` | Conformidade com o ambiente escolar e integridade de menores. |
| `HARM_CATEGORY_DANGEROUS_CONTENT` | `BLOCK_MEDIUM_AND_ABOVE` | Prevenção de riscos em atividades laboratoriais e industriais. |

### C. Esquemas JSON Estruturados Validados
1. **`ESQUEMA_ATIVIDADE_INTERDISCIPLINAR`:**
   - `tituloAtividade`, `eixoCNCT`, `cursoTecnico`, `areaMatematica`, `habilidadesBNCC`.
   - `articulacaoCurricular`: conceito matemático, aplicação no trabalho e disciplinas técnicas integradas.
   - `situacaoProblemaAutentica`: cenário real, dados técnicos e desafio profissional.
   - `etapasInvestigacao`: etapas numeradas, comandos, gabarito e interpretação técnica.
   - `reflexaoCriticaEMC`: dimensão ética/social e provocação docente (Skovsmose).
   - `alertaEticoObrigatorio`: texto canônico do projeto.

2. **`ESQUEMA_PLANO_AULA`:**
   - `tituloPlano`, `metodologiaAtiva`, `duracaoTotalMinutos`.
   - `momentosDaAula`: momentos estruturados (ex: Acolhimento, Investigação, Sistematização), tempo em minutos, `papelDoDocente` (mediador) e `papelDoEstudante` (protagonista).
   - `avaliacaoFormativa`: critérios de sucesso, instrumentos e feedback devolutivo.
   - `reflexaoCriticaEMC`: problematização social e cidadania.

### D. Cadeia Resiliente de Modelos e Tratamento de 503 / 429
O `GeminiService` implementa um mecanismo autônomo de resolução de modelos em cadeia:
- **Cadeia Flash:** `[GEMINI_MODEL, 'gemini-3-flash-preview', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite']`.
- **Cadeia Pro:** `[GEMINI_MODEL_PRO, 'gemini-3.1-pro-preview', 'gemini-3-flash-preview', 'gemini-3.6-flash', 'gemini-3.5-flash']`.
- **Comportamento em Exceções:**
  - `404 Not Found` (modelo depreciado pelo Google): pula imediatamente para o próximo modelo ativo sem penalidade de repetição.
  - `429 Quota Exceeded (limit: 0)`: detecta restrição de cota do tier gratuito e chaveia automaticamente para o modelo de suporte operacional.
  - `503 Service Unavailable (High demand)`: executa backoff com jitter e, se persistir, chaveia para o modelo alternativo da cadeia.
  - **Caching de Modelo Operacional:** O modelo bem-sucedido é memorizado em `this.activeModel` para garantir agilidade nas requisições seguintes.

### E. Telemetria A/B no PostgreSQL
Toda inferência pelo Gemini registra automaticamente:
- Latência total em milissegundos (`latencia_ms`).
- Tokens consumidos (`prompt_tokens`, `completion_tokens`, `total_tokens`).
- Modelo efetivo utilizado e flag `fallback_utilizado`.
- Vínculo relacional com a tabela `requisicoes_ia` e os parâmetros curriculares enviados.

---

## 🔒 3. Conformidade com o Alerta Ético e AGENTS.md

Toda atividade gerada pelo Gemini recebe a garantia do banner de validação docente:
> *"Este material foi gerado por Inteligência Artificial e deve ser revisado, validado e adaptado pela autoridade docente antes de sua aplicação em sala de aula."*

---

## 🧪 4. Validação e Testes Automatizados

A integração foi validada através da suíte [`backend/src/test-gemini-integration.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/test-gemini-integration.js), executável via:
```bash
npm run test:gemini
```
Verificações cobertas:
1. Validação dos 4 blocos de Safety Settings (`BLOCK_MEDIUM_AND_ABOVE`).
2. Validação dos esquemas JSON obrigatórios (`interdisciplinar` e `plano`).
3. Diagnóstico de conectividade e benchmark (`GET /api/laboratorio/gemini-benchmark`).
4. Geração real de atividade interdisciplinar contextualizada para a EPT.
5. Geração real de plano de aula ativa estruturado com tempos e papéis definidos.
6. Persistência atômica da telemetria A/B no banco de dados.
7. Teste de integração HTTP com o Express e respostas padronizadas RFC 7807.

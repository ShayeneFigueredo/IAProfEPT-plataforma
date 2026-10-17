# 🏛️ Documento de Decisão Arquitetural (ADR-011)
## Integração com a API Groq (LLaMA 3.3 70B via LPU), Parametrização para Cálculo Matemático Preciso e Tratamento de Rate Limits (429)

- **Status:** Aprovado / Implementado
- **Data da Decisão:** Outubro / 2026
- **Contexto da Pesquisa:** Tese de Doutorado em Educação Matemática (PPGEM / UFJF)
- **Autor / Doutorando:** Maycon Luiz Amaral Magalhães
- **Engenharia de Software:** Shayene Figueredo & Samuel Amorim
- **Orientadores:** Prof. Dr. Eduardo Barrére | Prof. Dr. Manuel José Cabral dos Santos Reis
- **Classificação CAPES:** Produto Técnico-Tecnológico (PTT4 - Software/Plataforma Educacional)
- **Referência Jira:** `[IA Engine]` / `[Groq LPU Integration]` | **Fase:** 2

---

## 🎯 1. Contexto Científico & Justificativa do Experimento A/B

Como estabelecido na [ADR-003](ADR_003_ARQUITETURA_IA_DUPLA_E_PROTOCOLO_TESTE_AB.md), a tese de doutorado de Maycon Magalhães realiza um **Teste Comparativo A/B empírico de 30 dias** com professores de Matemática da Rede Federal de Educação Profissional, Científica e Tecnológica (RFEPCT).

O **Motor A** do experimento fundamenta-se no ecossistema de modelos abertos de ponta (*open-weights*) executados em hardware dedicado de ultra-baixa latência:
- **Provedor:** Groq Cloud Inc.
- **Hardware de Aceleração:** LPU (Language Processing Unit), capaz de inferência sustentada superior a 300-450 tokens por segundo.
- **Modelo:** `llama-3.3-70b-versatile` (Meta AI).

### Desafios de Engenharia Resolvidos:
1. **Rigor Matemático vs Alucinação:** LLMs com temperaturas elevadas (0.7 a 1.0) tendem a cometer erros aritméticos grosseiros ou inventar dados em fórmulas de dosagem farmacológica, dimensionamento de silos ou circuitos elétricos. Era imperativo calibrar temperatura estrita (0.2 a 0.4).
2. **Tempo de Resposta em Sala de Aula:** Docentes não toleram esperas superiores a 10 ou 15 segundos durante o planejamento pedagógico. O critério de aceite estabeleceu inferência com tempo de resposta inferior a 2 segundos (< 2000 ms).
3. **Resiliência a Rate Limits (HTTP 429):** Provedores de nuvem impõem quotas de requisições por minuto (RPM) e tokens por minuto (TPM). O cliente precisava lidar de forma transparente com picos de tráfego sem derrubar a requisição do professor.

---

## ⚙️ 2. Arquitetura da Solução Implementada

### A. Cliente de Alta Performance (`GroqService.js`)
Localizado em [`backend/src/services/GroqService.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/services/GroqService.js):
- **Conexão Nativa:** Utiliza a API global de `fetch` do Node.js com `AbortController` para timeout estrito (15s).
- **Parametrização Matemática Determinística:**
  - `temperature: 0.2` (faixa 0.2 a 0.4 para garantir determinismo e reprodutibilidade científica nos cálculos).
  - `max_tokens: 4096`.
  - `response_format: { type: "json_object" }` para forçar geração estrita em JSON com gabarito passo a passo.
- **Rastreabilidade e Medição de Latência:**
  - Medição de alta precisão via `performance.now()`.
  - Extração de tokens consumidos (`usage.prompt_tokens`, `usage.completion_tokens`, `usage.total_tokens`).
  - Cálculo de vazão da LPU em tokens/segundo.

### B. Tratamento Resiliente de Rate Limits (429) e Quotas
- Monitoramento contínuo dos cabeçalhos proprietários da Groq:
  - `x-ratelimit-remaining-requests`
  - `x-ratelimit-reset-requests`
  - `x-ratelimit-remaining-tokens`
  - `retry-after`
- **Algoritmo de Retry com Exponential Backoff e Jitter:**
  - Em caso de HTTP 429, o serviço calcula o tempo de espera respeitando o cabeçalho `retry-after` ou aplicando $2^{\text{tentativa}} \times 1000\text{ms} + \text{jitter}$ aleatório.
  - Executa até 3 tentativas automáticas.
  - Caso esgotadas as tentativas, lança `RateLimitError` padronizado pelo RFC 7807 com orientações claras ao docente.

### C. Fallback Operacional e Alta Disponibilidade
- Se a conta ou chave temporária retornar `404 model_not_found` para o modelo primário, o motor chaveia transparentemente para o modelo de contingência (`openai/gpt-oss-120b`), memorizando o modelo ativo em sessão para evitar penalidades de latência em requisições subsequentes, e gravando `fallback_utilizado: true` na tabela `telemetria_ab`.

### D. Integração com a Telemetria A/B da Pesquisa
- Toda geração executada pelo docente é registrada de forma atômica no PostgreSQL através de [`LaboratorioRepository.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/repositories/LaboratorioRepository.js), abastecendo as tabelas:
  - `requisicoes_ia`: conteúdo gerado, parâmetros de entrada, habilidades BNCC e flag de validação ética.
  - `telemetria_ab`: latência (ms), motor (`groq`), tokens, hash anonimizado do docente (LGPD / CEP) e status de execução.

---

## 📊 3. Critérios de Aceite Validados

| Critério de Aceite | Resultado Obtido | Evidência nos Testes |
|---|---|---|
| **Tempo de Resposta < 2 segundos** | **607 ms a 752 ms** no benchmark LPU | `npm run test:groq` (Teste 1 e Teste 4: [PASS]) |
| **Vazão da LPU Groq** | **~444 a 454 tokens/segundo** | Inferência contínua sem filas perceptíveis |
| **Temperatura Baixa (0.2 a 0.4)** | `0.2` parametrizado | Cálculo exato de dosagens e taxas lineares |
| **Gabarito Passo a Passo** | Completo com interpretação física | Presente em todos os itens gerados |
| **Tratamento de Rate Limits 429** | Backoff exponencial + RFC 7807 | Simulação com captura de `RateLimitError` |
| **Alerta Ético Obrigatório** | 100% de conformidade | Banner institucional inserido no JSON |

---

## 🔍 4. Rastreabilidade no Repositório

- **Cliente Groq:** [`backend/src/services/GroqService.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/services/GroqService.js)
- **Persistência de Telemetria:** [`backend/src/repositories/LaboratorioRepository.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/repositories/LaboratorioRepository.js)
- **Controlador RESTful:** [`backend/src/controllers/LaboratorioController.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/controllers/LaboratorioController.js)
- **Rotas:** [`backend/src/routes/laboratorioRoutes.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/routes/laboratorioRoutes.js)
  - `POST /api/laboratorio/gerar-groq`
  - `GET /api/laboratorio/groq-benchmark`
- **Suite de Testes Automatizados:** [`backend/src/test-groq-integration.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/test-groq-integration.js)
- **Variáveis de Ambiente:** `.env` (`GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_TEMPERATURE`, `GROQ_MAX_TOKENS`)

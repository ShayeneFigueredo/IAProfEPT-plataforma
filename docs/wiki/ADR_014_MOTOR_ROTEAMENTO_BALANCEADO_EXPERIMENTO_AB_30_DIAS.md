# ADR 014: Motor de Roteamento Balanceado para o Experimento Piloto A/B de 30 Dias (Groq vs Gemini)

> **Documento de Governança Arquitetural & Rastreabilidade Científica**  
> **Projeto de Tese de Doutorado** — Programa de Pós-Graduação em Educação Matemática (PPGEM / UFJF)  
> **Doutorando:** Maycon Luiz Amaral Magalhães  
> **Engenharia de Software:** Shayene Figueredo & Samuel Amorim  
> **Orientador:** Prof. Dr. Eduardo Barrére | **Coorientador:** Prof. Dr. Manuel José Cabral dos Santos Reis  
> **Data de Registro:** 16/10/2026 (15:20 Horário de Brasília)  
> **Fase do Projeto:** Fase 2 (Engenharia de Prompts Ocultos, Backend IA Dupla & Prof. mAIcon) / Preparação Fase 3 (Deploy Piloto & Teste A/B de 30 Dias)  

---

## 📌 1. Status
**Aprovado e Implementado**. Roteador de distribuição balanceada 1:1 homologado estatisticamente com Teste Qui-Quadrado de Aderência ($\chi^2 = 0.004 < 3.841$, $p = 0.94957 > 0.05$ para $N = 1.000$) e persistência atômica da chave de teste por requisição no PostgreSQL 16+.

---

## 🎯 2. Contexto Científico & Requisitos da Tese

O capítulo 4 da Tese de Doutorado de Maycon Magalhães preconiza a realização de um **experimento empírico controlado de 30 dias** (janela de 20/10/2026 a 20/11/2026) junto a professores de Matemática da Rede Federal de Educação Profissional, Científica e Tecnológica (RFEPCT).

O objetivo do experimento é confrontar duas abordagens de Inteligência Artificial Generativa sob as mesmas condições pedagógicas parametrizadas:
1. **Motor A — Groq LLaMA 3.3 70B Versatile via LPU Hardware:** Avaliação de latência ultrarrápida (< 2s), determinismo e consistência lógica formal na resolução de situações-problema da Educação Matemática Crítica.
2. **Motor B — Google Gemini 1.5 Flash / Pro:** Avaliação de esquemas JSON estruturados com Safety Settings ativas, amplitude interdisciplinar entre áreas do conhecimento e articulação com os Eixos Tecnológicos do CNCT.

### Critérios Críticos Exigidos:
- **Janela de Teste Temporal Estrita:** 20/10/2026 00:00:00 a 20/11/2026 23:59:59 (Horário de Brasília), com suporte a ativação prévia para testes analíticos (`EXPERIMENTO_AB_ATIVO=true`).
- **Alocação Balanceada 50% / 50%:** A taxa de alocação entre Motor A e Motor B deve atender à proporção 1:1 estatisticamente comprovada ($H_0: P(A) = P(B) = 0.5$).
- **Algoritmo Determinístico & Pseudo-Aleatório:** Garantir consistência para uma mesma chave de requisição/docente, com distribuição uniforme baseada em hashing criptográfico SHA-256 e controle adaptativo de deriva de amostragem.
- **Persistência Atômica da Chave de Teste:** Cada requisição gerada no laboratório deve gravar na tabela `telemetria_ab` o grupo experimental (`'A'` ou `'B'`), a chave de teste única, o critério algorítmico e a flag de experimento ativo.

---

## 📐 3. Formulação Estatística do Critério de Aceite (Teste Qui-Quadrado)

Para assegurar validade científica aos dados coletados durante o protocolo piloto de 30 dias na RFEPCT, o balanceador implementa o teste de aderência Qui-Quadrado ($\chi^2$ Goodness-of-Fit) com 1 grau de liberdade ($df = 1$) e nível de significância $\alpha = 0.05$:

$$\chi^2 = \sum_{i \in \{A, B\}} \frac{(O_i - E_i)^2}{E_i} = \frac{(O_A - N/2)^2}{N/2} + \frac{(O_B - N/2)^2}{N/2}$$

Onde:
- $N = O_A + O_B$ (Total acumulado de requisições alocadas).
- $O_A$ e $O_B$ são as contagens observadas dos Grupos A e B.
- $E_A = E_B = N/2$ são as contagens esperadas sob a hipótese nula $H_0$.
- O valor crítico tabelado para $\alpha = 0.05$ e $df = 1$ é $\chi^2_{\text{crítico}} = 3.84146$.

### Regra de Aceitação:
- **Aceita-se $H_0$** se $\chi^2 < 3.84146$ e $p\text{-valor} > 0.05$, atestando que a distribuição observada não possui viés e cumpre rigorosamente a proporção 1:1.

---

## 🛠️ 4. Decisão Arquitetural e Componentes Implementados

### A. Serviço Central: `ABRoutingService.js`
Localização: [`backend/src/services/ABRoutingService.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/services/ABRoutingService.js)

O serviço orquestra a lógica de alocação através de 3 estratégias:
1. `'balanceado_adaptativo'` (Padrão de Produção): Utiliza a propriedade de avalanche uniforme do SHA-256 para extrair um inteiro sem sinal de 32 bits normalizado em 10.000 buckets $[0, 9999]$. Caso ocorra deriva momentânea na amostragem ($|O_A - O_B| > 1$), o algoritmo compensa preventivamente a alocação, garantindo que mesmo em pequenos lotes ou sequências rápidas a proporção convirja exatamente para 1:1.
2. `'hash_deterministico'`: Alocação pura via hash `SHA-256(chave) % 10000 < 5000 ? 'A' : 'B'`.
3. `'intercalado'`: Round-robin estrito alternado para benchmarks sintéticos de carga.

### B. Integração com o Roteador de Resiliência: `AIRouterService.js`
Localização: [`backend/src/services/AIRouterService.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/services/AIRouterService.js)

- Em modo `'auto'` ou durante a janela oficial do experimento, o roteador consulta o `ABRoutingService` para selecionar o motor primário (`'groq'` ou `'gemini'`) e o alternativo.
- **Resiliência Transparente:** Caso o motor alocado pelo teste A/B esteja com seu Circuit Breaker em estado `OPEN`, o sistema chaveia automaticamente para o motor alternativo, mas **preserva o grupo experimental original** (`grupo_experimental: 'A'`, `contingencia_acionada: true`), garantindo fidelidade metodológica aos registros da pesquisa.

### C. Persistência de Dados no PostgreSQL: `20261016152001_add_ab_experiment_columns_to_telemetria.js`
Novas colunas e índices adicionados à tabela `telemetria_ab`:

```sql
ALTER TABLE telemetria_ab
  ADD COLUMN grupo_experimental VARCHAR(10) NULL,
  ADD COLUMN chave_alocacao VARCHAR(128) NULL,
  ADD COLUMN criterio_alocacao VARCHAR(50) NULL,
  ADD COLUMN experimento_ativo BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX idx_telemetria_grupo_experimental ON telemetria_ab (grupo_experimental);
CREATE INDEX idx_telemetria_chave_alocacao ON telemetria_ab (chave_alocacao);
CREATE INDEX idx_telemetria_experimento_ativo ON telemetria_ab (experimento_ativo);
```

### D. Métricas Analíticas da Tese: `MetricasRepository.js`
Adição do bloco `experimentoAB30Dias` na rota autenticada `GET /api/metricas/tese`, consolidando contagens observadas, razão de distribuição, estatística Qui-Quadrado, p-valor e conformidade 1:1.

### E. Coleta e Persistência Assíncrona com Zero Sobrecarga: `TelemetryAsyncService.js`
Localização: [`backend/src/services/TelemetryAsyncService.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/services/TelemetryAsyncService.js)

Para que a coleta contínua de métricas não degrade a experiência do professor de Matemática com latência adicional de banco de dados, a camada de persistência foi desacoplada do ciclo de resposta HTTP:
- **Zero-Overhead (< 0.1ms):** As métricas de inferência (`id_requisicao`, `usuario_id` anonimizado via SHA-256, `motor_utilizado`, `modelo_especifico`, `tempo_latencia_ms`, `tokens_prompt`, `tokens_completion`, `parametros_curriculares`, `status_execucao`, `data_hora`) são recebidas em memória e enfileiradas instantaneamente sem aguardar I/O de disco.
- **Batch Flush em Segundo Plano:** Um worker assíncrono drena os lotes periodicamente (a cada 500ms ou ao atingir 10 itens) com transações atômicas no PostgreSQL 16+.
- **Resiliência e Backoff:** Retentativas automáticas (até 3 tentativas) e descarte preventivo com backpressure para proteção de memória em regimes de alta concorrência.

---

## 🔬 5. Resultados dos Testes Automatizados de Validação

Execuções oficiais das suítes de teste:
- Roteamento A/B: [`backend/src/test-ab-routing.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/test-ab-routing.js) (`npm run test:ab`)
- Telemetria Assíncrona: [`backend/src/test-telemetria-assincrona.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/test-telemetria-assincrona.js) (`npm run test:telemetria`)

| Teste | Critério Avaliado | Resultado | Decisão |
|---|---|---|---|
| **Janela Temporal** | 16/10 (inativo), 20/10 a 20/11 (ativo), 21/11 (inativo) | Conforme | Aprovado |
| **Determinismo** | Reprodutibilidade com chave de sessão docente idêntica | Conforme | Aprovado |
| **Amostra $N=1.000$** | $O_A = 499$ (49,90%) vs $O_B = 501$ (50,10%) | Razão 0,9960 : 1,0000 | Aprovado |
| **Teste Qui-Quadrado** | $\chi^2 = 0,004$ (Crítico: 3,84146), $p = 0,94957$ | $H_0$ Aceita | Aprovado |
| **Sobrecarga ao Usuário** | Latência percebida pelo docente ao registrar telemetria | **0,070 ms** (< 1,0 ms) | **Aprovado (Zero Sobrecarga)** |
| **Carga Concorrente ($N=50$)** | Enfileiramento de 50 métricas simultâneas | **0,037 ms/item** | Aprovado (100% gravado no PG) |
| **Anonimização Ética** | SHA-256 sobre identificador docente (Res. CNS 510/2016) | 64 chars hex sem vazamento | Aprovado |
| **Persistência PostgreSQL** | Colunas e índices gravados na tabela `telemetria_ab` | Atômico | Aprovado |
| **Resiliência Integrada** | Circuit Breaker OPEN -> Fallback com preservação do Grupo | Conforme | Aprovado |

---

## 📚 6. Referências & Vínculos Científicos
- **ADR-003:** [Arquitetura de IA Dupla e Protocolo de Teste A/B Comparativo](ADR_003_ARQUITETURA_IA_DUPLA_E_PROTOCOLO_TESTE_AB.md).
- **ADR-011:** [Integração com Groq API (LLaMA 3.3 70B Versatile via LPU)](ADR_011_INTEGRACAO_GROQ_LLAMA33_LPU_INFERENCIA.md).
- **ADR-012:** [Integração com Google Gemini API (Safety Settings e Esquemas Estruturados)](ADR_012_INTEGRACAO_GOOGLE_GEMINI_SAFETY_SETTINGS_JSON_ESTRUTURADO.md).
- **ADR-013:** [Roteador Inteligente e Mecanismo de Fallback com Circuit Breaker](ADR_013_ROTEADOR_INTELIGENTE_CIRCUIT_BREAKER_FALLBACK_ENTRE_MOTORES.md).
- **Regulamentação Ética:** Parecer CEP/UFJF e Resolução CNS 510/2016.

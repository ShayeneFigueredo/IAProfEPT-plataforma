# 🏛️ Documento de Decisão Arquitetural (ADR-013)
## Roteador Inteligente de IA, Padrão Circuit Breaker com Timeout de 10s e Mecanismo de Fallback Automático entre Motores (Groq vs Gemini)

- **Status:** Aprovado / Implementado
- **Data da Decisão:** Outubro / 2026
- **Contexto da Pesquisa:** Tese de Doutorado em Educação Matemática (PPGEM / UFJF)
- **Autor / Doutorando:** Maycon Luiz Amaral Magalhães
- **Engenharia de Software:** Shayene Figueredo & Samuel Amorim
- **Orientadores:** Prof. Dr. Eduardo Barrére | Prof. Dr. Manuel José Cabral dos Santos Reis
- **Classificação CAPES:** Produto Técnico-Tecnológico (PTT4 - Software/Plataforma Educacional)
- **Referência Jira:** `[IA Engine]` / `[Resilience Router & Circuit Breaker]` | **Fase:** 2

---

## 🎯 1. Contexto Científico & Justificativa do Experimento A/B

A tese de doutorado de Maycon Magalhães realiza uma avaliação comparativa empírica (*Teste A/B*) de 30 dias na Rede Federal de Educação Profissional, Científica e Tecnológica (RFEPCT). 

No ambiente escolar real, falhas de conectividade, limites de cotas de APIs em nuvem (HTTP 429) ou latências excessivas (> 10s) causam frustração docente e descontinuidade pedagógica, podendo invalidar a coleta de dados de usabilidade da pesquisa.

Para blindar a experiência docente, estabeleceu-se o seguinte **Critério de Aceite Inegociável**:
> **Zero travamentos para o docente em cenários de queda, instabilidade ou timeout de qualquer uma das APIs.**

---

## ⚙️ 2. Arquitetura da Solução Implementada

### A. Padrão Circuit Breaker (`CircuitBreaker.js`)
Localizado em [`backend/src/services/CircuitBreaker.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/services/CircuitBreaker.js):
Cada provedor (Groq e Google Gemini) é monitorado por uma instância dedicada de Circuit Breaker com três estados formais:

```
    ┌──────────┐   Falhas >= Limiar (3)   ┌────────┐
    │  CLOSED  │ ───────────────────────> │  OPEN  │
    └──────────┘                          └────────┘
         ^                                     │
         │ Sucesso na                          │ Cooldown
         │ requisição teste                    │ expirado (30s)
         │                                     v
    ┌───────────┐                         ┌───────────┐
    │  CLOSED   │ <────────────────────── │ HALF_OPEN │
    └───────────┘    Falha no teste       └───────────┘
                           │                   │
                           └───────────────────┘
```

1. **`CLOSED` (Operação Normal):** Requisições fluem diretamente para o motor alvo com timeout estrito de **10 segundos** (`AIInferenceTimeoutError`).
2. **`OPEN` (Circuito Aberto):** Quando falhas consecutivas atingem o limiar (`failureThreshold = 3`), o circuito abre. Requisições subsequentes executam **Fast-Fail** instantâneo (< 2ms), redirecionando imediatamente para o motor secundário sem submeter o professor a esperas de timeout.
3. **`HALF_OPEN` (Período de Teste):** Após a janela de arrefecimento (`resetTimeoutMs = 30000`), o circuito permite uma requisição piloto. Havendo sucesso, restaura para `CLOSED`; persistindo a falha, retorna para `OPEN`.

### B. Orquestrador e Roteador Resiliente (`AIRouterService.js`)
Localizado em [`backend/src/services/AIRouterService.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/services/AIRouterService.js):
- Gerencia a rota unificada `POST /api/laboratorio/gerar`.
- **Estratégia de Chaveamento Transparente:**
  - Se o motor primário (ex: Groq) falha por timeout (> 10s), HTTP 429 (taxa/tokens excedidos), HTTP 503 ou erro de rede, o orquestrador captura o evento, abre/incrementa o circuito do primário e despacha a requisição para o motor secundário (Gemini).
  - O motor secundário recebe um orçamento estendido (`timeoutSecundarioMs = 25s`) para garantir a entrega da atividade pedagógica estruturada.
- **Transparência no Retorno:** O docente recebe a atividade concluída, acompanhada do objeto de metadados:
  ```json
  {
    "sucesso": true,
    "atividade": { ... },
    "contingencia": {
      "acionada": true,
      "motorPrimarioFalhou": "groq",
      "motorSecundarioAtivado": "gemini",
      "motivoFalha": "503 Service Unavailable",
      "latenciaPrimarioMs": 10002,
      "latenciaSecundarioMs": 3410,
      "latenciaTotalMs": 13412,
      "estadoCircuitoPrimario": "OPEN"
    },
    "alertaEtico": "Este material foi gerado por Inteligência Artificial..."
  }
  ```

### C. Persistência de Auditoria e Telemetria A/B
Toda ocorrência de contingência é registrada de forma atômica no banco de dados através de [`LaboratorioRepository.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/repositories/LaboratorioRepository.js#L165-L220):
1. **`logs_auditoria`:** Registra evento formal `acao = 'CONTINGENCIA_CIRCUIT_BREAKER'` com payload forense completo (motor primário, motor secundário, motivo, estado do circuito e latências).
2. **`telemetria_ab`:** Grava o status de execução com a flag `fallback_utilizado: true`, alimentando os relatórios estatísticos da tese sobre a estabilidade comparativa de LPU (Groq) versus Nuvem Tradicional (Google).

---

## 🔒 3. Alerta Ético e Validação Docente (ADR-002)

Mesmo sob o acionamento de contingência em múltiplos níveis de fallback, a injeção do banner de autoridade docente permanece garantida em 100% dos cenários:
> *"Este material foi gerado por Inteligência Artificial e deve ser revisado, validado e adaptado pela autoridade docente antes de sua aplicação em sala de aula."*

---

## 🧪 4. Suíte de Testes Automatizados

Homologada através do comando:
```bash
npm run test:resiliencia
```
Verificações comprovadas em [`backend/src/test-circuit-breaker.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/test-circuit-breaker.js):
- Transição formal de estados: `CLOSED` $\rightarrow$ `OPEN` $\rightarrow$ `HALF_OPEN` $\rightarrow$ `CLOSED`.
- Corte estrito de timeout de inferência (> 10s).
- Fast-fail em circuito aberto (< 50ms).
- Chaveamento automático Groq $\rightarrow$ Gemini e Gemini $\rightarrow$ Groq.
- Gravação relacional do evento em `logs_auditoria` e `telemetria_ab`.
- Endpoints HTTP `POST /api/laboratorio/gerar` e `GET /api/laboratorio/circuit-breaker-status` (HTTP 200 OK).

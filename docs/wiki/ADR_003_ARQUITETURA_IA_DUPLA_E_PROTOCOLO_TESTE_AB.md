# 🏛️ Documento de Decisão Arquitetural (ADR-003)
## Arquitetura de IA Dupla (Groq LLaMA 3.3 70B vs Google Gemini 1.5) e Protocolo Experimental do Teste A/B

- **Status:** Aprovado / Em Fase de Desenvolvimento
- **Data da Decisão:** Setembro / 2026
- **Contexto da Pesquisa:** Tese de Doutorado em Educação Matemática (PPGEM / UFJF)
- **Autor / Doutorando:** Maycon Luiz Amaral Magalhães
- **Engenharia de Software:** Shayene Figueredo & Samuel Amorim
- **Orientadores:** Prof. Dr. Eduardo Barrére | Prof. Dr. Manuel José Cabral dos Santos Reis

---

## 🎯 1. Objetivo Científico do Experimento

Para fundamentar as conclusões empíricas da tese de doutorado de Maycon Magalhães, a plataforma implementa uma **Arquitetura de IA Dupla** para viabilizar um **Teste Comparativo A/B de 30 dias** (20/10 a 20/11/2026) com professores de Matemática da Rede Federal de Educação Profissional, Científica e Tecnológica (RFEPCT).

---

## ⚙️ 2. Especificação dos Modelos Selecionados

| Provedor / Motor | Modelo | Características Técnicas | Papel no Experimento |
|---|---|---|---|
| **Motor A (Groq)** | `llama-3.3-70b-versatile` | Inferência em hardware LPU de ultra-baixa latência (300+ tokens/s), modelo *open-weights* da Meta. | Avaliar rapidez, precisão lógica e custo-benefício de modelos abertos. |
| **Motor B (Google)** | `gemini-1.5-flash` / `gemini-1.5-pro` | Janela de contexto massiva, forte raciocínio multimodal e refinamento proprietário. | Avaliar riqueza didática e aderência pedagógica de modelos de fronteira fechados. |

---

## 📊 3. Métricas de Telemetria e Coleta de Dados para a Tese

Durante o uso da plataforma pelos professores participantes da pesquisa, o backend coletará de forma anonimizada (em conformidade com a LGPD e o Comitê de Ética em Pesquisa - CEP):
1. **Tempo de Resposta / Latência (ms):** Tempo desde o clique em "Gerar com IA" até a renderização do conteúdo.
2. **Taxa de Aceitação / Cópia / Exportação:** Percentual de conteúdos gerados que foram efetivamente aproveitados pelos docentes.
3. **Avaliação por Estrelas (1 a 5) & Feedback Qualitativo:** Avaliação docente sobre o rigor matemático, nível de contextualização e adequação ao curso técnico.
4. **Resiliência e Fallback Automático:** Monitoramento de taxas de erro de API e chaveamento automático em caso de oscilação de serviço.

---

## 🔍 4. Rastreabilidade no Código-Fonte
- Orquestrador de IA: `src/services/aiOrchestrator.js`
- Telemetria e Logs: `src/services/telemetryService.js`
- Mapeamento de Configurações: `.env.example` (`VITE_GROQ_API_KEY`, `VITE_GEMINI_API_KEY`)

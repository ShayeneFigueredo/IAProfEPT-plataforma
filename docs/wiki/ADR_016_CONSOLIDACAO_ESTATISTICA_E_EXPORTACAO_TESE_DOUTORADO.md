# ADR 016: Consolidação Estatística e Exportação Analítica para a Tese de Doutorado

> **Documento de Governança Arquitetural & Rastreabilidade Científica**  
> **Projeto de Tese de Doutorado** — Programa de Pós-Graduação em Educação Matemática (PPGEM / UFJF)  
> **Doutorando:** Maycon Luiz Amaral Magalhães  
> **Engenharia de Software:** Shayene Figueredo & Samuel Amorim  
> **Orientador:** Prof. Dr. Eduardo Barrére | **Coorientador:** Prof. Dr. Manuel José Cabral dos Santos Reis  
> **Data de Registro:** 17/10/2026  
> **Fase do Projeto:** Fase 2 (Backend IA Dupla & Telemetria) / Preparação Fase 3 (Teste A/B de 30 Dias)  

---

## 📌 1. Status
**Aprovado e Implementado**. Endpoint analítico `GET /api/telemetria/relatorio-tese` plenamente operacional, restrito ao pesquisador Maycon Magalhães e orientadores/administradores UFJF (`requirePesquisador`), calculando médias ponderadas de latência por tokens, distribuição de notas Likert (1 a 5 estrelas), desvios padrões amostrais, taxas de aceitação docente comparadas (Groq vs Gemini), teste Z de duas proporções e suporte à exportação direta em **JSON estruturado** e **CSV tabular** (RFC 4180 com suporte nativo ao Excel via BOM UTF-8).

---

## 🎯 2. Contexto Científico & Requisitos da Tese

O protocolo experimental comparativo de 30 dias (20/10 a 20/11/2026) exige uma ferramenta de extração e consolidação analítica para alimentar diretamente o texto e os anexos da Tese de Doutorado de Maycon Magalhães (PPGEM/UFJF).

### Objetivos do Serviço:
1. **Triangulação Empírica A/B:**
   - **Métricas Computacionais (Telemetria):** Latência de inferência (ms), consumo de tokens (prompt, completion e total), taxa de sucesso e taxa de fallback.
   - **Métricas Pedagógicas (Avaliação Docente):** Notas de 1 a 5 estrelas e aderência às 4 dimensões curriculares da EPT (Rigor Matemático, Contextualização EPT, Clareza do Gabarito, Adequação à BNCC).
2. **Consistência Matemática Rigorosa:**
   - A inferência de LLMs possui variabilidade intrínseca de latência correlacionada ao volume de tokens processados. A média ponderada por tokens ($\bar{L}_{pond}$) fornece a medida não-enviesada do tempo real por unidade de texto pedagógico gerado.
   - Cálculo amostral formal de variância ($s^2$), desvio padrão ($s$), erro padrão da média ($SE$), intervalo de confiança assintótico a 95% ($IC_{95\%}$) e teste Z de diferença de proporções de aceitação com p-valor bilateral.
3. **Controle de Acesso e Governança Ética (RBAC):**
   - Dados analíticos da pesquisa são de acesso restrito ao pesquisador doutorando e à equipe de orientação/auditoria institucional da UFJF (`pesquisador_doutorado` e `administrador_ufjf`).
   - Bloqueio peremptório de docentes da RFEPCT (HTTP 403 Forbidden) para evitar que visualizem o balanceamento A/B e enviesem suas futuras avaliações.
   - Anonimização estrita: os dados brutos exportados contêm apenas hashes truncados (16 caracteres) dos docentes, sem nenhum dado pessoal identificável (Resolução CNS 510/2016 e CEP/UFJF).
4. **Exportação Multi-Formato:**
   - **JSON:** Consumo automatizado por notebooks Jupyter / Python e painéis frontend.
   - **CSV (RFC 4180 com BOM UTF-8):** Inclusão imediata em ferramentas estatísticas acadêmicas (R, SPSS, Jamovi, Excel e tabelas em LaTeX).

---

## 📐 3. Formulação Matemática Formal

### A. Média Ponderada de Latência por Volume de Tokens
Para cada motor $m \in \{\text{groq}, \text{gemini}\}$ e para o agregado geral, com $N$ requisições de inferência:
$$\bar{L}_{pond} = \frac{\sum_{i=1}^N (L_i \times T_i)}{\sum_{i=1}^N T_i}$$
onde $L_i$ representa a latência em milissegundos e $T_i = \max(total\_tokens_i, 1)$ é o peso em tokens.

### B. Estatística Descritiva das Avaliações Docentes (Likert 1 a 5)
Com $M$ avaliações docentes e notas $X_i \in \{1, 2, 3, 4, 5\}$:
- **Média Aritmética:** $\bar{X} = \frac{1}{M} \sum_{i=1}^M X_i$
- **Variância Amostral:** $s^2 = \frac{1}{M - 1} \sum_{i=1}^M (X_i - \bar{X})^2 \quad (M > 1)$
- **Desvio Padrão Amostral:** $s = \sqrt{s^2}$
- **Erro Padrão da Média:** $SE = \frac{s}{\sqrt{M}}$
- **Intervalo de Confiança 95%:** $IC_{95\%} = [\bar{X} - 1.96 \cdot SE, \quad \bar{X} + 1.96 \cdot SE]$

### C. Taxas de Aceitação Pedagógica Docente
- **Taxa de Aceitação Alta (Qualidade Superior - 4 e 5 estrelas):**
  $$Tx_{alta} = \frac{n_4 + n_5}{M} \times 100\%$$
- **Taxa de Aceitação Ampla (Satisfatório - 3, 4 e 5 estrelas):**
  $$Tx_{ampla} = \frac{n_3 + n_4 + n_5}{M} \times 100\%$$
- **Taxa de Rejeição (Insatisfatório - 1 e 2 estrelas):**
  $$Tx_{rejeicao} = \frac{n_1 + n_2}{M} \times 100\%$$

### D. Teste Z de Significância entre Proporções de Aceitação (Groq vs Gemini)
$$p_{pool} = \frac{n_{alta}^{Groq} + n_{alta}^{Gemini}}{M_{Groq} + M_{Gemini}}$$
$$SE = \sqrt{p_{pool}(1 - p_{pool}) \left(\frac{1}{M_{Groq}} + \frac{1}{M_{Gemini}}\right)}$$
$$Z = \frac{p_{Groq} - p_{Gemini}}{SE}, \quad p\text{-valor} = 2 \cdot (1 - \Phi(|Z|))$$

---

## 🏛️ 4. Arquitetura e Estrutura de Código

### Componentes Implementados:
1. **`RelatorioTeseService` (`backend/src/services/RelatorioTeseService.js`):**
   - Encapsula todas as rotinas estatísticas descritivas, inferenciais e exportadores.
   - Fornece gerador CSV compatível com RFC 4180 e injeção do byte order mark `\uFEFF`.
   - Gera 5 tipos de visualizações tabulares:
     - `tipo=consolidado`: Matriz sintética comparativa dos indicadores A/B.
     - `tipo=avaliacoes`: Linhas individuais das avaliações anonimizadas.
     - `tipo=telemetria`: Linhas individuais de telemetria de inferência.
     - `tipo=tags`: Distribuição das 4 dimensões curriculares da EPT.
     - `tipo=completo`: Compilação unificada com seções demarcadas.
2. **`TelemetriaController.getRelatorioTese` (`backend/src/controllers/TelemetriaController.js`):**
   - Processamento de cabeçalhos (`Accept: text/csv` vs `application/json`) e parâmetros de query (`formato`, `tipo`, `incluirAmostra`).
   - Despacho com headers apropriados (`Content-Disposition: attachment; filename="..."`).
3. **Guarda RBAC em `telemetriaRoutes.js` (`backend/src/routes/telemetriaRoutes.js`):**
   - `requirePesquisador` (`pesquisador_doutorado` e `administrador_ufjf`).

---

## 📊 5. Tabela de Endpoints

| Método | Rota | Autenticação / RBAC | Saída |
|---|---|---|---|
| `GET` | `/api/telemetria/relatorio-tese` | `pesquisador_doutorado`, `administrador_ufjf` | JSON completo com metadados e consolidação. |
| `GET` | `/api/telemetria/relatorio-tese?formato=csv&tipo=consolidado` | `pesquisador_doutorado`, `administrador_ufjf` | Arquivo CSV da tabela comparativa dos motores. |
| `GET` | `/api/telemetria/relatorio-tese?formato=csv&tipo=avaliacoes` | `pesquisador_doutorado`, `administrador_ufjf` | Arquivo CSV com avaliações docentes anonimizadas. |
| `GET` | `/api/telemetria/relatorio-tese?formato=csv&tipo=telemetria` | `pesquisador_doutorado`, `administrador_ufjf` | Arquivo CSV com telemetria computacional A/B. |
| `GET` | `/api/telemetria/relatorio-tese?formato=csv&tipo=tags` | `pesquisador_doutorado`, `administrador_ufjf` | Arquivo CSV com frequência das 4 tags EPT. |
| `GET` | `/api/telemetria/relatorio-tese?formato=csv&tipo=completo` | `pesquisador_doutorado`, `administrador_ufjf` | Arquivo CSV completo com todas as seções para a tese. |

---

## 🛡️ 6. Evidências de Teste e Validação

Suite automatizada executada via `node backend/src/test-relatorio-tese.js`:
- **63 / 63 testes unitários e de integração passaram com 100% de sucesso**.
- Validação das fórmulas de média simples, ponderada, desvio padrão amostral, erro padrão e IC 95%.
- Bloqueio de acessos anônimos (401) e de docentes (403).
- Validação de integridade do cabeçalho CSV e codificação UTF-8 com BOM.

# ADR 019: Endpoint Unificado de Geração Parametrizada do Laboratório de IA (`POST /api/laboratorio/gerar`)

> **Status:** Aprovado e Homologado  
> **Data:** 17 de Outubro de 2026  
> **Contexto:** Tese de Doutorado em Educação Matemática (PPGEM / UFJF)  
> **Doutorando:** Maycon Luiz Amaral Magalhães  
> **Orientadores:** Prof. Dr. Eduardo Barrére & Prof. Dr. Manuel Cabral dos Santos Reis  
> **Engenharia de Software:** Shayene Figueredo & Samuel Amorim  

---

## 1. Contexto e Motivação Científica

No **Laboratório de Inteligência Artificial (Ambiente 2)** da Plataforma IAprofEPT, os professores de Matemática da Rede Federal de Educação Profissional, Científica e Tecnológica (RFEPCT) dispõem de um ambiente de criação didática baseado em quatro modalidades fundamentais para a Educação Profissional e Tecnológica (EPT):

1. **Exercícios e Avaliações (`exercicios`):** Questões contextualizadas em situações reais do mundo do trabalho segundo o Catálogo Nacional de Cursos Técnicos (CNCT), com perguntas progressivas e gabarito comentado passo a passo;
2. **Atividades Interdisciplinares EPT (`interdisciplinar`):** Propostas investigativas articulando a Matemática aos componentes curriculares técnicos e aos perfis profissionais dos cursos;
3. **Roteiros para Podcasts Educacionais (`podcast`):** Roteiros de áudio dialogados (entre mentor técnico e estudante) com rubricas de sonoplastia (SFX), transposição dialógica de conceitos matemáticos abstratos e um desafio conceitual com gabarito fundamentado;
4. **Planos de Aula Automáticos (`plano` ou `plano_aula`):** Planejamentos estruturados orientados por metodologias ativas (PBL, Sala de Aula Invertida, Metodologia do Erro Produtivo), com momentos pedagógicos discriminados e instrumentos de avaliação formativa com critérios de sucesso e gabarito orientador.

Para garantir que a experiência docente seja fluida, consistente e livre de barreiras operacionais, foi estabelecido o requisito de um **Endpoint Unificado de Geração Parametrizada (`POST /api/laboratorio/gerar`)**, responsável por:
- Orquestrar a montagem do prompt server-side (ADR-001);
- Acionar o motor de inferência balanceado pelo Teste A/B de 30 dias (Groq LLaMA 3.3 70B vs Google Gemini 1.5) com Circuit Breaker e contingência transparente;
- Persistir o resultado gerado e os metadados de telemetria no PostgreSQL (`requisicoes_ia` e `telemetria_ab`);
- Retornar uma resposta estruturada de alto nível contendo compulsoriamente: **Gabarito Passo a Passo**, **Habilidades da BNCC articuladas à EPT** e o **Banner Ético Institucional da Autoridade Docente**.

---

## 2. Decisão Arquitetural

### 2.1 Fluxo Integrado de Execução

```
[Cliente / Frontend Formativo / Laboratório]
                    │
                    ▼ (POST /api/laboratorio/gerar)
       [LaboratorioController.gerarAtividadeResiliente]
                    │
                    ▼
          [promptValidator] ─── (Rejeita prompt cru / ADR-001)
                    │
                    ▼
          [AIRouterService] ◄──► [ABRoutingService] (1:1 balanceado)
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
    [CircuitBreaker]    [CircuitBreaker]
        (Groq)              (Gemini)
          │                   │
          ▼                   ▼
    [GroqService]       [GeminiService]
          │                   │
          └─────────┬─────────┘
                    ▼
        [TelemetryAsyncService] ──► PostgreSQL (requisicoes_ia & telemetria_ab)
                    │
                    ▼
           [AIPostProcessor] ────► Sanitização, LaTeX KaTeX & Banner Ético Compulsório
                    │
                    ▼
[Resposta Estruturada JSON: atividade, modalidade, gabarito, habilidadesBNCC, alertaEtico]
```

### 2.2 Estruturação das 4 Modalidades no `PromptInjectionService`

Cada modalidade possui regras instrucionais dedicadas na System Instruction:
- **Exercícios:** Gera array `itens[]` com `enunciadoContextualizado`, `perguntas[]`, `gabaritoComentadoPassoAPasso[]` (etapas e resposta final) e `reflexaoCriticaEMC`.
- **Interdisciplinar:** Gera `temaInterdisciplinar`, `articulacaoCurricular`, `situacaoProblemaAutentica` e `etapasInvestigacao[]` com gabarito detalhado em cada etapa.
- **Podcast:** Gera `tituloEpisodio`, `duracaoEstimadaMinutos`, `personagens[]`, `blocosRoteiro[]` (com rubricas SFX e falas entonadas) e `desafioOuvinteComGabarito` (enunciado, etapas de cálculo, resposta final e justificativa).
- **Plano:** Gera `tituloPlano`, `metodologiaAtiva`, `momentosDaAula[]`, `objetivosAprendizagem[]` e `avaliacaoFormativa` com `gabaritoOrientador`.

### 2.3 Normalização de Alto Nível no Retorno do Controller
Para assegurar o cumprimento imediato do critério de aceite por qualquer interface cliente, o `LaboratorioController` extrai e expõe no nível raiz do JSON:
- `modalidade`: identificador canônico da ferramenta (`exercicios`, `interdisciplinar`, `podcast`, `plano`);
- `gabarito`: estrutura normalizada com etapas de cálculo e resposta final;
- `habilidadesBNCC`: array de habilidades com código (ex.: `EM13MAT301`), descrição e articulação com a EPT;
- `alertaEtico`: texto de validação docente obrigatório do PPGEM/UFJF:
  > *"Este material foi gerado por Inteligência Artificial e deve ser revisado, validado e adaptado pela autoridade docente antes de sua aplicação em sala de aula."*

---

## 3. Especificação do Endpoint

### `POST /api/laboratorio/gerar`

- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>` (opcional).
- **Payload de Entrada (Exemplo Modalidade Exercícios):**
```json
{
  "ferramenta": "exercicios",
  "areaMatematica": "Geometria Plana e Trigonometria",
  "cursoTecnico": "Técnico em Agropecuária / Agricultura",
  "nivel": "Médio / Técnico Integrado",
  "metodologia": "Metodologia do Erro Produtivo (Borasi)",
  "quantidade": 1,
  "motorPreferencial": "auto"
}
```

- **Resposta de Sucesso (HTTP 200 OK):**
```json
{
  "sucesso": true,
  "modalidade": "exercicios",
  "motor": "groq",
  "modeloUtilizado": "llama-3.3-70b-versatile",
  "latenciaMs": 1420,
  "atividade": {
    "tituloAtividade": "Dimensionamento de Painéis Fotovoltaicos em Agropecuária",
    "tipoAtividade": "exercicios",
    "itens": [
      {
        "numero": 1,
        "enunciadoContextualizado": "Um técnico em agropecuária projeta um sistema...",
        "perguntas": [{ "letra": "a", "comando": "Calcule a área total dos painéis." }],
        "gabaritoComentadoPassoAPasso": [
          {
            "item": "a",
            "etapasResolucao": ["Passo 1: ...", "Passo 2: ..."],
            "respostaFinal": "2.0 m²",
            "interpretacaoFisicaOuEconomica": "Dois módulos solares de 1 m² cada."
          }
        ],
        "reflexaoCriticaEMC": {
          "dimensaoReflexiva": "Sustentabilidade energética e agricultura familiar",
          "provocacaoDocente": "Quais os impactos socioambientais da dependência de combustíveis fósseis?"
        }
      }
    ],
    "alertaEticoObrigatorio": "Este material foi gerado por Inteligência Artificial..."
  },
  "gabarito": [
    {
      "numero": 1,
      "tituloItem": "Cálculo da Área dos Módulos Solares",
      "perguntas": [{ "letra": "a", "comando": "Calcule a área total dos painéis." }],
      "gabaritoComentadoPassoAPasso": [
        {
          "item": "a",
          "etapasResolucao": ["Passo 1: ...", "Passo 2: ..."],
          "respostaFinal": "2.0 m²"
        }
      ]
    }
  ],
  "habilidadesBNCC": [
    {
      "codigo": "EM13MAT301",
      "descricao": "Resolver e elaborar problemas do cotidiano...",
      "articulacaoComEPT": "Dimensionamento de área de captação solar no campo"
    }
  ],
  "alertaEtico": "Este material foi gerado por Inteligência Artificial e deve ser revisado, validado e adaptado pela autoridade docente antes de sua aplicação em sala de aula.",
  "alocacaoAB": {
    "grupo": "A",
    "motor": "groq",
    "chaveAlocacao": "chave-alocacao-docente",
    "criterioAlocacao": "hash_consistente_usuario",
    "experimentoAtivo": true
  },
  "contingencia": {
    "acionada": false,
    "motorUtilizado": "groq"
  }
}
```

---

## 4. Validação e Testes Automatizados

A suíte `backend/src/test-laboratorio-gerar-unificado.js` validou e homologou:
- [x] **Modalidade 1 (Exercícios):** Resposta com itens contextualizados, gabarito passo a passo, habilidades BNCC e banner ético;
- [x] **Modalidade 2 (Interdisciplinar):** Articulação com o curso técnico, etapas investigativas com gabarito técnico e reflexão EMC;
- [x] **Modalidade 3 (Podcast):** Roteiro com diálogos, sonoplastia, desafio para ouvintes com gabarito e BNCC;
- [x] **Modalidade 4 (Plano de Aula):** Momentos pedagógicos, metodologia ativa e avaliação formativa com gabarito orientador;
- [x] **Persistência no PostgreSQL:** Gravação atômica em `requisicoes_ia` e telemetria na tabela `telemetria_ab`;
- [x] **Roteamento A/B Balanceado:** Presença dos metadados científicos de alocação;
- [x] **Segurança ADR-001:** Rejeição de caixas de texto cru e tentativas de injeção de prompt com status HTTP 422 Unprocessable Entity.

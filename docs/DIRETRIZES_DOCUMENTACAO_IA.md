# 📚 Manual de Diretrizes de Documentação para IA & Equipe
> **Plataforma IAprofEPT — Tese de Doutorado PPGEM / UFJF**  
> **Autor da Pesquisa:** Maycon Luiz Amaral Magalhães  
> **Desenvolvimento de Software:** Shayene Figueredo & Samuel Amorim  

---

## 🎯 1. Objetivo deste Documento
Este manual define **exatamente como a IA e os desenvolvedores devem produzir e manter a documentação** do projeto IAprofEPT. Como se trata de um **Produto Educacional vinculado a uma Tese de Doutorado**, cada linha de código, componente visual e prompt de IA gerado precisa ter **rastreabilidade, clareza metodológica e fundamentação pedagógica**.

---

## 🏛️ 2. Estrutura de Documentação do Projeto

Toda a documentação do projeto está dividida em 3 pilares complementares:

```
├── .github/                       # Templates de PR, Issues e Workflows
├── docs/
│   ├── adr/                       # Architectural Decision Records (Decisões de Engenharia)
│   ├── prompts/                   # Catálogo de System Prompts & Engenharia de Prompts
│   ├── academic/                  # Relatórios técnicos e dados para a tese de Maycon
│   ├── DIRETRIZES_DOCUMENTACAO_IA.md
│   ├── GUIA_WIKI_GITHUB.md
│   ├── ESTRUTURA_TASKS_JIRA.md
│   └── GUIA_CONFIGURACAO_GIT.md
├── wiki/                          # Espelho local das páginas da Wiki do GitHub
└── AGENTS.md                      # Regras permanentes lidas por IAs em cada sessão
```

---

## 🔬 3. Como Registrar Architectural Decision Records (ADRs)

Para qualquer decisão arquitetural significativa (escolha de framework, mecanismo de fallback Groq/Gemini, estratégia de persistência de dados, exportação PDF), a IA deve registrar um arquivo em `docs/adr/ADR-XXX-<titulo>.md` seguindo o modelo:

```markdown
# ADR-00X: [Título da Decisão]

## Status
[Proposto | Aceito | Substituído] — Data: DD/MM/AAAA

## Contexto Pedagógico & Acadêmico
[Descreva o problema no contexto do PPGEM/UFJF, EPT e dos 5 ambientes da plataforma]

## Decisão Técnica
[O que foi escolhido, quais bibliotecas/modelos/APIs e por quê]

## Alternativas Consideradas
- Alternativa A: [Motivo de descarte]
- Alternativa B: [Motivo de descarte]

## Consequências & Impactos na Tese
- **Positivas:** [Ganhos de desempenho, fidelidade aos PPCs, facilidade de auditoria]
- **Riscos & Mitigações:** [Fallback, limites de rate da API, latência]
```

---

## 🤖 4. Como Documentar a Engenharia de Prompts Ocultos

No IAprofEPT, **não existem caixas de texto abertas para digitação de prompt pelo professor**. Todos os prompts são construídos dinamicamente pelo backend.

Cada prompt oculto DEVE ser documentado em `docs/prompts/` com a seguinte ficha técnica:

1. **Identificador do Prompt:** Ex: `PROMPT-LAB-EXERCICIO-01`
2. **Ambiente Vinculado:** Laboratório de IA / Gerador de Exercícios
3. **Parâmetros de Entrada:**
   - Eixo Tecnológico CNCT
   - Curso Técnico
   - Componente Curricular / Tópico de Matemática
   - Habilidade BNCC / PPC
   - Nível de Dificuldade e Metodologia
4. **System Prompt Base:** O texto exato de diretrizes pedagógicas e restrições de alucinação enviado para a LLM.
5. **Temperatura & Hiperparâmetros:** (ex: `temperature: 0.2`, `top_p: 0.9` para rigor lógico).
6. **Formato Esperado de Saída:** Markdown estruturado + Banner de Validação Ética.
7. **Modelo Testado:** Groq LLaMA 3.3 70B vs Google Gemini 1.5.

---

## 📊 5. Como Documentar os Resultados do Teste A/B de 30 Dias (Fase 3)

Durante a Fase 3 (20/10 a 20/11), as métricas coletadas devem ser registradas em `docs/academic/relatorio_teste_ab.md` contendo:
- **Total de Requisições por Modelo** (Groq vs Gemini)
- **Tempo Médio de Resposta (Latência em segundos)**
- **Consumo de Tokens (Entrada / Saída)**
- **Avaliação Qualitativa dos Docentes (Notas de 1 a 5 estrelas no Repositório)**
- **Taxa de Ajustes Docentes (o quanto o professor precisou editar o material gerado)**
- **Gráficos e Tabelas formatados para exportação direta para o LaTeX/Word da tese de Maycon**.

---

## 🔄 6. Ciclo de Vida de uma Tarefa (IA + Desenvolvedor)

1. **Leitura da Task no Jira:** A IA identifica a Issue (ex: `IAPROF-12: Criar Seletor de Eixos CNCT`).
2. **Criação da Branch:** `git checkout -b feature/IAPROF-12-seletor-cnct`.
3. **Implementação Guiada:** Respeitar identidade visual (`#064E3B`, `#10B981`), sem prompts vazios, responsividade 100%.
4. **Documentação Local:** Atualizar docs relevantes se houver mudança de arquitetura ou prompt.
5. **Commit Semântico:** Referenciar o ID da task e o Marco/Fase do cronograma.
6. **Abertura de PR:** Preencher o checklist acadêmico no PR Template.
7. **Atualização da Wiki do GitHub:** Refletir a entrega na página correspondente.

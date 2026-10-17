# ADR 018: API de Gestão do Acervo de Documentos Oficiais e E-book de Prompts para Educação Matemática na EPT

> **Status:** Aprovado e Homologado  
> **Data:** 17 de Outubro de 2026  
> **Contexto:** Tese de Doutorado em Educação Matemática (PPGEM / UFJF)  
> **Doutorando:** Maycon Luiz Amaral Magalhães  
> **Orientadores:** Prof. Dr. Eduardo Barrére & Prof. Dr. Manuel Cabral dos Santos Reis  
> **Engenharia de Software:** Shayene Figueredo & Samuel Amorim  

---

## 1. Contexto e Motivação Científica

No âmbito do **Ambiente Formativo (Ambiente 1)** da Plataforma IAprofEPT, a capacitação continuada dos professores de Matemática da Rede Federal de Educação Profissional, Científica e Tecnológica (RFEPCT) requer o acesso qualificado a dois tipos de recursos pedagógicos estruturantes:
1. **Acervo de Documentos Oficiais, Diretrizes e Legislação:**
   - O professor de matemática da EPT precisa fundamentar suas práticas no marco legal dos Institutos Federais (Lei nº 11.892/2008), nas diretrizes do Catálogo Nacional de Cursos Técnicos (CNCT 4ª Edição / MEC), nas orientações do Guia de IA Generativa do MEC/SETEC (2024), no Plano Brasileiro de IA (PBIA 2024-2028) e nas recomendações normativas e éticas globais da UNESCO (2021, 2023).
2. **E-book de Modelos Estruturados de Prompts para Educação Matemática:**
   - Em conformidade estrita com o **Princípio Inegociável da Proibição de Caixas de Prompt em Branco** (ADR 001), o sistema disponibiliza um repertório de templates pedagógicos formalmente parametrizados. Esses modelos cobrem metodologias ativas consolidadas pela pesquisa em Educação Matemática, como a Metodologia do Erro Produtivo, a Educação Matemática Crítica de Ole Skovsmose, a Modelagem Matemática em Arranjos Produtivos Locais (APL), a articulação entre habilidades da BNCC e perfis do CNCT, e o Feedback Formativo Acolhedor.

O objetivo desta intervenção técnica é expor dois endpoints REST dedicados (`GET /api/formativo/documentos` e `GET /api/formativo/ebook-prompts`) que atendam ao critério de aceite de **retorno ultra-rápido (< 20ms)** com metadados completos de publicação e links oficiais funcionais.

---

## 2. Decisão Arquitetural

### 2.1 Catálogo Canônico Indexado em Memória com Repositório Dedicado
Para atender aos requisitos de latência extremamente baixa (< 20ms) e integridade de links canônicos imutáveis, optou-se pela criação de módulos de configuração e repositório estruturados em memória (`backend/src/config/documentosOficiais.js`, `backend/src/config/ebookPromptsContent.js` e `backend/src/repositories/AcervoFormativoRepository.js`), sem overhead de I/O de disco ou dependência desnecessária de pooling do banco de dados relacional.

### 2.2 Estrutura do Acervo de Documentos Oficiais (`GET /api/formativo/documentos`)
- **Tags Canônicas Obrigatórias:**
  - `Legislacao EPT`: Legislação da Rede Federal, CNCT e guias curriculares do MEC.
  - `Relatorios UNESCO`: Instrumentos normativos internacionais sobre ética e diretrizes para formuladores de políticas públicas em IA.
  - `Plano Brasileiro de IA`: Documento executivo nacional do PBIA (MCTI) 2024-2028.
  - `Diretriz MEC` e `Fundamentação Teórica` (Skovsmose e Bolema).
- **Mecanismo de Normalização e Tolerância a Variações:**
  - O repositório implementa o `MAPA_NORMALIZACAO_TAGS_DOCS`, mapeando termos informados pelo cliente (ex.: `tag=unesco`, `tag=pbia`, `tag=legislacao`, `tag=legislação ept`) para a tag canônica correspondente.
- **Metadados de Publicação Completos:**
  - Cada item possui: `id`, `titulo`, `descricao`, `orgaoEmissor`, `anoPublicacao`, `tagPrincipal`, `tags`, `formato`, `paginas`, `tamanhoEstimado` e `url` absoluta e funcional.
- **Filtros Adicionais:**
  - Busca textual (`busca`) que inspeciona título, descrição, órgão emissor e tags.
  - Filtro por ano de publicação (`ano`).

### 2.3 Estrutura do E-book de Modelos Estruturados de Prompts (`GET /api/formativo/ebook-prompts`)
- **Modelos Estruturados Disponibilizados (8 Categorias):**
  1. `DIAG-PRE-REQUISITOS`: Diagnóstico de Pré-requisitos com Sondagem Profissional.
  2. `CTX-BNCC-CNCT`: Contextualização Técnica Autêntica BNCC x CNCT.
  3. `MET-ERRO-PRODUTIVO`: Metodologia do Erro Produtivo & Obstáculos Cognitivos.
  4. `FDB-DEVOLUTIVA-ACOLHEDORA`: Feedback Formativo Devolutivo e Acolhedor.
  5. `SEQ-INVESTIGACAO-CRITICA`: Sequência Didática em Educação Matemática Crítica (Skovsmose).
  6. `POD-ROTEIRO-DIALOGADO`: Roteiro de Podcast Pedagógico Interdisciplinar.
  7. `APL-MODELAGEM-REGIONAL`: Modelagem Matemática em Arranjos Produtivos Locais (APL).
  8. `RUB-AVALIACAO-COMPETENCIAS`: Rubrica Analítica de Avaliação por Competências na EPT.
- **Campos do Modelo Estruturado:**
  - `id`, `codigo`, `titulo`, `categoria`, `descricao`, `parametros` (com `nome`, `descricao` e `obrigatorio`), `template`, `exemploUso`, `eixosRecomendados` do CNCT e `dicaDocente`.
- **Filtros Disponíveis:**
  - Por categoria (`categoria`), busca textual (`busca`) e eixo tecnológico do CNCT (`eixo`).

### 2.4 Alerta Ético Obrigatório da Autoridade Docente
Ambos os endpoints retornam no corpo JSON a mensagem padrão de governança ética:
> *"Este material foi gerado por Inteligência Artificial e deve ser revisado, validado e adaptado pela autoridade docente antes de sua aplicação em sala de aula."*

---

## 3. Endpoints da API

### 3.1 `GET /api/formativo/documentos`
- **Query Params:**
  - `tag` (opcional): Filtra por tag canônica ou termo aproximado.
  - `busca` (opcional): Pesquisa por substring em múltiplos campos.
  - `ano` (opcional): Ano numérico de publicação.
- **Resposta Sucesso (200 OK):**
```json
{
  "sucesso": true,
  "total": 7,
  "totalGeralAcervo": 7,
  "filtroAplicado": {
    "tagOriginal": "unesco",
    "tagResolvida": "Relatorios UNESCO",
    "busca": null,
    "ano": null
  },
  "tagsDisponiveis": [
    "Legislacao EPT",
    "Relatorios UNESCO",
    "Plano Brasileiro de IA",
    "Diretriz MEC",
    "Fundamentação Teórica"
  ],
  "contagemPorTag": {
    "Legislacao EPT": 4,
    "Relatorios UNESCO": 2,
    "Plano Brasileiro de IA": 1,
    "Diretriz MEC": 1,
    "Fundamentação Teórica": 1
  },
  "documentos": [
    {
      "id": "doc-unesco-etica-2021",
      "titulo": "Recomendação sobre a Ética da Inteligência Artificial (UNESCO)",
      "descricao": "Primeiro instrumento normativo global sobre a ética da inteligência artificial...",
      "orgaoEmissor": "UNESCO",
      "anoPublicacao": 2021,
      "tagPrincipal": "Relatorios UNESCO",
      "tags": ["Relatorios UNESCO", "Etica e Cidadania", "Diretrizes Internacionais"],
      "url": "https://unesdoc.unesco.org/ark:/48223/pf0000381137_por",
      "formato": "PDF",
      "paginas": 44,
      "tamanhoEstimado": "1.8 MB",
      "ativo": true
    }
  ],
  "avisoEtico": "Este material foi gerado por Inteligência Artificial e deve ser revisado, validado e adaptado pela autoridade docente antes de sua aplicação em sala de aula."
}
```

### 3.2 `GET /api/formativo/ebook-prompts`
- **Query Params:**
  - `categoria` (opcional): Categoria pedagógica (ex.: `Diagnóstico`, `Contextualização`).
  - `busca` (opcional): Termo de busca textual.
  - `eixo` (opcional): Eixo tecnológico do CNCT.
- **Resposta Sucesso (200 OK):**
```json
{
  "sucesso": true,
  "total": 8,
  "totalGeralEbook": 8,
  "filtroAplicado": {
    "categoria": null,
    "busca": null,
    "eixo": null
  },
  "categoriasDisponiveis": [
    "Diagnóstico",
    "Contextualização",
    "Metodologia Ativa",
    "Feedback",
    "Sequência Didática",
    "Recurso Multimodal",
    "Modelagem Matemática",
    "Avaliação Formativa"
  ],
  "contagemPorCategoria": {
    "Diagnóstico": 1,
    "Contextualização": 1,
    "Metodologia Ativa": 1,
    "Feedback": 1,
    "Sequência Didática": 1,
    "Recurso Multimodal": 1,
    "Modelagem Matemática": 1,
    "Avaliação Formativa": 1
  },
  "prompts": [
    {
      "id": "prompt-diag-01",
      "codigo": "DIAG-PRE-REQUISITOS",
      "titulo": "Diagnóstico de Pré-requisitos com Sondagem Profissional",
      "categoria": "Diagnóstico",
      "descricao": "Identifica lacunas em habilidades fundamentais de matemática...",
      "parametros": [
        {
          "nome": "TEMA_MATEMATICO",
          "descricao": "Conteúdo ou objeto de conhecimento matemático",
          "obrigatorio": true
        }
      ],
      "template": "Atue como um especialista em Educação Matemática na EPT...",
      "exemploUso": "Atue como um especialista...",
      "eixosRecomendados": ["Informação e Comunicação", "Recursos Naturais"],
      "dicaDocente": "Utilize os resultados da sondagem para planejar momentos de nivelamento..."
    }
  ],
  "avisoEtico": "Este material foi gerado por Inteligência Artificial e deve ser revisado, validado e adaptado pela autoridade docente antes de sua aplicação em sala de aula."
}
```

---

## 4. Integração Frontend (`FormativoView.jsx`)

1. **Aba "Materiais & Legislação":**
   - Pílulas interativas para as tags: *Todos*, *Legislação EPT*, *Relatórios UNESCO* e *Plano Brasileiro de IA*.
   - Input de pesquisa textual em tempo real.
   - Cards com metadados editoriais (ano, formato, páginas, órgão emissor) e botão de acesso direto ao documento via link externo seguro (`rel="noopener noreferrer"`).
2. **Aba "E-book de Prompts":**
   - Pílulas para filtragem por categorias de Educação Matemática.
   - Caixa com o template do prompt monoespaçado, parâmetros destacados, dicas pedagógicas e badges de eixos do CNCT.
   - Botão "Copiar Modelo" integrado à Clipboard API com feedback visual imediato ("Copiado!").

---

## 5. Validação e Testes Automatizados

A suíte `backend/src/test-formativo-acervo.js` homologou 20 testes de integração:
- [x] Listagem geral de documentos com status 200 e metadados completos.
- [x] Filtragem pelas tags: `Legislacao EPT`, `Relatorios UNESCO` e `Plano Brasileiro de IA`.
- [x] Tolerância a variações (`unesco`, `pbia`, `legislacao`).
- [x] Filtragem textual e por ano de publicação.
- [x] Validação de URLs funcionais (protocolo http/https absoluto).
- [x] Listagem e filtragem dos modelos estruturados do e-book por categoria, busca e eixo tecnológico.
- [x] Presença obrigatória do alerta ético em todas as respostas.
- [x] Latência média inferior a 5ms (critério de retorno rápido atingido com distinção).

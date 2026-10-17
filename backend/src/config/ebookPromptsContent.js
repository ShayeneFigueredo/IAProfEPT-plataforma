/**
 * Modelos Estruturados de Prompts para Educação Matemática na EPT (E-book)
 * Plataforma IAprofEPT — Programa de Pós-Graduação em Educação Matemática (PPGEM / UFJF)
 * Doutorando: Maycon Luiz Amaral Magalhães
 * Orientação: Prof. Dr. Eduardo Barrére & Prof. Dr. Manuel Cabral dos Santos Reis
 * 
 * Este acervo constitui o repositório de templates estruturados que norteiam
 * a atuação docente crítica, respeitando a autonomia do professor e a
 * contextualização curricular entre BNCC e Catálogo Nacional de Cursos Técnicos (CNCT).
 */

export const CATEGORIAS_PROMPTS_CANONICAS = [
  'Diagnóstico',
  'Contextualização',
  'Metodologia Ativa',
  'Feedback',
  'Sequência Didática',
  'Recurso Multimodal',
  'Modelagem Matemática',
  'Avaliação Formativa',
];

export const MODELOS_EBOOK_PROMPTS = [
  {
    id: 'prompt-diag-01',
    codigo: 'DIAG-PRE-REQUISITOS',
    titulo: 'Diagnóstico de Pré-requisitos com Sondagem Profissional',
    categoria: 'Diagnóstico',
    descricao:
      'Identifica lacunas em habilidades fundamentais de matemática prévias para a introdução de novos conteúdos na EPT, gerando 3 questões de sondagem contextualizadas no cotidiano do curso técnico.',
    parametros: [
      {
        nome: 'TEMA_MATEMATICO',
        descricao: 'Conteúdo ou objeto de conhecimento matemático (ex.: Funções Exponenciais, Trigonometria)',
        obrigatorio: true,
      },
      {
        nome: 'CURSO_TECNICO',
        descricao: 'Curso Técnico de Nível Médio segundo o CNCT (ex.: Técnico em Agropecuária)',
        obrigatorio: true,
      },
      {
        nome: 'EIXO_TECNOLOGICO',
        descricao: 'Eixo tecnológico correspondente (ex.: Recursos Naturais)',
        obrigatorio: false,
      },
    ],
    template:
      'Atue como um especialista em Educação Matemática na Educação Profissional e Tecnológica (EPT). Identifique e liste os 3 pré-requisitos matemáticos essenciais que os estudantes do curso [CURSO_TECNICO] precisam dominar antes de iniciar o estudo de [TEMA_MATEMATICO]. Para cada pré-requisito, elabore uma questão diagnóstica de sondagem rápida (com gabarito comentado) inserida em um contexto profissional real da área técnica, permitindo ao professor mapear fragilidades conceituais sem tom punitivo.',
    exemploUso:
      'Atue como um especialista em Educação Matemática na Educação Profissional e Tecnológica (EPT). Identifique e liste os 3 pré-requisitos matemáticos essenciais que os estudantes do curso Técnico em Informática precisam dominar antes de iniciar o estudo de Matrizes e Grafos. Para cada pré-requisito, elabore uma questão diagnóstica de sondagem rápida (com gabarito comentado) inserida em um contexto profissional real da área técnica...',
    eixosRecomendados: ['Informação e Comunicação', 'Recursos Naturais', 'Controle e Processos Industriais'],
    dicaDocente:
      'Utilize os resultados da sondagem para planejar momentos de nivelamento e acolhimento conceitual antes de cobrar aplicações técnicas avançadas.',
  },
  {
    id: 'prompt-ctx-02',
    codigo: 'CTX-BNCC-CNCT',
    titulo: 'Contextualização Técnica Autêntica BNCC x CNCT',
    categoria: 'Contextualização',
    descricao:
      'Reescreve problemas puramente operatórios em situações-problema autênticas da prática técnica, articulando as competências da BNCC aos perfis profissionais do CNCT.',
    parametros: [
      {
        nome: 'HABILIDADE_BNCC',
        descricao: 'Código da habilidade BNCC do Ensino Médio (ex.: EM13MAT301)',
        obrigatorio: true,
      },
      {
        nome: 'TEMA_MATEMATICO',
        descricao: 'Objeto de conhecimento (ex.: Geometria Espacial / Cálculo de Volumes)',
        obrigatorio: true,
      },
      {
        nome: 'CURSO_TECNICO',
        descricao: 'Curso técnico de referência (ex.: Técnico em Edificações)',
        obrigatorio: true,
      },
      {
        nome: 'CENARIO_PROFISSIONAL',
        descricao: 'Situação real de trabalho (ex.: dosagem de concreto em fundações)',
        obrigatorio: false,
      },
    ],
    template:
      'Transforme o conteúdo matemático [TEMA_MATEMATICO], referenciado pela habilidade da BNCC [HABILIDADE_BNCC], em uma situação-problema autêntica para o curso [CURSO_TECNICO]. O enunciado deve simular um desafio real enfrentado no cenário profissional de [CENARIO_PROFISSIONAL], exigindo tomada de decisão técnica fundamentada em cálculos matemáticos rigorosos. Inclua a resolução passo a passo e o gabarito detalhado.',
    exemploUso:
      'Transforme o conteúdo matemático Geometria Espacial (Volumes e Áreas de Superfície), referenciado pela habilidade da BNCC EM13MAT301, em uma situação-problema autêntica para o curso Técnico em Edificações no cenário de dosagem de concreto em fundações cilíndricas...',
    eixosRecomendados: ['Infraestrutura', 'Controle e Processos Industriais', 'Ambiente e Saúde'],
    dicaDocente:
      'Evite a mera "falsa contextualização" (onde a historinha do problema não influencia a resolução). O contexto deve exigir a decisão técnica.',
  },
  {
    id: 'prompt-met-03',
    codigo: 'MET-ERRO-PRODUTIVO',
    titulo: 'Metodologia do Erro Produtivo & Obstáculos Cognitivos',
    categoria: 'Metodologia Ativa',
    descricao:
      'Constrói três resoluções fictícias contendo erros conceituais recorrentes cometidos por alunos, com questões norteadoras para que a turma identifique o equívoco e reconstrua a lógica correta.',
    parametros: [
      {
        nome: 'TEMA_MATEMATICO',
        descricao: 'Tópico de álgebra, cálculo ou geometria (ex.: Simplificação de Frações Algébricas)',
        obrigatorio: true,
      },
      {
        nome: 'CURSO_TECNICO',
        descricao: 'Curso Técnico (ex.: Técnico em Eletrotécnica)',
        obrigatorio: true,
      },
    ],
    template:
      'Com base na teoria do Erro Produtivo na Educação Matemática, elabore um problema aplicado ao curso [CURSO_TECNICO] sobre o tema [TEMA_MATEMATICO]. Em seguida, apresente 3 resoluções incorretas hipotéticas com erros conceituais típicos cometidos por estudantes (ex.: erro de sinal, confusão de grandezas, simplificação indevida). Para cada erro, formule 2 perguntas mediadoras que o professor pode usar em sala de aula para guiar a reflexão crítica e a autocorreção pelos próprios estudantes.',
    exemploUso:
      'Com base na teoria do Erro Produtivo na Educação Matemática, elabore um problema aplicado ao curso Técnico em Eletrotécnica sobre Lei de Ohm e Circuitos Equivalentes...',
    eixosRecomendados: ['Controle e Processos Industriais', 'Informação e Comunicação'],
    dicaDocente:
      'Incentive o debate coletivo: "Qual resolução você assinaria como engenheiro/técnico responsável e por quê?" para estimular a responsabilidade ética do futuro profissional.',
  },
  {
    id: 'prompt-fdb-04',
    codigo: 'FDB-DEVOLUTIVA-ACOLHEDORA',
    titulo: 'Feedback Formativo Devolutivo e Acolhedor',
    categoria: 'Feedback',
    descricao:
      'Gera modelos de feedbacks individualizados para avaliações formativas, combinando validação emocional, diagnóstico preciso do erro e sugestão de ação de melhoria.',
    parametros: [
      {
        nome: 'CURSO_TECNICO',
        descricao: 'Curso técnico em que o estudante está matriculado',
        obrigatorio: true,
      },
      {
        nome: 'DESCRICAO_ERRO',
        descricao: 'Síntese da dificuldade apresentada pelo estudante na atividade',
        obrigatorio: true,
      },
    ],
    template:
      'Elabore uma devolutiva pedagógica acolhedora, encorajadora e tecnicamente precisa para um estudante do curso [CURSO_TECNICO] que apresentou o seguinte equívoco conceitual em uma avaliação formativa de matemática: "[DESCRICAO_ERRO]". A devolutiva deve ter 3 partes: 1) Reconhecimento do esforço e dos passos acertados; 2) Indicação reflexiva do ponto que requer revisão conceitual; 3) Sugestão prática de um exercício ou analogia profissional para consolidar o aprendizado.',
    exemploUso:
      'Elabore uma devolutiva pedagógica acolhedora para um estudante do curso Técnico em Enfermagem que errou o cálculo de gotejamento de soro por confundir horas com minutos...',
    eixosRecomendados: ['Ambiente e Saúde', 'Gestão e Negócios', 'Produção Cultural e Design'],
    dicaDocente:
      'Feedbacks que começam valorizando o raciocínio inicial do estudante diminuem a ansiedade matemática e fortalecem o vínculo pedagógico.',
  },
  {
    id: 'prompt-seq-05',
    codigo: 'SEQ-INVESTIGACAO-CRITICA',
    titulo: 'Sequência Didática em Educação Matemática Crítica',
    categoria: 'Sequência Didática',
    descricao:
      'Estrutura uma sequência de 4 aulas fundamentada na Educação Matemática Crítica de Ole Skovsmose, transicionando do paradigma do exercício para o cenário para investigação.',
    parametros: [
      {
        nome: 'TEMA_MATEMATICO',
        descricao: 'Tema da matemática a ser trabalhado (ex.: Estatística e Amostragem)',
        obrigatorio: true,
      },
      {
        nome: 'CURSO_TECNICO',
        descricao: 'Curso técnico de atuação (ex.: Técnico em Meio Ambiente)',
        obrigatorio: true,
      },
      {
        nome: 'PROBLEMATICA_SOCIAL',
        descricao: 'Questão socioambiental ou de trabalho regional a ser investigada',
        obrigatorio: false,
      },
    ],
    template:
      'Estruture uma Sequência Didática de 4 aulas (50 min cada) baseada na abordagem da Educação Matemática Crítica (Skovsmose) para o curso [CURSO_TECNICO], articulando o tema [TEMA_MATEMATICO] com a problemática real [PROBLEMATICA_SOCIAL]. Detalhe cada aula: Aula 1 (Problematização inicial e imersão no cenário para investigação); Aula 2 (Coleta, organização de dados e modelagem matemática); Aula 3 (Análise crítica, identificação de vieses e tomada de decisão); Aula 4 (Apresentação dos resultados e reflexão sobre a matemacia).',
    exemploUso:
      'Estruture uma Sequência Didática de 4 aulas baseada na Educação Matemática Crítica para o curso Técnico em Meio Ambiente, articulando Estatística Descritiva com o monitoramento de bacias hidrográficas e descarte de resíduos industriais...',
    eixosRecomendados: ['Recursos Naturais', 'Ambiente e Saúde', 'Segurança'],
    dicaDocente:
      'Permita que os alunos confrontem diferentes fontes de dados para perceberem como dados matemáticos podem ser instrumentalizados no debate público.',
  },
  {
    id: 'prompt-pod-06',
    codigo: 'POD-ROTEIRO-DIALOGADO',
    titulo: 'Roteiro de Podcast Pedagógico Interdisciplinar',
    categoria: 'Recurso Multimodal',
    descricao:
      'Cria um roteiro para gravação de podcast pedagógico de 5 minutos, em formato de diálogo informal entre um estudante estagiário e um mentor técnico.',
    parametros: [
      {
        nome: 'TEMA_MATEMATICO',
        descricao: 'Conceito matemático chave (ex.: Progressão Geométrica e Escalas)',
        obrigatorio: true,
      },
      {
        nome: 'CURSO_TECNICO',
        descricao: 'Curso técnico foco (ex.: Técnico em Multimídia / Design)',
        obrigatorio: true,
      },
    ],
    template:
      'Escreva o roteiro de um episódio de podcast educativo de 5 minutos intitulado "Matemática em Código e Ação", destinado a estudantes do curso [CURSO_TECNICO]. O diálogo deve ocorrer entre uma estudante estagiária curiosa e um profissional experiente da área. Eles devem discutir como o conceito matemático de [TEMA_MATEMATICO] resolve um problema urgente do dia a dia da profissão. Inclua rubricas de entonação, efeitos sonoros recomendados (SFX) e pausas didáticas.',
    exemploUso:
      'Escreva o roteiro de um episódio de podcast educativo para o curso Técnico em Desenvolvimento de Sistemas explicando por que a complexidade de algoritmos O(log n) e Progressões Geométricas são vitais para o desempenho de servidores em nuvem...',
    eixosRecomendados: ['Informação e Comunicação', 'Produção Cultural e Design'],
    dicaDocente:
      'Os estudantes podem ser convidados a gravar o próprio podcast em duplas usando celulares, desenvolvendo habilidades de comunicação técnica e oralidade.',
  },
  {
    id: 'prompt-apl-07',
    codigo: 'APL-MODELAGEM-REGIONAL',
    titulo: 'Modelagem Matemática em Arranjos Produtivos Locais (APL)',
    categoria: 'Modelagem Matemática',
    descricao:
      'Cria uma proposta de projeto investigativo integrando matemática e a vocação econômica regional do Instituto Federal / Campus.',
    parametros: [
      {
        nome: 'SETOR_ECONOMICO_APL',
        descricao: 'Cadeia produtiva regional (ex.: Cafeicultura de Montanha, Polo Calçadista, Laticínios)',
        obrigatorio: true,
      },
      {
        nome: 'TEMA_MATEMATICO',
        descricao: 'Conteúdo de modelagem (ex.: Otimização Linear e Funções de Custo)',
        obrigatorio: true,
      },
      {
        nome: 'CURSO_TECNICO',
        descricao: 'Curso técnico de referência (ex.: Técnico em Administração / Agronegócio)',
        obrigatorio: true,
      },
    ],
    template:
      'Desenvolva uma proposta de atividade investigativa de Modelagem Matemática contextualizada no Arranjo Produtivo Local (APL) de [SETOR_ECONOMICO_APL] para turmas do curso [CURSO_TECNICO]. A atividade deve utilizar o objeto matemático [TEMA_MATEMATICO] para modelar um gargalo de sustentabilidade ou viabilidade financeira da cadeia produtiva local. Forneça: 1) A contextualização da cadeia de valor regional; 2) Os parâmetros e variáveis da modelagem; 3) As equações propostas; 4) Três perguntas de impacto socioeconômico para discussão em grupo.',
    exemploUso:
      'Desenvolva uma proposta de atividade investigativa de Modelagem Matemática no APL de Cafeicultura Familiar para o curso Técnico em Agropecuária utilizando Funções Quadráticas para cálculo do ponto de equilíbrio econômico e dimensionamento de secadores solares...',
    eixosRecomendados: ['Recursos Naturais', 'Gestão e Negócios', 'Produção Alimentícia'],
    dicaDocente:
      'Esta atividade aproxima a escola pública da comunidade externa, reforçando a missão institucional dos Institutos Federais de atuar nos territórios de abrangência.',
  },
  {
    id: 'prompt-rub-08',
    codigo: 'RUB-AVALIACAO-COMPETENCIAS',
    titulo: 'Rubrica Analítica de Avaliação por Competências na EPT',
    categoria: 'Avaliação Formativa',
    descricao:
      'Gera uma matriz de rubrica com critérios claros de desempenho em 4 níveis (Insuficiente, Básico, Proficiente, Avançado), avaliando simultaneamente o rigor matemático e a aplicação profissional.',
    parametros: [
      {
        nome: 'ATIVIDADE_PROPOSTA',
        descricao: 'Nome ou tipo de atividade avaliativa (ex.: Projeto de Dimensionamento Solar)',
        obrigatorio: true,
      },
      {
        nome: 'TEMA_MATEMATICO',
        descricao: 'Conteúdo matemático base (ex.: Trigonometria e Ângulos de Inclinação Solar)',
        obrigatorio: true,
      },
      {
        nome: 'CURSO_TECNICO',
        descricao: 'Curso Técnico (ex.: Técnico em Eletromecânica)',
        obrigatorio: true,
      },
    ],
    template:
      'Construa uma rubrica analítica de avaliação formativa para a atividade "[ATIVIDADE_PROPOSTA]" do curso [CURSO_TECNICO], envolvendo a aplicação de [TEMA_MATEMATICO]. A matriz deve conter 4 dimensões avaliativas: 1) Domínio dos conceitos matemáticos e rigor de cálculo; 2) Aplicação e pertinência ao contexto técnico da profissão; 3) Clareza na justificativa e argumentação técnica; 4) Postura ética e colaboração no trabalho em equipe. Para cada dimensão, descreva os critérios para os níveis: Insuficiente (1), Básico (2), Proficiente (3) e Avançado (4).',
    exemploUso:
      'Construa uma rubrica analítica de avaliação formativa para o Projeto de Dimensionamento de Painéis Fotovoltaicos do curso Técnico em Eletromecânica envolvendo Trigonometria e Ângulos de Incidência Solar...',
    eixosRecomendados: ['Controle e Processos Industriais', 'Infraestrutura', 'Recursos Naturais'],
    dicaDocente:
      'Compartilhe a rubrica com os estudantes ANTES da realização da tarefa. A transparência nos critérios avaliativos potencializa a autorregulação da aprendizagem.',
  },
];

export default {
  CATEGORIAS_PROMPTS_CANONICAS,
  MODELOS_EBOOK_PROMPTS,
};

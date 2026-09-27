/* ==========================================================================
   Banco de Dados Simulado - IAprofEPT (Fase 1 MVP)
   Dados Fidedignos à Pesquisa de Doutorado de Maycon Magalhães (PPGEM/UFJF)
   ========================================================================== */

const APP_DATA = {
  usuario: {
    nome: 'Prof. Maycon Magalhães',
    email: 'maycon.magalhaes@ifnmg.edu.br',
    instituicao: 'Instituto Federal do Norte de Minas Gerais (IFNMG)',
    campus: 'Campus Januária',
    cargo: 'Docente de Matemática na EPT',
    iniciais: 'MM',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    logado: true
  },

  modulos: [
    { id: 'inicio', label: 'Início', icon: 'fa-solid fa-house', desc: 'Painel Central & Visão Geral' },
    { id: 'formativo', label: 'Ambiente Formativo', icon: 'fa-solid fa-book-open-reader', badge: '4 Trilhas', desc: 'Cursos, acervo e e-book' },
    { id: 'laboratorio', label: 'Laboratório de IA', icon: 'fa-solid fa-flask-vial', badge: 'Motor IA', desc: 'Gerador guiado parametrizado' },
    { id: 'repositorio', label: 'Repositório', icon: 'fa-solid fa-folder-open', badge: '6 Práticas', desc: 'Curadoria e compartilhamento' },
    { id: 'reflexao', label: 'Reflexão Crítica', icon: 'fa-solid fa-scale-balanced', desc: 'Debate ético e autonomia' },
    { id: 'suporte', label: 'Suporte & Portfólio', icon: 'fa-solid fa-headset', desc: 'Prof. mAIcon e tutoriais' }
  ],

  // 1. AMBIENTE FORMATIVO
  trilhas: [
    {
      id: 1,
      titulo: 'Fundamentos da Inteligência Artificial',
      desc: 'O que é IA, Machine Learning e Modelos Generativos — conceitos essenciais para o docente de Matemática.',
      aulas: 6,
      duracao: '48 min',
      progresso: 100,
      status: 'concluido',
      tag: 'Básico'
    },
    {
      id: 2,
      titulo: 'Ética e Pensamento Crítico no Uso de IA',
      desc: 'Vieses algorítmicos, privacidade de dados, autoria docente e os limites éticos na sala de aula.',
      aulas: 5,
      duracao: '52 min',
      progresso: 60,
      status: 'em-andamento',
      tag: 'Ética'
    },
    {
      id: 3,
      titulo: 'Possibilidades Didáticas com Ferramentas Generativas',
      desc: 'Estratégias práticas para articular conceitos matemáticos abstratos com os desafios do mundo do trabalho.',
      aulas: 7,
      duracao: '64 min',
      progresso: 0,
      status: 'bloqueado',
      tag: 'Didática'
    },
    {
      id: 4,
      titulo: 'Estudos de Caso sobre o Uso de IA na EPT',
      desc: 'Casos reais comentados de integração entre Matemática, IA e cursos técnicos da Rede Federal.',
      aulas: 4,
      duracao: '40 min',
      progresso: 0,
      status: 'bloqueado',
      tag: 'Casos Reais'
    }
  ],

  documentos: [
    { id: 'd1', titulo: 'Recomendação da UNESCO sobre a Ética da Inteligência Artificial', tipo: 'UNESCO', tag: 'Documento Internacional', ano: '2021', link: '#' },
    { id: 'd2', titulo: 'Plano Brasileiro de Inteligência Artificial (PBIA 2024-2028)', tipo: 'Legislação', tag: 'Políticas Públicas', ano: '2024', link: '#' },
    { id: 'd3', titulo: 'Guia: IA Generativa na Educação Básica e Profissional (MEC)', tipo: 'Guia', tag: 'Diretriz MEC', ano: '2024', link: '#' },
    { id: 'd4', titulo: 'Catálogo Nacional de Cursos Técnicos (CNCT 4ª Edição)', tipo: 'Referencial', tag: 'Curricular EPT', ano: '2023', link: '#' },
    { id: 'd5', titulo: 'Educação Matemática Crítica e Tecnologias Digitais (Artigo Skovsmose)', tipo: 'Artigo', tag: 'Fundamentação Teórica', ano: '2022', link: '#' }
  ],

  videos: [
    {
      id: 'v1',
      youtubeId: 'Q_2bAN04KF0',
      titulo: 'IA na Educação Matemática da EPT — Live de Abertura da Pesquisa',
      autor: 'Prof. Maycon Magalhães (Doutorando PPGEM/UFJF)',
      duracao: 'Live Gravada',
      tipo: 'Palestra / Live',
      desc: 'Discussão de abertura sobre o uso crítico, ético e intencional da Inteligência Artificial no ensino de Matemática na Educação Profissional e Tecnológica.'
    }
  ],

  promptsEbook: [
    {
      id: 'p1',
      titulo: 'Diagnóstico de Pré-requisitos com Sondagem',
      categoria: 'Diagnóstico',
      template: 'Liste os pré-requisitos matemáticos essenciais para ensinar [TEMA MATEMÁTICO] a uma turma do curso técnico de [CURSO TÉCNICO], fornecendo 3 perguntas diagnósticas contextualizadas com o cotidiano profissional.'
    },
    {
      id: 'p2',
      titulo: 'Contextualização Técnica com a BNCC',
      categoria: 'Contextualização',
      template: 'Reescreva a situação-problema matemática "[ENUNCIADO BASE]" inserindo-a em um cenário autêntico do curso técnico de [CURSO TÉCNICO], preservando o rigor conceitual e indicando o código da habilidade BNCC correspondente.'
    },
    {
      id: 'p3',
      titulo: 'Metodologia do Erro Produtivo',
      categoria: 'Avaliação Formativa',
      template: 'Crie 3 resoluções comentadas para o problema de [TEMA], contendo erros conceituais recorrentes cometidos por estudantes, e formule questões reflexivas que estimulem a autocorreção mediada.'
    },
    {
      id: 'p4',
      titulo: 'Feedback Devolutivo Acolhedor',
      categoria: 'Feedback',
      template: 'Gere um modelo de feedback devolutivo individualizado, em tom pedagógico e encorajador, para um estudante de [CURSO TÉCNICO] que demonstrou a seguinte dúvida conceitual: "[DESCREVER DÚVIDA]".'
    }
  ],

  // 2. LABORATÓRIO DE IA (PARÂMETROS CURRICULARES ESTRUTURADOS)
  laboratorio: {
    ferramentas: [
      { id: 'exercicios', titulo: 'Exercícios & Avaliações', icone: 'fa-solid fa-calculator', desc: 'Gera questões contextualizadas com gabarito passo a passo e códigos da BNCC.', cor: 'var(--primary-green)' },
      { id: 'interdisciplinar', titulo: 'Atividades Interdisciplinares', icone: 'fa-solid fa-layer-group', desc: 'Integra a Matemática ao Eixo Tecnológico CNCT e ao perfil profissional do curso.', cor: 'var(--accent-blue)' },
      { id: 'podcast', titulo: 'Roteiros de Podcast Educativo', icone: 'fa-solid fa-podcast', desc: 'Roteiros de áudio em formato de diálogo didático para os estudantes.', cor: 'var(--accent-amber)' },
      { id: 'plano', titulo: 'Planejamento de Aulas Ativas', icone: 'fa-solid fa-chalkboard-user', desc: 'Planos estruturados com metodologias ativas, objetivos e recursos pedagógicos.', cor: 'var(--accent-purple)' }
    ],

    areasMatematica: [
      'Funções Afins e Quadráticas',
      'Progressões (PA e PG)',
      'Geometria Plana e Trigonometria',
      'Geometria Espacial e Volume',
      'Estatística Descritiva e Amostragem',
      'Probabilidade e Análise de Risco',
      'Matemática Financeira e Juros',
      'Análise Combinatória e Lógica',
      'Matrizes, Vetores e Sistemas Lineares',
      'Aritmética e Proporcionalidade'
    ],

    niveis: ['Inicial (1º Ano Integrado)', 'Intermediário (2º Ano Integrado)', 'Avançado (3º Ano / Subsequente)'],

    eixosCNCT: [
      { id: 'trabalho', label: 'Mundo do Trabalho & Produção', icone: 'fa-solid fa-briefcase' },
      { id: 'tecnologia', label: 'Tecnologia & Inovação', icone: 'fa-solid fa-microchip' },
      { id: 'ciencia', label: 'Ciência & Pesquisa Aplicada', icone: 'fa-solid fa-atom' },
      { id: 'cultura', label: 'Cultura & Sociedade', icone: 'fa-solid fa-people-roof' }
    ],

    cursosTecnicos: [
      'Técnico em Informática / Desenvolvimento de Sistemas',
      'Técnico em Agropecuária / Agricultura',
      'Técnico em Enfermagem / Saúde',
      'Técnico em Administração / Logística',
      'Técnico em Edificações / Construção Civil',
      'Técnico em Eletrotécnica / Automação',
      'Técnico em Química / Meio Ambiente',
      'Técnico em Mecânica Industrial'
    ],

    metodologias: [
      'Aprendizagem Baseada em Problemas (PBL)',
      'Sala de Aula Invertida',
      'Aprendizagem Baseada em Projetos Integradores',
      'Ensino Híbrido e Gamificação',
      'Modelagem Matemática da Realidade',
      'Estudo de Casos Autênticos da EPT'
    ],

    quantidades: ['3 Questões Detalhadas', '5 Questões com Gabarito', '10 Questões para Lista']
  },

  // 3. REPOSITÓRIO DE PRÁTICAS
  praticas: [
    {
      id: 'prat-1',
      titulo: 'Modelagem de Funções Afins no Cálculo de Dosagem Farmacológica',
      autor: 'Prof. Maycon Magalhães',
      instituicao: 'IFNMG · Campus Januária',
      curso: 'Enfermagem',
      tema: 'Funções Afins',
      tipo: 'Sequência Didática',
      likes: 28,
      visualizacoes: 142,
      data: 'Há 3 dias',
      habilidadeBNCC: 'EM13MAT401',
      resumo: 'Sequência contextualizada que relaciona grandezas proporcionais e taxa de variação na administração intravenosa de medicamentos em ambiente hospitalar.',
      conteudoCompleto: `### Contextualização Pedagógica
No curso Técnico em Enfermagem, a correta dosagem de fármacos é crucial para a segurança do paciente. Esta atividade conecta a taxa de infusão em ml/h com o modelo linear afim f(t) = a*t + b.

### Situação-Problema
Um paciente adulto internado necessita receber 500 ml de soro glicosado com infusão constante em 8 horas. 
1. Determine a lei da função que relaciona o volume restante V(t) em função do tempo t em horas.
2. Calcule o volume presente no frasco após decorridas 3 horas e 30 minutos de infusão.
3. Interprete o coeficiente angular no contexto do cuidado em saúde.

### Gabarito e Critérios de Correção
1. Taxa de infusão: 500 / 8 = 62,5 ml/h. Função: V(t) = 500 - 62,5t.
2. V(3,5) = 500 - 62,5 * 3,5 = 500 - 218,75 = 281,25 ml.
3. O coeficiente (-62,5) representa a taxa de esvaziamento contínuo por hora.`
    },
    {
      id: 'prat-2',
      titulo: 'Geometria Espacial no Dimensionamento e Capacidade de Silos Graneleiros',
      autor: 'Profa. Aline Santos',
      instituicao: 'IF Sul de Minas · Campus Machado',
      curso: 'Agropecuária',
      tema: 'Geometria Espacial',
      tipo: 'Projeto Integrador',
      likes: 35,
      visualizacoes: 198,
      data: 'Há 5 dias',
      habilidadeBNCC: 'EM13MAT308',
      resumo: 'Cálculo de volume combinado de cilindro reto e cone para armazenamento de grãos de milho e soja, integrando perdas por compactação.',
      conteudoCompleto: 'Atividade prática de campo integrando medidas de raio, altura do cone e densidade de grãos para previsão de safra agrícola.'
    },
    {
      id: 'prat-3',
      titulo: 'Álgebra Booleana e Lógica Proposicional no Desenvolvimento de Software',
      autor: 'Prof. Diego Carvalho',
      instituicao: 'IFSP · Campus Campinas',
      curso: 'Informática',
      tema: 'Lógica e Matrizes',
      tipo: 'Sequência Didática',
      likes: 31,
      visualizacoes: 175,
      data: 'Há 1 semana',
      habilidadeBNCC: 'EM13MAT103',
      resumo: 'Estudo de tabelas-verdade, portas lógicas e matrizes de adjacência aplicadas à estrutura de grafos e algoritmos de decisão.',
      conteudoCompleto: 'Exercícios práticos de simplificação de expressões lógicas utilizando teoremas de De Morgan para otimização de código JavaScript.'
    },
    {
      id: 'prat-4',
      titulo: 'Matemática Financeira e Demonstração de Fluxo de Caixa Empresarial',
      autor: 'Prof. Renato Oliveira',
      instituicao: 'IFMG · Campus Ribeirão das Neves',
      curso: 'Administração',
      tema: 'Matemática Financeira',
      tipo: 'Plano de Aula',
      likes: 22,
      visualizacoes: 110,
      data: 'Há 2 semanas',
      habilidadeBNCC: 'EM13MAT203',
      resumo: 'Simulações de amortização pelo sistema SAC e Price para investimento em maquinário de pequeno porte.',
      conteudoCompleto: 'Estudo comparativo de taxas nominais e efetivas em linhas de crédito para microempreendedores individuais.'
    },
    {
      id: 'prat-5',
      titulo: 'Topografia e Trigonometria na Altimetria de Terrenos Agrícolas',
      autor: 'Profa. Carla Mendes',
      instituicao: 'IF Goiano · Campus Ceres',
      curso: 'Agropecuária',
      tema: 'Trigonometria',
      tipo: 'Atividade de Campo',
      likes: 19,
      visualizacoes: 89,
      data: 'Há 2 semanas',
      habilidadeBNCC: 'EM13MAT306',
      resumo: 'Uso de teodolito artesanal e razões trigonométricas (seno, cosseno e tangente) para medição de declividade em curva de nível.',
      conteudoCompleto: 'Roteiro de aula prática para preservação do solo contra erosão pluvial por meio de curvas em nível.'
    },
    {
      id: 'prat-6',
      titulo: 'Resistência dos Materiais e Trigonometria em Treliças de Telhado',
      autor: 'Prof. Eduardo Silva',
      instituicao: 'CEFET-MG · Campus Curvelo',
      curso: 'Edificações',
      tema: 'Geometria e Vetores',
      tipo: 'Plano de Aula',
      likes: 16,
      visualizacoes: 95,
      data: 'Há 3 semanas',
      habilidadeBNCC: 'EM13MAT504',
      resumo: 'Decomposição vetorial de forças e cálculo de tração e compressão em nós de treliças metálicas tipo Howe e Pratt.',
      conteudoCompleto: 'Aplicação das leis dos senos e cossenos para dimensionamento seguro de coberturas industriais.'
    }
  ],

  // 4. PAINEL DE REFLEXÃO CRÍTICA
  foruns: [
    {
      id: 'f-1',
      titulo: 'Até onde a IA pode "corrigir" avaliações matemáticas sem desumanizar o processo formativo?',
      autor: 'Prof. Diego Carvalho (IFSP)',
      respostas: 18,
      ativo: true,
      tag: 'Avaliação Formativa',
      data: 'Hoje às 14:20'
    },
    {
      id: 'f-2',
      titulo: 'Vieses algorítmicos em enunciados: como a IA retrata as relações de gênero e trabalho na EPT?',
      autor: 'Profa. Carla Mendes (IF Goiano)',
      respostas: 12,
      ativo: true,
      tag: 'Vieses & Ética',
      data: 'Ontem'
    },
    {
      id: 'f-3',
      titulo: 'Autoria e autoridade docente: de quem é o plano de aula gerado com assistência de LLMs?',
      autor: 'Prof. Renato Oliveira (IFMG)',
      respostas: 26,
      ativo: true,
      tag: 'Autonomia Docente',
      data: 'Há 3 dias'
    }
  ],

  provocacoes: [
    {
      texto: '"Se a Inteligência Artificial pode gerar 50 exercícios em 2 segundos, qual passa a ser o papel insubstituível e humanizador do professor de Matemática?"',
      autor: 'Reflexão Coletiva · PPGEM / UFJF'
    },
    {
      texto: '"Economizar tempo de planejamento não basta: o que faremos com o tempo pedagógico que a tecnologia nos devolve em sala de aula?"',
      autor: 'Prof. Maycon Magalhães'
    },
    {
      texto: '"A máquina opera por probabilidade estatística de palavras; o professor opera por intencionalidade ética, escuta ativa e compromisso social."',
      autor: 'Educação Matemática Crítica'
    }
  ],

  artigos: [
    {
      titulo: 'A Docência em Matemática na Era dos Algoritmos: Resistência Crítica ou Acomodação Técnica?',
      autor: 'Entrevista Pedagógica com Especialistas',
      tempoLeitura: '8 min de leitura',
      tag: 'Entrevista'
    },
    {
      titulo: 'Educação Matemática Crítica de Ole Skovsmose frente às IAs Generativas',
      autor: 'Ensaio Teórico',
      tempoLeitura: '12 min de leitura',
      tag: 'Teoria Pedagógica'
    }
  ],

  // 5. SUPORTE & INDICADORES
  indicadores: [
    { id: 'ind-1', valor: '2 de 4', rotulo: 'Trilhas em Andamento', icone: 'fa-solid fa-graduation-cap', cor: 'var(--primary-green)', bg: 'var(--primary-soft-bg)' },
    { id: 'ind-2', valor: '18', rotulo: 'Materiais Gerados no Laboratório', icone: 'fa-solid fa-wand-magic-sparkles', cor: 'var(--accent-blue)', bg: 'var(--accent-blue-bg)' },
    { id: 'ind-3', valor: '4', rotulo: 'Práticas no Repositório', icone: 'fa-solid fa-folder-plus', cor: 'var(--accent-amber)', bg: 'var(--accent-amber-bg)' },
    { id: 'ind-4', valor: '9', rotulo: 'Participações nos Fóruns', icone: 'fa-solid fa-comments', cor: 'var(--accent-purple)', bg: 'var(--accent-purple-bg)' }
  ],

  tutoriais: [
    { titulo: 'Primeiros passos e navegação na Plataforma IAprofEPT', duracao: '3 min' },
    { titulo: 'Como gerar exercícios contextualizados sem prompt aberto', duracao: '5 min' },
    { titulo: 'Curadoria e compartilhamento de sequências no Repositório', duracao: '4 min' },
    { titulo: 'Uso ético do assistente virtual Prof. mAIcon', duracao: '2 min' }
  ],

  // BASE DE CONHECIMENTO DO PROF. MAICON (CHATBOT)
  respostasMaicon: {
    saudacao: 'Olá, colega professor! Eu sou o **Prof. mAIcon**, seu assistente pedagógico virtual no IAprofEPT. Como posso colaborar com o seu planejamento docente hoje?',
    sugestoes: [
      'Como parametrizar o Laboratório de IA?',
      'O que é o banner de validação ética?',
      'Como vincular uma atividade à BNCC?',
      'Como exportar materiais em PDF?'
    ],
    perguntasFrequentes: {
      'laboratorio': 'No **Laboratório de IA**, você não precisa escrever prompts livres! Basta selecionar a Área da Matemática, o Eixo CNCT, o Curso Técnico e a Metodologia. Nosso motor injeta automaticamente os parâmetros pedagógicos de rigor e contextualização.',
      'etica': 'O **Banner de Validação Ética** é um princípio central desta tese de doutorado: a IA atua apenas como copiloto sugeridor. A autoridade, adaptação e validação do conteúdo pertencem sempre à autoridade do professor antes de aplicar aos alunos.',
      'bncc': 'Cada recurso gerado no laboratório já vem com a habilidade correspondente do Ensino Médio/EPT (por exemplo, `EM13MAT401` para funções ou `EM13MAT308` para geometria espacial).',
      'exportar': 'Você pode clicar no botão **"Imprimir / Salvar PDF"** dentro de qualquer atividade gerada ou no Repositório para gerar um documento formatado com cabeçalho institucional e advertência ética.',
      'padrao': 'Compreendo a sua dúvida! Como assistente pedagógico do IAprofEPT, estou aqui para apoiar seu uso crítico das ferramentas. Você gostaria de explorar o **Laboratório de IA**, o **Ambiente Formativo** ou o **Repositório de Práticas**?'
    }
  }
};

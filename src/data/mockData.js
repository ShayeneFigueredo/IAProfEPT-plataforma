/* ==========================================================================
   Banco de Dados dos 5 Ambientes - IAprofEPT (React + Vite)
   ========================================================================== */

export const USER_DATA = {
  nome: 'Prof. Maycon Magalhães',
  email: 'maycon.magalhaes@ifnmg.edu.br',
  instituicao: 'Instituto Federal do Norte de Minas Gerais (IFNMG)',
  campus: 'Campus Januária',
  cargo: 'Docente de Matemática · IFNMG',
  iniciais: 'M'
};

export const MODULES_DATA = [
  { id: 'inicio', label: 'Início', icon: 'Home' },
  { id: 'formativo', label: 'Ambiente Formativo', icon: 'BookOpen', badge: '4' },
  { id: 'laboratorio', label: 'Laboratório de IA', icon: 'FlaskConical' },
  { id: 'repositorio', label: 'Repositório', icon: 'FolderGit2' },
  { id: 'reflexao', label: 'Reflexão Crítica', icon: 'Scale' },
  { id: 'suporte', label: 'Suporte', icon: 'HelpCircle' }
];

export const TRILHAS_DATA = [
  {
    id: 1,
    titulo: 'Fundamentos da Inteligência Artificial',
    desc: 'O que é IA, Machine Learning e Modelos Generativos — conceitos essenciais para o docente de Matemática.',
    aulas: 6,
    duracao: '48 min',
    progresso: 100,
    status: 'concluido'
  },
  {
    id: 2,
    titulo: 'Ética e Pensamento Crítico no Uso de IA',
    desc: 'Vieses algorítmicos, privacidade de dados, autoria docente e os limites éticos na sala de aula.',
    aulas: 5,
    duracao: '52 min',
    progresso: 60,
    status: 'em-andamento'
  },
  {
    id: 3,
    titulo: 'Possibilidades Didáticas com Ferramentas Generativas',
    desc: 'Estratégias práticas para articular conceitos matemáticos abstratos com os desafios do mundo do trabalho.',
    aulas: 7,
    duracao: '64 min',
    progresso: 0,
    status: 'bloqueado'
  },
  {
    id: 4,
    titulo: 'Estudos de Caso sobre o Uso de IA na EPT',
    desc: 'Casos reais comentados de integração entre Matemática, IA e cursos técnicos da Rede Federal.',
    aulas: 4,
    duracao: '40 min',
    progresso: 0,
    status: 'bloqueado'
  }
];

export const DOCUMENTOS_DATA = [
  { id: 'd1', titulo: 'Recomendação da UNESCO sobre a Ética da IA', tag: 'UNESCO', ano: '2021' },
  { id: 'd2', titulo: 'Plano Brasileiro de Inteligência Artificial (PBIA 2024-2028)', tag: 'Legislação', ano: '2024' },
  { id: 'd3', titulo: 'Guia: IA Generativa na Educação Básica e Profissional (MEC)', tag: 'Diretriz MEC', ano: '2024' },
  { id: 'd4', titulo: 'Catálogo Nacional de Cursos Técnicos (CNCT 4ª Edição)', tag: 'Curricular EPT', ano: '2023' },
  { id: 'd5', titulo: 'Educação Matemática Crítica e Tecnologias (Skovsmose)', tag: 'Fundamentação Teórica', ano: '2022' }
];

export const PROMPTS_EBOOK_DATA = [
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
];

export const LAB_OPTIONS = {
  ferramentas: [
    { id: 'exercicios', titulo: 'Exercícios & Avaliações', desc: 'Gera questões contextualizadas com gabarito passo a passo e códigos da BNCC.', cor: '#064E3B' },
    { id: 'interdisciplinar', titulo: 'Atividades Interdisciplinares', desc: 'Integra a Matemática ao Eixo Tecnológico CNCT e ao perfil profissional do curso.', cor: '#1E5FB0' },
    { id: 'podcast', titulo: 'Roteiros de Podcast Educativo', desc: 'Roteiros de áudio em formato de diálogo didático para os estudantes.', cor: '#9A5A16' },
    { id: 'plano', titulo: 'Planejamento de Aulas Ativas', desc: 'Planos estruturados com metodologias ativas, objetivos e recursos pedagógicos.', cor: '#6B51C4' }
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
  eixosCNCT: [
    { id: 'trabalho', label: 'Mundo do Trabalho & Produção' },
    { id: 'tecnologia', label: 'Tecnologia & Inovação' },
    { id: 'ciencia', label: 'Ciência & Pesquisa Aplicada' },
    { id: 'cultura', label: 'Cultura & Sociedade' }
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
  ]
};

export const PRATICAS_DATA = [
  {
    id: 'prat-1',
    titulo: 'Modelagem de Funções Afins no Cálculo de Dosagem Farmacológica',
    autor: 'Prof. Maycon Magalhães',
    instituicao: 'IFNMG · Campus Januária',
    curso: 'Enfermagem',
    tema: 'Funções Afins',
    tipo: 'Sequência Didática',
    likes: 28,
    data: 'Há 3 dias',
    habilidadeBNCC: 'EM13MAT401',
    resumo: 'Sequência contextualizada que relaciona grandezas proporcionais e taxa de variação na administração intravenosa de medicamentos em ambiente hospitalar.'
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
    data: 'Há 5 dias',
    habilidadeBNCC: 'EM13MAT308',
    resumo: 'Cálculo de volume combinado de cilindro reto e cone para armazenamento de grãos de milho e soja, integrando perdas por compactação.'
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
    data: 'Há 1 semana',
    habilidadeBNCC: 'EM13MAT103',
    resumo: 'Estudo de tabelas-verdade, portas lógicas e matrizes de adjacência aplicadas à estrutura de grafos e algoritmos de decisão.'
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
    data: 'Há 2 semanas',
    habilidadeBNCC: 'EM13MAT203',
    resumo: 'Simulações de amortização pelo sistema SAC e Price para investimento em maquinário de pequeno porte.'
  }
];

export const FORUNS_DATA = [
  {
    id: 'f-1',
    titulo: 'Até onde a IA pode "corrigir" avaliações matemáticas sem desumanizar o processo formativo?',
    autor: 'Prof. Diego Carvalho (IFSP)',
    respostas: 18,
    tag: 'Avaliação Formativa',
    data: 'Hoje às 14:20'
  },
  {
    id: 'f-2',
    titulo: 'Vieses algorítmicos em enunciados: como a IA retrata as relações de gênero e trabalho na EPT?',
    autor: 'Profa. Carla Mendes (IF Goiano)',
    respostas: 12,
    tag: 'Vieses & Ética',
    data: 'Ontem'
  },
  {
    id: 'f-3',
    titulo: 'Autoria e autoridade docente: de quem é o plano de aula gerado com assistência de LLMs?',
    autor: 'Prof. Renato Oliveira (IFMG)',
    respostas: 26,
    tag: 'Autonomia Docente',
    data: 'Há 3 dias'
  }
];

export const INDICADORES_DATA = [
  { id: 'ind-1', valor: '2 / 4', rotulo: 'Trilhas em Andamento', cor: '#065F46', bg: '#ECFDF5' },
  { id: 'ind-2', valor: '17', rotulo: 'Materiais Gerados no Laboratório', cor: '#1E5FB0', bg: '#EAF3FF' },
  { id: 'ind-3', valor: '4', rotulo: 'Práticas Compartilhadas', cor: '#9A5A16', bg: '#FFFBEB' },
  { id: 'ind-4', valor: '9', rotulo: 'Participações nos Fóruns', cor: '#6B51C4', bg: '#F5F3FF' }
];

export const MAICON_KNOWLEDGE = {
  saudacao: 'Olá, colega professor! Eu sou o **Prof. mAIcon**, seu assistente pedagógico virtual no IAprofEPT. Como posso colaborar com o seu planejamento docente hoje?',
  sugestoes: [
    'Como parametrizar o Laboratório de IA?',
    'O que é o banner de validação ética?',
    'Como vincular uma atividade à BNCC?',
    'Como exportar materiais em PDF?'
  ],
  respostas: {
    laboratorio: 'No **Laboratório de IA**, você não precisa escrever prompts livres! Basta selecionar a Área da Matemática, o Eixo CNCT, o Curso Técnico e a Metodologia. Nosso motor injeta automaticamente os parâmetros pedagógicos de rigor e contextualização.',
    etica: 'O **Banner de Validação Ética** é um princípio central desta tese de doutorado: a IA atua apenas como copiloto sugeridor. A autoridade, adaptação e validação do conteúdo pertencem sempre à autoridade do professor antes de aplicar aos alunos.',
    bncc: 'Cada recurso gerado no laboratório já vem com a habilidade correspondente do Ensino Médio/EPT (por exemplo, `EM13MAT401` para funções ou `EM13MAT308` para geometria espacial).',
    exportar: 'Você pode clicar no botão **"Imprimir / Salvar PDF"** dentro de qualquer atividade gerada ou no Repositório para gerar um documento formatado com cabeçalho institucional e advertência ética.',
    padrao: 'Compreendo a sua dúvida! Como assistente pedagógico do IAprofEPT, estou aqui para apoiar seu uso crítico das ferramentas. Você gostaria de explorar o **Laboratório de IA**, o **Ambiente Formativo** ou o **Repositório de Práticas**?'
  }
};

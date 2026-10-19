/**
 * Matriz de Alinhamento Curricular: Matemática x EPT x BNCC x Mundo do Trabalho
 * Plataforma IAprofEPT — Tese de Doutorado PPGEM / UFJF
 * 
 * Doutorando: Maycon Luiz Amaral Magalhães
 * Orientadores: Prof. Dr. Eduardo Barrére | Prof. Dr. Manuel José Cabral dos Santos Reis
 * 
 * Fundamentação Teórico-Normativa:
 * 1. Base Nacional Comum Curricular (BNCC - Ensino Médio, MEC 2018)
 * 2. Catálogo Nacional de Cursos Técnicos (CNCT 4ª Edição, SETEC/MEC 2023)
 * 3. Educação Matemática Crítica (Skovsmose, 2022)
 * 4. Princípio da Concepção do Ensino Médio Integrado (Ramos, 2008)
 */

export const ALERTA_ETICO_PADRAO =
  'Este material foi gerado por Inteligência Artificial e deve ser revisado, validado e adaptado pela autoridade docente antes de sua aplicação em sala de aula.';

export const DIRETRIZES_EDUCACAO_MATEMATICA_CRITICA = {
  autor: 'Ole Skovsmose (2022)',
  obra: 'Educação Matemática Crítica: incerteza, matemática e sociedade',
  pilares: [
    {
      pilar: 'Matemática em Ação (Formatting Power)',
      descricao:
        'A matemática não é neutra nem mera abstração formal; suas fórmulas, modelos e algoritmos moldam a realidade social, decidem políticas produtivas e interferem diretamente na vida dos trabalhadores e cidadãos.',
    },
    {
      pilar: 'Conhecimento Reflexivo além do Tecnológico',
      descricao:
        'O estudante deve dominar o cálculo instrumental (conhecimento matemático) e sua aplicação prática (conhecimento tecnológico), mas precisa desenvolver o Conhecimento Reflexivo: capacidade de avaliar criticamente as consequências éticas, sociais, econômicas e humanas das soluções técnicas calculadas.',
    },
    {
      pilar: 'Pedagogia do Diálogo e Incerteza',
      descricao:
        'Ruptura com o dogma da resposta única e exata. O mundo do trabalho real convive com margens de erro, incertezas, tolerâncias dimensionais, escassez de recursos e dilemas éticos que demandam raciocínio investigativo.',
    },
    {
      pilar: 'Formação Humana Integral e Emancipação na EPT',
      descricao:
        'O ensino de Matemática na EPT visa emancipar o futuro profissional técnico, conferindo-lhe autonomia para questionar automações, auditar dados e atuar com responsabilidade socioambiental.',
    },
  ],
  diretrizesGerais: [
    'Nunca apresentar problemas puramente mecanicistas desprovidos de sentido prático no mundo do trabalho.',
    'Exigir que toda resolução matemática contenha uma etapa explícita de "Interpretação Crítica dos Resultados".',
    'Incluir questionamentos sobre os impactos de decisões fundamentadas nos números (ex: dosagens, perdas agrícolas, custos sociais, impactos ambientais ou segurança no trabalho).',
    'Incentivar a reflexão sobre as limitações e hipóteses simplificadoras dos modelos matemáticos adotados.',
  ],
};

export const METODOLOGIAS_PEDAGOGICAS = {
  'Aprendizagem Baseada em Problemas (PBL)': {
    nome: 'Aprendizagem Baseada em Problemas (PBL)',
    sigla: 'PBL',
    foco: 'Situação-problema autêntica, aberta e desafiadora como ponto de partida da investigação.',
    orientacaoInstrucional:
      'Apresentar um problema autêntico do cotidiano profissional que demande levantamento de hipóteses, busca de dados e modelagem matemática antes de chegar a uma resposta prescritiva.',
  },
  'Modelagem Matemática da Realidade': {
    nome: 'Modelagem Matemática da Realidade',
    sigla: 'MMR',
    foco: 'Ciclo completo de modelagem: situação real -> simplificação -> matematização -> resolução -> validação.',
    orientacaoInstrucional:
      'Conduzir o estudante pelas etapas clássicas de modelagem matemática: identificar variáveis reais, estabelecer hipóteses simplificadoras, formular equações, calcular e validar a pertinência do modelo frente à realidade do trabalho.',
  },
  'Sala de Aula Invertida': {
    nome: 'Sala de Aula Invertida',
    sigla: 'FLIP',
    foco: 'Estudo prévio de conceitos-chave e aplicação colaborativa prática durante a aula.',
    orientacaoInstrucional:
      'Estruturar questões progressivas que partam da checagem conceitual prévia dos princípios matemáticos até o aprofundamento prático e discussão em grupos de trabalho técnico.',
  },
  'Aprendizagem Baseada em Projetos Integradores': {
    nome: 'Aprendizagem Baseada em Projetos Integradores',
    sigla: 'ABPr',
    foco: 'Desenvolvimento de uma solução técnica ou protótipo integrando múltiplos saberes.',
    orientacaoInstrucional:
      'Conectar o cálculo matemático a um projeto técnico interdisciplinar de média escala, onde os resultados matemáticos são requisitos diretos de um produto, serviço ou laudo técnico.',
  },
  'Ensino Híbrido e Gamificação': {
    nome: 'Ensino Híbrido e Gamificação',
    sigla: 'EHG',
    foco: 'Desafios dinâmicos, missões técnicas e tomada de decisão estratégica em etapas.',
    orientacaoInstrucional:
      'Organizar a atividade em fases ou missões progressivas com pontuação de critérios técnicos, análise de riscos e recompensas baseadas na precisão e reflexão crítica.',
  },
  'Estudo de Casos Autênticos da EPT': {
    nome: 'Estudo de Casos Autênticos da EPT',
    sigla: 'CASOS',
    foco: 'Narrativa imersiva baseada em ocorrências e desafios reais de empresas, cooperativas ou hospitais.',
    orientacaoInstrucional:
      'Apresentar uma narrativa detalhada com dados operacionais reais de uma situação profissional, demandando diagnóstico matemático e recomendação técnica fundamentada.',
  },
};

export const NIVEIS_DIFICULDADE = {
  'Inicial (1º Ano Integrado)': {
    rotulo: 'Inicial (1º Ano Integrado)',
    complexidade: 'Básico',
    anoSugerido: '1º Ano do Ensino Médio Integrado',
    caracteristicas:
      'Foco na transição para o raciocínio algébrico e funcional, contextualização intuitiva, cálculos diretos e leitura orientada de grandezas proporcionais.',
  },
  'Intermediário (2º Ano Integrado)': {
    rotulo: 'Intermediário (2º Ano Integrado)',
    complexidade: 'Intermediário',
    anoSugerido: '2º Ano do Ensino Médio Integrado',
    caracteristicas:
      'Integração de múltiplos conceitos matemáticos, interpretação de gráficos e taxas de variação, manipulação de modelos algébricos e resolução com múltiplas etapas.',
  },
  'Avançado (3º Ano / Subsequente)': {
    rotulo: 'Avançado (3º Ano / Subsequente)',
    complexidade: 'Avançado',
    anoSugerido: '3º Ano do Ensino Médio Integrado ou Curso Técnico Subsequente',
    caracteristicas:
      'Modelagem complexa, otimização paramétrica, análise crítica rigorosa de incertezas, cruzamento de normas técnicas e tomada de decisão estratégica.',
  },
};

export const EIXOS_CNCT = {
  'Ambiente e Saúde': {
    nome: 'Ambiente e Saúde',
    descricao: 'Ações de proteção, recuperação e preservação da saúde e do bem-estar biopsicossocial e ambiental.',
    cursosPadrao: ['Técnico em Enfermagem / Saúde'],
  },
  'Recursos Naturais': {
    nome: 'Recursos Naturais',
    descricao: 'Produção agropecuária, aquícola, florestal e preservação dos recursos do solo, água e fauna.',
    cursosPadrao: ['Técnico em Agropecuária / Agricultura'],
  },
  'Informação e Comunicação': {
    nome: 'Informação e Comunicação',
    descricao: 'Desenvolvimento de software, infraestrutura de redes, telecomunicações e segurança da informação.',
    cursosPadrao: ['Técnico em Informática / Desenvolvimento de Sistemas'],
  },
  'Gestão e Negócios': {
    nome: 'Gestão e Negócios',
    descricao: 'Administração, logística, contabilidade, finanças, comércio exterior e gestão de pessoas.',
    cursosPadrao: ['Técnico em Administração / Logística'],
  },
  Infraestrutura: {
    nome: 'Infraestrutura',
    descricao: 'Construção civil, saneamento, transporte, mobilidade urbana e obras viárias.',
    cursosPadrao: ['Técnico em Edificações / Construção Civil'],
  },
  'Controle e Processos Industriais': {
    nome: 'Controle e Processos Industriais',
    descricao: 'Automação, robótica, eletroeletrônica, mecânica, química e processos produtivos automatizados.',
    cursosPadrao: [
      'Técnico em Eletrotécnica / Automação',
      'Técnico em Química / Meio Ambiente',
      'Técnico em Mecânica Industrial',
    ],
  },
};

export const CURSOS_TECNICOS_DETALHADOS = {
  'Técnico em Enfermagem / Saúde': {
    nome: 'Técnico em Enfermagem / Saúde',
    eixoCNCT: 'Ambiente e Saúde',
    perfilProfissional:
      'Profissional de saúde apto a prestar assistência de enfermagem segura a pacientes sob supervisão do enfermeiro, atuando na administração precisa de fármacos, curativos, monitorização de sinais vitais e acolhimento.',
    cenariosTrabalho: {
      'Funções Afins e Quadráticas': {
        titulo: 'Administração de Terapia Medicamentosa e Farmacocinética',
        descricao:
          'Cálculo de taxa constante de infusão de soluções parenterais (ml/h, gotas/min, microgotas/min) e modelagem de curva de concentração sérica de antibióticos e anti-hipertensivos.',
        grandezas: ['Volume V(t) em ml', 'Tempo t em horas', 'Taxa de infusão constante k (ml/h)', 'Concentração sérica C(t) em mg/L'],
        normaOuReferencia: 'Protocolos de Segurança na Prescrição, Uso e Administração de Medicamentos (ANVISA / COFEN).',
      },
      'Geometria Espacial e Volume': {
        titulo: 'Cálculo de Capacidade Volumétrica em Cuidados de Saúde',
        descricao:
          'Dimensionamento de bolsas coletoras, balanço hídrico diário de pacientes em UTI e cubagem de reservatórios de oxigênio medicinal.',
        grandezas: ['Volume em cm³ e ml', 'Capacidade útil', 'Pressão manométrica e vazão'],
        normaOuReferencia: 'Boas Práticas de Enfermagem em Terapia Intensiva.',
      },
      'Estatística Descritiva e Amostragem': {
        titulo: 'Vigilância Epidemiológica Hospitalar e Indicadores de Saúde',
        descricao:
          'Análise de séries históricas de infecções hospitalares, taxa de ocupação de leitos e amostragem de eventos adversos.',
        grandezas: ['Taxa de incidência', 'Média, mediana e desvio-padrão de permanência', 'Frequência relativa'],
        normaOuReferencia: 'Comissão de Controle de Infecção Hospitalar (CCIH).',
      },
      padrao: {
        titulo: 'Cálculos de Enfermagem e Segurança do Paciente',
        descricao:
          'Grandezas de dosagem, proporcionalidade de fármacos diluídos e mensuração precisa de indicadores de saúde.',
        grandezas: ['Dosagem prescrita vs disponível', 'Volume do diluente', 'Tempo de infusão'],
        normaOuReferencia: 'Protocolo de Metas Internacionais de Segurança do Paciente.',
      },
    },
  },

  'Técnico em Agropecuária / Agricultura': {
    nome: 'Técnico em Agropecuária / Agricultura',
    eixoCNCT: 'Recursos Naturais',
    perfilProfissional:
      'Profissional que planeja, executa e monitora processos de produção vegetal e animal, armazenamento de grãos, conservação de solos, manejo sustentável e irrigação.',
    cenariosTrabalho: {
      'Geometria Espacial e Volume': {
        titulo: 'Dimensionamento e Capacidade Volumétrica de Silos Graneleiros',
        descricao:
          'Cálculo do volume combinado de corpos geométricos (cilindro reto + cone de descarga inferior) para armazenamento de grãos (milho, soja), considerando perdas por aeração e compactação gravitacional.',
        grandezas: ['Raio r da base', 'Altura cilíndrica H', 'Altura do cone h', 'Densidade aparente de grãos em kg/m³', 'Fator de compactação'],
        normaOuReferencia: 'Recomendações Técnicas da EMBRAPA para Armazenamento e Secagem de Grãos.',
      },
      'Funções Afins e Quadráticas': {
        titulo: 'Modelagem de Produtividade Agrícola e Dosagem de Adubação',
        descricao:
          'Lei do retorno decrescente de fertilizantes minerais (NPK) modelada por funções quadráticas e planejamento de plantio por hectare.',
        grandezas: ['Quantidade de nitrogênio N (kg/ha)', 'Produtividade esperada P(N) em sacas/ha', 'Vértice da parábola (ponto de máxima produtividade)'],
        normaOuReferencia: 'Manuais de Fertilidade do Solo e Nutrição de Plantas.',
      },
      'Matemática Financeira e Juros': {
        titulo: 'Custo de Safra e Análise de Investimento em Máquinas Agrícolas',
        descricao:
          'Financiamento de tratores e implementos via PRONAF/Plano Safra, cálculo de depreciação de máquinas e viabilidade econômica de culturas.',
        grandezas: ['Custo operacional por hora', 'Taxa de juros anual do crédito rural', 'Margem bruta por hectare'],
        normaOuReferencia: 'Metodologia de Custos de Produção da CONAB.',
      },
      padrao: {
        titulo: 'Gestão da Produção Agropecuária e Sustentabilidade',
        descricao:
          'Cálculo de vazão em irrigação por gotejamento, densidade de semeadura e manejo de rebanhos.',
        grandezas: ['Vazão em L/h', 'Área em hectares (ha)', 'Densidade de plantio por metro linear'],
        normaOuReferencia: 'Guia de Manejo Integrado de Culturas (EMBRAPA).',
      },
    },
  },

  'Técnico em Informática / Desenvolvimento de Sistemas': {
    nome: 'Técnico em Informática / Desenvolvimento de Sistemas',
    eixoCNCT: 'Informação e Comunicação',
    perfilProfissional:
      'Desenvolve, testa e mantém programas computacionais, bancos de dados, redes e soluções lógicas com foco em algoritmos, arquitetura de software e experiência do usuário.',
    cenariosTrabalho: {
      'Análise Combinatória e Lógica': {
        titulo: 'Tabelas-Verdade, Circuitos Digitais e Otimização Lógica',
        descricao:
          'Simplificação de expressões booleanas com teoremas de De Morgan, análise de complexidade condicional de código e arquitetura de portas lógicas em microprocessadores.',
        grandezas: ['Variáveis proposicionais p, q, r', 'Portas AND/OR/XOR', 'Número de combinações de estados (2^n)'],
        normaOuReferencia: 'Padrão IEEE de Lógica Digital e Arquitetura de Computadores.',
      },
      'Matrizes, Vetores e Sistemas Lineares': {
        titulo: 'Matrizes de Adjacência em Grafos e Roteamento de Redes',
        descricao:
          'Modelagem de topologias de redes de computadores por matrizes de adjacência, cálculo do caminho mais curto (algoritmo de Dijkstra) e transformações lineares em computação gráfica.',
        grandezas: ['Matriz A_nxn', 'Grau dos nós da rede', 'Pesos de latência nas arestas'],
        normaOuReferencia: 'Protocolos de Roteamento IP (OSPF, RIP) e Teoria dos Grafos Aplicada.',
      },
      'Progressões (PA e PG)': {
        titulo: 'Complexidade de Algoritmos e Estruturas de Dados Dinâmicas',
        descricao:
          'Análise de tempo assintótico Big-O em laços aninhados (PA), crescimento exponencial de nós em árvores binárias (PG) e buffers circulares.',
        grandezas: ['Número de instruções T(n)', 'Profundidade da árvore h', 'Tamanho do vetor dinâmico'],
        normaOuReferencia: 'Análise Assintótica de Algoritmos (Knuth / Cormen).',
      },
      padrao: {
        titulo: 'Engenharia de Software e Modelagem Lógico-Matemática',
        descricao:
          'Implementação de regras de negócio complexas, criptografia de chaves assimétricas e modelagem relacional.',
        grandezas: ['Chaves binárias', 'Complexidade ciclomática', 'Taxa de transferência de bits'],
        normaOuReferencia: 'Boas Práticas de Engenharia de Software (ACM / IEEE-CS).',
      },
    },
  },

  'Técnico em Administração / Logística': {
    nome: 'Técnico em Administração / Logística',
    eixoCNCT: 'Gestão e Negócios',
    perfilProfissional:
      'Apoia o planejamento estratégico, controle financeiro, gestão de suprimentos e estoques, custos industriais e tomada de decisão fundamentada em dados.',
    cenariosTrabalho: {
      'Matemática Financeira e Juros': {
        titulo: 'Comparação de Sistemas de Amortização (SAC vs Price) e Decisão de Investimento',
        descricao:
          'Análise comparativa de empréstimos e financiamento de capital de giro empresarial através do Sistema de Amortização Constante (SAC) e Tabela Price, com cálculo de VPL (Valor Presente Líquido) e TIR.',
        grandezas: ['Valor presente (PV)', 'Taxa de juros periódica (i)', 'Número de parcelas (n)', 'Valor das amortizações e juros decrescentes'],
        normaOuReferencia: 'Práticas de Gestão Financeira Corporativa e Normas do Banco Central do Brasil.',
      },
      'Estatística Descritiva e Amostragem': {
        titulo: 'Controle de Estoque e Curva ABC de Mercadorias',
        descricao:
          'Classificação de estoques pelo método da Curva ABC (Princípio de Pareto 80/20), cálculo do Ponto de Ressuprimento (PR) e Estoque de Segurança.',
        grandezas: ['Demanda média diária', 'Desvio-padrão da demanda', 'Nível de serviço desejado Z', 'Custo unitário'],
        normaOuReferencia: 'Gestão da Cadeia de Suprimentos (Supply Chain Management).',
      },
      'Funções Afins e Quadráticas': {
        titulo: 'Ponto de Equilíbrio Operacional (Break-Even Point) e Lucro Máximo',
        descricao:
          'Modelagem das funções Receita R(q), Custo Total C(q) e Lucro L(q) para determinar a quantidade mínima de produção viável.',
        grandezas: ['Custo fixo CF', 'Custo variável unitário CVU', 'Preço de venda unitário P', 'Quantidade produzida q'],
        normaOuReferencia: 'Contabilidade Gerencial e Gestão Estratégica de Custos.',
      },
      padrao: {
        titulo: 'Gestão Estratégica e Decisões Empresariais Baseadas em Dados',
        descricao:
          'Análise de liquidez, margem de contribuição e planejamento orçamentário.',
        grandezas: ['Receita bruta', 'Custos dedutíveis', 'Índices de liquidez corrente'],
        normaOuReferencia: 'Conselho Federal de Administração (CFA).',
      },
    },
  },

  'Técnico em Edificações / Construção Civil': {
    nome: 'Técnico em Edificações / Construção Civil',
    eixoCNCT: 'Infraestrutura',
    perfilProfissional:
      'Participa do projeto, planejamento, execução e fiscalização de obras civis, realizando levantamento topográfico, ensaios de materiais, cálculo estrutural básico e orçamento paramétrico.',
    cenariosTrabalho: {
      'Geometria Plana e Trigonometria': {
        titulo: 'Dimensionamento de Rampas de Acessibilidade (NBR 9050) e Inclinação de Telhados',
        descricao:
          'Cálculo trigonométrico da inclinação percentual i = (h/c) * 100 de rampas para pessoas com deficiência física e dimensionamento do caimento de águas de coberturas residenciais.',
        grandezas: ['Desnível h em metros', 'Comprimento horizontal c em metros', 'Comprimento da rampa L', 'Ângulo de inclinação theta'],
        normaOuReferencia: 'ABNT NBR 9050:2020 (Acessibilidade a edificações, mobiliário e espaços urbanos).',
      },
      'Geometria Espacial e Volume': {
        titulo: 'Cubagem de Concreto Armado e Movimentação de Terraplenagem',
        descricao:
          'Cálculo volumétrico para concretagem de sapatas piramidais, vigas, lajes e pilares, estimando perdas de material (brita, areia, cimento e água).',
        grandezas: ['Área da seção transversal', 'Comprimento linear', 'Volume total em m³', 'Fator de perda percentual'],
        normaOuReferencia: 'ABNT NBR 6118 (Projeto de estruturas de concreto).',
      },
      padrao: {
        titulo: 'Topografia, Desenho Técnico e Orçamento de Obras',
        descricao:
          'Cálculo de alvenarias, escalas cartográficas e esforço axial em treliças simples.',
        grandezas: ['Área de parede', 'Desconto de vãos de portas/janelas', 'Consumo de argamassa'],
        normaOuReferencia: 'Sindicato da Indústria da Construção Civil (SINAPI / Caixa).',
      },
    },
  },

  'Técnico em Eletrotécnica / Automação': {
    nome: 'Técnico em Eletrotécnica / Automação',
    eixoCNCT: 'Controle e Processos Industriais',
    perfilProfissional:
      'Planeja, instala, opera e mantém sistemas elétricos de potência, máquinas elétricas, comandos industriais e redes de distribuição em baixa e média tensão.',
    cenariosTrabalho: {
      'Geometria Plana e Trigonometria': {
        titulo: 'Análise de Circuitos de Corrente Alternada e Fator de Potência',
        descricao:
          'Triângulo de potências (potência ativa P em kW, reativa Q em kvar e aparente S em kVA), cálculo do cosseno de fi (fator de potência) e dimensionamento de banco de capacitores.',
        grandezas: ['Tensão RMS V', 'Corrente RMS I', 'Ângulo de defasagem theta', 'Fator de potência cos(theta)'],
        normaOuReferencia: 'Norma Regulamentadora NR-10 e Resoluções Normativas da ANEEL.',
      },
      'Matrizes, Vetores e Sistemas Lineares': {
        titulo: 'Leis de Kirchhoff em Redes Elétricas Complexas',
        descricao:
          'Montagem de sistemas lineares de equações para cálculo de correntes de malha e tensões nodais em subestações industriais.',
        grandezas: ['Resistências R em ohms', 'Fontes de tensão V', 'Correntes de malha I_1, I_2, I_3'],
        normaOuReferencia: 'Teoria de Circuitos Elétricos (Boylestad / Sadiku).',
      },
      padrao: {
        titulo: 'Instalações Elétricas Industriais e Eficiência Energética',
        descricao:
          'Dimensionamento de condutores por queda de tensão e capacidade de condução de corrente.',
        grandezas: ['Seção nominal do condutor em mm²', 'Queda de tensão percentual Delta V', 'Comprimento do circuito'],
        normaOuReferencia: 'ABNT NBR 5410 (Instalações elétricas de baixa tensão).',
      },
    },
  },

  'Técnico em Química / Meio Ambiente': {
    nome: 'Técnico em Química / Meio Ambiente',
    eixoCNCT: 'Controle e Processos Industriais',
    perfilProfissional:
      'Atua em laboratórios de controle de qualidade, análises físico-químicas, monitoramento de efluentes industriais e tratamento de resíduos.',
    cenariosTrabalho: {
      'Funções Afins e Quadráticas': {
        titulo: 'Curvas de Calibração Espectrofotométrica e Lei de Beer-Lambert',
        descricao:
          'Modelagem linear da relação entre absorbância óptica e concentração de analitos em amostras de água de rios e efluentes.',
        grandezas: ['Absorbância A (adimensional)', 'Absortividade molar epsilon', 'Caminho óptico b', 'Concentração C em mol/L'],
        normaOuReferencia: 'Standard Methods for the Examination of Water and Wastewater.',
      },
      padrao: {
        titulo: 'Controle Químico e Gestão de Resíduos Industriais',
        descricao:
          'Cálculo de pH com funções logarítmicas, balanço estequiométrico e neutralização de ácidos/bases.',
        grandezas: ['Concentração de íons H+', 'Potencial hidrogeniônico pH', 'Massa de reagente'],
        normaOuReferencia: 'Resoluções do CONAMA para Padrões de Lançamento de Efluentes.',
      },
    },
  },

  'Técnico em Mecânica Industrial': {
    nome: 'Técnico em Mecânica Industrial',
    eixoCNCT: 'Controle e Processos Industriais',
    perfilProfissional:
      'Desenvolve processos de usinagem, manutenção de equipamentos industriais, ajustes de precisão, calibração mecânica e ensaios não destrutivos.',
    cenariosTrabalho: {
      'Aritmética e Proporcionalidade': {
        titulo: 'Relações de Transmissão por Engrenagens e Polias',
        descricao:
          'Cálculo de velocidade angular, razão de transmissão i = n1/n2 = Z2/Z1 e torque transmitido em redutores mecânicos.',
        grandezas: ['Rotação por minuto (RPM)', 'Número de dentes Z', 'Diâmetro primitivo d', 'Torque T em Nm'],
        normaOuReferencia: 'Padrão AGMA para Dimensionamento de Engrenagens Cilíndricas.',
      },
      padrao: {
        titulo: 'Usinagem de Precisão e Tolerâncias Dimensionais',
        descricao:
          'Ajustes com tolerância ISO, dilatação térmica de eixos e velocidade de corte em tornos CNC.',
        grandezas: ['Afastamento superior e inferior em micrômetros', 'Diâmetro nominal', 'Velocidade de corte Vc'],
        normaOuReferencia: 'ABNT NBR ISO 286 (Sistema de tolerâncias e ajustes).',
      },
    },
  },
};

export const HABILIDADES_BNCC_DETALHADAS = {
  'Funções Afins e Quadráticas': [
    {
      codigo: 'EM13MAT401',
      descricao:
        'Converter representações algébricas de funções afins e funções quadráticas em representações geométricas no plano cartesiano, identificando características dessas funções (raízes, vértices, concavidade, crescimento ou decrescimento) com ou sem apoio de tecnologias digitais.',
      contextoEPT:
        'Aplicação direta na modelagem de taxas contínuas de variação no trabalho (infusão medicamentosa, depreciação linear, curvas de custo e ponto de equilíbrio).',
    },
    {
      codigo: 'EM13MAT302',
      descricao:
        'Construir modelos matemáticos lineares ou exponenciais para representar e solucionar problemas de decaimento de substâncias, crescimento bacteriano, farmacocinética e variações econômicas no setor produtivo.',
      contextoEPT:
        'Dimensionamento de processos dinâmicos temporais em saúde, agronomia e comércio.',
    },
  ],

  'Geometria Espacial e Volume': [
    {
      codigo: 'EM13MAT308',
      descricao:
        'Aplicar as relações métricas e fórmulas de áreas e volumes de prismas, pirâmides, cilindros, cones e esferas para resolver problemas do cotidiano e do mundo do trabalho (silos, reservatórios, embalagens, caçambas e cubagem de materiais).',
      contextoEPT:
        'Cálculo de capacidade real de armazenamento, perdas por compactação e dimensionamento físico na agropecuária e construção civil.',
    },
    {
      codigo: 'EM13MAT309',
      descricao:
        'Resolver e elaborar problemas de dimensionamento espacial e otimização geométrica, avaliando o consumo de materiais e o impacto de perdas nos custos industriais.',
      contextoEPT:
        'Projetos técnicos e minimização de desperdício de insumos em linhas produtivas.',
    },
  ],

  'Geometria Plana e Trigonometria': [
    {
      codigo: 'EM13MAT307',
      descricao:
        'Empregar noções geométricas e trigonométricas (teorema de Pitágoras, razões trigonométricas no triângulo retângulo, lei dos senos e dos cossenos) na resolução de problemas de agrimensura, topografia, engenharia, acessibilidade e arquitetura.',
      contextoEPT:
        'Dimensionamento de rampas acessíveis (NBR 9050), telhados estruturais, nivelamento de terrenos agrícolas e triângulo de potências elétricas.',
    },
    {
      codigo: 'EM13MAT501',
      descricao:
        'Investigar relações de proporcionalidade, paralelismo e perpendicularismo em figuras planas aplicadas a plantas baixas, maquetes e peças mecânicas conforme normas técnicas vigentes.',
      contextoEPT:
        'Leitura e interpretação de projetos arquitetônicos e diagramas esquemáticos industriais.',
    },
  ],

  'Matemática Financeira e Juros': [
    {
      codigo: 'EM13MAT203',
      descricao:
        'Aplicar conceitos de matemática financeira (juros simples e compostos, taxas equivalentes, amortizações pelos sistemas SAC e Price) em situações reais de tomada de decisão pessoal, familiar e empresarial, avaliando taxas de inflação e custo de oportunidade.',
      contextoEPT:
        'Análise de viabilidade financeira de empreendimentos técnicos, aquisição de máquinas e fluxo de caixa de cooperativas.',
    },
    {
      codigo: 'EM13MAT304',
      descricao:
        'Resolver e elaborar problemas com funções exponenciais e logarítmicas nos quais seja necessário calcular prazos de retorno de capital, montantes acumulados e desvalorização cambial.',
      contextoEPT:
        'Planejamento de médio e longo prazo em logística, administração e agricultura familiar.',
    },
  ],

  'Matrizes, Vetores e Sistemas Lineares': [
    {
      codigo: 'EM13MAT103',
      descricao:
        'Interpretar e comparar situações que envolvam sistemas de equações lineares e matrizes como ferramentas de modelagem e tomada de decisão em redes de transporte, telecomunicações e circuitos industriais.',
      contextoEPT:
        'Matrizes de adjacência para roteamento de pacotes de dados e equilíbrio de malhas de circuitos elétricos.',
    },
    {
      codigo: 'EM13MAT202',
      descricao:
        'Planejar e executar a resolução de problemas complexos por meio de sistemas lineares, utilizando algoritmos computacionais e métodos de escalonamento.',
      contextoEPT:
        'Otimização de linhas de produção e cálculo de correntes elétricas em subestações.',
    },
  ],

  'Análise Combinatória e Lógica': [
    {
      codigo: 'EM13MAT310',
      descricao:
        'Resolver e elaborar problemas de contagem envolvendo agrupamentos ordenados e não ordenados (arranjos, permutações e combinações) em situações de criptografia, organização de turnos de trabalho, logística e controle de qualidade.',
      contextoEPT:
        'Escala de plantões hospitalares, testes combinatórios de software e segurança cibernética.',
    },
    {
      codigo: 'EM13MAT103',
      descricao:
        'Analisar estruturas lógicas, tabelas-verdade e argumentos formais para tomada de decisões e validação de algoritmos computacionais.',
      contextoEPT:
        'Criação de regras de validação em código e portas lógicas de circuitos digitais.',
    },
  ],

  'Estatística Descritiva e Amostragem': [
    {
      codigo: 'EM13MAT102',
      descricao:
        'Analisar tabelas, gráficos de colunas, barras, setores ou linhas em relatórios técnicos e científicos, avaliando a consistência dos dados, o método de amostragem e a confiabilidade das conclusões.',
      contextoEPT:
        'Vigilância epidemiológica, controle estatístico de processos (CEP) e monitoramento de perdas na safra.',
    },
    {
      codigo: 'EM13MAT406',
      descricao:
        'Construir e interpretar tabelas de distribuição de frequência, histogramas, medidas de tendência central (média, mediana e moda) e de dispersão (variância e desvio-padrão) para variáveis quantitativas contínuas e discretas em processos produtivos.',
      contextoEPT:
        'Garantia de conformidade em ensaios laboratoriais e qualidade na prestação de serviços técnicos.',
    },
  ],

  'Probabilidade e Análise de Risco': [
    {
      codigo: 'EM13MAT311',
      descricao:
        'Identificar e calcular a probabilidade de eventos aleatórios em contextos do mundo do trabalho (falhas em componentes mecânicos, ocorrência de eventos climáticos adversos e contaminações biológicas), interpretando os resultados para gestão de riscos.',
      contextoEPT:
        'Manutenção preditiva, prevenção de acidentes de trabalho e biossegurança.',
    },
  ],

  'Progressões (PA e PG)': [
    {
      codigo: 'EM13MAT504',
      descricao:
        'Identificar e modelar padrões de regularidade e crescimento linear (Progressões Aritméticas) ou exponencial (Progressões Geométricas) em sequências numéricas aplicadas a fluxos de produção, amortização e decaimento.',
      contextoEPT:
        'Escalonamento de tarefas operacionais, depreciação acelerada de ativos e análise de algoritmos recursivos.',
    },
  ],

  'Aritmética e Proporcionalidade': [
    {
      codigo: 'EM13MAT101',
      descricao:
        'Interpretar criticamente situações econômicas, sociais e do mundo do trabalho que envolvam a variação de grandezas pela razão entre elas (densidade demográfica, velocidade, vazão, escalas de plantas e dosagens), analisando o contexto de forma reflexiva.',
      contextoEPT:
        'Diluição de soluções laboratoriais, leitura de escalas topográficas e relações de transmissão mecânica.',
    },
  ],
};

/**
 * Catálogo de Cursos Técnicos e Mapeamento de Aliases Homologados
 */
export const ALIASES_CURSOS_TECNICOS = [
  {
    nomeOficial: 'Técnico em Enfermagem / Saúde',
    aliases: [
      'enfermagem',
      'saude',
      'enfermeiro',
      'enfermeira',
      'tecnico em enfermagem',
      'tecnico em enfermagem / saude',
    ],
  },
  {
    nomeOficial: 'Técnico em Agropecuária / Agricultura',
    aliases: [
      'agropecuaria',
      'agricultura',
      'agro',
      'agronomia',
      'tecnico em agropecuaria',
      'tecnico em agropecuaria / agricultura',
    ],
  },
  {
    nomeOficial: 'Técnico em Informática / Desenvolvimento de Sistemas',
    aliases: [
      'informatica',
      'desenvolvimento de sistemas',
      'computacao',
      'software',
      'ti',
      'desenvolvimento',
      'tecnico em informatica',
      'tecnico em informatica / desenvolvimento de sistemas',
    ],
  },
  {
    nomeOficial: 'Técnico em Administração / Logística',
    aliases: [
      'administracao',
      'logistica',
      'gestao',
      'adm',
      'administracao / gestao',
      'tecnico em administracao',
      'tecnico em administracao / gestao',
      'tecnico em administracao / logistica',
    ],
  },
  {
    nomeOficial: 'Técnico em Edificações / Construção Civil',
    aliases: [
      'edificacoes',
      'construcao civil',
      'edificacao',
      'construcao',
      'tecnico em edificacoes',
      'tecnico em edificacoes / construcao civil',
    ],
  },
  {
    nomeOficial: 'Técnico em Eletrotécnica / Automação',
    aliases: [
      'eletrotecnica',
      'automacao',
      'eletrica',
      'eletro',
      'tecnico em eletrotecnica',
      'tecnico em eletrotecnica / automacao',
    ],
  },
  {
    nomeOficial: 'Técnico em Química / Meio Ambiente',
    aliases: [
      'quimica',
      'meio ambiente',
      'tecnico em quimica',
      'tecnico em quimica / meio ambiente',
    ],
  },
  {
    nomeOficial: 'Técnico em Mecânica Industrial',
    aliases: [
      'mecanica',
      'mecanica industrial',
      'usinagem',
      'tecnico em mecanica',
      'tecnico em mecanica industrial',
    ],
  },
];

/**
 * Catálogo de Áreas Matemáticas BNCC e Mapeamento de Aliases Homologados
 */
export const ALIASES_AREAS_MATEMATICA = [
  {
    nomeOficial: 'Funções Afins e Quadráticas',
    aliases: [
      'funcoes afins e quadraticas',
      'funcoes',
      'funcoes afins',
      'funcoes quadraticas',
      'algebra e funcoes',
      'funcoes e algebra',
      'afins e quadraticas',
      'algebra',
    ],
  },
  {
    nomeOficial: 'Geometria Espacial e Volume',
    aliases: [
      'geometria espacial e volume',
      'geometria espacial',
      'volume',
      'espacial',
      'geometria espacial e metricas',
      'cubagem',
      'solidos geometricos',
    ],
  },
  {
    nomeOficial: 'Geometria Plana e Trigonometria',
    aliases: [
      'geometria plana e trigonometria',
      'geometria plana',
      'trigonometria',
      'trigonometria e angulos',
      'plana e trigonometria',
      'angulos',
      'trigonometria basica',
    ],
  },
  {
    nomeOficial: 'Matemática Financeira e Juros',
    aliases: [
      'matematica financeira e juros',
      'matematica financeira',
      'financeira',
      'juros',
      'juros e amortizacao',
      'amortizacao',
      'juros simples e compostos',
    ],
  },
  {
    nomeOficial: 'Matrizes, Vetores e Sistemas Lineares',
    aliases: [
      'matrizes, vetores e sistemas lineares',
      'matrizes',
      'sistemas lineares',
      'vetores',
      'matrizes e sistemas',
      'matrizes e sistemas lineares',
      'sistemas',
    ],
  },
  {
    nomeOficial: 'Análise Combinatória e Lógica',
    aliases: [
      'analise combinatoria e logica',
      'analise combinatoria',
      'combinatoria',
      'logica',
      'logica e combinatoria',
      'contagem',
      'tabelas-verdade',
    ],
  },
  {
    nomeOficial: 'Estatística Descritiva e Amostragem',
    aliases: [
      'estatistica descritiva e amostragem',
      'estatistica descritiva',
      'estatistica',
      'amostragem',
      'estatistica e amostragem',
      'estatistica e probabilidade',
    ],
  },
  {
    nomeOficial: 'Probabilidade e Análise de Risco',
    aliases: [
      'probabilidade e analise de risco',
      'probabilidade',
      'analise de risco',
      'risco',
      'probabilidade e risco',
    ],
  },
  {
    nomeOficial: 'Progressões (PA e PG)',
    aliases: [
      'progressoes (pa e pg)',
      'progressoes',
      'pa e pg',
      'progressao aritmetica',
      'progressao geometrica',
      'sequencias',
      'pa',
      'pg',
    ],
  },
  {
    nomeOficial: 'Aritmética e Proporcionalidade',
    aliases: [
      'aritmetica e proporcionalidade',
      'aritmetica',
      'proporcionalidade',
      'razoes e proporcoes',
      'regra de tres',
      'razao e proporcao',
    ],
  },
];

/**
 * Catálogo de Metodologias Homologadas
 */
export const ALIASES_METODOLOGIAS = [
  {
    nomeOficial: 'Aprendizagem Baseada em Problemas (PBL)',
    aliases: [
      'aprendizagem baseada em problemas (pbl)',
      'aprendizagem baseada em problemas',
      'pbl',
      'problemas',
      'resolucao de problemas',
      'metodologia do erro produtivo (borasi)',
      'erro produtivo',
      'borasi',
    ],
  },
  {
    nomeOficial: 'Modelagem Matemática da Realidade',
    aliases: [
      'modelagem matematica da realidade',
      'modelagem matematica',
      'modelagem',
      'mmr',
    ],
  },
  {
    nomeOficial: 'Sala de Aula Invertida',
    aliases: [
      'sala de aula invertida',
      'sala invertida',
      'flipped classroom',
      'flip',
      'ensino sob medida (just-in-time teaching)',
      'ensino sob medida',
      'just-in-time teaching',
      'jitt',
    ],
  },
  {
    nomeOficial: 'Aprendizagem Baseada em Projetos Integradores',
    aliases: [
      'aprendizagem baseada em projetos integradores',
      'aprendizagem baseada em projetos',
      'projetos integradores',
      'projetos',
      'abpr',
      'metodologias ativas e design thinking',
      'design thinking',
      'metodologias ativas',
    ],
  },
  {
    nomeOficial: 'Ensino Híbrido e Gamificação',
    aliases: [
      'ensino hibrido e gamificacao',
      'ensino hibrido',
      'gamificacao',
      'ehg',
    ],
  },
  {
    nomeOficial: 'Estudo de Casos Autênticos da EPT',
    aliases: [
      'estudo de casos autenticos da ept',
      'estudo de casos autenticos',
      'estudo de casos',
      'casos autenticos',
      'casos',
      'estudo de caso e resolucao de problemas',
      'estudo de caso',
    ],
  },
];

/**
 * Catálogo de Níveis de Dificuldade Homologados
 */
export const ALIASES_NIVEIS = [
  {
    nomeOficial: 'Inicial (1º Ano Integrado)',
    aliases: [
      'inicial (1º ano integrado)',
      'inicial',
      '1º ano',
      '1o ano',
      '1 ano',
      '1',
      'basico',
      '1º ano integrado',
      '1o ano integrado',
      'primeiro ano',
    ],
  },
  {
    nomeOficial: 'Intermediário (2º Ano Integrado)',
    aliases: [
      'intermediario (2º ano integrado)',
      'intermediario',
      '2º ano',
      '2o ano',
      '2 ano',
      '2',
      'medio',
      '2º ano integrado',
      '2o ano integrado',
      'segundo ano',
      'medio / tecnico integrado',
      'medio/tecnico integrado',
      'tecnico integrado',
      'ensino medio integrado',
    ],
  },
  {
    nomeOficial: 'Avançado (3º Ano / Subsequente)',
    aliases: [
      'avancado (3º ano / subsequente)',
      'avancado',
      '3º ano',
      '3o ano',
      '3 ano',
      '3',
      'subsequente',
      '3º ano integrado',
      '3o ano integrado',
      'terceiro ano',
    ],
  },
];

/**
 * Função utilitária para normalizar strings de entrada (remover acentos, converter em minúsculas)
 * para buscas resilientes nos catálogos.
 */
export function normalizarChave(texto) {
  if (!texto || typeof texto !== 'string') return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Resolve e valida um curso técnico contra o catálogo oficial do CNCT.
 * Retorna o objeto de dados do curso ou null caso não conste no catálogo.
 */
export function resolverCursoCatalogo(cursoTecnico) {
  if (!cursoTecnico || typeof cursoTecnico !== 'string') return null;
  const cursoNorm = normalizarChave(cursoTecnico);
  if (!cursoNorm) return null;

  // Busca direta no objeto CURSOS_TECNICOS_DETALHADOS
  for (const [nomeOficial, dados] of Object.entries(CURSOS_TECNICOS_DETALHADOS)) {
    if (normalizarChave(nomeOficial) === cursoNorm) {
      return dados;
    }
  }

  // Busca nos aliases catalogados
  for (const item of ALIASES_CURSOS_TECNICOS) {
    const nomeNorm = normalizarChave(item.nomeOficial);
    if (
      nomeNorm === cursoNorm ||
      item.aliases.some((alias) => normalizarChave(alias) === cursoNorm)
    ) {
      return CURSOS_TECNICOS_DETALHADOS[item.nomeOficial] || null;
    }
  }

  // Busca por inclusão se tiver pelo menos 4 caracteres para evitar falso-positivo
  if (cursoNorm.length >= 4) {
    for (const item of ALIASES_CURSOS_TECNICOS) {
      for (const alias of item.aliases) {
        const aliasNorm = normalizarChave(alias);
        if (aliasNorm.length >= 4 && (cursoNorm.includes(aliasNorm) || aliasNorm.includes(cursoNorm))) {
          return CURSOS_TECNICOS_DETALHADOS[item.nomeOficial] || null;
        }
      }
    }
  }

  return null;
}

/**
 * Resolve e valida uma área da Matemática contra as habilidades cadastradas da BNCC.
 * Retorna o nome oficial da área ou null caso não conste no catálogo.
 */
export function resolverAreaCatalogo(areaMatematica) {
  if (!areaMatematica || typeof areaMatematica !== 'string') return null;
  const areaNorm = normalizarChave(areaMatematica);
  if (!areaNorm) return null;

  // Busca direta em HABILIDADES_BNCC_DETALHADAS
  for (const nomeArea of Object.keys(HABILIDADES_BNCC_DETALHADAS)) {
    if (normalizarChave(nomeArea) === areaNorm) {
      return nomeArea;
    }
  }

  // Busca nos aliases catalogados
  for (const item of ALIASES_AREAS_MATEMATICA) {
    const nomeNorm = normalizarChave(item.nomeOficial);
    if (
      nomeNorm === areaNorm ||
      item.aliases.some((alias) => normalizarChave(alias) === areaNorm)
    ) {
      return item.nomeOficial;
    }
  }

  // Busca por inclusão se tiver pelo menos 4 caracteres
  if (areaNorm.length >= 4) {
    for (const item of ALIASES_AREAS_MATEMATICA) {
      for (const alias of item.aliases) {
        const aliasNorm = normalizarChave(alias);
        if (aliasNorm.length >= 4 && (areaNorm.includes(aliasNorm) || aliasNorm.includes(areaNorm))) {
          return item.nomeOficial;
        }
      }
    }
  }

  return null;
}

/**
 * Resolve e valida uma metodologia pedagógica contra o catálogo homologado.
 * Retorna o objeto de dados da metodologia ou null caso não conste no catálogo.
 */
export function resolverMetodologiaCatalogo(metodologia) {
  if (!metodologia || typeof metodologia !== 'string') return null;
  const metNorm = normalizarChave(metodologia);
  if (!metNorm) return null;

  // Busca direta em METODOLOGIAS_PEDAGOGICAS
  for (const [nomeMet, dados] of Object.entries(METODOLOGIAS_PEDAGOGICAS)) {
    if (normalizarChave(nomeMet) === metNorm) {
      return dados;
    }
  }

  // Busca nos aliases catalogados
  for (const item of ALIASES_METODOLOGIAS) {
    const nomeNorm = normalizarChave(item.nomeOficial);
    if (
      nomeNorm === metNorm ||
      item.aliases.some((alias) => normalizarChave(alias) === metNorm)
    ) {
      return METODOLOGIAS_PEDAGOGICAS[item.nomeOficial] || null;
    }
  }

  return null;
}

/**
 * Resolve e valida um nível de dificuldade contra os anos integrados/subsequentes homologados.
 * Retorna o objeto de dados do nível ou null caso não conste no catálogo.
 */
export function resolverNivelCatalogo(nivel) {
  if (!nivel || typeof nivel !== 'string') return null;
  const nivelNorm = normalizarChave(nivel);
  if (!nivelNorm) return null;

  // Busca direta em NIVEIS_DIFICULDADE
  for (const [nomeNivel, dados] of Object.entries(NIVEIS_DIFICULDADE)) {
    if (normalizarChave(nomeNivel) === nivelNorm) {
      return dados;
    }
  }

  // Busca nos aliases catalogados
  for (const item of ALIASES_NIVEIS) {
    const nomeNorm = normalizarChave(item.nomeOficial);
    if (
      nomeNorm === nivelNorm ||
      item.aliases.some((alias) => normalizarChave(alias) === nivelNorm)
    ) {
      return NIVEIS_DIFICULDADE[item.nomeOficial] || null;
    }
  }

  return null;
}

/**
 * Resolve e valida um eixo tecnológico CNCT.
 * Retorna a chave oficial do eixo ou null caso não conste no catálogo.
 */
export function resolverEixoCatalogo(eixo) {
  if (!eixo || typeof eixo !== 'string') return null;
  const eixoNorm = normalizarChave(eixo);
  if (!eixoNorm) return null;

  for (const nomeEixo of Object.keys(EIXOS_CNCT)) {
    if (normalizarChave(nomeEixo) === eixoNorm || normalizarChave(nomeEixo).includes(eixoNorm)) {
      return nomeEixo;
    }
  }
  return null;
}

/**
 * Retorna lista estruturada dos catálogos permitidos na plataforma.
 */
export function obterCatalogosPermitidos() {
  return {
    cursosTecnicos: Object.keys(CURSOS_TECNICOS_DETALHADOS),
    areasMatematica: Object.keys(HABILIDADES_BNCC_DETALHADAS),
    metodologias: Object.keys(METODOLOGIAS_PEDAGOGICAS),
    niveisDificuldade: Object.keys(NIVEIS_DIFICULDADE),
    eixosCNCT: Object.keys(EIXOS_CNCT),
    ferramentasPermitidas: ['exercicios', 'interdisciplinar', 'podcast', 'plano', 'plano_aula'],
  };
}

/**
 * Resolve o contexto curricular completo com base nos parâmetros do professor.
 * Nunca expõe texto cru e injeta os metadados pedagógicos e do mundo do trabalho.
 */
export function resolverContextoCurricular({
  areaMatematica,
  cursoTecnico,
  nivel,
  metodologia,
  ferramenta = 'exercicios',
}) {
  // 1. Resolução do Curso Técnico
  let cursoResolvido = resolverCursoCatalogo(cursoTecnico);
  if (!cursoResolvido) {
    cursoResolvido = CURSOS_TECNICOS_DETALHADOS['Técnico em Enfermagem / Saúde'];
  }

  // 2. Resolução da Área Matemática
  let areaResolvida = resolverAreaCatalogo(areaMatematica);
  if (!areaResolvida) {
    areaResolvida = 'Funções Afins e Quadráticas';
  }

  // 3. Resolução das Habilidades BNCC
  const habilidadesBNCC =
    HABILIDADES_BNCC_DETALHADAS[areaResolvida] ||
    HABILIDADES_BNCC_DETALHADAS['Funções Afins e Quadráticas'];

  // 4. Resolução do Cenário Autêntico do Mundo do Trabalho
  const cenariosCurso = cursoResolvido.cenariosTrabalho || {};
  const cenarioTrabalho =
    cenariosCurso[areaResolvida] ||
    cenariosCurso.padrao || {
      titulo: `Aplicação Prática no ${cursoResolvido.nome}`,
      descricao: `Situação autêntica de tomada de decisão técnica fundamentada em conceitos de ${areaResolvida}.`,
      grandezas: ['Variável dependente', 'Variável independente', 'Parâmetro de controle'],
      normaOuReferencia: 'Práticas do Mundo do Trabalho e Normas Técnicas da EPT.',
    };

  // 5. Resolução da Metodologia
  let metodologiaResolvida = resolverMetodologiaCatalogo(metodologia);
  if (!metodologiaResolvida) {
    metodologiaResolvida = METODOLOGIAS_PEDAGOGICAS['Aprendizagem Baseada em Problemas (PBL)'];
  }

  // 6. Resolução do Nível
  let nivelResolvido = resolverNivelCatalogo(nivel);
  if (!nivelResolvido) {
    nivelResolvido = NIVEIS_DIFICULDADE['Intermediário (2º Ano Integrado)'];
  }

  return {
    curso: cursoResolvido,
    eixoCNCT: cursoResolvido.eixoCNCT,
    areaMatematica: areaResolvida,
    habilidadesBNCC,
    cenarioTrabalho,
    metodologia: metodologiaResolvida,
    nivel: nivelResolvido,
    ferramenta,
    educacaoMatematicaCritica: DIRETRIZES_EDUCACAO_MATEMATICA_CRITICA,
    alertaEticoObrigatorio: ALERTA_ETICO_PADRAO,
  };
}


/**
 * Seed 4: Matriz de Habilidades de Matemática da BNCC (Ensino Médio / EPT)
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Execução 100% Idempotente
 * @param {import('knex').Knex} knex
 */
export async function seed(knex) {
  const habilidades = [
    // Competência Específica 1
    {
      codigo: 'EM13MAT101',
      area: 'Matemática e suas Tecnologias',
      campo_matematico: 'Estatística e Probabilidade',
      descricao: 'Interpretar criticamente dados veiculados pela mídia e tabelas em contextos autênticos de pesquisa.',
      etapa: 'Ensino Médio',
    },
    {
      codigo: 'EM13MAT102',
      area: 'Matemática e suas Tecnologias',
      campo_matematico: 'Estatística e Probabilidade',
      descricao: 'Analisar tabelas e gráficos com medidas de tendência central (média, mediana e moda) e dispersão (variância e desvio padrão).',
      etapa: 'Ensino Médio',
    },
    {
      codigo: 'EM13MAT103',
      area: 'Matemática e suas Tecnologias',
      campo_matematico: 'Números e Álgebra',
      descricao: 'Interpretar e comparar situações de proporcionalidade direta e inversa em contextos produtivos.',
      etapa: 'Ensino Médio',
    },

    // Competência Específica 2
    {
      codigo: 'EM13MAT201',
      area: 'Matemática e suas Tecnologias',
      campo_matematico: 'Modelagem e Investigação',
      descricao: 'Propor ou participar de ações para investigar desafios do mundo contemporâneo e do trabalho com modelagem matemática.',
      etapa: 'Ensino Médio',
    },
    {
      codigo: 'EM13MAT202',
      area: 'Matemática e suas Tecnologias',
      campo_matematico: 'Estatística e Probabilidade',
      descricao: 'Planejar e executar pesquisa amostral sobre questões relevantes da área técnica e da sociedade.',
      etapa: 'Ensino Médio',
    },
    {
      codigo: 'EM13MAT203',
      area: 'Matemática e suas Tecnologias',
      campo_matematico: 'Matemática Financeira',
      descricao: 'Aplicar conceitos de matemática financeira (juros compostos, taxas de inflação, amortizações) em tomadas de decisão econômica.',
      etapa: 'Ensino Médio',
    },

    // Competência Específica 3
    {
      codigo: 'EM13MAT301',
      area: 'Matemática e suas Tecnologias',
      campo_matematico: 'Álgebra e Funções',
      descricao: 'Resolver e elaborar problemas com variação proporcional direta e inversa em grandezas da física, química e biologia.',
      etapa: 'Ensino Médio',
    },
    {
      codigo: 'EM13MAT302',
      area: 'Matemática e suas Tecnologias',
      campo_matematico: 'Álgebra e Funções',
      descricao: 'Construir modelos com funções polinomiais de 1º e 2º graus para descrever e projetar fenômenos de trajetórias e custos.',
      etapa: 'Ensino Médio',
    },
    {
      codigo: 'EM13MAT303',
      area: 'Matemática e suas Tecnologias',
      campo_matematico: 'Álgebra e Funções',
      descricao: 'Resolver e elaborar problemas que envolvam funções exponenciais em decaimento radioativo, farmacocinética e crescimento populacional.',
      etapa: 'Ensino Médio',
    },
    {
      codigo: 'EM13MAT304',
      area: 'Matemática e suas Tecnologias',
      campo_matematico: 'Álgebra e Funções',
      descricao: 'Resolver problemas com funções logarítmicas em escalas de pH, magnitude sísmica e intensidade sonora.',
      etapa: 'Ensino Médio',
    },
    {
      codigo: 'EM13MAT305',
      area: 'Matemática e suas Tecnologias',
      campo_matematico: 'Trigonometria e Funções',
      descricao: 'Resolver problemas com funções trigonométricas associadas a fenômenos periódicos (ondas acústicas, marés e circuitos elétricos).',
      etapa: 'Ensino Médio',
    },
    {
      codigo: 'EM13MAT306',
      area: 'Matemática e suas Tecnologias',
      campo_matematico: 'Álgebra e Sequências',
      descricao: 'Resolver problemas com progressões aritméticas (PA) e geométricas (PG) aplicadas a finanças, computação e ciências naturais.',
      etapa: 'Ensino Médio',
    },
    {
      codigo: 'EM13MAT307',
      area: 'Matemática e suas Tecnologias',
      campo_matematico: 'Geometria e Trigonometria',
      descricao: 'Empregar razões trigonométricas no triângulo retângulo e na circunferência em topografia, navegação e construção civil.',
      etapa: 'Ensino Médio',
    },
    {
      codigo: 'EM13MAT308',
      area: 'Matemática e suas Tecnologias',
      campo_matematico: 'Geometria Plana',
      descricao: 'Aplicar as relações métricas e áreas de figuras planas em projetos reais de loteamento, arquitetura e agrimensura.',
      etapa: 'Ensino Médio',
    },
    {
      codigo: 'EM13MAT309',
      area: 'Matemática e suas Tecnologias',
      campo_matematico: 'Geometria Espacial',
      descricao: 'Resolver problemas de cálculo de áreas de superfície e volumes de prismas, pirâmides, cilindros, cones e esferas em embalagens e silos.',
      etapa: 'Ensino Médio',
    },

    // Competência Específica 4
    {
      codigo: 'EM13MAT401',
      area: 'Matemática e suas Tecnologias',
      campo_matematico: 'Álgebra Linear',
      descricao: 'Converter representações algébricas e geométricas em sistemas lineares para resolver problemas de alocação de recursos.',
      etapa: 'Ensino Médio',
    },
    {
      codigo: 'EM13MAT402',
      area: 'Matemática e suas Tecnologias',
      campo_matematico: 'Álgebra Linear e Matrizes',
      descricao: 'Calcular operações matriciais, determinantes e transformações lineares aplicadas à computação gráfica e redes.',
      etapa: 'Ensino Médio',
    },
    {
      codigo: 'EM13MAT403',
      area: 'Matemática e suas Tecnologias',
      campo_matematico: 'Análise Combinatória',
      descricao: 'Analisar e resolver problemas de contagem por princípios multiplicativo e aditivo, permutações e combinações simples.',
      etapa: 'Ensino Médio',
    },

    // Competência Específica 5
    {
      codigo: 'EM13MAT501',
      area: 'Matemática e suas Tecnologias',
      campo_matematico: 'Grafos e Algoritmos',
      descricao: 'Investigar relações entre grandezas com matrizes de adjacência, teoria dos grafos e algoritmos de otimização logística.',
      etapa: 'Ensino Médio',
    },
    {
      codigo: 'EM13MAT502',
      area: 'Matemática e suas Tecnologias',
      campo_matematico: 'Geometria Analítica e Espacial',
      descricao: 'Investigar posições relativas de pontos, retas e planos no espaço cartesiano tridimensional em CAD e modelagem 3D.',
      etapa: 'Ensino Médio',
    },
    {
      codigo: 'EM13MAT503',
      area: 'Matemática e suas Tecnologias',
      campo_matematico: 'Cálculo e Taxas de Variação',
      descricao: 'Utilizar noções elementares de taxas de variação instantânea e áreas sob curvas na análise de velocidade e vazão.',
      etapa: 'Ensino Médio',
    },
    {
      codigo: 'EM13MAT504',
      area: 'Matemática e suas Tecnologias',
      campo_matematico: 'Otimização e Pesquisa Operacional',
      descricao: 'Investigar processos de otimização linear para maximização de lucros e minimização de perdas de material industrial.',
      etapa: 'Ensino Médio',
    },
  ];

  console.log(`📦 Populando ${habilidades.length} Habilidades de Matemática da BNCC (Ensino Médio)...`);

  for (const hab of habilidades) {
    const existing = await knex('habilidades_bncc')
      .where({ codigo: hab.codigo })
      .first();

    if (existing) {
      await knex('habilidades_bncc')
        .where({ id: existing.id })
        .update({
          area: hab.area,
          campo_matematico: hab.campo_matematico,
          descricao: hab.descricao,
          etapa: hab.etapa,
          updated_at: knex.fn.now(),
        });
    } else {
      await knex('habilidades_bncc').insert(hab);
    }
  }

  console.log('✅ Habilidades da BNCC populadas com sucesso.');
}

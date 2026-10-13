/**
 * Seed 3: Eixos Tecnológicos e Cursos Técnicos do CNCT (Catálogo Nacional de Cursos Técnicos)
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Execução 100% Idempotente
 * @param {import('knex').Knex} knex
 */
export async function seed(knex) {
  const eixos = [
    {
      codigo: 'ambiente_saude',
      nome: 'Ambiente e Saúde',
      descricao: 'Processos de proteção e preservação dos seres vivos e recursos ambientais, higienização, biossegurança e assistência.',
      icone: 'activity',
    },
    {
      codigo: 'recursos_naturais',
      nome: 'Recursos Naturais',
      descricao: 'Produção animal e vegetal, pesca, aquicultura, exploração florestal e extrativismo mineral.',
      icone: 'sprout',
    },
    {
      codigo: 'informacao_comunicacao',
      nome: 'Informação e Comunicação',
      descricao: 'Desenvolvimento de software, infraestrutura de redes, telecomunicações e inteligência de dados.',
      icone: 'cpu',
    },
    {
      codigo: 'gestao_negocios',
      nome: 'Gestão e Negócios',
      descricao: 'Planejamento, avaliação e gestão de processos corporativos, finanças, comércio e marketing.',
      icone: 'briefcase',
    },
    {
      codigo: 'infraestrutura',
      nome: 'Infraestrutura',
      descricao: 'Construção civil, transporte, mobilidade urbana, obras de engenharia e topografia.',
      icone: 'building',
    },
    {
      codigo: 'controle_processos',
      nome: 'Controle e Processos Industriais',
      descricao: 'Automação, processos mecânicos, eletroeletrônica, manutenção e fabricação industrial.',
      icone: 'settings',
    },
  ];

  console.log(`📦 Populando ${eixos.length} Eixos Tecnológicos do CNCT...`);

  const eixoIdMap = {};

  for (const eixo of eixos) {
    const existing = await knex('eixos_cnct').where({ codigo: eixo.codigo }).first();
    if (existing) {
      await knex('eixos_cnct')
        .where({ id: existing.id })
        .update({
          nome: eixo.nome,
          descricao: eixo.descricao,
          icone: eixo.icone,
          updated_at: knex.fn.now(),
        });
      eixoIdMap[eixo.codigo] = existing.id;
    } else {
      const [inserted] = await knex('eixos_cnct').insert(eixo).returning('id');
      eixoIdMap[eixo.codigo] = inserted.id || inserted;
    }
  }

  // Cursos Técnicos vinculados aos eixos
  const cursos = [
    // Ambiente e Saúde
    {
      eixoCodigo: 'ambiente_saude',
      codigo: 'tec_enfermagem',
      nome: 'Técnico em Enfermagem',
      descricao: 'Cuidados assistenciais e administração medicamentosa.',
      perfil_profissional: 'Aplica conceitos matemáticos de funções afins e exponenciais no decaimento e diluição de fármacos intravenosos.',
      carga_horaria_minima: 1200,
    },
    {
      eixoCodigo: 'ambiente_saude',
      codigo: 'tec_analises_clinicas',
      nome: 'Técnico em Análises Clínicas',
      descricao: 'Procedimentos laboratoriais biomédicos e diagnósticos.',
      perfil_profissional: 'Utiliza estatística descritiva, curvas de calibração espectrofotométrica e diluição seriada.',
      carga_horaria_minima: 1200,
    },
    {
      eixoCodigo: 'ambiente_saude',
      codigo: 'tec_meio_ambiente',
      nome: 'Técnico em Meio Ambiente',
      descricao: 'Gestão ambiental e conservação de recursos hídricos e florestais.',
      perfil_profissional: 'Modela taxas de regeneração vegetal, cálculo de vazão de efluentes e dispersão de poluentes.',
      carga_horaria_minima: 1200,
    },

    // Recursos Naturais
    {
      eixoCodigo: 'recursos_naturais',
      codigo: 'tec_agropecuaria',
      nome: 'Técnico em Agropecuária',
      descricao: 'Planejamento e execução da produção agrossilvipastoril sustentável.',
      perfil_profissional: 'Calcula volume de silos (cilindro + cone), taxa de semeadura, curvas de nível e dosagem de insumos por hectare.',
      carga_horaria_minima: 1200,
    },
    {
      eixoCodigo: 'recursos_naturais',
      codigo: 'tec_agronegocio',
      nome: 'Técnico em Agronegócio',
      descricao: 'Gestão da cadeia de suprimentos agrícola e comercialização.',
      perfil_profissional: 'Aplica matemática financeira, análise de custos operacionais e margem de rentabilidade da safra.',
      carga_horaria_minima: 1200,
    },
    {
      eixoCodigo: 'recursos_naturais',
      codigo: 'tec_florestal',
      nome: 'Técnico em Florestas',
      descricao: 'Silvicultura, inventário florestal e manejo de recursos naturais.',
      perfil_profissional: 'Executa dendrometria (cálculo de altura e volume de árvores por trigonometria) e amostragem estatística.',
      carga_horaria_minima: 1200,
    },

    // Informação e Comunicação
    {
      eixoCodigo: 'informacao_comunicacao',
      codigo: 'tec_informatica',
      nome: 'Técnico em Informática',
      descricao: 'Desenvolvimento de sistemas computacionais, banco de dados e suporte.',
      perfil_profissional: 'Emprega matrizes em renderização gráfica, grafos em redes e álgebra booleana em arquitetura de hardware.',
      carga_horaria_minima: 1200,
    },
    {
      eixoCodigo: 'informacao_comunicacao',
      codigo: 'tec_desenvolvimento_sistemas',
      nome: 'Técnico em Desenvolvimento de Sistemas',
      descricao: 'Engenharia de software, codificação web/mobile e inteligência computacional.',
      perfil_profissional: 'Aplica matrizes, vetores, teoria dos conjuntos e análise combinatória em algoritmos e criptografia.',
      carga_horaria_minima: 1200,
    },
    {
      eixoCodigo: 'informacao_comunicacao',
      codigo: 'tec_redes',
      nome: 'Técnico em Redes de Computadores',
      descricao: 'Projeção, instalação e administração de redes locais e de longa distância.',
      perfil_profissional: 'Calcula divisão de sub-redes IPv4/IPv6 em base binária, latência, throughput e topologias de rede.',
      carga_horaria_minima: 1200,
    },

    // Gestão e Negócios
    {
      eixoCodigo: 'gestao_negocios',
      codigo: 'tec_administracao',
      nome: 'Técnico em Administração',
      descricao: 'Execução de rotinas administrativas, estratégias e controle de estoques.',
      perfil_profissional: 'Aplica matemática financeira, amortização (Price vs SAC), cálculo de ponto de equilíbrio e VPL/TIR.',
      carga_horaria_minima: 1200,
    },
    {
      eixoCodigo: 'gestao_negocios',
      codigo: 'tec_contabilidade',
      nome: 'Técnico em Contabilidade',
      descricao: 'Escrituração contábil, tributação e balanços patrimoniais.',
      perfil_profissional: 'Opera cálculos de depreciação linear e acelerada, índices de solvência e juros compostos.',
      carga_horaria_minima: 1200,
    },
    {
      eixoCodigo: 'gestao_negocios',
      codigo: 'tec_logistica',
      nome: 'Técnico em Logística',
      descricao: 'Gestão de suprimentos, armazenagem e roteirização de transportes.',
      perfil_profissional: 'Otimiza rotas por teoria dos grafos, dimensionamento volumétrico de cargas e lote econômico de compra.',
      carga_horaria_minima: 1200,
    },

    // Infraestrutura
    {
      eixoCodigo: 'infraestrutura',
      codigo: 'tec_edificacoes',
      nome: 'Técnico em Edificações',
      descricao: 'Desenho técnico, projetos de engenharia e acompanhamento de obras civis.',
      perfil_profissional: 'Aplica trigonometria em coberturas, inclinação percentual de rampas (NBR 9050) e estática de treliças.',
      carga_horaria_minima: 1200,
    },
    {
      eixoCodigo: 'infraestrutura',
      codigo: 'tec_estradas',
      nome: 'Técnico em Estradas',
      descricao: 'Construção, pavimentação e sinalização de rodovias e ferrovias.',
      perfil_profissional: 'Aplica geometria analítica e trigonometria em curvas horizontais e verticais, superelevação e terraplenagem.',
      carga_horaria_minima: 1200,
    },

    // Controle e Processos Industriais
    {
      eixoCodigo: 'controle_processos',
      codigo: 'tec_eletrotecnica',
      nome: 'Técnico em Eletrotécnica',
      descricao: 'Projeção, instalação e manutenção de sistemas elétricos e subestações.',
      perfil_profissional: 'Resolve circuitos de corrente alternada com números complexos (fasores), cálculo de impedância e fator de potência.',
      carga_horaria_minima: 1200,
    },
    {
      eixoCodigo: 'controle_processos',
      codigo: 'tec_mecanica',
      nome: 'Técnico em Mecânica',
      descricao: 'Desenvolvimento e manutenção de máquinas, equipamentos e termodinâmica.',
      perfil_profissional: 'Calcula relações de transmissão por engrenagens, momentos de força, resistência de materiais e dilatação térmica.',
      carga_horaria_minima: 1200,
    },
    {
      eixoCodigo: 'controle_processos',
      codigo: 'tec_mecatronica',
      nome: 'Técnico em Mecatrônica',
      descricao: 'Integração de mecânica de precisão, eletrônica e programação robótica.',
      perfil_profissional: 'Aplica cinemática direta/inversa com transformações matriciais em braços robóticos e equações diferenciais em malhas PID.',
      carga_horaria_minima: 1200,
    },
  ];

  console.log(`📦 Populando ${cursos.length} Cursos Técnicos do CNCT...`);

  for (const curso of cursos) {
    const eixoId = eixoIdMap[curso.eixoCodigo];
    if (!eixoId) continue;

    const existing = await knex('cursos_tecnicos_cnct')
      .where({ codigo: curso.codigo })
      .first();

    if (existing) {
      await knex('cursos_tecnicos_cnct')
        .where({ id: existing.id })
        .update({
          eixo_id: eixoId,
          nome: curso.nome,
          descricao: curso.descricao,
          perfil_profissional: curso.perfil_profissional,
          carga_horaria_minima: curso.carga_horaria_minima,
          updated_at: knex.fn.now(),
        });
    } else {
      await knex('cursos_tecnicos_cnct').insert({
        eixo_id: eixoId,
        codigo: curso.codigo,
        nome: curso.nome,
        descricao: curso.descricao,
        perfil_profissional: curso.perfil_profissional,
        carga_horaria_minima: curso.carga_horaria_minima,
      });
    }
  }

  console.log('✅ Eixos e Cursos Técnicos do CNCT populados com sucesso.');
}

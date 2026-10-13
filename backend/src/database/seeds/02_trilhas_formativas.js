/**
 * Seed 2: Trilhas de Formação Continuada em IA para Docentes da EPT
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Execução 100% Idempotente
 * @param {import('knex').Knex} knex
 */
export async function seed(knex) {
  const trilhas = [
    {
      codigo: 'trilha-fundamentos',
      titulo: 'Fundamentos da Inteligência Artificial',
      descricao: 'Conceitos essenciais de IA, Aprendizado de Máquina, Processamento de Linguagem Natural e Modelos de Linguagem Generativos (LLMs) contextualizados para o ensino de Matemática.',
      carga_horaria: 40,
      total_aulas: 6,
      icone: 'spark',
      ordem: 1,
      ativo: true,
    },
    {
      codigo: 'trilha-etica',
      titulo: 'Ética e Pensamento Crítico no Uso de IA',
      descricao: 'Vieses algorítmicos em problemas matemáticos, privacidade de dados docentes/discentes, autoria intelectual e os princípios éticos da UNESCO e do Plano Brasileiro de IA (PBIA).',
      carga_horaria: 40,
      total_aulas: 5,
      icone: 'scale',
      ordem: 2,
      ativo: true,
    },
    {
      codigo: 'trilha-didatica',
      titulo: 'Possibilidades Didáticas com Ferramentas Generativas',
      descricao: 'Estratégias de integração curricular e elaboração de sequências didáticas e avaliações formativas sem depender de prompts em branco, articulando a BNCC às práxis da EPT.',
      carga_horaria: 45,
      total_aulas: 7,
      icone: 'flask',
      ordem: 3,
      ativo: true,
    },
    {
      codigo: 'trilha-casos',
      titulo: 'Estudos de Caso e Práticas Docentes na EPT',
      descricao: 'Experiências reais da Rede Federal conectando tópicos matemáticos abstratos (Funções, Trigonometria, Estatística, Geometria) aos setores produtivos e cursos técnicos.',
      carga_horaria: 45,
      total_aulas: 6,
      icone: 'book',
      ordem: 4,
      ativo: true,
    },
  ];

  console.log(`📦 Populando ${trilhas.length} trilhas formativas oficiais...`);

  for (const item of trilhas) {
    const existing = await knex('trilhas_formativas')
      .where({ codigo: item.codigo })
      .first();

    if (existing) {
      await knex('trilhas_formativas')
        .where({ id: existing.id })
        .update({
          titulo: item.titulo,
          descricao: item.descricao,
          carga_horaria: item.carga_horaria,
          total_aulas: item.total_aulas,
          icone: item.icone,
          ordem: item.ordem,
          ativo: item.ativo,
          updated_at: knex.fn.now(),
        });
    } else {
      await knex('trilhas_formativas').insert(item);
    }
  }

  console.log('✅ Trilhas formativas populadas com sucesso.');
}

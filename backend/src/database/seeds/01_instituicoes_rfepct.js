/**
 * Seed 1: Catálogo Oficial da Rede Federal de Educação Profissional, Científica e Tecnológica (RFEPCT)
 * Abrange todas as 27 Unidades Federativas (UFs) do Brasil
 * 
 * Execução 100% Idempotente
 * @param {import('knex').Knex} knex
 */
export async function seed(knex) {
  const instituicoes = [
    // --- REGIÃO SUDESTE ---
    // Minas Gerais (MG)
    { sigla: 'IFNMG', nome: 'Instituto Federal do Norte de Minas Gerais', campus: 'Campus Januária', uf: 'MG', tipo: 'IF' },
    { sigla: 'IFNMG', nome: 'Instituto Federal do Norte de Minas Gerais', campus: 'Campus Montes Claros', uf: 'MG', tipo: 'IF' },
    { sigla: 'IFMG', nome: 'Instituto Federal de Minas Gerais', campus: 'Campus Ouro Preto', uf: 'MG', tipo: 'IF' },
    { sigla: 'IFSULDEMINAS', nome: 'Instituto Federal do Sul de Minas Gerais', campus: 'Campus Pouso Alegre', uf: 'MG', tipo: 'IF' },
    { sigla: 'IFTM', nome: 'Instituto Federal do Triângulo Mineiro', campus: 'Campus Uberaba', uf: 'MG', tipo: 'IF' },
    { sigla: 'IF Sudeste MG', nome: 'Instituto Federal do Sudeste de Minas Gerais', campus: 'Campus Juiz de Fora', uf: 'MG', tipo: 'IF' },
    { sigla: 'CEFET-MG', nome: 'Centro Federal de Educação Tecnológica de Minas Gerais', campus: 'Campus Belo Horizonte', uf: 'MG', tipo: 'CEFET' },
    { sigla: 'COLTEC/UFMG', nome: 'Colégio Técnico da Universidade Federal de Minas Gerais', campus: 'Campus Pampulha', uf: 'MG', tipo: 'COLEGIO_TECNICO' },

    // São Paulo (SP)
    { sigla: 'IFSP', nome: 'Instituto Federal de São Paulo', campus: 'Campus São Paulo (Capital)', uf: 'SP', tipo: 'IF' },
    { sigla: 'IFSP', nome: 'Instituto Federal de São Paulo', campus: 'Campus Campinas', uf: 'SP', tipo: 'IF' },
    { sigla: 'COTUCA', nome: 'Colégio Técnico de Campinas - UNICAMP', campus: 'Campus Campinas', uf: 'SP', tipo: 'COLEGIO_TECNICO' },
    { sigla: 'COTIL', nome: 'Colégio Técnico de Limeira - UNICAMP', campus: 'Campus Limeira', uf: 'SP', tipo: 'COLEGIO_TECNICO' },

    // Rio de Janeiro (RJ)
    { sigla: 'IFRJ', nome: 'Instituto Federal do Rio de Janeiro', campus: 'Campus Maracanã', uf: 'RJ', tipo: 'IF' },
    { sigla: 'IFF', nome: 'Instituto Federal Fluminense', campus: 'Campus Campos Centro', uf: 'RJ', tipo: 'IF' },
    { sigla: 'CEFET-RJ', nome: 'Centro Federal de Educação Tecnológica Celso Suckow da Fonseca', campus: 'Campus Maracanã', uf: 'RJ', tipo: 'CEFET' },
    { sigla: 'CPII', nome: 'Colégio Pedro II - Rede Federal RJ', campus: 'Campus São Cristóvão', uf: 'RJ', tipo: 'COLEGIO_TECNICO' },
    { sigla: 'CTUR/UFRRJ', nome: 'Colégio Técnico da Universidade Federal Rural do Rio de Janeiro', campus: 'Campus Seropédica', uf: 'RJ', tipo: 'COLEGIO_TECNICO' },

    // Espírito Santo (ES)
    { sigla: 'IFES', nome: 'Instituto Federal do Espírito Santo', campus: 'Campus Vitória', uf: 'ES', tipo: 'IF' },
    { sigla: 'IFES', nome: 'Instituto Federal do Espírito Santo', campus: 'Campus Vila Velha', uf: 'ES', tipo: 'IF' },

    // --- REGIÃO SUL ---
    // Paraná (PR)
    { sigla: 'IFPR', nome: 'Instituto Federal do Paraná', campus: 'Campus Curitiba', uf: 'PR', tipo: 'IF' },
    { sigla: 'IFPR', nome: 'Instituto Federal do Paraná', campus: 'Campus Londrina', uf: 'PR', tipo: 'IF' },

    // Santa Catarina (SC)
    { sigla: 'IFSC', nome: 'Instituto Federal de Santa Catarina', campus: 'Campus Florianópolis', uf: 'SC', tipo: 'IF' },
    { sigla: 'IFC', nome: 'Instituto Federal Catarinense', campus: 'Campus Camboriú', uf: 'SC', tipo: 'IF' },

    // Rio Grande do Sul (RS)
    { sigla: 'IFRS', nome: 'Instituto Federal do Rio Grande do Sul', campus: 'Campus Bento Gonçalves', uf: 'RS', tipo: 'IF' },
    { sigla: 'IFSUL', nome: 'Instituto Federal Sul-rio-grandense', campus: 'Campus Pelotas', uf: 'RS', tipo: 'IF' },
    { sigla: 'IFFarroupilha', nome: 'Instituto Federal Farroupilha', campus: 'Campus Santa Maria', uf: 'RS', tipo: 'IF' },

    // --- REGIÃO NORDESTE ---
    // Bahia (BA)
    { sigla: 'IFBA', nome: 'Instituto Federal da Bahia', campus: 'Campus Salvador', uf: 'BA', tipo: 'IF' },
    { sigla: 'IF Baiano', nome: 'Instituto Federal Baiano', campus: 'Campus Catu', uf: 'BA', tipo: 'IF' },

    // Ceará (CE)
    { sigla: 'IFCE', nome: 'Instituto Federal do Ceará', campus: 'Campus Fortaleza', uf: 'CE', tipo: 'IF' },

    // Pernambuco (PE)
    { sigla: 'IFPE', nome: 'Instituto Federal de Pernambuco', campus: 'Campus Recife', uf: 'PE', tipo: 'IF' },
    { sigla: 'IF Sertão-PE', nome: 'Instituto Federal do Sertão Pernambucano', campus: 'Campus Petrolina', uf: 'PE', tipo: 'IF' },

    // Paraíba (PB)
    { sigla: 'IFPB', nome: 'Instituto Federal da Paraíba', campus: 'Campus João Pessoa', uf: 'PB', tipo: 'IF' },

    // Rio Grande do Norte (RN)
    { sigla: 'IFRN', nome: 'Instituto Federal do Rio Grande do Norte', campus: 'Campus Natal Central', uf: 'RN', tipo: 'IF' },

    // Alagoas (AL)
    { sigla: 'IFAL', nome: 'Instituto Federal de Alagoas', campus: 'Campus Maceió', uf: 'AL', tipo: 'IF' },

    // Sergipe (SE)
    { sigla: 'IFS', nome: 'Instituto Federal de Sergipe', campus: 'Campus Aracaju', uf: 'SE', tipo: 'IF' },

    // Piauí (PI)
    { sigla: 'IFPI', nome: 'Instituto Federal do Piauí', campus: 'Campus Teresina Central', uf: 'PI', tipo: 'IF' },

    // Maranhão (MA)
    { sigla: 'IFMA', nome: 'Instituto Federal do Maranhão', campus: 'Campus São Luís Monte Castelo', uf: 'MA', tipo: 'IF' },

    // --- REGIÃO CENTRO-OESTE ---
    // Goiás (GO)
    { sigla: 'IFG', nome: 'Instituto Federal de Goiás', campus: 'Campus Goiânia', uf: 'GO', tipo: 'IF' },
    { sigla: 'IF Goiano', nome: 'Instituto Federal Goiano', campus: 'Campus Rio Verde', uf: 'GO', tipo: 'IF' },

    // Distrito Federal (DF)
    { sigla: 'IFB', nome: 'Instituto Federal de Brasília', campus: 'Campus Brasília', uf: 'DF', tipo: 'IF' },

    // Mato Grosso (MT)
    { sigla: 'IFMT', nome: 'Instituto Federal de Mato Grosso', campus: 'Campus Cuiabá', uf: 'MT', tipo: 'IF' },

    // Mato Grosso do Sul (MS)
    { sigla: 'IFMS', nome: 'Instituto Federal de Mato Grosso do Sul', campus: 'Campus Campo Grande', uf: 'MS', tipo: 'IF' },

    // --- REGIÃO NORTE ---
    // Pará (PA)
    { sigla: 'IFPA', nome: 'Instituto Federal do Pará', campus: 'Campus Belém', uf: 'PA', tipo: 'IF' },

    // Amazonas (AM)
    { sigla: 'IFAM', nome: 'Instituto Federal do Amazonas', campus: 'Campus Manaus Centro', uf: 'AM', tipo: 'IF' },

    // Rondônia (RO)
    { sigla: 'IFRO', nome: 'Instituto Federal de Rondônia', campus: 'Campus Porto Velho Calama', uf: 'RO', tipo: 'IF' },

    // Tocantins (TO)
    { sigla: 'IFTO', nome: 'Instituto Federal do Tocantins', campus: 'Campus Palmas', uf: 'TO', tipo: 'IF' },

    // Acre (AC)
    { sigla: 'IFAC', nome: 'Instituto Federal do Acre', campus: 'Campus Rio Branco', uf: 'AC', tipo: 'IF' },

    // Amapá (AP)
    { sigla: 'IFAP', nome: 'Instituto Federal do Amapá', campus: 'Campus Macapá', uf: 'AP', tipo: 'IF' },

    // Roraima (RR)
    { sigla: 'IFRR', nome: 'Instituto Federal de Roraima', campus: 'Campus Boa Vista', uf: 'RR', tipo: 'IF' },
  ];

  console.log(`📦 Populando ${instituicoes.length} instituições da RFEPCT nas 27 UFs...`);

  for (const item of instituicoes) {
    const existing = await knex('instituicoes_rfepct')
      .where({ sigla: item.sigla, campus: item.campus })
      .first();

    if (existing) {
      await knex('instituicoes_rfepct')
        .where({ id: existing.id })
        .update({
          nome: item.nome,
          uf: item.uf,
          tipo: item.tipo,
          ativo: true,
          updated_at: knex.fn.now(),
        });
    } else {
      await knex('instituicoes_rfepct').insert({
        sigla: item.sigla,
        nome: item.nome,
        campus: item.campus,
        uf: item.uf,
        tipo: item.tipo,
        ativo: true,
      });
    }
  }

  console.log('✅ Instituições da RFEPCT populadas com sucesso (100% das 27 UFs cobertas).');
}

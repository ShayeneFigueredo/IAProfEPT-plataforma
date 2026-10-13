/**
 * Dados Institucionais e Curriculares da Rede Federal (RFEPCT)
 * Projeto de Pesquisa de Doutorado - PPGEM / UFJF
 * Doutorando: Maycon Luiz Amaral Magalhães
 */

export const UFS_LISTA = [
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'RR', nome: 'Roraima' }
];

export const INSTITUICOES_ORIGEM_LISTA = [
  // Minas Gerais
  { categoria: 'Instituto Federal', sigla: 'IFNMG', nome: 'IFNMG - Instituto Federal do Norte de Minas Gerais', uf: 'MG' },
  { categoria: 'Instituto Federal', sigla: 'IFMG', nome: 'IFMG - Instituto Federal de Minas Gerais', uf: 'MG' },
  { categoria: 'Instituto Federal', sigla: 'IFSULDEMINAS', nome: 'IFSULDEMINAS - Instituto Federal do Sul de Minas', uf: 'MG' },
  { categoria: 'Instituto Federal', sigla: 'IFTM', nome: 'IFTM - Instituto Federal do Triângulo Mineiro', uf: 'MG' },
  { categoria: 'Instituto Federal', sigla: 'IF Sudeste MG', nome: 'IF Sudeste MG - Instituto Federal do Sudeste de Minas Gerais', uf: 'MG' },
  { categoria: 'CEFET', sigla: 'CEFET-MG', nome: 'CEFET-MG - Centro Fed. de Educação Tecnológica de Minas Gerais', uf: 'MG' },
  { categoria: 'Colégio Técnico', sigla: 'COLTEC/UFMG', nome: 'COLTEC / UFMG - Colégio Técnico da UFMG', uf: 'MG' },

  // São Paulo e Rio de Janeiro
  { categoria: 'Instituto Federal', sigla: 'IFSP', nome: 'IFSP - Instituto Federal de São Paulo', uf: 'SP' },
  { categoria: 'Colégio Técnico', sigla: 'COTUCA', nome: 'COTUCA / UNICAMP - Colégio Técnico de Campinas', uf: 'SP' },
  { categoria: 'Colégio Técnico', sigla: 'COTIL', nome: 'COTIL / UNICAMP - Colégio Técnico de Limeira', uf: 'SP' },
  { categoria: 'Instituto Federal', sigla: 'IFRJ', nome: 'IFRJ - Instituto Federal do Rio de Janeiro', uf: 'RJ' },
  { categoria: 'Instituto Federal', sigla: 'IFFluminense', nome: 'IFF - Instituto Federal Fluminense', uf: 'RJ' },
  { categoria: 'CEFET', sigla: 'CEFET-RJ', nome: 'CEFET-RJ - Centro Fed. de Educação Tecnológica Celso Suckow', uf: 'RJ' },
  { categoria: 'Colégio Técnico', sigla: 'CPII', nome: 'Colégio Pedro II (CPII - Rede Federal RJ)', uf: 'RJ' },
  { categoria: 'Colégio Técnico', sigla: 'CTUR/UFRRJ', nome: 'CTUR / UFRRJ - Colégio Técnico da Rural', uf: 'RJ' },

  // Região Sul
  { categoria: 'Instituto Federal', sigla: 'IFPR', nome: 'IFPR - Instituto Federal do Paraná', uf: 'PR' },
  { categoria: 'Instituto Federal', sigla: 'IFSC', nome: 'IFSC - Instituto Federal de Santa Catarina', uf: 'SC' },
  { categoria: 'Instituto Federal', sigla: 'IFC', nome: 'IFC - Instituto Federal Catarinense', uf: 'SC' },
  { categoria: 'Instituto Federal', sigla: 'IFRS', nome: 'IFRS - Instituto Federal do Rio Grande do Sul', uf: 'RS' },
  { categoria: 'Instituto Federal', sigla: 'IFFarroupilha', nome: 'IFFarroupilha - Instituto Federal Farroupilha', uf: 'RS' },
  { categoria: 'Instituto Federal', sigla: 'IFSul', nome: 'IFSul - Instituto Federal Sul-rio-grandense', uf: 'RS' },

  // Região Nordeste
  { categoria: 'Instituto Federal', sigla: 'IFBA', nome: 'IFBA - Instituto Federal da Bahia', uf: 'BA' },
  { categoria: 'Instituto Federal', sigla: 'IFBaiano', nome: 'IF Baiano - Instituto Federal Baiano', uf: 'BA' },
  { categoria: 'Instituto Federal', sigla: 'IFCE', nome: 'IFCE - Instituto Federal do Ceará', uf: 'CE' },
  { categoria: 'Instituto Federal', sigla: 'IFPE', nome: 'IFPE - Instituto Federal de Pernambuco', uf: 'PE' },
  { categoria: 'Instituto Federal', sigla: 'IFSertaoPE', nome: 'IFSertãoPE - Instituto Federal do Sertão Pernambucano', uf: 'PE' },
  { categoria: 'Colégio Técnico', sigla: 'CODAI/UFRPE', nome: 'CODAI / UFRPE - Colégio Agrícola Dom Agostinho Ikas', uf: 'PE' },
  { categoria: 'Instituto Federal', sigla: 'IFPB', nome: 'IFPB - Instituto Federal da Paraíba', uf: 'PB' },
  { categoria: 'Instituto Federal', sigla: 'IFRN', nome: 'IFRN - Instituto Federal do Rio Grande do Norte', uf: 'RN' },
  { categoria: 'Instituto Federal', sigla: 'IFAL', nome: 'IFAL - Instituto Federal de Alagoas', uf: 'AL' },
  { categoria: 'Instituto Federal', sigla: 'IFS', nome: 'IFS - Instituto Federal de Sergipe', uf: 'SE' },
  { categoria: 'Instituto Federal', sigla: 'IFPI', nome: 'IFPI - Instituto Federal do Piauí', uf: 'PI' },
  { categoria: 'Colégio Técnico', sigla: 'CTF/UFPI', nome: 'Colégios Técnicos Vinculados à UFPI (CTF/CTB)', uf: 'PI' },
  { categoria: 'Instituto Federal', sigla: 'IFMA', nome: 'IFMA - Instituto Federal do Maranhão', uf: 'MA' },
  { categoria: 'Colégio Técnico', sigla: 'COLUN/UFMA', nome: 'COLUN / UFMA - Colégio Universitário da UFMA', uf: 'MA' },

  // Região Centro-Oeste e Norte
  { categoria: 'Instituto Federal', sigla: 'IFB', nome: 'IFB - Instituto Federal de Brasília', uf: 'DF' },
  { categoria: 'Instituto Federal', sigla: 'IFG', nome: 'IFG - Instituto Federal de Goiás', uf: 'GO' },
  { categoria: 'Instituto Federal', sigla: 'IFGoiano', nome: 'IF Goiano - Instituto Federal Goiano', uf: 'GO' },
  { categoria: 'Instituto Federal', sigla: 'IFMT', nome: 'IFMT - Instituto Federal de Mato Grosso', uf: 'MT' },
  { categoria: 'Instituto Federal', sigla: 'IFMS', nome: 'IFMS - Instituto Federal de Mato Grosso do Sul', uf: 'MS' },
  { categoria: 'Instituto Federal', sigla: 'IFES', nome: 'IFES - Instituto Federal do Espírito Santo', uf: 'ES' },
  { categoria: 'Instituto Federal', sigla: 'IFPA', nome: 'IFPA - Instituto Federal do Pará', uf: 'PA' },
  { categoria: 'Instituto Federal', sigla: 'IFAM', nome: 'IFAM - Instituto Federal do Amazonas', uf: 'AM' },
  { categoria: 'Instituto Federal', sigla: 'IFTO', nome: 'IFTO - Instituto Federal do Tocantins', uf: 'TO' },
  { categoria: 'Instituto Federal', sigla: 'IFRO', nome: 'IFRO - Instituto Federal de Rondônia', uf: 'RO' },
  { categoria: 'Instituto Federal', sigla: 'IFAC', nome: 'IFAC - Instituto Federal do Acre', uf: 'AC' },
  { categoria: 'Instituto Federal', sigla: 'IFAP', nome: 'IFAP - Instituto Federal do Amapá', uf: 'AP' },
  { categoria: 'Instituto Federal', sigla: 'IFRR', nome: 'IFRR - Instituto Federal de Roraima', uf: 'RR' },
  { categoria: 'Outra', sigla: 'OUTRA', nome: 'Outra Instituição da Rede Federal (RFEPCT)', uf: 'BR' }
];

export const CURSOS_TECNICOS_EPT = [
  'Informática',
  'Agropecuária',
  'Eletrotécnica',
  'Mecânica',
  'Edificações',
  'Administração',
  'Automação Industrial',
  'Química',
  'Enfermagem',
  'Meio Ambiente',
  'Logística',
  'Alimentos',
  'Biotecnologia',
  'Segurança do Trabalho',
  'Telecomunicações',
  'Recursos Pesqueiros',
  'Mineração',
  'Contabilidade'
];

export const TERMO_ETICO_COMPLETO = {
  titulo: 'Termo de Consentimento Livre e Esclarecido (TCLE) & Governança Ética',
  programa: 'Programa de Pós-Graduação em Educação Matemática (PPGEM / UFJF)',
  pesquisador: 'Maycon Luiz Amaral Magalhães (Doutorando)',
  orientacao: 'Prof. Dr. Eduardo Barrére (Orientador) | Prof. Dr. Manuel Cabral (Coorientador)',
  conteudo: [
    'O presente software e ambiente formativo constituem o Produto Técnico-Tecnológico (PTT4) da tese de doutorado em Educação Matemática desenvolvida na Universidade Federal de Juiz de Fora (UFJF).',
    'A participação dos docentes da Rede Federal (RFEPCT) é de caráter voluntário, acadêmico e formativo. Todos os dados coletados (métricas de uso, sugestões e avaliações dos materiais gerados por IA) serão tratados de forma estritamente anônima e confidencial, conforme a Resolução CNS nº 510/2016.',
    'Princípio da Insubstituibilidade da Autoridade Docente: O participante declara estar ciente de que a Inteligência Artificial atua exclusivamente como ferramenta auxiliar de apoio pedagógico. Nenhuma saída gerada pela IA deve ser aplicada em sala de aula sem a prévia revisão, adaptação e validação crítica por parte do professor responsável.',
    'Os dados coletados comporão o relatório estatístico da tese e publicações científicas, visando contribuir para a formação continuada e políticas públicas para o ensino de Matemática na Educação Profissional e Tecnológica.'
  ]
};

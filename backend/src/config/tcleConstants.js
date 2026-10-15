/**
 * Constantes Oficiais do Termo de Consentimento Livre e Esclarecido (TCLE)
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Em conformidade com:
 * - Resolução CNS nº 510/2016 (Pesquisas em Ciências Humanas e Sociais)
 * - Comitê de Ética em Pesquisa da UFJF (CEP/UFJF)
 * - Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)
 */

export const TCLE_CONFIG = {
  versaoVigente: '1.0',
  dataAprovacao: '2026-09-22',
  titulo: 'Termo de Consentimento Livre e Esclarecido (TCLE) & Governança Ética',
  pesquisa: 'Plataforma IAprofEPT: Ambiente de Apoio à Docência em Matemática na EPT com IA Generativa',
  programa: 'Programa de Pós-Graduação em Educação Matemática (PPGEM / UFJF)',
  instituicao: 'Universidade Federal de Juiz de Fora (UFJF)',
  comiteEtica: {
    nome: 'Comitê de Ética em Pesquisa da Universidade Federal de Juiz de Fora (CEP/UFJF)',
    email: 'cep.propesq@ufjf.br',
    telefone: '(32) 2102-3788',
    endereco: 'Pró-Reitoria de Pós-Graduação e Pesquisa - Campus Universitário, Juiz de Fora - MG',
  },
  pesquisadores: {
    autor: 'Maycon Luiz Amaral Magalhães (Doutorando PPGEM / UFJF)',
    orientador: 'Prof. Dr. Eduardo Barrére (DCC / PPGEM / UFJF)',
    coorientador: 'Prof. Dr. Manuel José Cabral dos Santos Reis (UTAD / Portugal)',
    desenvolvimento: 'Shayene Figueredo & Samuel Amorim',
  },
  respaldoLegal: [
    'Resolução CNS nº 510/2016 (Normas aplicáveis a pesquisas em Ciências Humanas e Sociais)',
    'Resolução CNS nº 466/2012 (Diretrizes e normas regulamentadoras de pesquisas envolvendo seres humanos)',
    'Lei Geral de Proteção de Dados Pessoais (LGPD - Lei Federal nº 13.709/2018)',
    'Marco Regulatório da Inteligência Artificial e Recomendações da UNESCO sobre a Ética na IA (2021)',
  ],
  clausulas: [
    {
      numero: 1,
      titulo: 'Objeto da Pesquisa e Produto Técnico-Tecnológico (PTT4)',
      descricao: 'O software IAprofEPT e seus 5 Ambientes Virtuais constituem o Produto Educacional da tese de doutorado em Educação Matemática na UFJF, visando qualificar e apoiar o trabalho docente de Matemática na Rede Federal de Educação Profissional, Científica e Tecnológica (RFEPCT).',
    },
    {
      numero: 2,
      titulo: 'Voluntariedade e Liberdade de Consentimento',
      descricao: 'A participação do docente é estritamente voluntária, gratuita e sem qualquer forma de penalidade ou prejuízo funcional no caso de não aceitação ou desistência a qualquer momento.',
    },
    {
      numero: 3,
      titulo: 'Anonimização de Dados e Conformidade com a LGPD',
      descricao: 'Todos os registros de interação, avaliações pedagógicas por estrelas e telemetria de inferência do teste A/B (Groq vs Gemini) são pseudonimizados e criptografados. O endereço IP de conexão é compulsoriamente anonimizado na persistência do consentimento.',
    },
    {
      numero: 4,
      titulo: 'Princípio Inegociável da Autoridade Docente (ADR-002)',
      descricao: 'A Inteligência Artificial atua como instrumento auxiliar complementar. O participante declara ciência de que nenhuma atividade, plano de aula ou sequência didática deve ser aplicada em sala de aula sem a prévia revisão, adaptação e validação pela autoridade docente.',
    },
    {
      numero: 5,
      titulo: 'Destinação Exclusivamente Acadêmica dos Resultados',
      descricao: 'Os dados consolidados serão analisados em termos estatísticos agregados na tese de doutorado de Maycon Luiz Amaral Magalhães e em publicações científicas revisadas por pares, visando o aprimoramento contínuo das políticas educacionais da EPT.',
    },
  ],
};

export default TCLE_CONFIG;

import crypto from 'crypto';
import {
  resolverContextoCurricular,
  ALERTA_ETICO_PADRAO,
  DIRETRIZES_EDUCACAO_MATEMATICA_CRITICA,
  EIXOS_CNCT,
  CURSOS_TECNICOS_DETALHADOS,
  HABILIDADES_BNCC_DETALHADAS,
  METODOLOGIAS_PEDAGOGICAS,
  NIVEIS_DIFICULDADE,
} from '../config/curricularMatrix.js';
import { validarParametrosLaboratorio } from '../validators/promptValidator.js';

/**
 * Schema JSON Estrito da Saída Esperada da LLM
 * Compatível com draft-07 e geradores de validação de esquemas JSON.
 */
export const SCHEMA_SAIDA_JSON_ESTRITO = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'AtividadePedagogicaIAprofEPT',
  description:
    'Estrutura JSON estrita de atividade gerada por IA com ancoragem curricular na BNCC, Educação Matemática Crítica e EPT.',
  type: 'object',
  required: [
    'tituloAtividade',
    'tipoAtividade',
    'areaMatematica',
    'nivelDificuldade',
    'cursoTecnico',
    'eixoCNCT',
    'habilidadesBNCC',
    'cenarioMundoDoTrabalho',
    'metodologiaAplicada',
    'itens',
    'alertaEticoObrigatorio',
  ],
  properties: {
    tituloAtividade: {
      type: 'string',
      description: 'Título contextualizado e pedagogicamente atraente da atividade.',
    },
    tipoAtividade: {
      type: 'string',
      description: 'Tipo de atividade (exercicios, interdisciplinar, podcast, plano).',
    },
    areaMatematica: {
      type: 'string',
      description: 'Área da Matemática trabalhada.',
    },
    nivelDificuldade: {
      type: 'string',
      description: 'Nível de dificuldade curricular (Inicial, Intermediário ou Avançado).',
    },
    cursoTecnico: {
      type: 'string',
      description: 'Nome oficial do Curso Técnico da EPT.',
    },
    eixoCNCT: {
      type: 'string',
      description: 'Eixo Tecnológico do Catálogo Nacional de Cursos Técnicos (CNCT).',
    },
    habilidadesBNCC: {
      type: 'array',
      description: 'Lista de habilidades da BNCC do Ensino Médio mobilizadas.',
      items: {
        type: 'object',
        required: ['codigo', 'descricao'],
        properties: {
          codigo: { type: 'string', example: 'EM13MAT401' },
          descricao: { type: 'string' },
          articulacaoComEPT: { type: 'string' },
        },
      },
    },
    cenarioMundoDoTrabalho: {
      type: 'object',
      required: ['tituloCenario', 'descricaoSituacao', 'grandezasEnvolvidas'],
      properties: {
        tituloCenario: { type: 'string' },
        descricaoSituacao: { type: 'string' },
        grandezasEnvolvidas: {
          type: 'array',
          items: { type: 'string' },
        },
        normaOuReferenciaTecnica: { type: 'string' },
      },
    },
    metodologiaAplicada: {
      type: 'object',
      required: ['nome', 'orientacaoDidatica'],
      properties: {
        nome: { type: 'string' },
        orientacaoDidatica: { type: 'string' },
      },
    },
    itens: {
      type: 'array',
      description: 'Conjunto de questões ou itens progressivos da atividade.',
      minItems: 1,
      items: {
        type: 'object',
        required: [
          'numero',
          'enunciadoContextualizado',
          'perguntas',
          'gabaritoComentadoPassoAPasso',
          'reflexaoCriticaEMC',
        ],
        properties: {
          numero: { type: 'integer' },
          tituloItem: { type: 'string' },
          enunciadoContextualizado: {
            type: 'string',
            description: 'Enunciado imersivo no mundo do trabalho com dados técnicos verossímeis.',
          },
          dadosTecnicosFornecidos: {
            type: 'object',
            description: 'Valores, parâmetros e grandezas fornecidas no problema.',
          },
          perguntas: {
            type: 'array',
            items: {
              type: 'object',
              required: ['letra', 'comando'],
              properties: {
                letra: { type: 'string', example: 'a' },
                comando: { type: 'string' },
              },
            },
          },
          gabaritoComentadoPassoAPasso: {
            type: 'array',
            items: {
              type: 'object',
              required: ['item', 'etapasResolucao', 'respostaFinal'],
              properties: {
                item: { type: 'string', example: 'a' },
                etapasResolucao: {
                  type: 'array',
                  items: { type: 'string' },
                },
                respostaFinal: { type: 'string' },
                interpretacaoFisicaOuEconomica: { type: 'string' },
              },
            },
          },
          reflexaoCriticaEMC: {
            type: 'object',
            required: ['dimensaoReflexiva', 'provocacaoDocente'],
            properties: {
              dimensaoReflexiva: {
                type: 'string',
                description:
                  'Dimensão ética, social, ambiental, humana ou trabalhista (Educação Matemática Crítica - Skovsmose).',
              },
              provocacaoDocente: {
                type: 'string',
                description:
                  'Questão reflexiva para debate em sala sobre as consequências e limites do modelo matemático.',
              },
            },
          },
        },
      },
    },
    alertaEticoObrigatorio: {
      type: 'string',
      description: 'Banner obrigatório de validação pedagógica docente.',
    },
  },
};

/**
 * Serviço de Injeção de Prompts Ocultos e Parametrização Curricular
 * Plataforma IAprofEPT — PPGEM / UFJF
 */
export class PromptInjectionService {
  /**
   * Constrói a instrução de sistema (System Instruction) detalhada,
   * especializada para a modalidade selecionada (exercicios, interdisciplinar, podcast, plano).
   * Garante que nenhum prompt aberto seja manipulado pelo docente (ADR-001).
   */
  construirSystemInstruction(contexto, quantidade) {
    const {
      curso,
      eixoCNCT,
      areaMatematica,
      habilidadesBNCC,
      cenarioTrabalho,
      metodologia,
      nivel,
      ferramenta,
      educacaoMatematicaCritica,
      alertaEticoObrigatorio,
    } = contexto;

    const habilidadesFormatadas = habilidadesBNCC
      .map(
        (h) =>
          `- [${h.codigo}]: ${h.descricao}\n  (Articulação com EPT: ${h.contextoEPT || 'Contextualização no perfil profissional do curso'})`
      )
      .join('\n');

    const pilaresEMC = educacaoMatematicaCritica.pilares
      .map((p) => `- **${p.pilar}**: ${p.descricao}`)
      .join('\n');

    const diretrizesEMC = educacaoMatematicaCritica.diretrizesGerais
      .map((d) => `  * ${d}`)
      .join('\n');

    const basePromptCabecalho = `[SYSTEM INSTRUCTION — PLATAFORMA IAPROFEPT | PPGEM-UFJF]
# PAPEL E IDENTIDADE PEDAGÓGICA
Você é um Docente e Pesquisador Especialista em Educação Matemática na Educação Profissional e Tecnológica (EPT), com sólida fundamentação nas teorias da Educação Matemática Crítica (Ole Skovsmose) e na concepção de Ensino Médio Integrado (Maranhão Ramos).
Sua missão é gerar atividades pedagógicas altamente contextualizadas, matematicamente rigorosas e pedagogicamente emancipatórias, articulando as competências da Base Nacional Comum Curricular (BNCC) às demandas autênticas do Catálogo Nacional de Cursos Técnicos (CNCT).

---
# 1. DIRETRIZES DA EDUCAÇÃO MATEMÁTICA CRÍTICA (OLE SKOVSMOSE, 2022)
Você DEVE obrigatoriamente incorporar os seguintes fundamentos em toda a atividade produzida:
${pilaresEMC}

Regras pedagógicas inegociáveis:
${diretrizesEMC}

---
# 2. ANCORAGEM CURRICULAR BNCC (ENSINO MÉDIO / EPT)
Área da Matemática Selecionada: ${areaMatematica}
Nível de Complexidade: ${nivel.rotulo} (${nivel.caracteristicas})
Habilidades Obrigatórias a serem mobilizadas e explicitadas na resposta:
${habilidadesFormatadas}

---
# 3. CONTEXTO AUTÊNTICO DO MUNDO DO TRABALHO (CNCT 4ª EDIÇÃO)
Eixo Tecnológico CNCT: ${eixoCNCT}
Curso Técnico de Destino: ${curso.nome}
Perfil Profissional: ${curso.perfilProfissional}

Cenário Autêntico a ser Modelado:
- Título do Cenário: ${cenarioTrabalho.titulo}
- Descrição da Situação Real: ${cenarioTrabalho.descricao}
- Grandezas e Variáveis Envolvidas: ${cenarioTrabalho.grandezas.join(', ')}
- Norma Técnica / Referência Profissional: ${cenarioTrabalho.normaOuReferencia || 'Normas Técnicas da Área'}

---
# 4. METODOLOGIA PEDAGÓGICA SELECIONADA
Metodologia: ${metodologia.nome} (${metodologia.sigla})
Foco Didático: ${metodologia.foco}
Diretriz de Condução: ${metodologia.orientacaoInstrucional}

---
# 5. REGRAS DE RIGOR TÉCNICO, NOTAÇÃO E FORMATO
1. Todas as fórmulas e expressões matemáticas devem ser grafadas com clareza em notação padronizada (utilize LaTeX com delimitadores $...$ para termos inline e $$...$$ para equações em destaque).
2. Forneça dados numéricos realistas e plausíveis para o cotidiano profissional de ${curso.nome}.
3. Inserir obrigatoriamente o seguinte Alerta Ético Institucional no campo "alertaEticoObrigatorio":
   "${alertaEticoObrigatorio}"
4. A resposta DEVE ser EXCLUSIVAMENTE um único objeto JSON válido, sem texto introdutório e sem saudações.`;

    // -------------------------------------------------------------------------
    // MODALIDADE 1: EXERCÍCIOS E AVALIAÇÕES
    // -------------------------------------------------------------------------
    if (ferramenta === 'exercicios') {
      return `${basePromptCabecalho}

---
# 6. ESPECIFICAÇÃO DA MODALIDADE: EXERCÍCIOS E AVALIAÇÕES
A atividade deve conter exatamente ${quantidade} item(ns)/questão(ões) progressivos.
Cada item deve conter:
a) Enunciado imersivo no contexto profissional autêntico;
b) Perguntas progressivas (item 'a', 'b', 'c');
c) Gabarito detalhado comentado passo a passo com etapas de resolução e resposta final;
d) Reflexão Crítica de Educação Matemática Crítica (EMC) sobre implicações éticas, sociais ou de segurança do trabalho.

Estrutura JSON obrigatória:
{
  "tituloAtividade": "string",
  "tipoAtividade": "exercicios",
  "areaMatematica": "${areaMatematica}",
  "nivelDificuldade": "${nivel.rotulo}",
  "cursoTecnico": "${curso.nome}",
  "eixoCNCT": "${eixoCNCT}",
  "habilidadesBNCC": [
    { "codigo": "string", "descricao": "string", "articulacaoComEPT": "string" }
  ],
  "cenarioMundoDoTrabalho": {
    "tituloCenario": "string",
    "descricaoSituacao": "string",
    "grandezasEnvolvidas": ["string"],
    "normaOuReferenciaTecnica": "string"
  },
  "metodologiaAplicada": {
    "nome": "${metodologia.nome}",
    "orientacaoDidatica": "string"
  },
  "itens": [
    {
      "numero": 1,
      "tituloItem": "string",
      "enunciadoContextualizado": "string",
      "dadosTecnicosFornecidos": {},
      "perguntas": [
        { "letra": "a", "comando": "string" }
      ],
      "gabaritoComentadoPassoAPasso": [
        {
          "item": "a",
          "etapasResolucao": ["string"],
          "respostaFinal": "string",
          "interpretacaoFisicaOuEconomica": "string"
        }
      ],
      "reflexaoCriticaEMC": {
        "dimensaoReflexiva": "string",
        "provocacaoDocente": "string"
      }
    }
  ],
  "alertaEticoObrigatorio": "${alertaEticoObrigatorio}"
}`;
    }

    // -------------------------------------------------------------------------
    // MODALIDADE 2: ATIVIDADES INTERDISCIPLINARES EPT
    // -------------------------------------------------------------------------
    if (ferramenta === 'interdisciplinar') {
      return `${basePromptCabecalho}

---
# 6. ESPECIFICAÇÃO DA MODALIDADE: ATIVIDADES INTERDISCIPLINARES EPT
A atividade deve articular a Matemática com os componentes curriculares técnicos do curso ${curso.nome}.
Deve propor uma situação-problema autêntica com ${quantidade} etapa(s) de investigação integrada, contendo gabarito e resolução comentada passo a passo para cada etapa.

Estrutura JSON obrigatória:
{
  "tituloAtividade": "string",
  "tipoAtividade": "interdisciplinar",
  "areaMatematica": "${areaMatematica}",
  "cursoTecnico": "${curso.nome}",
  "eixoCNCT": "${eixoCNCT}",
  "nivelDificuldade": "${nivel.rotulo}",
  "habilidadesBNCC": [
    { "codigo": "string", "descricao": "string", "articulacaoEPT": "string" }
  ],
  "temaInterdisciplinar": "string",
  "articulacaoCurricular": {
    "conceitoMatematico": "string",
    "aplicacaoMundoTrabalho": "string",
    "componentesTecnicosIntegrados": ["string"]
  },
  "situacaoProblemaAutentica": {
    "cenario": "string",
    "dadosTecnicos": {},
    "desafioProfissional": "string"
  },
  "etapasInvestigacao": [
    {
      "etapa": 1,
      "titulo": "string",
      "comando": "string",
      "etapasResolucao": ["string"],
      "gabaritoFinal": "string",
      "interpretacaoTecnica": "string"
    }
  ],
  "reflexaoCriticaEMC": {
    "dimensaoEticaOuSocial": "string",
    "provocacaoDocente": "string"
  },
  "alertaEticoObrigatorio": "${alertaEticoObrigatorio}"
}`;
    }

    // -------------------------------------------------------------------------
    // MODALIDADE 3: ROTEIROS PARA PODCASTS EDUCACIONAIS
    // -------------------------------------------------------------------------
    if (ferramenta === 'podcast') {
      return `${basePromptCabecalho}

---
# 6. ESPECIFICAÇÃO DA MODALIDADE: ROTEIRO PARA PODCAST EDUCACIONAL
O roteiro deve simular um episódio de áudio educativo dinâmico (5 a 10 min) intitulado com clareza, em diálogo entre um mentor técnico experiente e uma estudante estagiária curiosa do curso ${curso.nome}.
Deve incluir:
a) Vinhetas e indicações de efeitos sonoros (SFX);
b) Diálogos explicando a aplicação prática do conceito matemático ${areaMatematica};
c) Um Desafio Matemático apresentado aos ouvintes, com GABARITO COMPLETO comentado passo a passo para o docente utilizar na aula;
d) Reflexão crítica de Educação Matemática Crítica sobre os impactos tecnológicos e sociais.

Estrutura JSON obrigatória:
{
  "tituloAtividade": "string",
  "tituloEpisodio": "string",
  "tipoAtividade": "podcast",
  "areaMatematica": "${areaMatematica}",
  "cursoTecnico": "${curso.nome}",
  "eixoCNCT": "${eixoCNCT}",
  "duracaoEstimadaMinutos": 6,
  "habilidadesBNCC": [
    { "codigo": "string", "descricao": "string", "articulacaoEPT": "string" }
  ],
  "sinopseEpisodio": "string",
  "personagens": [
    { "nome": "string", "papel": "string" }
  ],
  "blocosRoteiro": [
    {
      "bloco": 1,
      "titulo": "string",
      "indicacaoAudioOuSFX": "string",
      "dialogos": [
        { "locutor": "string", "fala": "string", "entonacao": "string" }
      ]
    }
  ],
  "desafioOuvinteComGabarito": {
    "enunciadoDesafio": "string",
    "etapasResolucao": ["string"],
    "respostaFinalGabarito": "string",
    "explicacaoPedagogica": "string"
  },
  "reflexaoCriticaEMC": {
    "impactoSocioEconomico": "string",
    "provocacaoFinal": "string"
  },
  "alertaEticoObrigatorio": "${alertaEticoObrigatorio}"
}`;
    }

    // -------------------------------------------------------------------------
    // MODALIDADE 4: PLANOS DE AULA AUTOMÁTICOS
    // -------------------------------------------------------------------------
    return `${basePromptCabecalho}

---
# 6. ESPECIFICAÇÃO DA MODALIDADE: PLANO DE AULA AUTOMÁTICO
O plano deve estruturar uma proposta completa de aula baseada na metodologia ativa "${metodologia.nome}" para o curso ${curso.nome}.
Deve detalhar momentos pedagógicos, recursos tecnológicos, objetivos articulados à BNCC e instrumento de avaliação formativa contendo critérios de sucesso e gabarito orientador/devolutivo com etapas de resolução.

Estrutura JSON obrigatória:
{
  "tituloAtividade": "string",
  "tituloPlano": "string",
  "tipoAtividade": "plano",
  "areaMatematica": "${areaMatematica}",
  "cursoTecnico": "${curso.nome}",
  "eixoCNCT": "${eixoCNCT}",
  "metodologiaAtiva": "${metodologia.nome}",
  "duracaoTotalMinutos": 100,
  "objetivosAprendizagem": [
    { "objetivo": "string", "habilidadeBNCC": "string" }
  ],
  "habilidadesBNCC": [
    { "codigo": "string", "descricao": "string", "articulacaoEPT": "string" }
  ],
  "recursosDidaticosETecnologicos": ["string"],
  "momentosDaAula": [
    {
      "momento": "string",
      "tempoMinutos": 20,
      "descricaoAtividade": "string",
      "papelDoDocente": "string",
      "papelDoEstudante": "string"
    }
  ],
  "avaliacaoFormativa": {
    "criteriosSucesso": "string",
    "instrumento": "string",
    "gabaritoOrientador": {
      "problemaProposto": "string",
      "etapasResolucao": ["string"],
      "respostaFinal": "string",
      "feedbackDevolutivo": "string"
    }
  },
  "reflexaoCriticaEMC": {
    "problematizacaoSocial": "string",
    "conexaoComCidadania": "string"
  },
  "alertaEticoObrigatorio": "${alertaEticoObrigatorio}"
}`;
  }

  /**
   * Constrói o User Prompt objetivo sintetizando os seletores,
   * sem manipulação de texto em branco pelo professor.
   */
  construirUserPrompt(contexto, quantidade) {
    const { curso, areaMatematica, nivel, metodologia, ferramenta } = contexto;

    if (ferramenta === 'interdisciplinar') {
      return `Por favor, elabore a atividade interdisciplinar articulando Matemática e EPT contendo exatamente ${quantidade} etapa(s) de investigação para a Área de ${areaMatematica}, direcionada ao curso ${curso.nome}.
Aplique rigorosamente a metodologia "${metodologia.nome}" e retorne única e exclusivamente o objeto JSON estrito com as etapas de investigação, gabaritos detalhados passo a passo e as reflexões da Educação Matemática Crítica.`;
    }

    if (ferramenta === 'podcast') {
      return `Por favor, elabore o roteiro de podcast educativo em formato de diálogo informal e didático entre mentor e estudante sobre ${areaMatematica} aplicada ao curso ${curso.nome}.
Inclua indicações de SFX, explicação matemática acessível e um desafio aos ouvintes com gabarito passo a passo fundamentado. Retorne única e exclusivamente o objeto JSON estrito.`;
    }

    if (ferramenta === 'plano') {
      return `Por favor, elabore o plano de aula estruturado com a metodologia ativa "${metodologia.nome}" para ensinar ${areaMatematica} aos estudantes do curso ${curso.nome}.
Detalhe os momentos da aula, os objetivos alinhados à BNCC e a avaliação formativa com gabarito orientador passo a passo. Retorne única e exclusivamente o objeto JSON estrito.`;
    }

    // Default: exercícios
    return `Por favor, elabore a lista de exercícios e avaliações contendo exatamente ${quantidade} item(ns)/questão(ões) progressivos para a Área de ${areaMatematica}, com nível de complexidade ${nivel.rotulo}, direcionada aos estudantes do ${curso.nome}.
Aplique rigorosamente a metodologia "${metodologia.nome}", fundamentando-se no cenário autêntico do mundo do trabalho e nas habilidades BNCC especificadas na System Instruction.
Lembre-se de retornar única e exclusivamente o objeto JSON estrito com os gabaritos passo a passo e as reflexões da Educação Matemática Crítica.`;
  }

  /**
   * Constrói o payload pronto para consumo na API do Groq (LLaMA 3.3 70B Versatile)
   */
  construirPayloadGroq(systemInstruction, userPrompt) {
    return {
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 4096,
      top_p: 0.95,
      response_format: {
        type: 'json_object',
      },
      messages: [
        {
          role: 'system',
          content: systemInstruction,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    };
  }

  /**
   * Constrói o payload pronto para consumo na API do Google Gemini (Gemini 1.5 Flash)
   */
  construirPayloadGemini(systemInstruction, userPrompt) {
    return {
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.4,
        topP: 0.95,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
      systemInstruction: {
        parts: [
          {
            text: systemInstruction,
          },
        ],
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: userPrompt,
            },
          ],
        },
      ],
    };
  }

  /**
   * Estima quantidade aproximada de tokens para fins de telemetria
   */
  estimarTokens(texto) {
    if (!texto) return 0;
    // Aproximação heurística padrão: ~4 caracteres por token em línguas neolatinas
    return Math.ceil(texto.length / 4);
  }

  /**
   * Método Principal: Monta o prompt curricular completo e estruturado em JSON estrito.
   * Atende ao Critério de Aceite: prompt montado em estrutura JSON estrita pronta para envio às LLMs.
   * 
   * @param {Object} parametrosEntrada - Parâmetros dos seletores enviados pelo docente
   * @returns {Object} Estrutura JSON estrita pronta para envio às LLMs
   */
  montarPrompt(parametrosEntrada) {
    // 1. Validação estrita contra campos de texto cru e verificação Zod (ADR-001)
    const paramsValidados = validarParametrosLaboratorio(parametrosEntrada);

    // 2. Resolução da Matriz Curricular (BNCC x EPT x CNCT x Skovsmose)
    const contextoCurricular = resolverContextoCurricular({
      areaMatematica: paramsValidados.areaMatematica,
      cursoTecnico: paramsValidados.cursoTecnico,
      nivel: paramsValidados.nivel,
      metodologia: paramsValidados.metodologia,
      ferramenta: paramsValidados.ferramenta,
    });

    const quantidade = paramsValidados.quantidade;

    // 3. Montagem da System Instruction e User Prompt
    const systemInstruction = this.construirSystemInstruction(contextoCurricular, quantidade);
    const userPrompt = this.construirUserPrompt(contextoCurricular, quantidade);

    // 4. Montagem dos Payloads específicos para os motores Groq e Gemini
    const groqPayload = this.construirPayloadGroq(systemInstruction, userPrompt);
    const geminiPayload = this.construirPayloadGemini(systemInstruction, userPrompt);

    // 5. Geração de Metadados e Telemetria para a Tese
    const promptId = crypto.randomUUID();
    const hashParametros = crypto
      .createHash('sha256')
      .update(JSON.stringify(paramsValidados))
      .digest('hex');

    const estimativaTokensSystem = this.estimarTokens(systemInstruction);
    const estimativaTokensUser = this.estimarTokens(userPrompt);

    // 6. Retorno da Estrutura JSON Estrita (Critério de Aceite)
    return {
      sucesso: true,
      promptId,
      criadoEm: new Date().toISOString(),
      parametrosEntrada: paramsValidados,
      curriculoInjetado: {
        eixoCNCT: contextoCurricular.eixoCNCT,
        cursoTecnico: contextoCurricular.curso.nome,
        perfilProfissional: contextoCurricular.curso.perfilProfissional,
        areaMatematica: contextoCurricular.areaMatematica,
        nivelDificuldade: contextoCurricular.nivel.rotulo,
        habilidadesBNCC: contextoCurricular.habilidadesBNCC,
        cenarioMundoDoTrabalho: contextoCurricular.cenarioTrabalho,
        metodologia: contextoCurricular.metodologia,
        diretrizesEducacaoMatematicaCritica: contextoCurricular.educacaoMatematicaCritica.pilares,
        alertaEticoObrigatorio: contextoCurricular.alertaEticoObrigatorio,
      },
      systemInstruction,
      userPrompt,
      schemaSaidaEsperada: SCHEMA_SAIDA_JSON_ESTRITO,
      groqPayload,
      geminiPayload,
      telemetriaMeta: {
        versaoMotor: '1.0.0',
        hashParametros,
        estimativaTokensPromptTotal: estimativaTokensSystem + estimativaTokensUser,
        estimativaTokensSystem,
        estimativaTokensUser,
        provedorSolicitado: paramsValidados.provedor,
        conformidadeEtica: true,
        proibicaoPromptEmBrancoAtendida: true,
      },
    };
  }

  /**
   * Retorna os metadados dos parâmetros curriculares disponíveis
   * para alimentar dinamicamente os seletores do frontend e a documentação.
   */
  obterParametrosCurricularesDisponiveis() {
    return {
      areasMatematica: Object.keys(HABILIDADES_BNCC_DETALHADAS),
      eixosCNCT: Object.keys(EIXOS_CNCT).map((k) => ({
        id: k,
        nome: EIXOS_CNCT[k].nome,
        descricao: EIXOS_CNCT[k].descricao,
      })),
      cursosTecnicos: Object.keys(CURSOS_TECNICOS_DETALHADOS).map((k) => ({
        id: k,
        nome: CURSOS_TECNICOS_DETALHADOS[k].nome,
        eixoCNCT: CURSOS_TECNICOS_DETALHADOS[k].eixoCNCT,
        perfilProfissional: CURSOS_TECNICOS_DETALHADOS[k].perfilProfissional,
      })),
      niveis: Object.keys(NIVEIS_DIFICULDADE).map((k) => ({
        id: k,
        rotulo: NIVEIS_DIFICULDADE[k].rotulo,
        complexidade: NIVEIS_DIFICULDADE[k].complexidade,
        anoSugerido: NIVEIS_DIFICULDADE[k].anoSugerido,
      })),
      metodologias: Object.keys(METODOLOGIAS_PEDAGOGICAS).map((k) => ({
        id: k,
        nome: METODOLOGIAS_PEDAGOGICAS[k].nome,
        sigla: METODOLOGIAS_PEDAGOGICAS[k].sigla,
        foco: METODOLOGIAS_PEDAGOGICAS[k].foco,
      })),
      quantidadesSugeridas: [
        { rotulo: '1 Questão Aprofundada', valor: 1 },
        { rotulo: '3 Questões Progressivas', valor: 3 },
        { rotulo: '5 Questões com Gabarito', valor: 5 },
        { rotulo: '10 Questões para Lista', valor: 10 },
      ],
      ferramentas: [
        { id: 'exercicios', nome: 'Exercícios & Avaliações' },
        { id: 'interdisciplinar', nome: 'Atividades Interdisciplinares' },
        { id: 'podcast', nome: 'Roteiros de Podcast Educativo' },
        { id: 'plano', nome: 'Planejamento de Aulas Ativas' },
      ],
      alertaEticoPadrao: ALERTA_ETICO_PADRAO,
      referenciasTeoricas: {
        educacaoMatematicaCritica: DIRETRIZES_EDUCACAO_MATEMATICA_CRITICA.autor,
        bncc: 'MEC (2018) - Ensino Médio',
        cnct: 'SETEC/MEC (2023) - 4ª Edição',
      },
    };
  }
}

export const promptInjectionService = new PromptInjectionService();
export default promptInjectionService;

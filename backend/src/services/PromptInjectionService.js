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
   * garantindo que nenhum prompt aberto seja manipulado pelo docente.
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

    return `[SYSTEM INSTRUCTION — PLATAFORMA IAPROFEPT | PPGEM-UFJF]
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
1. Todas as fórmulas e expressões matemáticas devem ser grafadas com clareza em notação padronizada (pode utilizar LaTeX entre delimitadores $...$ quando aplicável).
2. Forneça dados numéricos realistas e plausíveis para o cotidiano profissional de ${curso.nome}.
3. A atividade deve conter exatamente ${quantidade} item(ns)/questão(ões) progressivos.
4. Cada item deve conter:
   a) Enunciado imersivo no contexto do trabalho;
   b) Perguntas progressivas (item 'a', 'b', 'c');
   c) Gabarito detalhado comentado passo a passo, incluindo interpretação física/econômica do resultado;
   d) Reflexão Crítica de Educação Matemática Crítica (EMC) sobre implicações sociais, éticas, ambientais ou de segurança do trabalho relacionadas ao cálculo efetuado.
5. Inserir obrigatoriamente o seguinte Alerta Ético Institucional no campo "alertaEticoObrigatorio":
   "${alertaEticoObrigatorio}"

---
# 6. CRITÉRIO DE ACEITE ESTRETO — SAÍDA EXCLUSIVAMENTE EM JSON
Você DEVE retornar sua resposta EXCLUSIVAMENTE como um único objeto JSON válido, sem texto introdutório, sem saudações e sem blocos de markdown adicionais fora do JSON.
O JSON deve obedecer rigorosamente à estrutura de chaves:
{
  "tituloAtividade": "string",
  "tipoAtividade": "${ferramenta}",
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

  /**
   * Constrói o User Prompt objetivo sintetizando os seletores,
   * sem manipulação de texto em branco pelo professor.
   */
  construirUserPrompt(contexto, quantidade) {
    const { curso, areaMatematica, nivel, metodologia, ferramenta } = contexto;

    return `Por favor, elabore a atividade pedagógica estruturada de ${ferramenta} contendo exatamente ${quantidade} item(ns)/questão(ões) para a Área de ${areaMatematica}, com nível de complexidade ${nivel.rotulo}, direcionada aos estudantes do ${curso.nome}.
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

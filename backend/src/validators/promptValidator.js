import { z } from 'zod';
import { ValidationError } from '../errors/AppError.js';
import {
  resolverCursoCatalogo,
  resolverAreaCatalogo,
  resolverMetodologiaCatalogo,
  resolverNivelCatalogo,
  resolverEixoCatalogo,
} from '../config/curricularMatrix.js';

/**
 * Lista de propriedades estritamente proibidas para impedir caixas de texto cru
 * e garantir conformidade com a ADR-001 (Proibição de Prompt em Branco).
 */
export const CAMPOS_PROIBIDOS_PROMPT_CRU = [
  'prompt',
  'rawPrompt',
  'customPrompt',
  'instrucaoLivre',
  'textoLivre',
  'mensagemLivre',
  'comando',
  'systemPromptCustomizado',
  'userPrompt',
  'freeText',
  'instrucao',
  'inputPrompt',
  'query',
  'mensagem',
  'texto',
  'chat',
];

/**
 * Padrões de Jailbreak e Prompt Injection Heurísticos proibidos em qualquer parâmetro
 */
export const PADROES_INJECAO_PROMPT = [
  {
    regex: /(ignore|desconsidere|esqueca|esqueça)\s+(as|todas|all|previous|minhas)?\s*(instrucoes|instruções|regras|instructions)/i,
    motivo: 'Tentativa de desvio ou cancelamento das instruções do sistema (Prompt Injection).',
  },
  {
    regex: /(system\s*prompt|system:|system\s*instruction|<\|im_start\|>|<\|im_end\|>|\[INST\]|\[\/INST\]|###\s*(System|Human|Assistant):)/i,
    motivo: 'Tentativa de injeção de delimitadores de controle de LLM.',
  },
  {
    regex: /(dan\s*mode|jailbreak|modo\s*desenvolvedor|developer\s*mode)/i,
    motivo: 'Tentativa de ativação de jailbreak ou bypass de segurança.',
  },
  {
    regex: /(voce\s*agora\s*e|você\s*agora\s*é|you\s*are\s*now|finja\s*que|pretend\s*to\s*be|act\s*as\s+an?)/i,
    motivo: 'Tentativa de personificação não autorizada ou quebra de persona pedagógica.',
  },
  {
    regex: /(bypass|override\s*safety|ignore\s*guardrails)/i,
    motivo: 'Tentativa explícita de bypass de salvaguardas éticas.',
  },
  {
    regex: /(<script|javascript:|eval\(|drop\s+table)/i,
    motivo: 'Tentativa de injeção de código ou payload malicioso.',
  },
];

/**
 * Função utilitária para extrair quantidade inteira a partir de formatos aceitos:
 * Ex: 3, "3", "3 questões", "5 itens", "10 questões para lista"
 */
function normalizarQuantidade(val) {
  if (typeof val === 'number') {
    return Math.floor(val);
  }
  if (typeof val === 'string') {
    const match = val.match(/\d+/);
    if (match) {
      return parseInt(match[0], 10);
    }
  }
  return NaN;
}

/**
 * Schema Zod de validação dos parâmetros curriculares do Laboratório de IA
 */
const promptParametrosSchema = z
  .object({
    areaMatematica: z
      .string({
        required_error: 'O parâmetro "areaMatematica" é obrigatório.',
        invalid_type_error: 'O parâmetro "areaMatematica" deve ser uma string.',
      })
      .trim()
      .min(2, 'O parâmetro "areaMatematica" deve conter pelo menos 2 caracteres.')
      .max(120, 'O parâmetro "areaMatematica" não pode exceder 120 caracteres.'),

    nivel: z
      .string({
        required_error: 'O parâmetro "nivel" é obrigatório.',
        invalid_type_error: 'O parâmetro "nivel" deve ser uma string.',
      })
      .trim()
      .min(2, 'O parâmetro "nivel" deve conter pelo menos 2 caracteres.')
      .max(80, 'O parâmetro "nivel" não pode exceder 80 caracteres.'),

    quantidade: z
      .union([z.number(), z.string()], {
        required_error: 'O parâmetro "quantidade" é obrigatório.',
        invalid_type_error: 'O parâmetro "quantidade" deve ser um número ou string válida.',
      })
      .transform((val) => normalizarQuantidade(val))
      .refine(
        (num) => !isNaN(num) && num >= 1 && num <= 20,
        {
          message: 'A quantidade deve ser um número inteiro entre 1 e 20.',
        }
      ),

    cursoTecnico: z
      .string({
        required_error: 'O parâmetro "cursoTecnico" é obrigatório.',
        invalid_type_error: 'O parâmetro "cursoTecnico" deve ser uma string.',
      })
      .trim()
      .min(2, 'O parâmetro "cursoTecnico" deve conter pelo menos 2 caracteres.')
      .max(120, 'O parâmetro "cursoTecnico" não pode exceder 120 caracteres.'),

    metodologia: z
      .string({
        required_error: 'O parâmetro "metodologia" é obrigatório.',
        invalid_type_error: 'O parâmetro "metodologia" deve ser uma string.',
      })
      .trim()
      .min(2, 'O parâmetro "metodologia" deve conter pelo menos 2 caracteres.')
      .max(120, 'O parâmetro "metodologia" não pode exceder 120 caracteres.'),

    ferramenta: z
      .string({
        invalid_type_error: 'O parâmetro "ferramenta" deve ser uma string.',
      })
      .trim()
      .refine(
        (val) => {
          const v = val.toLowerCase();
          return [
            'exercicios',
            'interdisciplinar',
            'atividades_interdisciplinares',
            'podcast',
            'podcasts',
            'roteiro_podcast',
            'plano',
            'plano_aula',
            'planos',
          ].includes(v);
        },
        {
          message:
            'A ferramenta / modalidade informada é inválida. Modalidades homologadas: "exercicios", "interdisciplinar", "podcast" ou "plano".',
        }
      )
      .transform((val) => {
        const v = val.toLowerCase();
        if (v === 'plano_aula' || v === 'planos' || v === 'plano') return 'plano';
        if (v === 'podcast' || v === 'podcasts' || v === 'roteiro_podcast') return 'podcast';
        if (v === 'interdisciplinar' || v === 'atividades_interdisciplinares') return 'interdisciplinar';
        return 'exercicios';
      })
      .default('exercicios'),

    provedor: z
      .enum(['groq', 'gemini', 'ambos'], {
        invalid_type_error: 'O provedor de IA deve ser "groq", "gemini" ou "ambos".',
      })
      .default('ambos'),

    motorPreferencial: z
      .enum(['groq', 'gemini', 'auto'], {
        invalid_type_error: 'O motor preferencial deve ser "groq", "gemini" ou "auto".',
      })
      .optional(),

    usarPro: z.boolean().optional(),

    temperature: z
      .union([z.number(), z.string()])
      .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
      .optional(),

    eixoTecnologico: z.string().optional(),
    eixo: z.string().optional(),
    chaveAlocacao: z.string().optional(),
    forcarExperimentoAB: z.boolean().optional(),
    estrategiaAB: z.string().optional(),
    manterConsistenciaUsuario: z.boolean().optional(),
    dataReferencia: z.union([z.string(), z.date()]).optional(),
    semente: z.union([z.string(), z.number()]).optional(),
    gravarBanco: z.boolean().optional(),
    duracaoMinutos: z.union([z.number(), z.string()]).optional(),
  })
  .strict(); // Rejeita propriedades não mapeadas para impedir injeção de prompt em branco

/**
 * Validador de Parâmetros Curriculares do Laboratório de IA
 * Verifica:
 * 1. Proibição inviolável de campos de texto livre / prompt cru (ADR-001)
 * 2. Bloqueio de injeções heurísticas de prompt / jailbreaks
 * 3. Validação estrutural via Zod (rejeitando campos não mapeados com 422)
 * 4. Validação estrita de cada parâmetro contra a Matriz Curricular homologada (BNCC x CNCT x Metodologias)
 * 
 * Lança ValidationError (RFC 7807 com statusCode 422) em caso de desconformidade.
 */
export function validarParametrosLaboratorio(dados) {
  if (!dados || typeof dados !== 'object') {
    throw new ValidationError('O corpo da requisição deve ser um objeto JSON válido.', [
      { name: 'body', reason: 'Corpo da requisição ausente ou malformatado.' },
    ]);
  }

  const invalidParams = [];

  // 1. Verificação de Segurança Inviolável (ADR-001): Proibição de campos de prompt aberto
  for (const campo of CAMPOS_PROIBIDOS_PROMPT_CRU) {
    if (Object.prototype.hasOwnProperty.call(dados, campo)) {
      invalidParams.push({
        name: campo,
        reason:
          'Proibido: a Plataforma IAprofEPT veta campos de prompt em branco ou texto cru. Utilize exclusivamente os seletores curriculares parametrizados (ADR-001).',
      });
    }
  }

  // 2. Detecção de Padrões de Jailbreak / Prompt Injection em qualquer valor string recebido
  for (const [chave, valor] of Object.entries(dados)) {
    if (typeof valor === 'string') {
      for (const padrao of PADROES_INJECAO_PROMPT) {
        if (padrao.regex.test(valor)) {
          invalidParams.push({
            name: chave,
            reason: `Violação de segurança detectada no parâmetro '${chave}': ${padrao.motivo}`,
          });
          break;
        }
      }
    }
  }

  if (invalidParams.length > 0) {
    throw new ValidationError(
      'Violação do Princípio da Engenharia de Prompt Oculto (ADR-001): comandos de texto livre ou tentativas de bypass não são permitidos.',
      invalidParams
    );
  }

  // 3. Validação estrutural com Zod (rejeição de propriedades arbitrárias via .strict())
  const result = promptParametrosSchema.safeParse(dados);

  if (!result.success) {
    const formatErrors = result.error.issues.map((err) => ({
      name: err.path.join('.') || 'parametro',
      reason: err.message,
    }));

    throw new ValidationError(
      'Falha na validação dos parâmetros curriculares de montagem de prompt.',
      formatErrors
    );
  }

  const dadosValidados = result.data;

  // 4. Validação de Catálogo: Curso Técnico contra o CNCT
  const cursoResolvido = resolverCursoCatalogo(dadosValidados.cursoTecnico);
  if (!cursoResolvido) {
    invalidParams.push({
      name: 'cursoTecnico',
      reason: `O curso técnico '${dadosValidados.cursoTecnico}' não consta no Catálogo Nacional de Cursos Técnicos (CNCT) homologado na Matriz Curricular da plataforma.`,
    });
  }

  // 5. Validação de Catálogo: Área da Matemática contra Habilidades BNCC
  const areaResolvida = resolverAreaCatalogo(dadosValidados.areaMatematica);
  if (!areaResolvida) {
    invalidParams.push({
      name: 'areaMatematica',
      reason: `A área matemática '${dadosValidados.areaMatematica}' não consta nas habilidades da BNCC cadastradas na Matriz Curricular da plataforma.`,
    });
  }

  // 6. Validação de Catálogo: Metodologia Pedagógica
  const metodologiaResolvida = resolverMetodologiaCatalogo(dadosValidados.metodologia);
  if (!metodologiaResolvida) {
    invalidParams.push({
      name: 'metodologia',
      reason: `A metodologia '${dadosValidados.metodologia}' não consta no catálogo oficial de metodologias ativas homologadas na plataforma.`,
    });
  }

  // 7. Validação de Catálogo: Nível de Dificuldade
  const nivelResolvido = resolverNivelCatalogo(dadosValidados.nivel);
  if (!nivelResolvido) {
    invalidParams.push({
      name: 'nivel',
      reason: `O nível de dificuldade '${dadosValidados.nivel}' não consta no catálogo curricular da plataforma (válidos: Inicial, Intermediário, Avançado).`,
    });
  }

  // 8. Validação de Catálogo: Eixo Tecnológico (se fornecido opcionalmente)
  const eixoInformado = dadosValidados.eixoTecnologico || dadosValidados.eixo;
  if (eixoInformado) {
    const eixoResolvido = resolverEixoCatalogo(eixoInformado);
    if (!eixoResolvido) {
      invalidParams.push({
        name: 'eixoTecnologico',
        reason: `O eixo tecnológico '${eixoInformado}' não consta no Catálogo Nacional de Cursos Técnicos (CNCT).`,
      });
    }
  }

  if (invalidParams.length > 0) {
    throw new ValidationError(
      'Parâmetros informados estão fora dos catálogos homologados da Matriz Curricular BNCC x EPT.',
      invalidParams
    );
  }

  // Retorna os dados com os nomes canônicos oficiais resolvidos
  return {
    ...dadosValidados,
    cursoTecnico: cursoResolvido.nome,
    areaMatematica: areaResolvida,
    metodologia: metodologiaResolvida.nome,
    nivel: nivelResolvido.rotulo,
    eixoTecnologico: cursoResolvido.eixoCNCT,
  };
}

export default {
  validarParametrosLaboratorio,
  CAMPOS_PROIBIDOS_PROMPT_CRU,
  PADROES_INJECAO_PROMPT,
};


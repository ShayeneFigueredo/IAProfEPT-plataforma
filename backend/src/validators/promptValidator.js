import { z } from 'zod';
import { ValidationError } from '../errors/AppError.js';

/**
 * Lista de propriedades estritamente proibidas para impedir caixas de texto cru
 * e garantir conformidade com a ADR-001 (Proibição de Prompt em Branco).
 */
const CAMPOS_PROIBIDOS_PROMPT_CRU = [
  'prompt',
  'rawPrompt',
  'customPrompt',
  'instrucaoLivre',
  'textoLivre',
  'mensagemLivre',
  'comando',
  'systemPromptCustomizado',
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
      .enum(['exercicios', 'interdisciplinar', 'podcast', 'plano'], {
        invalid_type_error: 'A ferramenta informada não é suportada.',
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
  })
  .strict(); // Rejeita propriedades adicionais não mapeadas para reforçar segurança

/**
 * Validador de Parâmetros Curriculares
 * Lança ValidationError (RFC 7807) caso os dados estejam incorretos
 * ou haja violação do princípio de proibição de prompt em branco.
 */
export function validarParametrosLaboratorio(dados) {
  if (!dados || typeof dados !== 'object') {
    throw new ValidationError('O corpo da requisição deve ser um objeto JSON válido.', [
      { name: 'body', reason: 'Corpo da requisição ausente ou malformatado.' },
    ]);
  }

  // 1. Verificação de Segurança Inviolável (ADR-001): Proibição de campos de prompt aberto
  const invalidParams = [];
  for (const campo of CAMPOS_PROIBIDOS_PROMPT_CRU) {
    if (Object.prototype.hasOwnProperty.call(dados, campo)) {
      invalidParams.push({
        name: campo,
        reason:
          'Proibido: a Plataforma IAprofEPT veta campos de prompt em branco ou texto cru. Utilize exclusivamente os seletores curriculares parametrizados (ADR-001).',
      });
    }
  }

  if (invalidParams.length > 0) {
    throw new ValidationError(
      'Violação do Princípio da Engenharia de Prompt Oculto (ADR-001): campos de prompt em branco não são permitidos.',
      invalidParams
    );
  }

  // 2. Validação com Zod
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

  return result.data;
}

export default {
  validarParametrosLaboratorio,
};

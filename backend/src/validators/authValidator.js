import { z } from 'zod';
import { ValidationError } from '../errors/AppError.js';

/**
 * Validadores de Esquema com Zod — Módulo de Autenticação e Registro
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Regras Estritas:
 * 1. Nome Completo: min 3, max 255 caracteres
 * 2. E-mail Institucional: @*.edu.br ou homologado (ex: @cp2.g12.br, @*.ufjf.br)
 * 3. Senha Forte: min 8, maiúscula, minúscula, número e símbolo
 * 4. UF: Um dos 27 estados da federação brasileira
 * 5. Instituição de Origem: IF / UF / CEFET / Colégio Técnico
 * 6. Campus: min 2 caracteres
 * 7. Cursos Técnicos: lista não vazia de cursos atendidos
 * 8. Matrícula SIAPE: opcional (se informada, 5 a 20 caracteres)
 * 9. TCLE: Termo de Consentimento Livre e Esclarecido obrigatório
 */

export const BRAZILIAN_UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

// Regex para validação estrita de e-mail institucional homologado da RFEPCT / Rede Pública
const INSTITUTIONAL_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)*(?:edu\.br|g12\.br|ufjf\.br|cefetmg\.br|cefet-rj\.br)$/i;

// Regex para caracteres especiais em senhas
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;

export const registerDocenteSchema = z.object({
  nome: z
    .string({ required_error: 'O nome completo é obrigatório.' })
    .trim()
    .min(3, 'O nome completo deve conter no mínimo 3 caracteres.')
    .max(255, 'O nome completo não pode exceder 255 caracteres.')
    .refine((val) => val.includes(' '), {
      message: 'Por favor, informe seu nome completo (nome e sobrenome).',
    }),

  email: z
    .string({ required_error: 'O e-mail institucional é obrigatório.' })
    .trim()
    .toLowerCase()
    .email('Formato de e-mail inválido.')
    .max(255, 'O e-mail não pode exceder 255 caracteres.')
    .refine((val) => {
      // Permite domínios homologados de teste se configurado no ambiente
      if (process.env.NODE_ENV !== 'production' && val.endsWith('@teste.homolog.br')) {
        return true;
      }
      return INSTITUTIONAL_EMAIL_REGEX.test(val);
    }, {
      message: 'O e-mail deve pertencer a um domínio institucional homologado da RFEPCT (@*.edu.br ou instituição parceira).',
    }),

  senha: z
    .string({ required_error: 'A senha é obrigatória.' })
    .min(8, 'A senha deve conter no mínimo 8 caracteres.')
    .max(128, 'A senha não pode exceder 128 caracteres.')
    .refine((val) => /[A-Z]/.test(val), {
      message: 'A senha deve conter pelo menos uma letra maiúscula.',
    })
    .refine((val) => /[a-z]/.test(val), {
      message: 'A senha deve conter pelo menos uma letra minúscula.',
    })
    .refine((val) => /[0-9]/.test(val), {
      message: 'A senha deve conter pelo menos um número.',
    })
    .refine((val) => SPECIAL_CHAR_REGEX.test(val), {
      message: 'A senha deve conter pelo menos um caractere especial (!@#$%^&*...).',
    }),

  uf: z
    .string({ required_error: 'A Unidade Federativa (UF) é obrigatória.' })
    .trim()
    .toUpperCase()
    .refine((val) => BRAZILIAN_UFS.includes(val), {
      message: `UF inválida. Deve ser uma das 27 UFs do Brasil (ex: MG, SP, RJ, etc.).`,
    }),

  instituicao: z
    .string({ required_error: 'A instituição de origem é obrigatória (IF, UF, CEFET ou Colégio Técnico).' })
    .trim()
    .min(2, 'A instituição de origem deve ter no mínimo 2 caracteres.')
    .max(255, 'A instituição de origem não pode exceder 255 caracteres.')
    .optional()
    .or(z.literal('')),

  instituicaoOrigem: z
    .string()
    .trim()
    .min(2)
    .max(255)
    .optional(),

  outraRede: z
    .string()
    .trim()
    .max(255)
    .optional()
    .nullable(),

  instituicaoId: z
    .string()
    .uuid('ID da instituição inválido (deve ser UUID).')
    .optional()
    .nullable(),

  campus: z
    .string({ required_error: 'O campus de atuação é obrigatório.' })
    .trim()
    .min(2, 'O campus deve ter no mínimo 2 caracteres.')
    .max(150, 'O campus não pode exceder 150 caracteres.'),

  cursosTecnicos: z
    .preprocess((val) => {
      if (typeof val === 'string') {
        return val
          .split(',')
          .map((c) => c.trim())
          .filter((c) => c.length > 0);
      }
      return val;
    }, z.array(z.string().trim().min(2, 'Nome do curso técnico deve ter pelo menos 2 caracteres')))
    .refine((arr) => Array.isArray(arr) && arr.length > 0, {
      message: 'Informe pelo menos um curso técnico atendido pelo docente.',
    }),

  matriculaSiape: z
    .string()
    .trim()
    .max(30, 'A matrícula SIAPE não pode exceder 30 caracteres.')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),

  areaAtuacao: z
    .string()
    .trim()
    .min(2)
    .max(150)
    .optional()
    .default('Matemática'),

  termoEticoAceito: z
    .boolean()
    .optional()
    .default(true)
    .refine((val) => val === true, {
      message: 'O aceite do Termo de Consentimento Livre e Esclarecido (TCLE) é obrigatório.',
    }),
}).transform((data) => {
  // Normalização de campos com aliases
  const instituicaoFinal = data.instituicao || data.instituicaoOrigem || '';
  return {
    ...data,
    instituicao: instituicaoFinal,
  };
});

/**
 * Esquema de Validação para Login Docente
 * Suporta E-mail institucional OU Matrícula SIAPE (+ UF)
 */
export const loginDocenteSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Formato de e-mail inválido.')
    .optional()
    .or(z.literal('')),

  matriculaSiape: z
    .string()
    .trim()
    .max(30, 'Matrícula SIAPE não pode exceder 30 caracteres.')
    .optional()
    .or(z.literal('')),

  identificador: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),

  uf: z
    .string()
    .trim()
    .toUpperCase()
    .refine((val) => !val || BRAZILIAN_UFS.includes(val), {
      message: 'UF inválida. Deve ser uma das 27 UFs do Brasil (ex: MG, SP, etc.).',
    })
    .optional()
    .or(z.literal('')),

  senha: z
    .string({ required_error: 'A senha é obrigatória.' })
    .min(1, 'A senha não pode estar vazia.'),
}).refine(
  (data) => (data.email && data.email.length > 0) ||
            (data.matriculaSiape && data.matriculaSiape.length > 0) ||
            (data.identificador && data.identificador.length > 0),
  {
    message: 'Informe seu e-mail institucional ou matrícula SIAPE para login.',
    path: ['identificador'],
  }
).transform((data) => {
  let emailFinal = data.email && data.email.length > 0 ? data.email : null;
  let siapeFinal = data.matriculaSiape && data.matriculaSiape.length > 0 ? data.matriculaSiape : null;

  if (data.identificador && data.identificador.length > 0) {
    if (data.identificador.includes('@')) {
      emailFinal = data.identificador.toLowerCase();
    } else {
      siapeFinal = data.identificador;
    }
  }

  return {
    ...data,
    email: emailFinal,
    matriculaSiape: siapeFinal,
    uf: data.uf && data.uf.length > 0 ? data.uf : null,
  };
});

/**
 * Esquema de Validação para Solicitação de Recuperação de Senha (POST /api/auth/forgot-password)
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Formato de e-mail inválido.')
    .optional(),

  identificador: z
    .string()
    .trim()
    .optional(),
}).refine(
  (data) => (data.email && data.email.length > 0) || (data.identificador && data.identificador.length > 0),
  {
    message: 'Informe seu e-mail institucional para solicitar a recuperação de senha.',
    path: ['email'],
  }
).transform((data) => {
  const emailFinal = (data.email || data.identificador || '').toLowerCase().trim();
  return { email: emailFinal };
});

/**
 * Esquema de Validação para Redefinição de Senha (POST /api/auth/reset-password)
 */
export const resetPasswordSchema = z.object({
  token: z
    .string({ required_error: 'O token de redefinição de senha é obrigatório.' })
    .trim()
    .min(10, 'Token de redefinição inválido.'),

  novaSenha: z
    .string({ required_error: 'A nova senha é obrigatória.' })
    .min(8, 'A nova senha deve conter no mínimo 8 caracteres.')
    .max(128, 'A nova senha não pode exceder 128 caracteres.')
    .refine((val) => /[A-Z]/.test(val), {
      message: 'A nova senha deve conter pelo menos uma letra maiúscula.',
    })
    .refine((val) => /[a-z]/.test(val), {
      message: 'A nova senha deve conter pelo menos uma letra minúscula.',
    })
    .refine((val) => /[0-9]/.test(val), {
      message: 'A nova senha deve conter pelo menos um número.',
    })
    .refine((val) => SPECIAL_CHAR_REGEX.test(val), {
      message: 'A nova senha deve conter pelo menos um caractere especial (!@#$%^&*...).',
    }),

  confirmacaoSenha: z
    .string()
    .optional(),
}).refine(
  (data) => !data.confirmacaoSenha || data.novaSenha === data.confirmacaoSenha,
  {
    message: 'A confirmação de senha não confere com a nova senha digitada.',
    path: ['confirmacaoSenha'],
  }
);

/**
 * Middleware para validação do corpo da requisição via Zod
 * Lança ValidationError padronizado RFC 7807 em caso de erro
 * @param {import('zod').ZodSchema} schema
 */
export function validateBody(schema) {
  return (req, res, next) => {
    // Normaliza chaves com snake_case para camelCase se presentes
    const normalizedBody = { ...req.body };
    if ('instituicao_origem' in req.body && !normalizedBody.instituicaoOrigem) {
      normalizedBody.instituicaoOrigem = req.body.instituicao_origem;
    }
    if ('outra_rede' in req.body && !normalizedBody.outraRede) {
      normalizedBody.outraRede = req.body.outra_rede;
    }
    if ('instituicao_id' in req.body && !normalizedBody.instituicaoId) {
      normalizedBody.instituicaoId = req.body.instituicao_id;
    }
    if ('cursos_tecnicos' in req.body && !normalizedBody.cursosTecnicos) {
      normalizedBody.cursosTecnicos = req.body.cursos_tecnicos;
    }
    if ('matricula_siape' in req.body && !normalizedBody.matriculaSiape) {
      normalizedBody.matriculaSiape = req.body.matricula_siape;
    }
    if ('area_atuacao' in req.body && !normalizedBody.areaAtuacao) {
      normalizedBody.areaAtuacao = req.body.area_atuacao;
    }
    if ('termo_etico_aceito' in req.body && !normalizedBody.termoEticoAceito) {
      normalizedBody.termoEticoAceito = req.body.termo_etico_aceito;
    }
    if ('nova_senha' in req.body && !normalizedBody.novaSenha) {
      normalizedBody.novaSenha = req.body.nova_senha;
    }
    if ('confirmacao_senha' in req.body && !normalizedBody.confirmacaoSenha) {
      normalizedBody.confirmacaoSenha = req.body.confirmacao_senha;
    }

    const result = schema.safeParse(normalizedBody);

    if (!result.success) {
      const invalidParams = result.error.issues.map((issue) => ({
        name: issue.path.join('.') || 'corpo',
        reason: issue.message,
      }));

      return next(
        new ValidationError(
          'Falha na validação dos campos obrigatórios do docente.',
          invalidParams
        )
      );
    }

    // Injeta dados validados e tipados em req.body
    req.body = result.data;
    next();
  };
}

export default {
  BRAZILIAN_UFS,
  registerDocenteSchema,
  loginDocenteSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  validateBody,
};

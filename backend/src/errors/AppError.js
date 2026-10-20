/**
 * Padronização de Erros RFC 7807 — Problem Details for HTTP APIs
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Especificação: https://datatracker.ietf.org/doc/html/rfc7807
 */

export class AppError extends Error {
  /**
   * @param {string} title - Título curto legível do problema
   * @param {number} statusCode - Código de status HTTP (400, 404, etc.)
   * @param {string} detail - Explicação detalhada da ocorrência
   * @param {string} [type] - URI identificadora do tipo de erro
   * @param {Array<{ name: string, reason: string }>} [invalidParams] - Parâmetros inválidos em caso de validação
   */
  constructor(title, statusCode = 500, detail = '', type = null, invalidParams = null) {
    super(detail || title);
    this.name = this.constructor.name;
    this.title = title;
    this.statusCode = statusCode;
    this.status = statusCode;
    this.detail = detail || title;
    this.type = type || `https://iaprofept.ufjf.br/errors/${this.slugify(title)}`;
    this.invalidParams = invalidParams || [];
    this.isOperational = true; // Erro operacional previsto da aplicação

    Error.captureStackTrace(this, this.constructor);
  }

  slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Serializa o erro para o formato RFC 7807
   * @param {string} [instance] - URI da requisição (req.originalUrl)
   */
  toProblemJson(instance = null) {
    const problem = {
      type: this.type,
      title: this.title,
      status: this.statusCode,
      detail: this.detail,
      timestamp: new Date().toISOString(),
    };

    if (instance) {
      problem.instance = instance;
    }

    if (this.invalidParams && this.invalidParams.length > 0) {
      problem.invalidParams = this.invalidParams;
    }

    return problem;
  }
}

export class BadRequestError extends AppError {
  constructor(detail = 'Requisição inválida ou parâmetros incorretos.') {
    super('Requisição Inválida', 400, detail, 'https://iaprofept.ufjf.br/errors/bad-request');
  }
}

export class UnauthorizedError extends AppError {
  constructor(detail = 'Autenticação necessária para acessar este recurso.') {
    super('Não Autorizado', 401, detail, 'https://iaprofept.ufjf.br/errors/unauthorized');
  }
}

export class ForbiddenError extends AppError {
  constructor(detail = 'Você não possui permissão para acessar este recurso.') {
    super('Acesso Proibido', 403, detail, 'https://iaprofept.ufjf.br/errors/forbidden');
  }
}

export class NotFoundError extends AppError {
  constructor(detail = 'O recurso solicitado não foi encontrado.') {
    super('Recurso Não Encontrado', 404, detail, 'https://iaprofept.ufjf.br/errors/not-found');
  }
}

export class ConflictError extends AppError {
  constructor(detail = 'Conflito com o estado atual do recurso.') {
    super('Conflito de Dados', 409, detail, 'https://iaprofept.ufjf.br/errors/conflict');
  }
}

export class ValidationError extends AppError {
  constructor(detail = 'Falha na validação dos campos da requisição.', invalidParams = []) {
    super(
      'Erro de Validação',
      422,
      detail,
      'https://iaprofept.ufjf.br/errors/validation-error',
      invalidParams
    );
  }
}

export class RateLimitError extends AppError {
  constructor(detail = 'Limite de requisições excedido. Tente novamente mais tarde.') {
    super('Muitas Requisições', 429, detail, 'https://iaprofept.ufjf.br/errors/rate-limit-exceeded');
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(detail = 'O arquivo enviado excede o limite máximo permitido de 15MB.') {
    super('Arquivo Muito Grande', 413, detail, 'https://iaprofept.ufjf.br/errors/payload-too-large');
  }
}

export class InternalServerError extends AppError {
  constructor(detail = 'Ocorreu um erro interno no servidor.') {
    super('Erro Interno do Servidor', 500, detail, 'https://iaprofept.ufjf.br/errors/internal-error');
    this.isOperational = false;
  }
}


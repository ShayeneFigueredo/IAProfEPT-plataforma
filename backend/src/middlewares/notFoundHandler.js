import { NotFoundError } from '../errors/AppError.js';

/**
 * Middleware para tratamento de rotas não encontradas (404)
 * Plataforma IAprofEPT — PPGEM / UFJF
 */
export function notFoundHandler(req, res, next) {
  const method = req.method;
  const path = req.originalUrl || req.url;
  next(new NotFoundError(`A rota ${method} ${path} não existe nesta API.`));
}

export default notFoundHandler;

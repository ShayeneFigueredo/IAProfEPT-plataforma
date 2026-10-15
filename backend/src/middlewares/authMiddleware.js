import { tokenService } from '../services/TokenService.js';
import { UnauthorizedError } from '../errors/AppError.js';

/**
 * Middleware de Autenticação JWT (Guarda de Rotas Protegidas)
 * Plataforma IAprofEPT — PPGEM / UFJF
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(new UnauthorizedError('Cabeçalho de autorização não fornecido.'));
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next(new UnauthorizedError('Formato de token inválido. Utilize: Bearer <token>.'));
  }

  const token = parts[1];

  try {
    const payload = tokenService.verifyAccessToken(token);
    // Injeta os dados do usuário autenticado na requisição
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      nome: payload.nome,
    };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware de Autenticação JWT Opcional
 * Se o cabeçalho Authorization for fornecido e válido, injeta req.user; senão define req.user = null.
 */
export function optionalAuthenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    req.user = null;
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    req.user = null;
    return next();
  }

  const token = parts[1];

  try {
    const payload = tokenService.verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      nome: payload.nome,
    };
  } catch (err) {
    req.user = null;
  }

  next();
}

export {
  authorizeRoles,
  requireAdmin,
  requirePesquisador,
  requireDocente,
} from './rbacMiddleware.js';

export default authenticateToken;

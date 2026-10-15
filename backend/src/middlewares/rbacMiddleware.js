import { ROLES, isRoleAllowed } from '../config/roles.js';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError.js';
import { tokenService } from '../services/TokenService.js';

/**
 * Middleware de Autorização e Controle de Acesso Baseado em Papéis (RBAC)
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Critérios de Aceite:
 * 1. Requisições sem token retornam 401 Unauthorized
 * 2. Requisições com papel insuficiente retornam 403 Forbidden
 * 3. Requisições com token válido e papel permitido prosseguem com sucesso (next)
 * 
 * @param  {...string|string[]} roles - Lista de papéis permitidos para o recurso
 * @returns {import('express').RequestHandler}
 */
export function authorizeRoles(...roles) {
  // Achata argumentos (suporta tanto authorizeRoles('admin', 'pesquisador') quanto authorizeRoles(['admin', 'pesquisador']))
  const allowedRoles = roles.flat().filter(Boolean);

  return (req, res, next) => {
    // 1. Verificação de Autenticação Prévia (req.user)
    if (!req.user) {
      const authHeader = req.headers?.authorization;

      if (!authHeader) {
        return next(new UnauthorizedError('Autenticação necessária para acessar este recurso. Token JWT ausente.'));
      }

      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return next(new UnauthorizedError('Formato de token inválido. Utilize: Bearer <token>.'));
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
        return next(err);
      }
    }

    // 2. Verificação de Autorização por Papel (RBAC)
    const userRole = req.user?.role;

    if (!userRole) {
      return next(new ForbiddenError('Acesso proibido: identificador de perfil (role) ausente na credencial de autenticação.'));
    }

    if (allowedRoles.length > 0 && !isRoleAllowed(userRole, allowedRoles)) {
      return next(
        new ForbiddenError(
          `Acesso proibido: o perfil '${userRole}' não possui autorização para este recurso. Perfis autorizados: [${allowedRoles.join(', ')}].`
        )
      );
    }

    // Autorização concedida
    next();
  };
}

/**
 * Middleware pré-configurado: Acesso restrito a Administradores UFJF
 */
export const requireAdmin = authorizeRoles(ROLES.ADMINISTRADOR_UFJF);

/**
 * Middleware pré-configurado: Acesso restrito a Pesquisadores de Doutorado e Administradores
 */
export const requirePesquisador = authorizeRoles(ROLES.PESQUISADOR_DOUTORADO, ROLES.ADMINISTRADOR_UFJF);

/**
 * Middleware pré-configurado: Acesso a Docentes da RFEPCT, Pesquisadores e Administradores
 */
export const requireDocente = authorizeRoles(
  ROLES.DOCENTE_RFEPCT,
  ROLES.PESQUISADOR_DOUTORADO,
  ROLES.ADMINISTRADOR_UFJF
);

export default authorizeRoles;

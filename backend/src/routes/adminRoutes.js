import { Router } from 'express';
import { adminController } from '../controllers/AdminController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/rbacMiddleware.js';
import { ROLES } from '../config/roles.js';

const router = Router();

/**
 * Guarda RBAC: Rotas administrativas são de acesso restrito e exclusivo a
 * administrador_ufjf.
 */
const requireAdmin = [
  authenticateToken,
  authorizeRoles(ROLES.ADMINISTRADOR_UFJF),
];

/**
 * GET /api/admin/usuarios
 * Listagem paginada de todos os usuários da plataforma
 */
router.get(
  '/usuarios',
  ...requireAdmin,
  (req, res, next) => adminController.listUsers(req, res, next)
);

/**
 * PATCH /api/admin/usuarios/:id/status
 * Alteração do status de um usuário (ativo, pendente, suspenso, inativo)
 */
router.patch(
  '/usuarios/:id/status',
  ...requireAdmin,
  (req, res, next) => adminController.updateUserStatus(req, res, next)
);

/**
 * GET /api/admin/auditoria
 * Consulta e filtragem dos logs de auditoria do sistema
 */
router.get(
  '/auditoria',
  ...requireAdmin,
  (req, res, next) => adminController.getAuditLogs(req, res, next)
);

/**
 * GET /api/admin/estatisticas
 * Resumo estatístico do sistema e adesão da RFEPCT
 */
router.get(
  '/estatisticas',
  ...requireAdmin,
  (req, res, next) => adminController.getSystemStats(req, res, next)
);

export default router;

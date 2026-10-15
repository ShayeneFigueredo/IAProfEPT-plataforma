import { Router } from 'express';
import { metricasController } from '../controllers/MetricasController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/rbacMiddleware.js';
import { ROLES } from '../config/roles.js';

const router = Router();

/**
 * Guarda RBAC: Rotas de métricas científicas são de acesso exclusivo a
 * pesquisador_doutorado e administrador_ufjf.
 */
const requireAcessoPesquisa = [
  authenticateToken,
  authorizeRoles(ROLES.PESQUISADOR_DOUTORADO, ROLES.ADMINISTRADOR_UFJF),
];

/**
 * GET /api/metricas/tese
 * Consolidação de dados estatísticos da tese de doutorado PPGEM/UFJF
 */
router.get(
  '/tese',
  ...requireAcessoPesquisa,
  (req, res, next) => metricasController.getMetricasTese(req, res, next)
);

/**
 * GET /api/metricas/telemetria-ab
 * Registros brutos do protocolo experimental comparativo (Groq vs Gemini)
 */
router.get(
  '/telemetria-ab',
  ...requireAcessoPesquisa,
  (req, res, next) => metricasController.getTelemetriaAb(req, res, next)
);

export default router;

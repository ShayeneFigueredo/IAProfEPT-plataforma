import { Router } from 'express';
import { authController } from '../controllers/AuthController.js';
import { authRateLimiter } from '../config/security.js';
import {
  registerDocenteSchema,
  loginDocenteSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  validateBody
} from '../validators/authValidator.js';
import { authenticateToken, optionalAuthenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

/**
 * POST /api/auth/register
 * Cadastro de Docentes da RFEPCT com validação estrita Zod
 */
router.post(
  '/register',
  authRateLimiter,
  validateBody(registerDocenteSchema),
  (req, res, next) => authController.register(req, res, next)
);

/**
 * POST /api/auth/login
 * Autenticação de Docentes por E-mail ou Matrícula SIAPE (+ UF)
 */
router.post(
  '/login',
  authRateLimiter,
  validateBody(loginDocenteSchema),
  (req, res, next) => authController.login(req, res, next)
);

/**
 * POST /api/auth/forgot-password
 * Solicitação de token seguro para recuperação de senha (validade de 2h)
 */
router.post(
  '/forgot-password',
  authRateLimiter,
  validateBody(forgotPasswordSchema),
  (req, res, next) => authController.forgotPassword(req, res, next)
);

/**
 * POST /api/auth/reset-password
 * Redefinição segura de senha com token de uso único
 */
router.post(
  '/reset-password',
  authRateLimiter,
  validateBody(resetPasswordSchema),
  (req, res, next) => authController.resetPassword(req, res, next)
);

/**
 * GET /api/auth/me
 * Perfil do docente autenticado (protegido por JWT)
 */
router.get(
  '/me',
  authenticateToken,
  (req, res, next) => authController.me(req, res, next)
);

/**
 * GET /api/auth/termo-etico
 * Auditoria de conformidade com o Comitê de Ética em Pesquisa (CEP/UFJF) e Resolução CNS 510/2016
 */
router.get(
  '/termo-etico',
  optionalAuthenticateToken,
  (req, res, next) => authController.getTermoEtico(req, res, next)
);

export default router;

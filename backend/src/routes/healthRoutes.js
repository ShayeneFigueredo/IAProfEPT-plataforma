import { Router } from 'express';
import { healthController } from '../controllers/HealthController.js';

const router = Router();

// Rota de Healthcheck completa
router.get('/health', (req, res, next) => healthController.check(req, res, next));

// Rota rápida de liveness ping
router.get('/ping', (req, res) => healthController.ping(req, res));

// Rota de simulação de erro interno para auditoria do RFC 7807 (ativa em dev/test)
if (process.env.NODE_ENV !== 'production') {
  router.get('/health/error-simulation', (req, res, next) => {
    next(new Error('Simulação controlada de falha interna para validação do RFC 7807'));
  });
}

export default router;

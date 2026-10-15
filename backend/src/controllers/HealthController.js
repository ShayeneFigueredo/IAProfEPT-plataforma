import { healthService } from '../services/HealthService.js';

/**
 * Camada de Controle — Health Controller
 * Plataforma IAprofEPT — PPGEM / UFJF
 */
export class HealthController {
  /**
   * GET /api/health
   */
  async check(req, res, next) {
    try {
      const data = await healthService.getSystemHealth();
      const statusCode = data.status === 'healthy' ? 200 : 503;
      return res.status(statusCode).json(data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/ping
   */
  async ping(req, res) {
    return res.status(200).json({
      pong: true,
      timestamp: new Date().toISOString(),
    });
  }
}

export const healthController = new HealthController();
export default healthController;

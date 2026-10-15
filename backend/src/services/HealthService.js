import { healthCheck } from '../config/database.js';

/**
 * Camada de Serviço — Diagnóstico e Saúde do Sistema
 * Plataforma IAprofEPT — PPGEM / UFJF
 */
export class HealthService {
  /**
   * Consolida o status completo de integridade da plataforma
   */
  async getSystemHealth() {
    const dbHealth = await healthCheck();
    const isHealthy = dbHealth.status === 'healthy';

    const memory = process.memoryUsage();

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      projeto: 'Plataforma IAprofEPT (PTT4 / CAPES)',
      pesquisa: 'Tese de Doutorado PPGEM / UFJF — Maycon Luiz Amaral Magalhães',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      sistema: {
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        memoryRssMb: Math.round(memory.rss / 1024 / 1024),
        heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
      },
      bancoDeDados: dbHealth,
    };
  }
}

export const healthService = new HealthService();
export default healthService;

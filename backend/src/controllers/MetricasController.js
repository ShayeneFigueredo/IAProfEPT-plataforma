import { metricasRepository } from '../repositories/MetricasRepository.js';

/**
 * Controller de Métricas e Telemetria da Tese de Doutorado
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Acesso Restrito: pesquisador_doutorado e administrador_ufjf
 */
export class MetricasController {
  /**
   * GET /api/metricas/tese
   * Retorna métricas consolidadas da tese de Maycon Magalhães e do experimento A/B
   */
  async getMetricasTese(req, res, next) {
    try {
      const metricas = await metricasRepository.getMetricasTese();
      return res.status(200).json({
        sucesso: true,
        solicitante: {
          id: req.user?.id,
          nome: req.user?.nome,
          role: req.user?.role,
        },
        ...metricas,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/metricas/telemetria-ab
   * Retorna registros anonimizados do protocolo empírico de 30 dias para exportação
   */
  async getTelemetriaAb(req, res, next) {
    try {
      const { limit, motor, status } = req.query;
      const telemetria = await metricasRepository.getTelemetriaAbRaw({ limit, motor, status });
      return res.status(200).json({
        sucesso: true,
        totalRegistros: telemetria.length,
        dados: telemetria,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const metricasController = new MetricasController();
export default metricasController;

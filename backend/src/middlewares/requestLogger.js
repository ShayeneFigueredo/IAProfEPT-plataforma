/**
 * Middleware de Logging e Auditoria de Requisições HTTP
 * Plataforma IAprofEPT — PPGEM / UFJF
 */
export function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, originalUrl } = req;

  // Intercepta o evento 'finish' da resposta para calcular a latência real
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const statusBadge = statusCode >= 500 ? '🔴' : statusCode >= 400 ? '🟡' : '🟢';

    if (process.env.NODE_ENV !== 'test') {
      console.log(
        `[HTTP] ${statusBadge} ${method} ${originalUrl} | Status: ${statusCode} | ${duration}ms | IP: ${ip}`
      );
    }
  });

  next();
}

export default requestLogger;

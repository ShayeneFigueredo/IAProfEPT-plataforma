import { AppError } from '../errors/AppError.js';

/**
 * Middleware Centralizado de Tratamento de Erros — Padrão RFC 7807
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Critério de Aceite Inegociável:
 * - Respostas padronizadas em application/problem+json
 * - NUNCA expor stack traces de erros internos na resposta HTTP
 */
export function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV === 'development';
  const instance = req.originalUrl || req.url;

  // Log interno para monitoramento e auditoria da equipe
  console.error(`[API Error] [${new Date().toISOString()}] ${req.method} ${instance}`);
  console.error(`  Mensagem: ${err.message}`);
  if (err.stack) {
    console.error(`  Stack Trace Interno:\n${err.stack}`);
  }

  // 1. Erros operacionais conhecidos (AppError)
  if (err instanceof AppError) {
    res.setHeader('Content-Type', 'application/problem+json');
    return res.status(err.statusCode).json(err.toProblemJson(instance));
  }

  // 2. Erros de parsing do corpo JSON (SyntaxError do express.json)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    res.setHeader('Content-Type', 'application/problem+json');
    return res.status(400).json({
      type: 'https://iaprofept.ufjf.br/errors/bad-json',
      title: 'JSON Inválido',
      status: 400,
      detail: 'O corpo da requisição contém uma estrutura JSON malformada.',
      instance,
      timestamp: new Date().toISOString(),
    });
  }

  // 3. Erros de processamento de Upload (Multer)
  if (err.name === 'MulterError' || err.code === 'LIMIT_FILE_SIZE') {
    res.setHeader('Content-Type', 'application/problem+json');
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        type: 'https://iaprofept.ufjf.br/errors/payload-too-large',
        title: 'Arquivo Muito Grande',
        status: 413,
        detail: 'O arquivo enviado excede o limite máximo permitido de 15MB.',
        instance,
        timestamp: new Date().toISOString(),
      });
    }
    return res.status(400).json({
      type: 'https://iaprofept.ufjf.br/errors/upload-error',
      title: 'Erro no Upload do Arquivo',
      status: 400,
      detail: `Falha no processamento do anexo multipart: ${err.message}`,
      instance,
      timestamp: new Date().toISOString(),
    });
  }

  // 4. Erros inesperados / 500 Internal Server Error
  // CRÍTICO: Jamais expor stack trace ao cliente externo
  res.setHeader('Content-Type', 'application/problem+json');
  return res.status(500).json({
    type: 'https://iaprofept.ufjf.br/errors/internal-server-error',
    title: 'Erro Interno do Servidor',
    status: 500,
    detail: 'Ocorreu uma falha interna no processamento. A equipe de engenharia foi notificada.',
    instance,
    timestamp: new Date().toISOString(),
  });
}

export default errorHandler;

import express from 'express';
import dotenv from 'dotenv';
import {
  corsMiddleware,
  helmetMiddleware,
  apiRateLimiter,
} from './config/security.js';
import cookieParser from 'cookie-parser';
import requestLogger from './middlewares/requestLogger.js';
import notFoundHandler from './middlewares/notFoundHandler.js';
import errorHandler from './middlewares/errorHandler.js';
import apiRouter from './routes/index.js';

dotenv.config();

const app = express();

// Confiança em proxy reverso institucional (UFJF / Docker / Nginx)
app.set('trust proxy', 1);

// 1. MIDDLEWARES GLOBAIS DE SEGURANÇA E PROTOCOLO
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(apiRateLimiter);

// 2. PARSERS E LOGGING
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// 3. ROTA RAIZ INFORMATIVA
app.get('/', (req, res) => {
  res.json({
    projeto: 'Plataforma IAprofEPT',
    descricao: 'Ambiente Virtual de Apoio à Docência em Matemática na EPT com IA Generativa',
    pesquisa: 'Tese de Doutorado PPGEM / UFJF — Maycon Luiz Amaral Magalhães',
    versao: '1.0.0',
    status: 'operacional',
    documentacaoApi: '/api',
    healthCheck: '/api/health',
  });
});

// 4. ROTEADOR CENTRAL DA API (/api)
app.use('/api', apiRouter);

// 5. TRATAMENTO DE ROTAS NÃO ENCONTRADAS (404)
app.use(notFoundHandler);

// 6. TRATAMENTO CENTRALIZADO DE EXCEÇÕES (RFC 7807)
app.use(errorHandler);

export default app;

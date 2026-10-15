import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { RateLimitError } from '../errors/AppError.js';

/**
 * Configurações de Segurança e Middlewares Globais
 * Plataforma IAprofEPT — PPGEM / UFJF
 */

// 1. ORIGENS INSTITUCIONAIS PERMITIDAS (CORS)
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://iaprofept.ufjf.br',
  'https://www.iaprofept.ufjf.br',
];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (como curl, mobile apps ou healthchecks locais)
    if (!origin) return callback(null, true);

    // Permite qualquer subdomínio institucional da UFJF em produção
    if (origin.endsWith('.ufjf.br') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origem ${origin} bloqueada pela política institucional de CORS.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Type', 'Content-Disposition'],
  maxAge: 86400, // 24 horas em cache preflight
});

// 2. HELMET (CABEÇALHOS HTTP DE SEGURANÇA)
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", ...allowedOrigins],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// 3. RATE LIMITING GERAL DA API (PROTEÇÃO CONTRA ABUSOS E DOS)
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX || '200', 10), // Até 200 requisições por janela
  standardHeaders: true, // Retorna RateLimit-* headers no padrão IETF
  legacyHeaders: false,
  handler: (req, res, next) => {
    const error = new RateLimitError('Limite geral de requisições excedido. Por favor, aguarde alguns minutos.');
    next(error);
  },
});

// 4. RATE LIMITING RESTRITO PARA AUTENTICAÇÃO (PROTEÇÃO CONTRA BRUTE FORCE)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 15, // Máximo de 15 tentativas de login por IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    const error = new RateLimitError('Muitas tentativas de autenticação falhadas. O IP foi bloqueado temporariamente por 15 minutos.');
    next(error);
  },
});

export default {
  corsMiddleware,
  helmetMiddleware,
  apiRateLimiter,
  authRateLimiter,
};

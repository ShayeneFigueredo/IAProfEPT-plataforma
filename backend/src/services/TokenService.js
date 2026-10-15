import jwt from 'jsonwebtoken';
import { cryptoService } from './CryptoService.js';
import { refreshTokenRepository } from '../repositories/RefreshTokenRepository.js';
import { UnauthorizedError } from '../errors/AppError.js';

/**
 * Serviço de Tokens de Acesso JWT e Refresh Tokens com Rotação Automática
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Atende aos requisitos:
 * - Access Tokens JWT de curta duração (15 minutos)
 * - Refresh Tokens opacos de alta entropia persistidos no PostgreSQL
 * - Cookies HttpOnly com SameSite=Strict
 * - Rotação automática de refresh token com detecção de comprometimento/reuso
 */

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_iaprofept_ufjf_2026';
const ACCESS_TOKEN_EXPIRATION = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_DAYS = 7;

export class TokenService {
  /**
   * Gera Token de Acesso JWT de curta duração (15min)
   * @param {{ id: string, email: string, role: string, nome: string }} user
   * @returns {string} Token JWT assinado
   */
  generateAccessToken(user) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      nome: user.nome,
      iss: 'https://iaprofept.ufjf.br',
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRATION,
      algorithm: 'HS256',
    });
  }

  /**
   * Valida e decodifica um Access Token JWT
   * @param {string} token
   * @returns {object} Payload decodificado
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'https://iaprofept.ufjf.br',
        algorithms: ['HS256'],
      });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token de acesso expirado. Renove sua sessão.');
      }
      throw new UnauthorizedError('Token de acesso inválido ou malformado.');
    }
  }

  /**
   * Gera um Refresh Token opaco, grava o hash no PostgreSQL e retorna o token bruto
   * @param {{ id: string }} user
   * @param {{ ip?: string, userAgent?: string }} meta
   * @returns {Promise<{ rawToken: string, expiraEm: Date }>}
   */
  async createRefreshToken(user, meta = {}) {
    const rawToken = cryptoService.generateRandomToken(40);
    const tokenHash = cryptoService.hashToken(rawToken);

    const expiraEm = new Date();
    expiraEm.setDate(expiraEm.getDate() + REFRESH_TOKEN_DAYS);

    await refreshTokenRepository.create({
      usuarioId: user.id,
      tokenHash,
      expiraEm,
      ipOrigem: meta.ip || null,
      userAgent: meta.userAgent || null,
    });

    return { rawToken, expiraEm };
  }

  /**
   * Ciclo de Renovação e Rotação Automática de Refresh Tokens
   * @param {string} rawToken - Refresh token recebido via cookie HttpOnly
   * @param {{ ip?: string, userAgent?: string }} meta
   * @returns {Promise<{ accessToken: string, newRefreshToken: string, user: object }>}
   */
  async rotateRefreshToken(rawToken, meta = {}) {
    if (!rawToken) {
      throw new UnauthorizedError('Refresh token não fornecido.');
    }

    const tokenHash = cryptoService.hashToken(rawToken);
    const existingToken = await refreshTokenRepository.findByTokenHash(tokenHash);

    if (!existingToken) {
      throw new UnauthorizedError('Sessão inexistente ou inválida. Efetue login novamente.');
    }

    // DETECÇÃO DE COMPROMETIMENTO / REUSO DE REFRESH TOKEN
    if (existingToken.revogado) {
      // Se um token já revogado for reutilizado, revoga compulsoriamente toda a árvore de tokens do usuário
      console.warn(`[Security Alert] Tentativa de reuso de token revogado detectada para o usuário ${existingToken.usuario_id}. Revogando todas as sessões ativas.`);
      await refreshTokenRepository.revokeAllByUsuarioId(existingToken.usuario_id);
      throw new UnauthorizedError('Alerta de segurança: tentativa de reuso de sessão detectada. Todas as sessões foram invalidadas.');
    }

    // VERIFICAÇÃO DE EXPIRAÇÃO
    if (new Date() > new Date(existingToken.expira_em)) {
      await refreshTokenRepository.revoke(existingToken.id);
      throw new UnauthorizedError('Sessão expirada. Por favor, realize um novo login.');
    }

    const user = {
      id: existingToken.user_id,
      nome: existingToken.nome,
      email: existingToken.email,
      role: existingToken.role,
      status: existingToken.status,
    };

    if (user.status !== 'ativo') {
      throw new UnauthorizedError('Conta de usuário inativa ou bloqueada.');
    }

    // ROTAÇÃO: Cria um novo refresh token e invalida o anterior apontando a substituição
    const { rawToken: newRawToken } = await this.createRefreshToken(user, meta);
    const newHash = cryptoService.hashToken(newRawToken);
    const newRecord = await refreshTokenRepository.findByTokenHash(newHash);

    await refreshTokenRepository.revoke(existingToken.id, newRecord?.id || null);

    // Gera novo access token de 15min
    const accessToken = this.generateAccessToken(user);

    return {
      accessToken,
      newRefreshToken: newRawToken,
      user,
    };
  }

  /**
   * Revoga um refresh token no logout
   * @param {string} rawToken
   */
  async revokeRefreshToken(rawToken) {
    if (!rawToken) return;
    const tokenHash = cryptoService.hashToken(rawToken);
    const token = await refreshTokenRepository.findByTokenHash(tokenHash);
    if (token) {
      await refreshTokenRepository.revoke(token.id);
    }
  }

  /**
   * Opções seguras para configuração do Cookie HttpOnly do Refresh Token
   */
  getCookieOptions() {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true, // Inacessível por JavaScript no navegador (proteção anti-XSS)
      secure: isProduction, // HTTPS obrigatório em produção
      sameSite: 'strict', // Proteção total contra CSRF
      path: '/api/auth', // Restringe o cookie exclusivamente às rotas de autenticação
      maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000, // 7 dias em milissegundos
    };
  }
}

export const tokenService = new TokenService();
export default tokenService;

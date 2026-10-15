import { authService } from '../services/AuthService.js';
import { tokenService } from '../services/TokenService.js';
import { userRepository } from '../repositories/UserRepository.js';
import { NotFoundError } from '../errors/AppError.js';

/**
 * Controller de Autenticação e Registro Docente
 * Plataforma IAprofEPT — PPGEM / UFJF
 */
export class AuthController {
  /**
   * POST /api/auth/register
   * Cadastra novo docente da RFEPCT com validação estrita de esquema
   */
  async register(req, res, next) {
    try {
      const clientMeta = {
        ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'] || null,
      };

      const result = await authService.registerDocente(req.body, clientMeta);

      // Define cookie HttpOnly seguro para o Refresh Token (SameSite=Strict, Path=/api/auth)
      res.cookie('refreshToken', result.refreshToken, tokenService.getCookieOptions());

      return res.status(201).json({
        mensagem: 'Docente registrado com sucesso na plataforma IAprofEPT.',
        usuario: result.usuario,
        perfil: result.perfil,
        accessToken: result.accessToken,
        tokenTipo: 'Bearer',
        expiraEm: '15m',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Autentica docente por e-mail ou matrícula SIAPE (+ UF)
   */
  async login(req, res, next) {
    try {
      const clientMeta = {
        ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'] || null,
      };

      const result = await authService.loginDocente(req.body, clientMeta);

      // Define cookie HttpOnly seguro para o Refresh Token (SameSite=Strict, Path=/api/auth)
      res.cookie('refreshToken', result.refreshToken, tokenService.getCookieOptions());

      return res.status(200).json({
        mensagem: 'Login realizado com sucesso na plataforma IAprofEPT.',
        usuario: result.usuario,
        perfil: result.perfil,
        accessToken: result.accessToken,
        tokenTipo: 'Bearer',
        expiraEm: '15m',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Retorna o perfil completo do docente autenticado (sem expor hash de senha)
   */
  async me(req, res, next) {
    try {
      const userId = req.user?.id;
      const profile = await userRepository.findProfileByUserId(userId);

      if (!profile) {
        throw new NotFoundError('Perfil docente não encontrado.');
      }

      return res.status(200).json(profile);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Solicita token seguro de recuperação de senha com validade de 2 horas
   */
  async forgotPassword(req, res, next) {
    try {
      const clientMeta = {
        ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'] || null,
      };

      const result = await authService.forgotPassword(req.body, clientMeta);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/reset-password
   * Redefine a senha utilizando token criptografado de uso único
   */
  async resetPassword(req, res, next) {
    try {
      const clientMeta = {
        ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'] || null,
      };

      const result = await authService.resetPassword(req.body, clientMeta);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/termo-etico
   * Retorna os termos do TCLE e relatório de conformidade ética com o CEP/UFJF e Resolução CNS 510/2016
   */
  async getTermoEtico(req, res, next) {
    try {
      const userId = req.user?.id || null;
      const result = await authService.getTermoEtico(userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
export default authController;

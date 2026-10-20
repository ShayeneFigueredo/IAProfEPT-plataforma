import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../src/services/AuthService.js';
import { userRepository } from '../../src/repositories/UserRepository.js';
import { passwordResetRepository } from '../../src/repositories/PasswordResetRepository.js';
import { refreshTokenRepository } from '../../src/repositories/RefreshTokenRepository.js';
import { consentimentoTcleRepository } from '../../src/repositories/ConsentimentoTcleRepository.js';
import { cryptoService } from '../../src/services/CryptoService.js';
import { tokenService } from '../../src/services/TokenService.js';
import { ConflictError, UnauthorizedError, BadRequestError } from '../../src/errors/AppError.js';

vi.mock('../../src/repositories/UserRepository.js');
vi.mock('../../src/repositories/PasswordResetRepository.js');
vi.mock('../../src/repositories/RefreshTokenRepository.js');
vi.mock('../../src/repositories/ConsentimentoTcleRepository.js');
vi.mock('../../src/services/CryptoService.js');
vi.mock('../../src/services/TokenService.js');

describe('AuthService', () => {
  let authService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService();
  });

  describe('registerDocente', () => {
    it('should throw ConflictError if email exists', async () => {
      userRepository.findByEmail.mockResolvedValue({ id: '1' });
      await expect(authService.registerDocente({ email: 'test@ufjf.br' })).rejects.toThrow(ConflictError);
    });

    it('should throw ConflictError if matriculaSiape exists', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.findByMatriculaSiape.mockResolvedValue({ id: '2' });
      await expect(authService.registerDocente({ email: 'test@ufjf.br', matriculaSiape: '123' })).rejects.toThrow(ConflictError);
    });

    it('should register successfully', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.findByMatriculaSiape.mockResolvedValue(null);
      userRepository.findInstituicao.mockResolvedValue({ id: 'inst-1', nome: 'IFMG' });
      
      cryptoService.hashPassword.mockResolvedValue('hashed-pw');
      cryptoService.anonymizeIp.mockReturnValue('127.0.0.x');

      userRepository.createDocenteWithProfile.mockResolvedValue({
        usuario: { id: 'u1', email: 'test@ufjf.br', role: 'docente_rfepct', status: 'ativo' },
        perfil: { id: 'p1', instituicao: { nome: 'IFMG' } },
        consentimento: { created_at: new Date() }
      });

      tokenService.generateAccessToken.mockReturnValue('access-token');
      tokenService.createRefreshToken.mockResolvedValue({ rawToken: 'refresh-token' });

      const result = await authService.registerDocente({
        email: 'test@ufjf.br',
        senha: 'password',
        nome: 'Test Docente',
        instituicao: 'IFMG'
      });

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.usuario.id).toBe('u1');
      expect(userRepository.createDocenteWithProfile).toHaveBeenCalled();
    });
  });

  describe('loginDocente', () => {
    it('should throw UnauthorizedError if user not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      await expect(authService.loginDocente({ email: 'test@ufjf.br' })).rejects.toThrow(UnauthorizedError);
      expect(userRepository.recordAuditLog).toHaveBeenCalled();
    });

    it('should throw UnauthorizedError if blocked', async () => {
      const future = new Date();
      future.setMinutes(future.getMinutes() + 10);
      userRepository.findByEmail.mockResolvedValue({ id: 'u1', bloqueado_ate: future });

      await expect(authService.loginDocente({ email: 'test@ufjf.br' })).rejects.toThrow('Conta bloqueada temporariamente');
    });

    it('should throw and block if max attempts reached', async () => {
      userRepository.findByEmail.mockResolvedValue({ id: 'u1', tentativas_login_falhas: 4 });
      cryptoService.comparePassword.mockResolvedValue(false);

      await expect(authService.loginDocente({ email: 'test@ufjf.br', senha: 'wrong' })).rejects.toThrow('Conta bloqueada temporariamente');
      expect(userRepository.recordLoginFailure).toHaveBeenCalledWith('u1', 5, true);
    });

    it('should login successfully', async () => {
      userRepository.findByEmail.mockResolvedValue({ id: 'u1', email: 'test@ufjf.br' });
      cryptoService.comparePassword.mockResolvedValue(true);
      userRepository.findProfileByUserId.mockResolvedValue({ perfil: { id: 'p1' } });
      tokenService.generateAccessToken.mockReturnValue('access-token');
      tokenService.createRefreshToken.mockResolvedValue({ rawToken: 'refresh-token' });

      const result = await authService.loginDocente({ email: 'test@ufjf.br', senha: 'pw' });
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(userRepository.recordLoginSuccess).toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('should return mock response even if user not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      const result = await authService.forgotPassword({ email: 'notfound@ufjf.br' });
      expect(result.enviado).toBe(false);
      expect(result.mensagem).toContain('Se o e-mail institucional informado estiver cadastrado');
    });

    it('should process forgot password and generate token', async () => {
      userRepository.findByEmail.mockResolvedValue({ id: 'u1', email: 'found@ufjf.br', nome: 'Test' });
      cryptoService.generateRandomToken.mockReturnValue('raw-token');
      cryptoService.hashToken.mockReturnValue('hash-token');

      const result = await authService.forgotPassword({ email: 'found@ufjf.br' });
      
      expect(result.enviado).toBe(true);
      expect(passwordResetRepository.invalidatePendingByUsuarioId).toHaveBeenCalledWith('u1');
      expect(passwordResetRepository.create).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should throw if token not found', async () => {
      passwordResetRepository.findByTokenHash.mockResolvedValue(null);
      await expect(authService.resetPassword({ token: 'invalid', novaSenha: 'pw' })).rejects.toThrow(BadRequestError);
    });

    it('should throw if token used', async () => {
      passwordResetRepository.findByTokenHash.mockResolvedValue({ usado: true });
      await expect(authService.resetPassword({ token: 'valid', novaSenha: 'pw' })).rejects.toThrow(BadRequestError);
    });

    it('should throw if token expired', async () => {
      passwordResetRepository.findByTokenHash.mockResolvedValue({ expira_em: new Date('2000-01-01') });
      await expect(authService.resetPassword({ token: 'valid', novaSenha: 'pw' })).rejects.toThrow(BadRequestError);
    });

    it('should reset password successfully', async () => {
      const future = new Date();
      future.setHours(future.getHours() + 1);
      passwordResetRepository.findByTokenHash.mockResolvedValue({ id: 'r1', expira_em: future, user_id: 'u1' });
      cryptoService.hashPassword.mockResolvedValue('new-hash');

      const result = await authService.resetPassword({ token: 'valid', novaSenha: 'pw' });
      expect(result.usuarioId).toBe('u1');
      expect(passwordResetRepository.markAsUsed).toHaveBeenCalledWith('r1', null);
      expect(userRepository.updatePassword).toHaveBeenCalledWith('u1', 'new-hash');
      expect(refreshTokenRepository.revokeAllByUsuarioId).toHaveBeenCalledWith('u1');
    });
  });

  describe('getTermoEtico', () => {
    it('should return default termo if no userId', async () => {
      consentimentoTcleRepository.getAuditoriaConformidade.mockResolvedValue({ totalUsuarios: 1 });
      const result = await authService.getTermoEtico();
      expect(result.auditoriaConformidade.totalUsuarios).toBe(1);
      expect(result.consentimentoDocente).toBeNull();
    });

    it('should return consentimento se userId provido', async () => {
      consentimentoTcleRepository.findLatestByUsuarioId.mockResolvedValue({ id: 'c1', versao_termo: '1.0' });
      consentimentoTcleRepository.getAuditoriaConformidade.mockResolvedValue({ totalUsuarios: 1 });
      const result = await authService.getTermoEtico('u1');
      expect(result.consentimentoDocente.consentimentoId).toBe('c1');
    });
  });
});

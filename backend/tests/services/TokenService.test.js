import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { TokenService } from '../../src/services/TokenService.js';
import { cryptoService } from '../../src/services/CryptoService.js';
import { refreshTokenRepository } from '../../src/repositories/RefreshTokenRepository.js';
import { UnauthorizedError } from '../../src/errors/AppError.js';

vi.mock('../../src/services/CryptoService.js', () => ({
  cryptoService: {
    generateRandomToken: vi.fn(),
    hashToken: vi.fn(),
  }
}));

vi.mock('../../src/repositories/RefreshTokenRepository.js', () => ({
  refreshTokenRepository: {
    create: vi.fn(),
    findByTokenHash: vi.fn(),
    revokeAllByUsuarioId: vi.fn(),
    revoke: vi.fn(),
  }
}));

describe('TokenService', () => {
  let tokenService;

  beforeEach(() => {
    vi.clearAllMocks();
    tokenService = new TokenService();
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT token', () => {
      const user = { id: '1', email: 'test@ufjf.br', role: 'PROFESSOR', nome: 'Test' };
      const token = tokenService.generateAccessToken(user);
      
      const decoded = jwt.decode(token);
      expect(decoded.sub).toBe('1');
      expect(decoded.email).toBe('test@ufjf.br');
      expect(decoded.role).toBe('PROFESSOR');
      expect(decoded.nome).toBe('Test');
      expect(decoded.iss).toBe('https://iaprofept.ufjf.br');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and return payload for a valid token', () => {
      const user = { id: '1', email: 'test@ufjf.br', role: 'PROFESSOR', nome: 'Test' };
      const token = tokenService.generateAccessToken(user);
      
      const verified = tokenService.verifyAccessToken(token);
      expect(verified.sub).toBe('1');
    });

    it('should throw UnauthorizedError for expired token', () => {
      const expiredToken = jwt.sign({ sub: '1' }, process.env.JWT_SECRET || 'dev_secret_iaprofept_ufjf_2026', { expiresIn: '-1s' });
      expect(() => tokenService.verifyAccessToken(expiredToken)).toThrow(UnauthorizedError);
      expect(() => tokenService.verifyAccessToken(expiredToken)).toThrow('Token de acesso expirado');
    });

    it('should throw UnauthorizedError for invalid token', () => {
      expect(() => tokenService.verifyAccessToken('invalid-token')).toThrow(UnauthorizedError);
    });
  });

  describe('createRefreshToken', () => {
    it('should create and return a new refresh token', async () => {
      cryptoService.generateRandomToken.mockReturnValue('raw-token');
      cryptoService.hashToken.mockReturnValue('hash-token');
      refreshTokenRepository.create.mockResolvedValue({ id: '1' });

      const user = { id: 'user-id' };
      const result = await tokenService.createRefreshToken(user, { ip: '127.0.0.1' });

      expect(result.rawToken).toBe('raw-token');
      expect(result.expiraEm).toBeInstanceOf(Date);
      expect(refreshTokenRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        usuarioId: 'user-id',
        tokenHash: 'hash-token',
        ipOrigem: '127.0.0.1'
      }));
    });
  });

  describe('rotateRefreshToken', () => {
    it('should throw UnauthorizedError if no raw token is provided', async () => {
      await expect(tokenService.rotateRefreshToken(null)).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError if token does not exist', async () => {
      cryptoService.hashToken.mockReturnValue('hash-token');
      refreshTokenRepository.findByTokenHash.mockResolvedValue(null);

      await expect(tokenService.rotateRefreshToken('raw')).rejects.toThrow(UnauthorizedError);
    });

    it('should revoke all and throw if token was already revoked', async () => {
      cryptoService.hashToken.mockReturnValue('hash-token');
      refreshTokenRepository.findByTokenHash.mockResolvedValue({ revogado: true, usuario_id: 'user-id' });

      await expect(tokenService.rotateRefreshToken('raw')).rejects.toThrow('tentativa de reuso de sessão detectada');
      expect(refreshTokenRepository.revokeAllByUsuarioId).toHaveBeenCalledWith('user-id');
    });

    it('should throw if token is expired', async () => {
      cryptoService.hashToken.mockReturnValue('hash-token');
      refreshTokenRepository.findByTokenHash.mockResolvedValue({ expira_em: new Date('2000-01-01'), id: 'token-id' });

      await expect(tokenService.rotateRefreshToken('raw')).rejects.toThrow('Sessão expirada');
      expect(refreshTokenRepository.revoke).toHaveBeenCalledWith('token-id');
    });

    it('should throw if user is inactive', async () => {
      cryptoService.hashToken.mockReturnValue('hash-token');
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      refreshTokenRepository.findByTokenHash.mockResolvedValue({ expira_em: futureDate, user_id: '1', status: 'inativo' });

      await expect(tokenService.rotateRefreshToken('raw')).rejects.toThrow('Conta de usuário inativa ou bloqueada.');
    });

    it('should rotate token and return new credentials', async () => {
      cryptoService.hashToken.mockReturnValue('hash-token');
      cryptoService.generateRandomToken.mockReturnValue('new-raw-token');
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      refreshTokenRepository.findByTokenHash
        .mockResolvedValueOnce({ expira_em: futureDate, id: 'old-token', user_id: '1', status: 'ativo', email: 'a@a.com', role: 'PROF', nome: 'A' })
        .mockResolvedValueOnce({ id: 'new-token' });

      const result = await tokenService.rotateRefreshToken('raw');
      
      expect(result.newRefreshToken).toBe('new-raw-token');
      expect(result.accessToken).toBeTypeOf('string');
      expect(refreshTokenRepository.revoke).toHaveBeenCalledWith('old-token', 'new-token');
    });
  });

  describe('revokeRefreshToken', () => {
    it('should revoke if token exists', async () => {
      cryptoService.hashToken.mockReturnValue('hash-token');
      refreshTokenRepository.findByTokenHash.mockResolvedValue({ id: '1' });

      await tokenService.revokeRefreshToken('raw');
      expect(refreshTokenRepository.revoke).toHaveBeenCalledWith('1');
    });
  });
});

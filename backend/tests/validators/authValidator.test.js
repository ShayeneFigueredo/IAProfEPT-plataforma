import { describe, it, expect } from 'vitest';
import { registerDocenteSchema, loginDocenteSchema, validateBody, forgotPasswordSchema, resetPasswordSchema } from '../../src/validators/authValidator.js';
import { ValidationError } from '../../src/errors/AppError.js';

describe('authValidator', () => {
  describe('registerDocenteSchema', () => {
    it('should validate valid data', () => {
      const data = {
        nome: 'João Silva',
        email: 'joao.silva@ufjf.br',
        senha: 'Password123!',
        uf: 'MG',
        instituicao: 'UFJF',
        campus: 'Juiz de Fora',
        cursosTecnicos: ['Informática'],
        termoEticoAceito: true
      };
      
      const result = registerDocenteSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should invalidate missing email domain', () => {
      const data = {
        nome: 'João Silva',
        email: 'joao.silva@gmail.com', // Not institutional
        senha: 'Password123!',
        uf: 'MG',
        instituicao: 'UFJF',
        campus: 'Juiz de Fora',
        cursosTecnicos: ['Informática']
      };
      
      const result = registerDocenteSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('loginDocenteSchema', () => {
    it('should validate email login', () => {
      const result = loginDocenteSchema.safeParse({ email: 'test@ufjf.br', senha: '123' });
      expect(result.success).toBe(true);
    });

    it('should validate siape login', () => {
      const result = loginDocenteSchema.safeParse({ matriculaSiape: '123456789', senha: '123' });
      expect(result.success).toBe(true);
    });

    it('should fail if no identificador', () => {
      const result = loginDocenteSchema.safeParse({ senha: '123' });
      expect(result.success).toBe(false);
    });
  });

  describe('forgotPasswordSchema', () => {
    it('should validate valid email', () => {
      const result = forgotPasswordSchema.safeParse({ email: 'test@ufjf.br' });
      expect(result.success).toBe(true);
    });
  });

  describe('resetPasswordSchema', () => {
    it('should validate token and matching passwords', () => {
      const result = resetPasswordSchema.safeParse({ token: '123456789012', novaSenha: 'Password123!', confirmacaoSenha: 'Password123!' });
      expect(result.success).toBe(true);
    });
  });

  describe('validateBody middleware', () => {
    it('should call next on valid data', () => {
      const req = { body: { email: 'test@ufjf.br', senha: '123' } };
      const res = {};
      const next = vi.fn();
      validateBody(loginDocenteSchema)(req, res, next);
      expect(next).toHaveBeenCalledWith();
      expect(req.body.email).toBe('test@ufjf.br');
    });

    it('should call next with ValidationError on invalid data', () => {
      const req = { body: { email: 'invalid' } };
      const res = {};
      const next = vi.fn();
      validateBody(loginDocenteSchema)(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });
});

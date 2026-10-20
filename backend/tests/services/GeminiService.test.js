import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeminiService } from '../../src/services/GeminiService.js';
import { promptInjectionService } from '../../src/services/PromptInjectionService.js';
import { aiPostProcessor } from '../../src/services/AIPostProcessor.js';
import { AppError } from '../../src/errors/AppError.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

vi.mock('../../src/services/PromptInjectionService.js');
vi.mock('../../src/services/AIPostProcessor.js');
vi.mock('@google/generative-ai');

describe('GeminiService', () => {
  let geminiService;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
    geminiService = new GeminiService();
    geminiService.maxRetries = 1;
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  describe('getApiKey', () => {
    it('should throw if no API key', () => {
      delete process.env.GEMINI_API_KEY;
      expect(() => geminiService.getApiKey()).toThrow(AppError);
    });

    it('should return api key', () => {
      expect(geminiService.getApiKey()).toBe('test-key');
    });
  });

  describe('executarComResiliencia', () => {
    it('should handle successful generation', async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => '{"sucesso": true}',
          usageMetadata: { totalTokenCount: 10 }
        }
      });
      GoogleGenerativeAI.prototype.getGenerativeModel = vi.fn().mockReturnValue({
        generateContent: mockGenerateContent
      });

      const result = await geminiService.executarComResiliencia({ prompt: 'test' });
      expect(result.sucesso).toBe(true);
      expect(result.conteudoJson.sucesso).toBe(true);
    });

    it('should handle API failure and throw AppError', async () => {
      const mockGenerateContent = vi.fn().mockRejectedValue(new Error('Internal Server Error'));
      GoogleGenerativeAI.prototype.getGenerativeModel = vi.fn().mockReturnValue({
        generateContent: mockGenerateContent
      });

      await expect(geminiService.executarComResiliencia({ prompt: 'test' })).rejects.toThrow(AppError);
    });
  });

  describe('gerarAtividadeInterdisciplinar', () => {
    it('should generate successfully', async () => {
      promptInjectionService.montarPrompt.mockReturnValue({
        systemInstruction: 'sys',
        userPrompt: 'user',
        curriculoInjetado: {}
      });

      aiPostProcessor.processar.mockReturnValue({ success: true });

      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: { text: () => '{"atividade": "ok"}' }
      });
      GoogleGenerativeAI.prototype.getGenerativeModel = vi.fn().mockReturnValue({
        generateContent: mockGenerateContent
      });

      const res = await geminiService.gerarAtividadeInterdisciplinar({}, { gravarBanco: false });
      expect(res.success).toBe(true);
      expect(aiPostProcessor.processar).toHaveBeenCalled();
    });
  });

  describe('gerarPlanoAula', () => {
    it('should generate successfully', async () => {
      promptInjectionService.montarPrompt.mockReturnValue({
        systemInstruction: 'sys',
        userPrompt: 'user',
        curriculoInjetado: { metodologia: { nome: 'PBL' } }
      });

      aiPostProcessor.processar.mockReturnValue({ success: true });

      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: { text: () => '{"plano": "ok"}' }
      });
      GoogleGenerativeAI.prototype.getGenerativeModel = vi.fn().mockReturnValue({
        generateContent: mockGenerateContent
      });

      const res = await geminiService.gerarPlanoAula({}, { gravarBanco: false });
      expect(res.success).toBe(true);
    });
  });
  
  describe('gerarRoteiroPodcast', () => {
    it('should generate successfully', async () => {
      promptInjectionService.montarPrompt.mockReturnValue({
        systemInstruction: 'sys',
        userPrompt: 'user',
        curriculoInjetado: {}
      });

      aiPostProcessor.processar.mockReturnValue({ success: true });

      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: { text: () => '{"podcast": "ok"}' }
      });
      GoogleGenerativeAI.prototype.getGenerativeModel = vi.fn().mockReturnValue({
        generateContent: mockGenerateContent
      });

      const res = await geminiService.gerarRoteiroPodcast({}, { gravarBanco: false });
      expect(res.success).toBe(true);
    });
  });
});

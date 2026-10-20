import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GroqService } from '../../src/services/GroqService.js';
import { promptInjectionService } from '../../src/services/PromptInjectionService.js';
import { aiPostProcessor } from '../../src/services/AIPostProcessor.js';
import { RateLimitError, AppError } from '../../src/errors/AppError.js';

vi.mock('../../src/services/PromptInjectionService.js');
vi.mock('../../src/services/AIPostProcessor.js');

describe('GroqService', () => {
  let groqService;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GROQ_API_KEY = 'test-key';
    groqService = new GroqService();
    groqService.timeoutMs = 1000;
    groqService.maxRetries = 1;
    global.fetch = vi.fn();
  });

  afterEach(() => {
    delete process.env.GROQ_API_KEY;
  });

  describe('getApiKey', () => {
    it('should throw if no API key', () => {
      delete process.env.GROQ_API_KEY;
      expect(() => groqService.getApiKey()).toThrow(AppError);
    });

    it('should return api key', () => {
      expect(groqService.getApiKey()).toBe('test-key');
    });
  });

  describe('completarChat', () => {
    it('should handle 200 OK', async () => {
      const mockResponse = {
        status: 200,
        headers: new Map(),
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: '{"sucesso": true}' } }],
          usage: { total_tokens: 10 }
        })
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await groqService.completarChat({ messages: [] });
      expect(result.sucesso).toBe(true);
      expect(result.conteudoJson.sucesso).toBe(true);
    });

    it('should handle 429 Rate Limit', async () => {
      const mockResponse = {
        status: 429,
        headers: new Map(),
        text: vi.fn().mockResolvedValue('Rate limit')
      };
      global.fetch.mockResolvedValue(mockResponse);

      await expect(groqService.completarChat({ messages: [] })).rejects.toThrow(RateLimitError);
    });

    it('should handle 404 Model Not Found and trigger fallback', async () => {
      const mockResponse404 = {
        status: 404,
        headers: new Map(),
        json: vi.fn().mockResolvedValue({ error: { code: 'model_not_found' } })
      };
      const mockResponse200 = {
        status: 200,
        headers: new Map(),
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: '{"fallback": true}' } }],
          usage: {}
        })
      };
      
      global.fetch.mockResolvedValueOnce(mockResponse404).mockResolvedValueOnce(mockResponse200);

      const result = await groqService.completarChat({ messages: [] });
      expect(result.fallbackUtilizado).toBe(true);
      expect(result.modelo).toBe(groqService.fallbackModel);
    });
  });

  describe('gerarAtividadeCurricular', () => {
    it('should generate successfully', async () => {
      promptInjectionService.montarPrompt.mockReturnValue({
        groqPayload: { messages: [], response_format: {} },
        curriculoInjetado: {}
      });

      aiPostProcessor.processar.mockReturnValue({ success: true });

      const mockResponse = {
        status: 200,
        headers: new Map(),
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: '{"atividade": "ok"}' } }],
          usage: {}
        })
      };
      global.fetch.mockResolvedValue(mockResponse);

      const res = await groqService.gerarAtividadeCurricular({}, { gravarBanco: false });
      expect(res.success).toBe(true);
      expect(aiPostProcessor.processar).toHaveBeenCalled();
    });
  });

  describe('benchmarkLpu', () => {
    it('should run benchmark', async () => {
      const mockResponse = {
        status: 200,
        headers: new Map(),
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: '{"diagnostico": "lpu_operacional"}' } }],
          usage: {}
        })
      };
      global.fetch.mockResolvedValue(mockResponse);

      const res = await groqService.benchmarkLpu();
      expect(res.status).toBe('operacional');
    });
  });
});

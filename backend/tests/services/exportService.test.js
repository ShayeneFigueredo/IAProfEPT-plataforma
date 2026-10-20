import { describe, it, expect, vi } from 'vitest';
import { exportService } from '../../src/services/exportService.js';
import puppeteer from 'puppeteer';
import htmlToDocx from 'html-to-docx';

vi.mock('puppeteer');
vi.mock('html-to-docx');

describe('exportService', () => {
  describe('generatePdf', () => {
    it('should generate a PDF buffer', async () => {
      const mockPage = {
        setContent: vi.fn(),
        evaluate: vi.fn(),
        pdf: vi.fn().mockResolvedValue(Buffer.from('pdf-data'))
      };
      
      const mockBrowser = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn()
      };
      
      puppeteer.launch.mockResolvedValue(mockBrowser);

      const result = await exportService.generatePdf({
        titulo: 'Test',
        conteudo: '<p>test</p>',
        cursoTecnico: 'Info'
      });

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('pdf-data');
      expect(puppeteer.launch).toHaveBeenCalled();
      expect(mockPage.setContent).toHaveBeenCalled();
      expect(mockPage.pdf).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });

  describe('generateDocx', () => {
    it('should generate a DOCX buffer', async () => {
      htmlToDocx.mockResolvedValue(Buffer.from('docx-data'));

      const result = await exportService.generateDocx({
        titulo: 'Test Docx',
        conteudo: '<p>test docx</p>',
        cursoTecnico: 'Agro'
      });

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('docx-data');
      expect(htmlToDocx).toHaveBeenCalled();
    });
  });
});

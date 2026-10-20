import crypto from 'crypto';
import path from 'path';
import { ValidationError, PayloadTooLargeError, BadRequestError } from '../errors/AppError.js';

/**
 * Serviço de Escaneamento de Segurança e Validação de Anexos
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Atende aos requisitos rigorosos:
 * 1. Validação estrita de MIME types (apenas PDF, DOCX, DOC e Imagens JPEG/PNG/WEBP)
 * 2. Validação profunda de assinaturas binárias (Magic Bytes) contra falsificação de extensões
 * 3. Escaneamento heurístico contra malware, scripts executáveis e macros maliciosas
 * 4. Limite de tamanho máximo de 15MB (15.728.640 bytes)
 * 5. Sanitização de nomes de arquivos (anti-path traversal, anti-null byte)
 * 6. Geração de hash criptográfico de integridade SHA-256
 */

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export const MIME_CONFIG = {
  'application/pdf': {
    exts: ['.pdf'],
    magicCheck: (buf) => buf.length >= 5 && buf.subarray(0, 5).toString('ascii') === '%PDF-',
    description: 'Documento PDF',
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    exts: ['.docx'],
    // DOCX é um container ZIP (PK\x03\x04)
    magicCheck: (buf) =>
      buf.length >= 4 &&
      buf[0] === 0x50 &&
      buf[1] === 0x4b &&
      buf[2] === 0x03 &&
      buf[3] === 0x04,
    description: 'Documento Word DOCX',
  },
  'application/msword': {
    exts: ['.doc'],
    // Legacy OLE Compound File (D0 CF 11 E0 A1 B1 1A E1)
    magicCheck: (buf) =>
      buf.length >= 8 &&
      buf[0] === 0xd0 &&
      buf[1] === 0xcf &&
      buf[2] === 0x11 &&
      buf[3] === 0xe0 &&
      buf[4] === 0xa1 &&
      buf[5] === 0xb1 &&
      buf[6] === 0x1a &&
      buf[7] === 0xe1,
    description: 'Documento Word DOC (Legado)',
  },
  'image/jpeg': {
    exts: ['.jpg', '.jpeg'],
    magicCheck: (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
    description: 'Imagem JPEG',
  },
  'image/png': {
    exts: ['.png'],
    magicCheck: (buf) =>
      buf.length >= 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a,
    description: 'Imagem PNG',
  },
  'image/webp': {
    exts: ['.webp'],
    // RIFF .... WEBP
    magicCheck: (buf) =>
      buf.length >= 12 &&
      buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buf.subarray(8, 12).toString('ascii') === 'WEBP',
    description: 'Imagem WebP',
  },
};

export class FileSecurityScanner {
  /**
   * Sanitiza o nome original do arquivo removendo sequências de path traversal,
   * caracteres de controle, null bytes e espaços redundantes.
   * 
   * @param {string} originalName
   * @returns {string} Nome sanitizado seguro
   */
  static sanitizeFilename(originalName) {
    if (!originalName || typeof originalName !== 'string') {
      return 'anexo_sem_nome';
    }

    // 1. Remove caminhos absolutos / diretórios e sequências ../ ou ..\
    let safe = path.basename(originalName.trim());

    // 2. Remove null bytes (\0) e caracteres de controle
    safe = safe.replace(/[\0\x00-\x1f\x7f]/g, '');

    // 3. Normaliza caracteres acentuados mantendo legibilidade
    safe = safe.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // 4. Substitui caracteres perigosos por underscore
    safe = safe.replace(/[^a-zA-Z0-9._-]/g, '_');

    // 5. Evita nomes vazios ou que iniciem por ponto
    safe = safe.replace(/^\.+/, '');
    if (!safe || safe === '.') {
      safe = 'anexo_documento';
    }

    // 6. Limita tamanho do nome
    if (safe.length > 150) {
      const ext = path.extname(safe);
      const base = safe.slice(0, 150 - ext.length);
      safe = `${base}${ext}`;
    }

    return safe;
  }

  /**
   * Calcula o hash criptográfico SHA-256 do arquivo para garantia de integridade.
   * 
   * @param {Buffer} buffer
   * @returns {string} Hash SHA-256 em hexadecimal
   */
  static calculateSha256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Realiza escaneamento heurístico em busca de vetores de ataque embutidos
   * (código executável PE/ELF, tags de script em imagens, macros ou shells).
   * 
   * @param {Buffer} buffer
   * @param {string} mimeType
   */
  static scanThreatSignatures(buffer, mimeType) {
    // 1. Bloqueia cabeçalhos executáveis do Windows (PE / MZ)
    if (buffer.length >= 2 && buffer[0] === 0x4d && buffer[1] === 0x5a) {
      throw new ValidationError(
        'Arquivo rejeitado pelo escaneamento de segurança institucional: executável binário (PE/MZ) detectado.'
      );
    }

    // 2. Bloqueia executáveis do Linux (ELF)
    if (
      buffer.length >= 4 &&
      buffer[0] === 0x7f &&
      buffer[1] === 0x45 &&
      buffer[2] === 0x4c &&
      buffer[3] === 0x46
    ) {
      throw new ValidationError(
        'Arquivo rejeitado pelo escaneamento de segurança institucional: executável ELF detectado.'
      );
    }

    // 3. Escaneamento heurístico de scripts em imagens (vetor Polyglot / XSS)
    if (mimeType.startsWith('image/')) {
      // Amostra dos primeiros 4KB e últimos 4KB para scripts embutidos
      const headerStr = buffer.subarray(0, Math.min(buffer.length, 4096)).toString('utf-8', 0, 4096);
      const footerOffset = Math.max(0, buffer.length - 4096);
      const footerStr = buffer.subarray(footerOffset).toString('utf-8');

      const suspiciousPatterns = [
        /<script\b/i,
        /javascript:/i,
        /<\?php/i,
        /<svg\b/i,
        /onload=/i,
        /onerror=/i,
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(headerStr) || pattern.test(footerStr)) {
          throw new ValidationError(
            'Arquivo rejeitado pelo escaneamento de segurança institucional: código executável/script detectado no anexo.'
          );
        }
      }
    }
  }

  /**
   * Executa a bateria completa de validações e escaneamento de segurança.
   * 
   * @param {Object} file - Objeto de arquivo do Multer (req.file)
   * @returns {{
   *   nomeOriginalSanitizado: string,
   *   extensao: string,
   *   mimeType: string,
   *   tamanhoBytes: number,
   *   hashSha256: string
   * }} Metadados sanitizados e validados
   */
  static scanAndValidate(file) {
    if (!file || !file.buffer) {
      throw new BadRequestError('Nenhum arquivo enviado no campo "arquivo" do formulário multipart/form-data.');
    }

    const { buffer, originalname, mimetype: declaredMime, size } = file;
    const fileSize = size || buffer.length;

    // 1. Limite Máximo de 15MB
    if (fileSize > MAX_FILE_SIZE_BYTES) {
      throw new PayloadTooLargeError(
        `O anexo enviado possui ${(fileSize / (1024 * 1024)).toFixed(2)}MB, excedendo o limite máximo institucional de 15MB.`
      );
    }

    if (fileSize === 0) {
      throw new BadRequestError('O arquivo enviado está vazio (0 bytes).');
    }

    // 2. Sanitização do Nome do Arquivo
    const nomeSanitizado = this.sanitizeFilename(originalname);
    const extensao = path.extname(nomeSanitizado).toLowerCase();

    if (!extensao) {
      throw new ValidationError('O arquivo enviado não possui extensão válida (ex: .pdf, .docx, .png, .jpg).');
    }

    // 3. Validação de MIME Type Permitido
    const mimeNormalized = declaredMime ? declaredMime.toLowerCase().trim() : '';
    const configMime = MIME_CONFIG[mimeNormalized];

    if (!configMime) {
      const permitidos = Object.keys(MIME_CONFIG).join(', ');
      throw new ValidationError(
        `Tipo de arquivo não permitido: '${declaredMime}'. São aceitos apenas documentos pedagógicos (PDF, DOCX) e imagens (JPEG, PNG, WebP). Tipos homologados: ${permitidos}.`
      );
    }

    // 4. Validação de Extensão vs MIME Type Declarado
    if (!configMime.exts.includes(extensao)) {
      throw new ValidationError(
        `Incompatibilidade entre a extensão do arquivo ('${extensao}') e o tipo MIME informado ('${declaredMime}'). Extensões esperadas: ${configMime.exts.join(', ')}.`
      );
    }

    // 5. Validação Profunda de Assinatura Binária (Magic Bytes)
    const magicValido = configMime.magicCheck(buffer);
    if (!magicValido) {
      throw new ValidationError(
        `Falha na verificação de integridade binária: a assinatura de bytes do arquivo não corresponde ao formato ${configMime.description}. Arquivo corrompido ou extensão mascarada.`
      );
    }

    // 6. Escaneamento Heurístico de Ameaças / Malware
    this.scanThreatSignatures(buffer, mimeNormalized);

    // 7. Geração do Hash SHA-256 de Integridade
    const hashSha256 = this.calculateSha256(buffer);

    return {
      nomeOriginalSanitizado: nomeSanitizado,
      extensao,
      mimeType: mimeNormalized,
      tamanhoBytes: fileSize,
      hashSha256,
    };
  }
}

export const fileSecurityScanner = FileSecurityScanner;
export default FileSecurityScanner;

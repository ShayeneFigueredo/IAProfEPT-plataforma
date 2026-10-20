import multer from 'multer';
import { MAX_FILE_SIZE_BYTES } from '../services/FileSecurityScanner.js';

/**
 * Middleware de Upload Multipart/form-data com Armazenamento em Memória
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Configuração:
 * - memoryStorage: disponibiliza o buffer em RAM para cálculo de SHA-256 e validação de Magic Bytes
 * - limits: 15MB por arquivo, 1 arquivo por envio
 * - Suporte flexível aos campos: 'arquivo', 'file' ou 'anexo'
 */

const storage = multer.memoryStorage();

const multerHandler = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES, // 15MB
    files: 1,
  },
}).fields([
  { name: 'arquivo', maxCount: 1 },
  { name: 'file', maxCount: 1 },
  { name: 'anexo', maxCount: 1 },
]);

export function uploadSingleAnexo(req, res, next) {
  multerHandler(req, res, (err) => {
    if (err) {
      return next(err);
    }

    if (req.files) {
      req.file =
        req.files['arquivo']?.[0] ||
        req.files['file']?.[0] ||
        req.files['anexo']?.[0] ||
        null;
    }

    next();
  });
}

export default uploadSingleAnexo;

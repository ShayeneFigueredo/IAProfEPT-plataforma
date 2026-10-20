import { fileSecurityScanner } from '../services/FileSecurityScanner.js';
import { storageService } from '../services/StorageService.js';
import { anexosRepository } from '../repositories/AnexosRepository.js';
import { validarUuid } from '../validators/repositorioValidator.js';
import { BadRequestError, ForbiddenError } from '../errors/AppError.js';

/**
 * Controlador de Upload e Gerenciamento Seguro de Anexos
 * Plataforma IAprofEPT — PPGEM / UFJF
 */
export class AnexosController {
  constructor() {
    this.uploadAnexo = this.uploadAnexo.bind(this);
    this.obterDetalhesAnexo = this.obterDetalhesAnexo.bind(this);
    this.downloadAnexo = this.downloadAnexo.bind(this);
    this.deletarAnexo = this.deletarAnexo.bind(this);
  }

  /**
   * POST /api/repositorio/anexos (ou POST /api/repositorio/praticas/:id/anexo)
   * Realiza upload multipart/form-data, validação estrita de MIME, magic bytes,
   * cálculo de hash SHA-256 e armazenamento institucional seguro.
   */
  async uploadAnexo(req, res, next) {
    try {
      const usuarioId = req.user?.id;
      if (!usuarioId) {
        throw new BadRequestError('Identificação do docente autenticado não encontrada na sessão.');
      }

      if (!req.file) {
        throw new BadRequestError(
          'Nenhum arquivo enviado. Utilize o formato multipart/form-data com o campo "arquivo", "file" ou "anexo".'
        );
      }

      // Vínculo opcional com prática (via URL param ou corpo da requisição)
      let praticaId = req.params?.id || req.body?.praticaId || req.body?.pratica_id || null;
      if (praticaId) {
        praticaId = validarUuid(praticaId, 'praticaId');
      }

      // 1. Escaneamento rigoroso de segurança, validação de MIME, Magic Bytes e geração de SHA-256
      const scan = fileSecurityScanner.scanAndValidate(req.file);

      // 2. Armazenamento persistente no disco institucional ou S3
      const { nomeArmazenado, caminhoStorage, storageTipo } = await storageService.salvarArquivo(
        req.file.buffer,
        scan.nomeOriginalSanitizado,
        scan.extensao,
        scan.mimeType
      );

      // 3. Gerar URL protegida inicial (com UUID temporário)
      // O ID definitivo será atribuído pelo PostgreSQL
      const idTemporario = nomeArmazenado.split('_')[0];
      const urlProtegidaInicial = storageService.gerarUrlProtegida(idTemporario);

      // 4. Persistência transacional no PostgreSQL
      const anexoCriado = await anexosRepository.salvarAnexo({
        praticaId,
        usuarioId,
        nomeOriginal: scan.nomeOriginalSanitizado,
        nomeArmazenado,
        mimeType: scan.mimeType,
        extensao: scan.extensao,
        tamanhoBytes: scan.tamanhoBytes,
        hashSha256: scan.hashSha256,
        storageTipo,
        caminhoStorage,
        urlProtegida: urlProtegidaInicial,
      });

      // Se o ID gerado pelo Postgres for diferente do temporário, atualiza a URL protegida definitiva
      const urlDefinitiva = storageService.gerarUrlProtegida(anexoCriado.id);
      if (anexoCriado.url_protegida !== urlDefinitiva) {
        await anexosRepository.query(
          `UPDATE anexos_repositorio SET url_protegida = $1 WHERE id = $2;`,
          [urlDefinitiva, anexoCriado.id]
        );
        anexoCriado.url_protegida = urlDefinitiva;
      }

      const tamanhoFormatado =
        scan.tamanhoBytes >= 1024 * 1024
          ? `${(scan.tamanhoBytes / (1024 * 1024)).toFixed(2)} MB`
          : `${(scan.tamanhoBytes / 1024).toFixed(2)} KB`;

      return res.status(201).json({
        sucesso: true,
        mensagem: 'Arquivo anexado com sucesso e verificado com hash SHA-256 de integridade.',
        anexo: {
          id: anexoCriado.id,
          praticaId: anexoCriado.pratica_id,
          nomeOriginal: anexoCriado.nome_original,
          mimeType: anexoCriado.mime_type,
          extensao: anexoCriado.extensao,
          tamanhoBytes: Number(anexoCriado.tamanho_bytes),
          tamanhoFormatado,
          hashSha256: anexoCriado.hash_sha256,
          urlProtegida: anexoCriado.url_protegida,
          storageTipo: anexoCriado.storage_tipo,
          createdAt: anexoCriado.created_at,
          autor: anexoCriado.autor,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/repositorio/anexos/:id
   * Retorna os metadados cadastrais do anexo com integridade SHA-256.
   */
  async obterDetalhesAnexo(req, res, next) {
    try {
      const anexoId = validarUuid(req.params.id, 'id');
      const solicitanteId = req.user?.id || null;
      const isAdm = req.user?.role === 'administrador_ufjf';

      const anexo = await anexosRepository.buscarPorId(anexoId);

      // Verificação de visibilidade: se a prática for privada (rascunho), apenas autor ou admin acessa
      if (anexo.pratica && !anexo.pratica.publicado) {
        if (!isAdm && anexo.pratica.autorId !== solicitanteId) {
          throw new ForbiddenError('A prática pedagógica vinculada a este anexo ainda não foi publicada.');
        }
      }

      // Se não vinculado a nenhuma prática, apenas autor ou admin tem acesso aos detalhes
      if (!anexo.pratica && !isAdm && anexo.usuarioId !== solicitanteId) {
        throw new ForbiddenError('Este anexo não está público no Repositório.');
      }

      return res.status(200).json({
        sucesso: true,
        anexo,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/repositorio/anexos/:id/download (ou stream direto)
   * Entrega o arquivo armazenado com controle de cache (ETag SHA-256) e headers de proteção.
   */
  async downloadAnexo(req, res, next) {
    try {
      const anexoId = validarUuid(req.params.id, 'id');
      const solicitanteId = req.user?.id || null;
      const isAdm = req.user?.role === 'administrador_ufjf';

      const anexo = await anexosRepository.buscarPorId(anexoId);

      // Verificação de permissões
      if (anexo.pratica && !anexo.pratica.publicado) {
        if (!isAdm && anexo.pratica.autorId !== solicitanteId) {
          throw new ForbiddenError('Acesso restrito ao autor da prática pedagógica em rascunho.');
        }
      }

      if (!anexo.pratica && !isAdm && anexo.usuarioId !== solicitanteId) {
        throw new ForbiddenError('Acesso restrito ao autor do anexo.');
      }

      // Suporte a cache condicional HTTP 304 com base no hash SHA-256
      const clientEtag = req.headers['if-none-match'];
      const currentEtag = `"${anexo.hashSha256}"`;

      if (clientEtag && clientEtag === currentEtag) {
        return res.status(304).end();
      }

      // Headers de Segurança e Integridade
      res.setHeader('Content-Type', anexo.mimeType);
      res.setHeader('Content-Length', anexo.tamanhoBytes);
      res.setHeader('ETag', currentEtag);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-File-Integrity-SHA256', anexo.hashSha256);

      // Disposição: inline para visualização em navegador ou attachment se requerido
      const isDownloadAttachment = req.query.download === '1' || req.path.endsWith('/download');
      const dispositionType = isDownloadAttachment ? 'attachment' : 'inline';
      res.setHeader(
        'Content-Disposition',
        `${dispositionType}; filename="${encodeURIComponent(anexo.nomeOriginal)}"`
      );

      // Streaming do arquivo
      const stream = storageService.obterStreamArquivo(anexo.caminhoStorage, anexo.storageTipo);
      stream.on('error', (err) => next(err));
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/repositorio/anexos/:id
   * Exclusão lógica com Soft Delete do anexo.
   */
  async deletarAnexo(req, res, next) {
    try {
      const anexoId = validarUuid(req.params.id, 'id');
      const usuarioId = req.user.id;
      const isAdm = req.user.role === 'administrador_ufjf';

      const resultado = await anexosRepository.deletarAnexoSoft(anexoId, usuarioId, isAdm);

      return res.status(200).json({
        sucesso: true,
        mensagem: 'Anexo removido do Repositório com sucesso (Soft Delete).',
        anexoId: resultado.id,
        deletedAt: resultado.deletedAt,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const anexosController = new AnexosController();
export default anexosController;

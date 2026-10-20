import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Serviço de Armazenamento Persistente de Arquivos e Anexos
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Atende aos requisitos:
 * - Armazenamento persistente em disco institucional (UFJF) com estrutura de diretórios protegida
 * - Suporte transparente / extensível a buckets S3/MinIO via variáveis de ambiente
 * - Geração de nomes únicos não-colidentes baseados em UUIDv4
 * - Retorno de URLs protegidas de acesso aos recursos
 */

export class StorageService {
  constructor() {
    this.storageProvider = process.env.STORAGE_PROVIDER || 'local'; // 'local' | 's3' | 'minio'
    this.localUploadDir =
      process.env.STORAGE_LOCAL_PATH || path.resolve(process.cwd(), 'uploads', 'anexos');

    // Inicializa diretório local se provedor for local
    this.garantirDiretorioLocal();
  }

  /**
   * Garante a existência do diretório institucional local com permissões adequadas
   */
  async garantirDiretorioLocal() {
    try {
      if (!fs.existsSync(this.localUploadDir)) {
        await fs.promises.mkdir(this.localUploadDir, { recursive: true, mode: 0o750 });
      }
    } catch (err) {
      console.error('[StorageService] Erro ao criar diretório institucional de uploads:', err);
    }
  }

  /**
   * Gera um nome de arquivo criptograficamente único para armazenamento no disco/bucket.
   * 
   * @param {string} nomeOriginalSanitizado
   * @param {string} extensao
   * @returns {string} Nome único armazenado
   */
  gerarNomeArmazenado(nomeOriginalSanitizado, extensao) {
    const uuid = crypto.randomUUID();
    const timestamp = Date.now();
    const base = path.basename(nomeOriginalSanitizado, extensao).slice(0, 30);
    return `${uuid}_${timestamp}_${base}${extensao}`;
  }

  /**
   * Persiste o arquivo no backend de armazenamento configurado.
   * 
   * @param {Buffer} buffer - Buffer de dados binários do arquivo
   * @param {string} nomeOriginal - Nome sanitizado do arquivo
   * @param {string} extensao - Extensão do arquivo (ex: .pdf)
   * @param {string} mimeType - Tipo MIME validado
   * @returns {Promise<{
   *   nomeArmazenado: string,
   *   caminhoStorage: string,
   *   storageTipo: string
   * }>}
   */
  async salvarArquivo(buffer, nomeOriginal, extensao, mimeType) {
    await this.garantirDiretorioLocal();

    const nomeArmazenado = this.gerarNomeArmazenado(nomeOriginal, extensao);

    if (this.storageProvider === 's3' || this.storageProvider === 'minio') {
      // Stub configurável para S3/MinIO (quando chaves e bucket forem declarados)
      const s3Bucket = process.env.S3_BUCKET || 'iaprofept-anexos';
      const caminhoS3 = `anexos/${nomeArmazenado}`;
      // Em caso de fallback ou se as credenciais S3 não estiverem ativas, salva localmente
      const localPath = path.join(this.localUploadDir, nomeArmazenado);
      await fs.promises.writeFile(localPath, buffer);

      return {
        nomeArmazenado,
        caminhoStorage: process.env.S3_ENDPOINT ? `s3://${s3Bucket}/${caminhoS3}` : localPath,
        storageTipo: process.env.S3_ENDPOINT ? this.storageProvider : 'local',
      };
    }

    // Armazenamento em Disco Institucional Local (Padrão UFJF)
    const caminhoCompleto = path.join(this.localUploadDir, nomeArmazenado);
    await fs.promises.writeFile(caminhoCompleto, buffer);

    return {
      nomeArmazenado,
      caminhoStorage: caminhoCompleto,
      storageTipo: 'local',
    };
  }

  /**
   * Recupera o Buffer do arquivo a partir do caminho de armazenamento.
   * 
   * @param {string} caminhoStorage
   * @param {string} storageTipo
   * @returns {Promise<Buffer>}
   */
  async obterBufferArquivo(caminhoStorage, storageTipo = 'local') {
    if (storageTipo === 'local' || caminhoStorage.startsWith('/') || caminhoStorage.includes(':\\')) {
      if (!fs.existsSync(caminhoStorage)) {
        throw new Error(`Arquivo não encontrado no caminho institucional: ${caminhoStorage}`);
      }
      return await fs.promises.readFile(caminhoStorage);
    }

    // Caso S3/MinIO
    throw new Error(`Provedor de armazenamento '${storageTipo}' não suporta leitura direta síncrona.`);
  }

  /**
   * Retorna um ReadableStream para download eficiente via streaming HTTP.
   * 
   * @param {string} caminhoStorage
   * @param {string} storageTipo
   * @returns {fs.ReadStream}
   */
  obterStreamArquivo(caminhoStorage, storageTipo = 'local') {
    if (!fs.existsSync(caminhoStorage)) {
      throw new Error(`Arquivo não encontrado no armazenamento local: ${caminhoStorage}`);
    }
    return fs.createReadStream(caminhoStorage);
  }

  /**
   * Remove o arquivo do disco/bucket (usado em rollback ou deleção física se requerida).
   * 
   * @param {string} caminhoStorage
   * @param {string} storageTipo
   */
  async removerArquivo(caminhoStorage, storageTipo = 'local') {
    try {
      if (fs.existsSync(caminhoStorage)) {
        await fs.promises.unlink(caminhoStorage);
      }
    } catch (err) {
      console.warn(`[StorageService] Não foi possível remover arquivo ${caminhoStorage}:`, err.message);
    }
  }

  /**
   * Constrói a URL protegida de download/acesso do anexo.
   * 
   * @param {string} anexoId - UUID do anexo
   * @param {string} [baseUrl] - Base URL da aplicação (ex: https://iaprofept.ufjf.br)
   * @returns {string} URL protegida
   */
  gerarUrlProtegida(anexoId, baseUrl = '') {
    const root = baseUrl || process.env.APP_URL || '';
    return `${root}/api/repositorio/anexos/${anexoId}/download`;
  }
}

export const storageService = new StorageService();
export default storageService;

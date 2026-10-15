import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Serviço Criptográfico e de Hashing Seguro
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Atende aos requisitos:
 * - Hash de senhas com bcrypt (salt factor 12)
 * - Hashes determinísticos SHA-256 para tokens de sessão
 * - Geração de tokens de alta entropia criptográfica
 */

const SALT_ROUNDS = 12;

export class CryptoService {
  /**
   * Gera hash seguro para senha utilizando bcrypt com salt factor 12
   * @param {string} password - Senha em texto plano
   * @returns {Promise<string>}
   */
  async hashPassword(password) {
    if (!password || typeof password !== 'string') {
      throw new Error('A senha deve ser uma string não vazia.');
    }
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Compara uma senha em texto plano com o hash bcrypt armazenado
   * @param {string} password - Senha fornecida
   * @param {string} hash - Hash armazenado
   * @returns {Promise<boolean>}
   */
  async comparePassword(password, hash) {
    if (!password || !hash) return false;
    return bcrypt.compare(password, hash);
  }

  /**
   * Gera hash SHA-256 de um token para busca indexada e segurança em repouso
   * @param {string} token
   * @returns {string} Hash SHA-256 em hexadecimal (64 caracteres)
   */
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Gera string aleatória criptograficamente segura (entropia de 320 bits)
   * @param {number} bytes - Quantidade de bytes de entropia (padrão 40)
   * @returns {string}
   */
  generateRandomToken(bytes = 40) {
    return crypto.randomBytes(bytes).toString('hex');
  }

  /**
   * Anonimiza o endereço IP para proteção de privacidade (LGPD & Resolução CNS 510/2016)
   * Mascara o último octeto de endereços IPv4 (/24) e os últimos 80 bits de IPv6 (/48)
   * @param {string} ip
   * @returns {string}
   */
  anonymizeIp(ip) {
    if (!ip || typeof ip !== 'string') return '0.0.0.0/24';

    let cleanIp = ip.trim();
    if (cleanIp.startsWith('::ffff:')) {
      cleanIp = cleanIp.substring(7);
    }

    if (cleanIp === '::1' || cleanIp === '127.0.0.1' || cleanIp === 'localhost') {
      return '127.0.0.0/24';
    }

    // IPv4: ex: 192.168.1.100 -> 192.168.1.0/24
    if (cleanIp.includes('.')) {
      const parts = cleanIp.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
      }
    }

    // IPv6: ex: 2001:db8:85a3:0:0:8a2e:370:7334 -> 2001:db8:85a3::/48
    if (cleanIp.includes(':')) {
      const parts = cleanIp.split(':');
      if (parts.length >= 3) {
        return `${parts[0]}:${parts[1]}:${parts[2]}::/48`;
      }
    }

    return '0.0.0.0/24';
  }
}

export const cryptoService = new CryptoService();
export default cryptoService;

import { userRepository } from '../repositories/UserRepository.js';
import { passwordResetRepository } from '../repositories/PasswordResetRepository.js';
import { refreshTokenRepository } from '../repositories/RefreshTokenRepository.js';
import { consentimentoTcleRepository } from '../repositories/ConsentimentoTcleRepository.js';
import { TCLE_CONFIG } from '../config/tcleConstants.js';
import { cryptoService } from './CryptoService.js';
import { tokenService } from './TokenService.js';
import { ConflictError, NotFoundError, UnauthorizedError, BadRequestError } from '../errors/AppError.js';

/**
 * Serviço de Autenticação e Gestão de Docentes
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Atende às diretrizes:
 * - Validação de unicidade de e-mail e matrícula SIAPE
 * - Hashing seguro via Argon2id / bcrypt salt 12
 * - Persistência atômica e geração de par Access Token + Refresh Token
 * - NENHUMA exposição de hash de senha nas saídas
 */
export class AuthService {
  /**
   * Registra um novo docente da RFEPCT na plataforma
   * @param {object} docenteData - Dados validados via Zod schema
   * @param {object} meta - { ip, userAgent }
   * @returns {Promise<object>} Perfil higienizado e tokens de sessão
   */
  async registerDocente(docenteData, meta = {}) {
    // 1. Verificação de unicidade do e-mail institucional
    const existingUser = await userRepository.findByEmail(docenteData.email);
    if (existingUser) {
      throw new ConflictError(
        'O e-mail institucional informado já está cadastrado na plataforma IAprofEPT.'
      );
    }

    // 2. Verificação de unicidade da matrícula SIAPE (se informada)
    if (docenteData.matriculaSiape) {
      const existingSiape = await userRepository.findByMatriculaSiape(docenteData.matriculaSiape);
      if (existingSiape) {
        throw new ConflictError(
          'A matrícula SIAPE informada já está vinculada a outro perfil docente cadastrado.'
        );
      }
    }

    // 3. Resolução da Instituição de Origem da RFEPCT (se informada por sigla, nome ou ID)
    let instituicaoId = docenteData.instituicaoId || null;
    let instituicaoInfo = null;

    if (instituicaoId) {
      instituicaoInfo = await userRepository.findInstituicao({ id: instituicaoId });
    } else if (docenteData.instituicao) {
      instituicaoInfo = await userRepository.findInstituicao({
        termo: docenteData.instituicao,
        uf: docenteData.uf,
        campus: docenteData.campus,
      });
      if (instituicaoInfo) {
        instituicaoId = instituicaoInfo.id;
      }
    }

    // 4. Hashing de senha com bcrypt (salt factor 12)
    const senhaHash = await cryptoService.hashPassword(docenteData.senha);

    // 5. Persistência atômica no PostgreSQL (usuarios + perfis_docentes + consentimentos_tcle)
    const ipAnonimizado = cryptoService.anonymizeIp(meta.ip || '127.0.0.1');
    const { usuario, perfil, consentimento } = await userRepository.createDocenteWithProfile({
      userData: {
        nome: docenteData.nome,
        email: docenteData.email,
        senhaHash,
        role: 'docente_rfepct',
        status: 'ativo',
      },
      profileData: {
        instituicaoId,
        uf: docenteData.uf,
        matriculaSiape: docenteData.matriculaSiape || null,
        areaAtuacao: docenteData.areaAtuacao || 'Matemática',
        cursosTecnicos: docenteData.cursosTecnicos,
        termoEticoAceito: docenteData.termoEticoAceito !== false,
        termoEticoVersao: '1.0',
        ipOrigem: meta.ip || null,
      },
      consentData: {
        versaoTermo: '1.0',
        ipAnonimizado,
        userAgent: meta.userAgent || null,
      },
    });

    // 6. Geração de Access Token JWT (15min) e Refresh Token (7 dias)
    const accessToken = tokenService.generateAccessToken(usuario);
    const { rawToken: refreshToken } = await tokenService.createRefreshToken(usuario, meta);

    // 7. Retorno higienizado (SEM senha_hash)
    return {
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        status: usuario.status,
        createdAt: usuario.created_at,
      },
      perfil: {
        id: perfil.id,
        uf: perfil.uf,
        instituicaoOrigem: perfil.instituicao?.nome || docenteData.instituicao || 'Rede Federal de EPCT',
        campus: perfil.instituicao?.campus || docenteData.campus,
        instituicaoId: perfil.instituicao_id,
        instituicao: perfil.instituicao || null,
        matriculaSiape: perfil.matricula_siape,
        areaAtuacao: perfil.area_atuacao,
        cursosTecnicos: perfil.cursos_tecnicos,
        termoEtico: {
          aceito: perfil.termo_etico_aceito,
          versao: perfil.termo_etico_versao,
          dataAceite: consentimento?.created_at || perfil.data_aceite_termo,
          ipAnonimizado: consentimento?.ip_anonimizado || ipAnonimizado,
        },
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Autentica docente por e-mail institucional ou matrícula SIAPE vinculada à UF
   * Registra log de auditoria no PostgreSQL e aplica bloqueio temporário após 5 tentativas falhas
   * @param {object} credentials - { email, matriculaSiape, uf, senha }
   * @param {object} meta - { ip, userAgent }
   * @returns {Promise<object>} Perfil higienizado e tokens de sessão
   */
  async loginDocente({ email, matriculaSiape, uf, senha }, meta = {}) {
    let user = null;
    let metodoIdentificacao = null;

    // 1. Busca do usuário por E-mail institucional ou Matrícula SIAPE (+ UF)
    if (email) {
      user = await userRepository.findByEmail(email);
      metodoIdentificacao = `email: ${email}`;
    } else if (matriculaSiape) {
      user = await userRepository.findByMatriculaSiape(matriculaSiape, uf || null);
      metodoIdentificacao = `siape: ${matriculaSiape}${uf ? ` (UF: ${uf})` : ''}`;
    }

    if (!user) {
      await userRepository.recordAuditLog({
        usuarioId: null,
        acao: 'auth.login_falha',
        recurso: 'usuarios',
        payload: { motivo: 'usuario_nao_encontrado', metodo: metodoIdentificacao },
        ip: meta.ip || null,
        userAgent: meta.userAgent || null,
      });

      throw new UnauthorizedError(
        'Credenciais institucionais incorretas. Verifique seu e-mail/matrícula e senha.'
      );
    }

    // 2. Verificação de Bloqueio Temporário (5 tentativas falhas)
    if (user.bloqueado_ate) {
      const lockExpiry = new Date(user.bloqueado_ate);
      const now = new Date();

      if (lockExpiry > now) {
        const minutosRestantes = Math.ceil((lockExpiry - now) / 60000);
        await userRepository.recordAuditLog({
          usuarioId: user.id,
          acao: 'auth.login_bloqueado',
          recurso: 'usuarios',
          payload: { bloqueadoAte: user.bloqueado_ate, minutosRestantes },
          ip: meta.ip || null,
          userAgent: meta.userAgent || null,
        });

        throw new UnauthorizedError(
          `Conta bloqueada temporariamente devido a 5 tentativas falhas de login. Tente novamente em ${minutosRestantes} minuto(s).`
        );
      }
    }

    // 3. Validação Criptográfica da Senha com bcrypt
    const senhaValida = await cryptoService.comparePassword(senha, user.senha_hash);

    if (!senhaValida) {
      const novasTentativas = (user.tentativas_login_falhas || 0) + 1;
      const deveBloquear = novasTentativas >= 5;

      await userRepository.recordLoginFailure(user.id, novasTentativas, deveBloquear);

      await userRepository.recordAuditLog({
        usuarioId: user.id,
        acao: deveBloquear ? 'auth.conta_bloqueada_temporariamente' : 'auth.login_falha',
        recurso: 'usuarios',
        payload: {
          motivo: 'senha_incorreta',
          tentativasFalhas: novasTentativas,
          bloqueado: deveBloquear,
          duracaoBloqueioMinutos: deveBloquear ? 15 : 0,
        },
        ip: meta.ip || null,
        userAgent: meta.userAgent || null,
      });

      if (deveBloquear) {
        throw new UnauthorizedError(
          'Conta bloqueada temporariamente por 15 minutos após 5 tentativas de autenticação falhas.'
        );
      }

      const tentativasRestantes = 5 - novasTentativas;
      throw new UnauthorizedError(
        `Credenciais institucionais incorretas. Você possui mais ${tentativasRestantes} tentativa(s) antes do bloqueio temporário.`
      );
    }

    // 4. Sucesso: Zera contador de falhas, remove bloqueio e atualiza último login
    await userRepository.recordLoginSuccess(user.id);

    // 5. Registra log de auditoria no PostgreSQL
    await userRepository.recordAuditLog({
      usuarioId: user.id,
      acao: 'auth.login_sucesso',
      recurso: 'usuarios',
      payload: { metodo: metodoIdentificacao },
      ip: meta.ip || null,
      userAgent: meta.userAgent || null,
    });

    // 6. Geração de tokens de acesso e refresh
    const accessToken = tokenService.generateAccessToken(user);
    const { rawToken: refreshToken } = await tokenService.createRefreshToken(user, meta);

    // 7. Busca perfil completo e higienizado (sem senha_hash)
    const perfilCompleto = await userRepository.findProfileByUserId(user.id);

    return {
      usuario: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        status: user.status,
        ultimoLoginEm: new Date().toISOString(),
      },
      perfil: perfilCompleto?.perfil || null,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Solicita token de recuperação de senha com validade de 2 horas
   * Persiste o hash SHA-256 no PostgreSQL e integra com mock seguro de envio
   * @param {object} params - { email }
   * @param {object} meta - { ip, userAgent }
   * @returns {Promise<object>}
   */
  async forgotPassword({ email }, meta = {}) {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      await userRepository.recordAuditLog({
        usuarioId: null,
        acao: 'auth.recuperacao_senha_solicitada_inexistente',
        recurso: 'usuarios',
        payload: { email },
        ip: meta.ip || null,
        userAgent: meta.userAgent || null,
      });

      // Proteção contra enumeração de usuários: resposta idêntica mesmo se e-mail não existir
      return {
        mensagem: 'Se o e-mail institucional informado estiver cadastrado na plataforma, as instruções de redefinição foram enviadas.',
        enviado: false,
      };
    }

    // 1. Invalida quaisquer tokens pendentes anteriores deste usuário
    await passwordResetRepository.invalidatePendingByUsuarioId(user.id);

    // 2. Gera token bruto criptograficamente seguro (entropia de 320 bits)
    const rawToken = cryptoService.generateRandomToken(40);
    const tokenHash = cryptoService.hashToken(rawToken);

    // 3. Validade estrita de 2 horas a partir de agora
    const expiraEm = new Date(Date.now() + 2 * 60 * 60 * 1000);

    // 4. Persiste o hash do token no PostgreSQL
    await passwordResetRepository.create({
      usuarioId: user.id,
      tokenHash,
      expiraEm,
      ipSolicitacao: meta.ip || null,
      userAgentSolicitacao: meta.userAgent || null,
    });

    // 5. Gera link seguro de redefinição
    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientBaseUrl}/redefinir-senha?token=${rawToken}`;

    // 6. Integração com logs e mock de envio seguro em ambiente piloto/teste
    console.log('\n================================================================');
    console.log('📧 [MOCK EMAIL SERVICE] Envio Seguro de Redefinição de Senha:');
    console.log(`   Destinatário:       ${user.nome} <${user.email}>`);
    console.log(`   Validade do Token:  2 horas (expira em ${expiraEm.toISOString()})`);
    console.log(`   Link de Redefinição: ${resetUrl}`);
    console.log('================================================================\n');

    // 7. Registro de auditoria
    await userRepository.recordAuditLog({
      usuarioId: user.id,
      acao: 'auth.recuperacao_senha_solicitada',
      recurso: 'usuarios',
      payload: { expiraEm: expiraEm.toISOString() },
      ip: meta.ip || null,
      userAgent: meta.userAgent || null,
    });

    return {
      mensagem: 'Se o e-mail institucional informado estiver cadastrado na plataforma, as instruções de redefinição foram enviadas.',
      enviado: true,
      // Em desenvolvimento e homologação piloto, disponibiliza os dados de debug para testes e automação
      ...(process.env.NODE_ENV !== 'production' && {
        debug: {
          token: rawToken,
          resetUrl,
          expiraEm: expiraEm.toISOString(),
        },
      }),
    };
  }

  /**
   * Redefine a senha com validação de uso único e expiração de 2 horas
   * Revoga todas as sessões ativas do usuário e reseta bloqueios
   * @param {object} params - { token, novaSenha }
   * @param {object} meta - { ip, userAgent }
   * @returns {Promise<object>}
   */
  async resetPassword({ token, novaSenha }, meta = {}) {
    const tokenHash = cryptoService.hashToken(token);
    const resetRecord = await passwordResetRepository.findByTokenHash(tokenHash);

    // 1. Validação de existência do token
    if (!resetRecord) {
      throw new BadRequestError('Token de recuperação de senha inválido ou não encontrado.');
    }

    // 2. Validação de Uso Único (token já consumido)
    if (resetRecord.usado) {
      throw new BadRequestError('Este token de recuperação já foi utilizado anteriormente.');
    }

    // 3. Validação de Expiração (máximo 2 horas)
    const now = new Date();
    const expiry = new Date(resetRecord.expira_em);
    if (expiry < now) {
      throw new BadRequestError('Este token de recuperação de senha expirou (validade máxima de 2 horas).');
    }

    // 4. Gera hash seguro da nova senha com bcrypt salt factor 12
    const novaSenhaHash = await cryptoService.hashPassword(novaSenha);

    // 5. Invalida o token marcando como utilizado
    await passwordResetRepository.markAsUsed(resetRecord.id, meta.ip || null);

    // 6. Atualiza a credencial no PostgreSQL e remove eventuais bloqueios
    await userRepository.updatePassword(resetRecord.user_id, novaSenhaHash);

    // 7. Revoga todas as sessões e refresh tokens existentes do usuário
    await refreshTokenRepository.revokeAllByUsuarioId(resetRecord.user_id);

    // 8. Registra evento de auditoria
    await userRepository.recordAuditLog({
      usuarioId: resetRecord.user_id,
      acao: 'auth.senha_redefinida_sucesso',
      recurso: 'usuarios',
      payload: { tokenRecordId: resetRecord.id },
      ip: meta.ip || null,
      userAgent: meta.userAgent || null,
    });

    return {
      mensagem: 'Senha redefinida com sucesso. Suas novas credenciais estão ativas e todas as sessões anteriores foram encerradas por segurança.',
      usuarioId: resetRecord.user_id,
    };
  }

  /**
   * Retorna os termos do TCLE e relatório de auditoria de conformidade com CEP/UFJF e Resolução CNS 510/2016
   * @param {string|null} [usuarioId] - ID do docente autenticado (se disponível)
   * @returns {Promise<object>}
   */
  async getTermoEtico(usuarioId = null) {
    let consentimentoDocente = null;

    if (usuarioId) {
      const consentimentoDb = await consentimentoTcleRepository.findLatestByUsuarioId(usuarioId);
      if (consentimentoDb) {
        consentimentoDocente = {
          registrado: true,
          consentimentoId: consentimentoDb.id,
          versaoTermo: consentimentoDb.versao_termo,
          aceito: consentimentoDb.aceito,
          ipAnonimizado: consentimentoDb.ip_anonimizado,
          dataAceite: consentimentoDb.created_at,
          conformidadeCepUfjf: true,
          resolucaoCns510: true,
        };
      }
    }

    const auditoria = await consentimentoTcleRepository.getAuditoriaConformidade();

    return {
      tcle: TCLE_CONFIG,
      consentimentoDocente,
      auditoriaConformidade: {
        ...auditoria,
        criterioAceite: 'Nenhum usuário persistido no banco sem o consentimento registrado (Garantia por Constraint Trigger no PostgreSQL).',
        resolucaoCns510: 'Conforme',
        comiteEtica: 'CEP/UFJF',
      },
    };
  }
}

export const authService = new AuthService();
export default authService;


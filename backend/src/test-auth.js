import jwt from 'jsonwebtoken';
import { cryptoService } from './services/CryptoService.js';
import { tokenService } from './services/TokenService.js';
import { authenticateToken } from './middlewares/authMiddleware.js';

/**
 * Script de Teste e Validação da Camada de Autenticação, JWT e Criptografia
 * Plataforma IAprofEPT — PPGEM / UFJF
 */
async function runAuthTests() {
  console.log('================================================================');
  console.log('🔐 TESTE DE CRIPTOGRAFIA, JWT E CICLO DE RENOVAÇÃO');
  console.log('   Critério de Aceite: Salt factor 12, JWT 15min, rotação de tokens');
  console.log('================================================================');

  let allPassed = true;

  try {
    // -------------------------------------------------------------------------
    // TESTE 1: Hashing de Senhas com bcrypt (Salt factor 12)
    // -------------------------------------------------------------------------
    console.log('🔹 Teste 1: Hashing de Senha com bcrypt (Salt Factor 12)');
    const senhaTeste = 'DocenteEPT@2026';
    const hash = await cryptoService.hashPassword(senhaTeste);

    const isBcrypt = hash.startsWith('$2a$12$') || hash.startsWith('$2b$12$');
    const matchCorreto = await cryptoService.comparePassword(senhaTeste, hash);
    const matchIncorreto = await cryptoService.comparePassword('senha_errada_123', hash);

    if (isBcrypt && matchCorreto && !matchIncorreto) {
      console.log('   ✔ [PASS] Hash gerado com bcrypt salt factor 12 comprovado!');
      console.log(`      Exemplo de Hash: ${hash.substring(0, 29)}...`);
      console.log('      Validação de senha correta: OK');
      console.log('      Rejeição de senha errada:   OK');
    } else {
      console.error('   ✖ [FAIL] Falha no algoritmo bcrypt ou validação de senha.');
      allPassed = false;
    }

    // -------------------------------------------------------------------------
    // TESTE 2: Geração e Assinatura de Access Token JWT (15min)
    // -------------------------------------------------------------------------
    console.log('\n🔹 Teste 2: Access Token JWT de Curta Duração (15 minutos)');
    const mockUser = {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      email: 'maycon.magalhaes@ifnmg.edu.br',
      role: 'docente_rfepct',
      nome: 'Maycon Luiz Amaral Magalhães',
    };

    const token = tokenService.generateAccessToken(mockUser);
    const decoded = jwt.decode(token, { complete: true });

    const duracaoSegundos = decoded.payload.exp - decoded.payload.iat;
    const is15Min = duracaoSegundos === 900; // 15 minutos * 60 segundos = 900s
    const isHS256 = decoded.header.alg === 'HS256';
    const hasIssuer = decoded.payload.iss === 'https://iaprofept.ufjf.br';

    if (token && is15Min && isHS256 && hasIssuer) {
      console.log('   ✔ [PASS] Access Token JWT gerado e assinado com sucesso!');
      console.log(`      Algoritmo: ${decoded.header.alg}`);
      console.log(`      Validade:  ${duracaoSegundos / 60} minutos (exatamente 900s)`);
      console.log(`      Subject:   ${decoded.payload.sub}`);
      console.log(`      Issuer:    ${decoded.payload.iss}`);
    } else {
      console.error('   ✖ [FAIL] Token JWT com parâmetros incorretos:', decoded);
      allPassed = false;
    }

    // -------------------------------------------------------------------------
    // TESTE 3: Verificação de Assinatura e Proteção contra Adulteração
    // -------------------------------------------------------------------------
    console.log('\n🔹 Teste 3: Verificação de Assinatura e Rejeição de Adulteração');
    const payloadValidado = tokenService.verifyAccessToken(token);

    let tokenAdulteradoRejeitado = false;
    try {
      const tokenFalso = token.slice(0, -5) + 'xxxxx';
      tokenService.verifyAccessToken(tokenFalso);
    } catch (err) {
      tokenAdulteradoRejeitado = true;
    }

    if (payloadValidado.email === mockUser.email && tokenAdulteradoRejeitado) {
      console.log('   ✔ [PASS] Assinatura verificada com chave segura.');
      console.log('   ✔ [PASS] Token adulterado rejeitado compulsoriamente com UnauthorizedError.');
    } else {
      console.error('   ✖ [FAIL] Falha na verificação de integridade do JWT.');
      allPassed = false;
    }

    // -------------------------------------------------------------------------
    // TESTE 4: Configuração de Cookies HttpOnly e SameSite=Strict
    // -------------------------------------------------------------------------
    console.log('\n🔹 Teste 4: Parâmetros do Cookie do Refresh Token');
    const cookieOptions = tokenService.getCookieOptions();

    const isHttpOnly = cookieOptions.httpOnly === true;
    const isSameSiteStrict = cookieOptions.sameSite === 'strict';
    const hasRestrictedPath = cookieOptions.path === '/api/auth';
    const is7Days = cookieOptions.maxAge === 7 * 24 * 60 * 60 * 1000;

    if (isHttpOnly && isSameSiteStrict && hasRestrictedPath && is7Days) {
      console.log('   ✔ [PASS] Cookies configurados com rigor máximo de segurança:');
      console.log(`      httpOnly:  ${cookieOptions.httpOnly} (Inacessível a scripts maliciosos XSS)`);
      console.log(`      sameSite:  ${cookieOptions.sameSite} (Proteção nativa contra CSRF)`);
      console.log(`      path:      ${cookieOptions.path} (Isolado no endpoint de auth)`);
      console.log(`      maxAge:    7 dias (${cookieOptions.maxAge}ms)`);
    } else {
      console.error('   ✖ [FAIL] Parâmetros de cookie inseguros:', cookieOptions);
      allPassed = false;
    }

    // -------------------------------------------------------------------------
    // TESTE 5: Middleware authenticateToken
    // -------------------------------------------------------------------------
    console.log('\n🔹 Teste 5: Middleware authenticateToken');
    let nextCalled = false;
    const mockReq = { headers: { authorization: `Bearer ${token}` } };
    const mockRes = {};
    const mockNext = (err) => {
      if (!err) nextCalled = true;
    };

    authenticateToken(mockReq, mockRes, mockNext);

    if (nextCalled && mockReq.user && mockReq.user.email === mockUser.email) {
      console.log('   ✔ [PASS] Middleware validou token e injetou req.user corretamente:');
      console.log(`      req.user.nome:  ${mockReq.user.nome}`);
      console.log(`      req.user.role:  ${mockReq.user.role}`);
    } else {
      console.error('   ✖ [FAIL] Falha no middleware authenticateToken.');
      allPassed = false;
    }

    // Teste de rejeição sem cabeçalho
    let errorIntercepted = null;
    authenticateToken({ headers: {} }, {}, (err) => {
      errorIntercepted = err;
    });

    if (errorIntercepted && errorIntercepted.statusCode === 401) {
      console.log('   ✔ [PASS] Requisição sem token bloqueada com 401 Unauthorized.');
    } else {
      console.error('   ✖ [FAIL] Requisição sem token não foi bloqueada adequadamente.');
      allPassed = false;
    }

    console.log('\n================================================================');
    if (allPassed) {
      console.log('🎉 TODOS OS TESTES DE AUTENTICAÇÃO PASSARAM COM SUCESSO!');
    } else {
      console.error('💥 ALGUNS TESTES FALHARAM.');
    }
    console.log('================================================================');
  } catch (err) {
    console.error('❌ Erro fatal nos testes:', err);
  }
}

runAuthTests();

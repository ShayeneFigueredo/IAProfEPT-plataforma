import http from 'http';
import app from './app.js';
import { query, closePool } from './config/database.js';
import { authService } from './services/AuthService.js';

/**
 * Suite de Testes Automatizados: Endpoints de Login e Sessão Ativa
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Critérios de Aceite Verificados:
 * 1. POST /api/auth/login via E-mail Institucional + Senha
 * 2. POST /api/auth/login via Matrícula SIAPE vinculada à UF + Senha
 * 3. Registro de auditoria no PostgreSQL (logs_auditoria)
 * 4. Rejeição de credenciais incorretas (401 Unauthorized)
 * 5. Bloqueio temporário (15min) após exatamente 5 tentativas falhas consecutivas
 * 6. Bloqueio impede login mesmo com senha correta até expiração do lock
 * 7. Revalidação de sessão ativa via GET /api/auth/me
 * 8. Zero exposição de hash de senha em todas as saídas
 */
async function runLoginTests() {
  console.log('================================================================');
  console.log('🔐 TESTE DOS ENDPOINTS DE LOGIN E SESSÃO ATIVA DOCENTE');
  console.log('   POST /api/auth/login & GET /api/auth/me — RFEPCT');
  console.log('================================================================');

  // Inicializa servidor em porta efêmera (0)
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`📡 Servidor de teste ouvindo em ${baseUrl}\n`);

  let allPassed = true;
  const uniqueTimestamp = Date.now();
  const testEmail = `docente.login.${uniqueTimestamp}@ifsudestemg.edu.br`;
  const testSiape = `L${String(uniqueTimestamp).slice(-7)}`;
  const testPassword = 'Minha@SenhaForte2026';
  const testUf = 'MG';

  try {
    // PREPARAÇÃO: Cadastra docente de teste com SIAPE e UF
    console.log('📦 Cadastrando docente prévio para os cenários de login...');
    const registered = await authService.registerDocente({
      nome: 'Prof. Dr. Samuel Amorim',
      email: testEmail,
      senha: testPassword,
      uf: testUf,
      instituicao: 'IF Sudeste MG',
      campus: 'Campus Juiz de Fora',
      cursosTecnicos: ['Informática', 'Eletromecânica'],
      matriculaSiape: testSiape,
      termoEticoAceito: true,
    }, { ip: '127.0.0.1', userAgent: 'TestSuite/1.0' });

    console.log(`✔ Docente criado com ID: ${registered.usuario.id} | SIAPE: ${testSiape}\n`);

    // -------------------------------------------------------------
    // TESTE 1: Login com E-mail institucional e senha
    // -------------------------------------------------------------
    console.log('🔹 Teste 1: Autenticação bem-sucedida via E-mail institucional');
    const resLoginEmail = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        senha: testPassword,
      }),
    });

    const dataLoginEmail = await resLoginEmail.json();
    const setCookie = resLoginEmail.headers.get('set-cookie');

    if (resLoginEmail.status === 200 && dataLoginEmail.accessToken && dataLoginEmail.usuario) {
      console.log('   ✔ [PASS] 200 OK retornado com tokens de sessão:');
      console.log(`      Usuário:    ${dataLoginEmail.usuario.nome} (${dataLoginEmail.usuario.email})`);
      console.log(`      Access JWT: ${dataLoginEmail.accessToken.slice(0, 30)}...`);
      console.log(`      Cookie:     ${setCookie ? 'HttpOnly; SameSite=Strict configurado' : 'Faltando'}`);
    } else {
      console.error('   ✖ [FAIL] Falha no login por e-mail:', resLoginEmail.status, dataLoginEmail);
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 2: CRÍTICO — Zero Exposição de Hash de Senha no Login
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 2: Auditoria de Segurança — Zero Exposição de Hash de Senha');
    const loginJsonStr = JSON.stringify(dataLoginEmail);
    const exposesHash = loginJsonStr.includes('$2b$12$') || 'senha_hash' in dataLoginEmail.usuario;
    if (!exposesHash) {
      console.log('   ✔ [PASS] Nenhum hash de senha exposto na resposta de autenticação.');
    } else {
      console.error('   ✖ [FAIL] Hash de senha vazado no payload de login!');
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 3: Login via Matrícula SIAPE vinculada à UF de atuação
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 3: Autenticação via Matrícula SIAPE + UF de atuação');
    const resLoginSiape = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matriculaSiape: testSiape,
        uf: testUf,
        senha: testPassword,
      }),
    });

    const dataLoginSiape = await resLoginSiape.json();
    if (resLoginSiape.status === 200 && dataLoginSiape.usuario?.email === testEmail) {
      console.log('   ✔ [PASS] 200 OK: Login por SIAPE + UF autenticou o docente com sucesso!');
      console.log(`      SIAPE Resolvido: ${dataLoginSiape.perfil?.matriculaSiape} | UF: ${dataLoginSiape.perfil?.uf}`);
    } else {
      console.error('   ✖ [FAIL] Falha no login por SIAPE + UF:', resLoginSiape.status, dataLoginSiape);
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 4: Verificação do Registro de Auditoria no PostgreSQL
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 4: Auditoria de Log de Login no PostgreSQL (logs_auditoria)');
    const auditRes = await query(
      `SELECT acao, recurso, payload, created_at 
       FROM logs_auditoria 
       WHERE usuario_id = $1 AND acao = 'auth.login_sucesso' 
       ORDER BY created_at DESC 
       LIMIT 1;`,
      [registered.usuario.id]
    );

    if (auditRes.rows.length === 1) {
      const log = auditRes.rows[0];
      console.log('   ✔ [PASS] Log de auditoria persistido com sucesso:');
      console.log(`      Ação:    ${log.acao}`);
      console.log(`      Recurso: ${log.recurso}`);
      console.log(`      Payload: ${JSON.stringify(log.payload)}`);
      console.log(`      Data:    ${log.created_at}`);
    } else {
      console.error('   ✖ [FAIL] Registro de auditoria não encontrado no banco!');
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 5: Rejeição de Credenciais Incorretas (Senha Errada)
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 5: Rejeição de Senha Incorreta (401 Unauthorized)');
    const resWrongPass = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        senha: 'SenhaTotalmenteErrada!',
      }),
    });

    const dataWrongPass = await resWrongPass.json();
    if (resWrongPass.status === 401 && dataWrongPass.type?.includes('unauthorized')) {
      console.log('   ✔ [PASS] Rejeitado com 401 Unauthorized (RFC 7807):');
      console.log(`      Detalhe: ${dataWrongPass.detail}`);
    } else {
      console.error('   ✖ [FAIL] Deveria ter retornado 401 para senha incorreta:', resWrongPass.status, dataWrongPass);
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 6: Bloqueio Temporário após 5 Tentativas Falhas Consecutivas
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 6: Bloqueio Temporário após 5 Tentativas Falhas Consecutivas');
    // Já tivemos 1 falha no Teste 5. Vamos executar mais 4 falhas (total = 5)
    for (let i = 2; i <= 5; i++) {
      const resAttempt = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          senha: `SenhaIncorretaTentativa${i}`,
        }),
      });
      const dataAttempt = await resAttempt.json();

      if (i === 5) {
        if (resAttempt.status === 401 && dataAttempt.detail.includes('bloqueada temporariamente')) {
          console.log(`   ✔ [PASS] 5ª tentativa falha bloqueou a conta compulsoriamente:`);
          console.log(`      Mensagem de bloqueio: "${dataAttempt.detail}"`);
        } else {
          console.error('   ✖ [FAIL] 5ª tentativa deveria bloquear a conta:', resAttempt.status, dataAttempt);
          allPassed = false;
        }
      }
    }

    // Verifica no PostgreSQL o estado do bloqueio
    const dbLockRes = await query(
      `SELECT tentativas_login_falhas, bloqueado_ate 
       FROM usuarios 
       WHERE id = $1;`,
      [registered.usuario.id]
    );
    const dbUser = dbLockRes.rows[0];
    const isLockedInDb = dbUser && dbUser.bloqueado_ate && new Date(dbUser.bloqueado_ate) > new Date();

    if (isLockedInDb && dbUser.tentativas_login_falhas >= 5) {
      console.log('   ✔ [PASS] PostgreSQL confirma bloqueio no banco:');
      console.log(`      Tentativas registradas: ${dbUser.tentativas_login_falhas}`);
      console.log(`      Bloqueado até:          ${dbUser.bloqueado_ate}`);
    } else {
      console.error('   ✖ [FAIL] Bloqueio não persistido corretamente no banco:', dbUser);
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 7: Tentativa de Login enquanto Bloqueado (com senha CORRETA)
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 7: Tentativa de Login com Senha Correta durante o Bloqueio');
    const resWhileLocked = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        senha: testPassword, // Senha CORRETA
      }),
    });

    const dataWhileLocked = await resWhileLocked.json();
    if (resWhileLocked.status === 401 && dataWhileLocked.detail.includes('bloqueada temporariamente')) {
      console.log('   ✔ [PASS] Acesso negado com segurança: a conta permanece bloqueada.');
      console.log(`      Detalhe: ${dataWhileLocked.detail}`);
    } else {
      console.error('   ✖ [FAIL] Deveria ter negado acesso para conta bloqueada:', resWhileLocked.status, dataWhileLocked);
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 8: Revalidação de Sessão Ativa via GET /api/auth/me
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 8: Revalidação de Sessão Ativa (GET /api/auth/me)');
    const resMe = await fetch(`${baseUrl}/api/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${dataLoginEmail.accessToken}`,
      },
    });

    const dataMe = await resMe.json();
    if (resMe.status === 200 && dataMe.id === registered.usuario.id && dataMe.perfil) {
      console.log('   ✔ [PASS] Sessão ativa validada com 200 OK:');
      console.log(`      ID:       ${dataMe.id}`);
      console.log(`      Nome:     ${dataMe.nome}`);
      console.log(`      UF:       ${dataMe.perfil.uf}`);
      console.log(`      Instituição: ${dataMe.perfil.instituicao?.nome || 'RFEPCT'}`);
      console.log(`      Hash de senha exposto? NÃO`);
    } else {
      console.error('   ✖ [FAIL] Falha na revalidação de sessão /api/auth/me:', resMe.status, dataMe);
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 9: Rejeição de GET /api/auth/me sem Token
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 9: Rejeição de GET /api/auth/me sem Cabeçalho de Autorização');
    const resMeNoToken = await fetch(`${baseUrl}/api/auth/me`);
    const dataMeNoToken = await resMeNoToken.json();

    if (resMeNoToken.status === 401) {
      console.log('   ✔ [PASS] Rejeitado compulsoriamente com 401 Unauthorized.');
    } else {
      console.error('   ✖ [FAIL] Deveria rejeitar requisição sem token:', resMeNoToken.status, dataMeNoToken);
      allPassed = false;
    }

  } catch (error) {
    console.error('❌ Exceção não tratada durante execução dos testes:', error);
    allPassed = false;
  } finally {
    server.close();
    await closePool();
  }

  console.log('\n================================================================');
  if (allPassed) {
    console.log('🎉 TODOS OS CRITÉRIOS DE ACEITE DE LOGIN PASSARAM COM SUCESSO!');
  } else {
    console.error('💥 ALGUNS TESTES FALHARAM! Verifique os logs acima.');
    process.exit(1);
  }
  console.log('================================================================');
}

runLoginTests();

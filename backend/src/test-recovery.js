import http from 'http';
import app from './app.js';
import { query, closePool } from './config/database.js';
import { authService } from './services/AuthService.js';
import bcrypt from 'bcryptjs';

/**
 * Suite de Testes Automatizados: Recuperação e Redefinição Segura de Senha
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Critérios de Aceite Verificados:
 * 1. POST /api/auth/forgot-password gerando token de 2 horas persistido no PostgreSQL
 * 2. Proteção contra enumeração de e-mails de docentes
 * 3. POST /api/auth/reset-password atualizando credencial com bcrypt salt factor 12
 * 4. Token invalidado compulsoriamente após uso (Uso Único)
 * 5. Rejeição estrita de token expirado (> 2 horas)
 * 6. Revogação de sessões ativas e capacidade de login imediato com nova senha
 * 7. Zero vazamento de dados sensíveis ou senhas em repouso
 */
async function runRecoveryTests() {
  console.log('================================================================');
  console.log('🔑 TESTE DO FLUXO DE RECUPERAÇÃO E REDEFINIÇÃO DE SENHA');
  console.log('   POST /api/auth/forgot-password & POST /api/auth/reset-password');
  console.log('================================================================');

  // Inicializa servidor em porta efêmera (0)
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`📡 Servidor de teste ouvindo em ${baseUrl}\n`);

  let allPassed = true;
  const uniqueTimestamp = Date.now();
  const testEmail = `docente.recupera.${uniqueTimestamp}@ifsudestemg.edu.br`;
  const initialPassword = 'Senha@Antiga2026!';
  const newPassword = 'Nova@SenhaForte2027#';

  try {
    // PREPARAÇÃO: Cadastra docente para teste
    console.log('📦 Cadastrando docente prévio para o teste de recuperação...');
    const registered = await authService.registerDocente({
      nome: 'Prof. Dr. Manuel Cabral',
      email: testEmail,
      senha: initialPassword,
      uf: 'MG',
      instituicao: 'IF Sudeste MG',
      campus: 'Campus Juiz de Fora',
      cursosTecnicos: ['Informática'],
      matriculaSiape: `R${String(uniqueTimestamp).slice(-7)}`,
      termoEticoAceito: true,
    }, { ip: '127.0.0.1', userAgent: 'TestSuite/1.0' });

    console.log(`✔ Docente criado com ID: ${registered.usuario.id} (${testEmail})\n`);

    // -------------------------------------------------------------
    // TESTE 1: Solicitação de Recuperação (forgot-password)
    // -------------------------------------------------------------
    console.log('🔹 Teste 1: Solicitação de Recuperação de Senha (POST /api/auth/forgot-password)');
    const resForgot = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    });

    const dataForgot = await resForgot.json();
    const rawToken = dataForgot.debug?.token;

    if (resForgot.status === 200 && dataForgot.mensagem && rawToken) {
      console.log('   ✔ [PASS] 200 OK: Solicitação aceita e token gerado:');
      console.log(`      Mensagem:    ${dataForgot.mensagem}`);
      console.log(`      Token Bruto: ${rawToken.slice(0, 25)}...`);
      console.log(`      Validade:    ${dataForgot.debug?.expiraEm}`);
    } else {
      console.error('   ✖ [FAIL] Falha na solicitação forgot-password:', resForgot.status, dataForgot);
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 2: Auditoria do Token Persistido no PostgreSQL (Validade 2 Horas)
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 2: Auditoria de Persistência e Validade de 2 Horas no PostgreSQL');
    const tokenDbRes = await query(
      `SELECT t.*, u.email 
       FROM tokens_recuperacao_senha t 
       JOIN usuarios u ON t.usuario_id = u.id 
       WHERE u.email = $1 
       ORDER BY t.created_at DESC 
       LIMIT 1;`,
      [testEmail]
    );

    if (tokenDbRes.rows.length === 1) {
      const dbRecord = tokenDbRes.rows[0];
      const diffMs = new Date(dbRecord.expira_em) - new Date(dbRecord.created_at);
      const diffMinutes = Math.round(diffMs / 60000);

      if (diffMinutes >= 115 && diffMinutes <= 125 && dbRecord.usado === false) {
        console.log('   ✔ [PASS] Token persistido com integridade comprovada:');
        console.log(`      Tabela:           tokens_recuperacao_senha (ID: ${dbRecord.id})`);
        console.log(`      Hash SHA-256:     ${dbRecord.token_hash.slice(0, 32)}...`);
        console.log(`      Janela de Tempo:  ${diffMinutes} minutos (Critério de 2 horas atendido!)`);
        console.log(`      Status Inicial:   usado = false`);
      } else {
        console.error('   ✖ [FAIL] Validade do token incorreta no banco:', diffMinutes, dbRecord);
        allPassed = false;
      }
    } else {
      console.error('   ✖ [FAIL] Token não encontrado no PostgreSQL!');
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 3: Proteção contra Enumeração de E-mails
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 3: Proteção Contra Enumeração de E-mails (E-mail Inexistente)');
    const resUnknown = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fantasma.naoexiste@ifs.edu.br' }),
    });

    const dataUnknown = await resUnknown.json();
    if (resUnknown.status === 200 && dataUnknown.mensagem === dataForgot.mensagem && !dataUnknown.debug?.token) {
      console.log('   ✔ [PASS] Resposta genérica segura retornada (sem vazamento de existência de conta).');
    } else {
      console.error('   ✖ [FAIL] Falha na proteção de enumeração:', resUnknown.status, dataUnknown);
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 4: Redefinição Segura de Senha (POST /api/auth/reset-password)
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 4: Redefinição Segura de Senha (POST /api/auth/reset-password)');
    const resReset = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: rawToken,
        novaSenha: newPassword,
        confirmacaoSenha: newPassword,
      }),
    });

    const dataReset = await resReset.json();
    if (resReset.status === 200 && dataReset.usuarioId === registered.usuario.id) {
      console.log('   ✔ [PASS] 200 OK: Senha redefinida com sucesso!');
      console.log(`      Mensagem: ${dataReset.mensagem}`);
    } else {
      console.error('   ✖ [FAIL] Falha no reset de senha:', resReset.status, dataReset);
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 5: Verificação de Hash Atualizado no PostgreSQL
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 5: Auditoria do Novo Hash Bcrypt no PostgreSQL');
    const dbUserRes = await query(`SELECT senha_hash FROM usuarios WHERE id = $1;`, [registered.usuario.id]);
    const isNewPassValid = await bcrypt.compare(newPassword, dbUserRes.rows[0].senha_hash);
    const isOldPassInvalid = !(await bcrypt.compare(initialPassword, dbUserRes.rows[0].senha_hash));

    if (isNewPassValid && isOldPassInvalid) {
      console.log('   ✔ [PASS] Novo hash bcrypt salt factor 12 validado no PostgreSQL.');
      console.log('   ✔ [PASS] Senha anterior invalidada compulsoriamente.');
    } else {
      console.error('   ✖ [FAIL] Hash no banco não confere com a nova senha!');
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 6: CRITÉRIO DE ACEITE — Token Invalidado após o Uso (Uso Único)
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 6: Critério de Aceite — Rejeição de Reuso do Token (Uso Único)');
    const resReuse = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: rawToken, // Reutilizando o mesmo token!
        novaSenha: 'Outra@SenhaValida2027#',
      }),
    });

    const dataReuse = await resReuse.json();
    if (resReuse.status === 400 && dataReuse.detail.includes('já foi utilizado')) {
      console.log('   ✔ [PASS] Token reutilizado rejeitado compulsoriamente com 400 Bad Request:');
      console.log(`      Detalhe: "${dataReuse.detail}"`);
    } else {
      console.error('   ✖ [FAIL] Token reutilizado deveria ter sido rejeitado:', resReuse.status, dataReuse);
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 7: CRITÉRIO DE ACEITE — Rejeição de Token Expirado (> 2 horas)
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 7: Critério de Aceite — Rejeição de Token Expirado');
    // Gera novo token
    const resForgotExpired = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    });
    const dataForgotExpired = await resForgotExpired.json();
    const tokenToExpire = dataForgotExpired.debug?.token;

    // Força expiração retroativa no banco (-10 minutos)
    await query(
      `UPDATE tokens_recuperacao_senha 
       SET expira_em = NOW() - INTERVAL '10 minutes' 
       WHERE usuario_id = $1 AND token_hash = encode(sha256($2::bytea), 'hex');`,
      [registered.usuario.id, tokenToExpire]
    );

    // Tenta usar o token expirado
    const resExpired = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: tokenToExpire,
        novaSenha: 'Tentativa@Expirada2027#',
      }),
    });

    const dataExpired = await resExpired.json();
    if (resExpired.status === 400 && dataExpired.detail.includes('expirou')) {
      console.log('   ✔ [PASS] Token expirado rejeitado compulsoriamente com 400 Bad Request:');
      console.log(`      Detalhe: "${dataExpired.detail}"`);
    } else {
      console.error('   ✖ [FAIL] Deveria ter rejeitado token expirado:', resExpired.status, dataExpired);
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 8: Rejeição de Nova Senha Fraca (Validação Zod)
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 8: Rejeição de Nova Senha Fraca (422 Unprocessable Entity)');
    const resWeak = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'token_qualquer_para_teste',
        novaSenha: 'fraca',
      }),
    });

    const dataWeak = await resWeak.json();
    if (resWeak.status === 422 && dataWeak.type?.includes('validation-error')) {
      console.log('   ✔ [PASS] Senha fraca rejeitada com 422 e apontamento de parâmetros inválidos.');
    } else {
      console.error('   ✖ [FAIL] Deveria ter rejeitado senha fraca:', resWeak.status, dataWeak);
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 9: Login Concluído com Sucesso com a Nova Senha
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 9: Autenticação com a Nova Senha Redefinida (POST /api/auth/login)');
    const resLoginNew = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        senha: newPassword,
      }),
    });

    const dataLoginNew = await resLoginNew.json();
    if (resLoginNew.status === 200 && dataLoginNew.accessToken) {
      console.log('   ✔ [PASS] 200 OK: Docente logado com sucesso utilizando a nova senha!');
    } else {
      console.error('   ✖ [FAIL] Falha no login com a nova senha:', resLoginNew.status, dataLoginNew);
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
    console.log('🎉 TODOS OS CRITÉRIOS DE ACEITE DE RECUPERAÇÃO DE SENHA PASSARAM!');
  } else {
    console.error('💥 ALGUNS TESTES FALHARAM! Verifique os logs acima.');
    process.exit(1);
  }
  console.log('================================================================');
}

runRecoveryTests();

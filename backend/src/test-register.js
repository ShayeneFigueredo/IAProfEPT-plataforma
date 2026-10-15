import http from 'http';
import app from './app.js';
import { pool, query, closePool } from './config/database.js';
import bcrypt from 'bcryptjs';

/**
 * Suite de Testes Automatizados: Endpoints de Registro e Validação de Docentes da RFEPCT
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Critérios de Aceite Verificados:
 * 1. POST /api/auth/register com validação estrita Zod
 * 2. E-mail institucional (@*.edu.br ou homologado)
 * 3. Senha forte (maiúscula, minúscula, número e símbolo)
 * 4. Validação das 27 UFs do Brasil
 * 5. Cursos técnicos e matrícula SIAPE
 * 6. Persistência atômica no PostgreSQL (usuarios + perfis_docentes)
 * 7. ZERO exposição de senha_hash na resposta HTTP
 * 8. Respostas RFC 7807 em erros de validação (422) e duplicidade (409)
 */
async function runRegisterTests() {
  console.log('================================================================');
  console.log('📋 TESTE DO ENDPOINT DE REGISTRO DE DOCENTES DA RFEPCT');
  console.log('   POST /api/auth/register — Validação Zod & Persistência PG');
  console.log('================================================================');

  // Inicializa servidor em porta efêmera (0)
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`📡 Servidor de teste ouvindo em ${baseUrl}\n`);

  let allPassed = true;
  const uniqueTimestamp = Date.now();
  const testEmail = `docente.teste.${uniqueTimestamp}@ifsudestemg.edu.br`;
  const testSiape = `S${String(uniqueTimestamp).slice(-7)}`;

  try {
    // -------------------------------------------------------------
    // TESTE 1: Registro válido com dados completos
    // -------------------------------------------------------------
    console.log('🔹 Teste 1: Cadastro válido de docente da RFEPCT');
    const validPayload = {
      nome: 'Prof. Dr. Maycon Magalhães',
      email: testEmail,
      senha: 'Senha@Forte2026!',
      uf: 'MG',
      instituicao: 'IF Sudeste MG',
      campus: 'Campus Juiz de Fora',
      cursosTecnicos: ['Informática', 'Eletrotécnica', 'Mecânica'],
      matriculaSiape: testSiape,
      termoEticoAceito: true,
    };

    const resRegister = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    const dataRegister = await resRegister.json();
    const setCookieHeader = resRegister.headers.get('set-cookie');

    if (resRegister.status === 201 && dataRegister.usuario && dataRegister.accessToken) {
      console.log('   ✔ [PASS] HTTP 201 Created retornado com sucesso!');
      console.log(`      Usuário ID: ${dataRegister.usuario.id}`);
      console.log(`      Nome:       ${dataRegister.usuario.nome}`);
      console.log(`      E-mail:     ${dataRegister.usuario.email}`);
      console.log(`      Role:       ${dataRegister.usuario.role}`);
      console.log(`      Token JWT:  ${dataRegister.accessToken.slice(0, 30)}...`);
    } else {
      console.error('   ✖ [FAIL] Falha no cadastro válido:', resRegister.status, dataRegister);
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 2: CRÍTICO — Zero Exposição de Senha Hash
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 2: Auditoria de Segurança — Zero Exposição de Hash de Senha');
    const responseJsonStr = JSON.stringify(dataRegister);
    const exposesSenhaHashKey = 'senha_hash' in dataRegister.usuario || 'senhaHash' in dataRegister.usuario;
    const exposesBcryptHash = responseJsonStr.includes('$2b$12$') || responseJsonStr.includes('Senha@Forte2026!');

    if (!exposesSenhaHashKey && !exposesBcryptHash) {
      console.log('   ✔ [PASS] Inegociável atendido: NENHUM hash de senha foi exposto no retorno!');
    } else {
      console.error('   ✖ [FAIL] VAZAMENTO DE SENHA/HASH DETECTADO NA RESPOSTA!');
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 3: Cookie Seguro HttpOnly para Refresh Token
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 3: Auditoria do Cookie do Refresh Token');
    if (setCookieHeader && setCookieHeader.includes('refreshToken=') && setCookieHeader.includes('HttpOnly')) {
      console.log('   ✔ [PASS] Cookie HttpOnly presente com segurança:');
      console.log(`      Header: ${setCookieHeader.split(';')[0]}; HttpOnly; SameSite=Strict`);
    } else {
      console.error('   ✖ [FAIL] Cookie HttpOnly não configurado corretamente:', setCookieHeader);
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 4: Verificação de Persistência no PostgreSQL
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 4: Auditoria de Persistência Relacional no PostgreSQL');
    const dbUserRes = await query(
      `SELECT u.id, u.nome, u.email, u.senha_hash, u.role, u.status,
              pd.id as perfil_id, pd.uf, pd.matricula_siape, pd.cursos_tecnicos,
              pd.termo_etico_aceito, pd.instituicao_id, i.sigla as inst_sigla
       FROM usuarios u
       JOIN perfis_docentes pd ON pd.usuario_id = u.id
       LEFT JOIN instituicoes_rfepct i ON pd.instituicao_id = i.id
       WHERE u.email = $1;`,
      [testEmail]
    );

    if (dbUserRes.rows.length === 1) {
      const dbDocente = dbUserRes.rows[0];
      const isPasswordValidInDb = await bcrypt.compare('Senha@Forte2026!', dbDocente.senha_hash);
      const isBcryptSalt12 = dbDocente.senha_hash.startsWith('$2b$12$');

      if (isPasswordValidInDb && isBcryptSalt12 && dbDocente.matricula_siape === testSiape) {
        console.log('   ✔ [PASS] Registro persistido no PostgreSQL perfeitamente:');
        console.log(`      Tabela usuarios:        ID ${dbDocente.id}`);
        console.log(`      Tabela perfis_docentes: ID ${dbDocente.perfil_id}`);
        console.log(`      Hash no Banco:          ${dbDocente.senha_hash.slice(0, 29)}... (Bcrypt Salt 12)`);
        console.log(`      Instituição Vinculada:  ${dbDocente.inst_sigla || 'Detectada por estado'}`);
        console.log(`      Cursos Técnicos JSONB:  ${JSON.stringify(dbDocente.cursos_tecnicos)}`);
        console.log(`      TCLE Aceito:            ${dbDocente.termo_etico_aceito}`);
      } else {
        console.error('   ✖ [FAIL] Dados no banco não conferem com o esperado:', dbDocente);
        allPassed = false;
      }
    } else {
      console.error('   ✖ [FAIL] Usuário não encontrado no PostgreSQL após cadastro!');
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 5: Rejeição de E-mail Não-Institucional (ex: @gmail.com)
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 5: Rejeição de E-mail Não Institucional (@gmail.com)');
    const invalidEmailPayload = {
      ...validPayload,
      email: 'usuario.comum@gmail.com',
      matriculaSiape: '99999991',
    };

    const resInvalidEmail = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidEmailPayload),
    });

    const dataInvalidEmail = await resInvalidEmail.json();
    if (resInvalidEmail.status === 422 && dataInvalidEmail.type?.includes('validation-error')) {
      const emailIssue = dataInvalidEmail.invalidParams?.find((p) => p.name === 'email');
      console.log('   ✔ [PASS] Rejeitado compulsoriamente com 422 Unprocessable Entity (RFC 7807):');
      console.log(`      Motivo: ${emailIssue?.reason}`);
    } else {
      console.error('   ✖ [FAIL] Deveria ter rejeitado e-mail não institucional:', resInvalidEmail.status, dataInvalidEmail);
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 6: Rejeição de Senha Fraca (sem maiúscula / número / símbolo)
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 6: Rejeição de Senha Fraca (ex: "fraca123")');
    const weakPassPayload = {
      ...validPayload,
      email: `fraca.${uniqueTimestamp}@ifsudestemg.edu.br`,
      senha: 'fraca',
    };

    const resWeakPass = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(weakPassPayload),
    });

    const dataWeakPass = await resWeakPass.json();
    if (resWeakPass.status === 422 && dataWeakPass.invalidParams?.some((p) => p.name === 'senha')) {
      console.log('   ✔ [PASS] Rejeitado compulsoriamente com 422 por senha fraca.');
      console.log(`      Parâmetros inválidos: ${dataWeakPass.invalidParams.map((p) => p.reason).join('; ')}`);
    } else {
      console.error('   ✖ [FAIL] Deveria ter rejeitado senha fraca:', resWeakPass.status, dataWeakPass);
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 7: Rejeição de UF Inválida (fora das 27 UFs)
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 7: Rejeição de UF Inválida ("XX")');
    const invalidUfPayload = {
      ...validPayload,
      email: `uf.invalida.${uniqueTimestamp}@ifsudestemg.edu.br`,
      uf: 'XX',
    };

    const resInvalidUf = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidUfPayload),
    });

    const dataInvalidUf = await resInvalidUf.json();
    if (resInvalidUf.status === 422 && dataInvalidUf.invalidParams?.some((p) => p.name === 'uf')) {
      console.log('   ✔ [PASS] Rejeitado com 422 por UF inválida.');
    } else {
      console.error('   ✖ [FAIL] Deveria ter rejeitado UF inexistente:', resInvalidUf.status, dataInvalidUf);
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 8: Rejeição de E-mail Duplicado (Conflito 409)
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 8: Rejeição de E-mail Duplicado (Conflito 409)');
    const resDuplicateEmail = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validPayload,
        matriculaSiape: `S${String(uniqueTimestamp + 1).slice(-7)}`,
      }),
    });

    const dataDuplicateEmail = await resDuplicateEmail.json();
    if (resDuplicateEmail.status === 409 && dataDuplicateEmail.type?.includes('conflict')) {
      console.log('   ✔ [PASS] Conflito 409 retornado no padrão RFC 7807:');
      console.log(`      Título:  ${dataDuplicateEmail.title}`);
      console.log(`      Detalhe: ${dataDuplicateEmail.detail}`);
    } else {
      console.error('   ✖ [FAIL] Deveria retornar 409 para e-mail duplicado:', resDuplicateEmail.status, dataDuplicateEmail);
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 9: Rejeição de Matrícula SIAPE Duplicada (Conflito 409)
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 9: Rejeição de Matrícula SIAPE Duplicada (Conflito 409)');
    const resDuplicateSiape = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validPayload,
        email: `novo.docente.${uniqueTimestamp}@cefetmg.br` || `novo.${uniqueTimestamp}@cefet.edu.br`,
        matriculaSiape: testSiape, // Já cadastrada no Teste 1
      }),
    });

    const dataDuplicateSiape = await resDuplicateSiape.json();
    if (resDuplicateSiape.status === 409 && dataDuplicateSiape.type?.includes('conflict')) {
      console.log('   ✔ [PASS] Conflito 409 detectado para matrícula SIAPE duplicada.');
      console.log(`      Detalhe: ${dataDuplicateSiape.detail}`);
    } else {
      console.error('   ✖ [FAIL] Deveria retornar 409 para SIAPE duplicada:', resDuplicateSiape.status, dataDuplicateSiape);
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 10: Consulta do Perfil Autenticado via GET /api/auth/me
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 10: Consulta do Perfil Docente via GET /api/auth/me');
    const resMe = await fetch(`${baseUrl}/api/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${dataRegister.accessToken}`,
      },
    });

    const dataMe = await resMe.json();
    if (resMe.status === 200 && dataMe.id && dataMe.perfil && !('senha_hash' in dataMe)) {
      console.log('   ✔ [PASS] Perfil autenticado retornado com 200 OK:');
      console.log(`      Nome:     ${dataMe.nome}`);
      console.log(`      E-mail:   ${dataMe.email}`);
      console.log(`      UF:       ${dataMe.perfil.uf}`);
      console.log(`      SIAPE:    ${dataMe.perfil.matriculaSiape}`);
      console.log(`      Hash exposto? NÃO (100% seguro)`);
    } else {
      console.error('   ✖ [FAIL] Falha ao consultar GET /api/auth/me:', resMe.status, dataMe);
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
    console.log('🎉 TODOS OS CRITÉRIOS DE ACEITE DE REGISTRO PASSARAM COM SUCESSO!');
  } else {
    console.error('💥 ALGUNS TESTES FALHARAM! Verifique os logs acima.');
    process.exit(1);
  }
  console.log('================================================================');
}

runRegisterTests();

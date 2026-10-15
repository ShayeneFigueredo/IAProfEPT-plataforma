import http from 'http';
import app from './app.js';
import { query, closePool } from './config/database.js';
import { authService } from './services/AuthService.js';
import { consentimentoTcleRepository } from './repositories/ConsentimentoTcleRepository.js';

/**
 * Suite de Testes Automatizados: Controle de Consentimento Livre e Esclarecido (TCLE)
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Critérios de Aceite Verificados:
 * 1. Tabela 'consentimentos_tcle' persistindo usuario_id, versao_termo, timestamp ISO e IP anonimizado
 * 2. Anonimização estrita do IP conforme LGPD e Resolução CNS 510/2016 (máscara /24 ou /48)
 * 3. Endpoint GET /api/auth/termo-etico para auditoria de conformidade com CEP/UFJF
 * 4. Resposta enriquecida com status individual quando autenticado com Bearer Token
 * 5. Rejeição compulsoriamente de cadastro sem aceite ético (termoEticoAceito: false)
 * 6. CRITÉRIO DE ACEITE INEGOCIÁVEL: Nenhum usuário criado no banco sem o consentimento registrado (Garantia por Constraint Trigger no PostgreSQL)
 * 7. Auditoria relacional global comprovando 100% de conformidade ética da base
 */
async function runTcleTests() {
  console.log('================================================================');
  console.log('⚖️ TESTE DE REGISTRO DE CONSENTIMENTO E ACEITE DO TERMO ÉTICO (TCLE)');
  console.log('   Conformidade CEP/UFJF, Resolução CNS 510/2016 & Constraint Trigger');
  console.log('================================================================');

  // Inicializa servidor em porta efêmera (0)
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`📡 Servidor de teste ouvindo em ${baseUrl}\n`);

  let allPassed = true;
  const timestamp = Date.now();
  const testEmail = `docente.tcle.${timestamp}@ifsudestemg.edu.br`;

  try {
    // -------------------------------------------------------------
    // TESTE 1: Cadastro com Consentimento Ético Válido (POST /api/auth/register)
    // -------------------------------------------------------------
    console.log('🔹 Teste 1: Cadastro de Docente com Aceite do TCLE (POST /api/auth/register)');
    const resRegister = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '200.131.250.45', // IP da Rede Federal (IF)
      },
      body: JSON.stringify({
        nome: 'Prof. Dra. Maria Augusta',
        email: testEmail,
        senha: 'Senha@Forte2026#',
        uf: 'MG',
        instituicao: 'IF Sudeste MG',
        campus: 'Campus Barbacena',
        cursosTecnicos: ['Agropecuária', 'Informática'],
        matriculaSiape: `T${String(timestamp).slice(-7)}`,
        termoEticoAceito: true,
      }),
    });

    const dataRegister = await resRegister.json();
    let userId = dataRegister.usuario?.id;
    let accessToken = dataRegister.accessToken;

    if (resRegister.status === 201 && userId && dataRegister.perfil?.termoEtico) {
      const termoInfo = dataRegister.perfil.termoEtico;
      console.log('   ✔ [PASS] 201 Created: Docente registrado com dados de consentimento vinculados:');
      console.log(`      Usuário ID:     ${userId}`);
      console.log(`      TCLE Versão:    ${termoInfo.versao}`);
      console.log(`      TCLE Aceito:    ${termoInfo.aceito}`);
      console.log(`      IP Anonimizado: ${termoInfo.ipAnonimizado}`);
      console.log(`      Data Aceite:    ${termoInfo.dataAceite}`);
    } else {
      console.error('   ✖ [FAIL] Falha no cadastro de docente com TCLE:', resRegister.status, dataRegister);
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 2: Auditoria de Persistência na Tabela 'consentimentos_tcle'
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 2: Auditoria de Persistência na Tabela consentimentos_tcle no PostgreSQL');
    const tcleDbRes = await query(
      `SELECT id, usuario_id, versao_termo, aceito, ip_anonimizado, user_agent, created_at
       FROM consentimentos_tcle 
       WHERE usuario_id = $1
       ORDER BY created_at DESC 
       LIMIT 1;`,
      [userId]
    );

    if (tcleDbRes.rows.length === 1) {
      const dbRecord = tcleDbRes.rows[0];
      const isIpAnon = dbRecord.ip_anonimizado.endsWith('.0/24') || dbRecord.ip_anonimizado.includes('/48') || dbRecord.ip_anonimizado.includes('/128');
      const isIsoDate = !isNaN(Date.parse(dbRecord.created_at));

      if (dbRecord.aceito === true && dbRecord.versao_termo === '1.0' && isIpAnon && isIsoDate) {
        console.log('   ✔ [PASS] Registro na tabela consentimentos_tcle persistido com integridade total:');
        console.log(`      ID do Consentimento: ${dbRecord.id}`);
        console.log(`      Usuário Vinculado:   ${dbRecord.usuario_id}`);
        console.log(`      Versão Homologada:   ${dbRecord.versao_termo}`);
        console.log(`      IP Anonimizado:      ${dbRecord.ip_anonimizado} (LGPD & CNS 510/2016 OK)`);
        console.log(`      Timestamp ISO:       ${new Date(dbRecord.created_at).toISOString()}`);
      } else {
        console.error('   ✖ [FAIL] Dados do consentimento inconsistentes no banco:', dbRecord);
        allPassed = false;
      }
    } else {
      console.error('   ✖ [FAIL] Registro de consentimento NÃO encontrado na tabela consentimentos_tcle!');
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 3: Auditoria do Evento Ético na Tabela 'logs_auditoria'
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 3: Auditoria do Evento de Consentimento em logs_auditoria');
    const auditRes = await query(
      `SELECT acao, recurso, payload, created_at 
       FROM logs_auditoria 
       WHERE usuario_id = $1 AND acao = 'auth.aceite_tcle_cadastro';`,
      [userId]
    );

    if (auditRes.rows.length >= 1) {
      const auditLog = auditRes.rows[0];
      console.log('   ✔ [PASS] Evento de consentimento auditado no banco com rastreabilidade para a tese:');
      console.log(`      Ação:    ${auditLog.acao}`);
      console.log(`      Recurso: ${auditLog.recurso}`);
      console.log(`      Payload: ${JSON.stringify(auditLog.payload)}`);
    } else {
      console.error('   ✖ [FAIL] Log de auditoria auth.aceite_tcle_cadastro não foi encontrado!');
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 4: Endpoint Público de Auditoria Ética (GET /api/auth/termo-etico)
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 4: Consulta ao Endpoint Público (GET /api/auth/termo-etico)');
    const resPublicTermo = await fetch(`${baseUrl}/api/auth/termo-etico`);
    const dataPublicTermo = await resPublicTermo.json();

    if (
      resPublicTermo.status === 200 &&
      dataPublicTermo.tcle?.versaoVigente === '1.0' &&
      dataPublicTermo.auditoriaConformidade?.statusAuditoria === 'CONFORME_CEP_UFJF_CNS510'
    ) {
      console.log('   ✔ [PASS] 200 OK: Metadados do TCLE e auditoria institucional retornados com sucesso:');
      console.log(`      Título:             ${dataPublicTermo.tcle.titulo}`);
      console.log(`      Comitê de Ética:    ${dataPublicTermo.tcle.comiteEtica.nome}`);
      console.log(`      Respaldo Legal:     ${dataPublicTermo.tcle.respaldoLegal[0]}`);
      console.log(`      Pesquisador Resp.:  ${dataPublicTermo.tcle.pesquisadores.autor}`);
      console.log(`      Status Auditoria:   ${dataPublicTermo.auditoriaConformidade.statusAuditoria}`);
      console.log(`      Taxa Conformidade:  ${dataPublicTermo.auditoriaConformidade.taxaConformidade}`);
    } else {
      console.error('   ✖ [FAIL] Falha no retorno de GET /api/auth/termo-etico:', resPublicTermo.status, dataPublicTermo);
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 5: Consulta Autenticada ao TCLE (Status Individual do Docente)
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 5: Consulta Autenticada ao TCLE (GET /api/auth/termo-etico + Bearer Token)');
    const resAuthTermo = await fetch(`${baseUrl}/api/auth/termo-etico`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const dataAuthTermo = await resAuthTermo.json();

    if (
      resAuthTermo.status === 200 &&
      dataAuthTermo.consentimentoDocente?.registrado === true &&
      dataAuthTermo.consentimentoDocente?.versaoTermo === '1.0'
    ) {
      console.log('   ✔ [PASS] 200 OK: Dados específicos do consentimento docente validados:');
      console.log(`      Consentimento ID: ${dataAuthTermo.consentimentoDocente.consentimentoId}`);
      console.log(`      Registrado:       ${dataAuthTermo.consentimentoDocente.registrado}`);
      console.log(`      IP Anonimizado:   ${dataAuthTermo.consentimentoDocente.ipAnonimizado}`);
      console.log(`      Data de Aceite:   ${dataAuthTermo.consentimentoDocente.dataAceite}`);
    } else {
      console.error('   ✖ [FAIL] Falha na consulta autenticada ao termo ético:', resAuthTermo.status, dataAuthTermo);
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 6: CRITÉRIO DE ACEITE — Rejeição de Cadastro sem TCLE (termoEticoAceito: false)
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 6: Critério de Aceite — Rejeição de Cadastro sem Consentimento Ético');
    const emailSemAceite = `docente.semtermo.${timestamp}@ifsudestemg.edu.br`;
    const resSemAceite = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Prof. Tentativa Sem Aceite',
        email: emailSemAceite,
        senha: 'Senha@Valida2026#',
        uf: 'MG',
        instituicao: 'IF Sudeste MG',
        campus: 'Campus Juiz de Fora',
        cursosTecnicos: ['Informática'],
        termoEticoAceito: false, // RECUSOU O TCLE!
      }),
    });

    const dataSemAceite = await resSemAceite.json();

    if (resSemAceite.status === 422 || resSemAceite.status === 400) {
      // Verifica no banco se nenhum usuário foi criado
      const checkUserRes = await query(`SELECT id FROM usuarios WHERE email = $1;`, [emailSemAceite]);
      if (checkUserRes.rows.length === 0) {
        console.log('   ✔ [PASS] Cadastro sem aceite do TCLE rejeitado com segurança compulsoriamente:');
        console.log(`      Status HTTP: ${resSemAceite.status} (${resSemAceite.status === 422 ? 'Unprocessable Entity' : 'Bad Request'})`);
        console.log('   ✔ [PASS] Banco de dados verificado: NENHUM usuário foi persistido no PostgreSQL!');
      } else {
        console.error('   ✖ [FAIL] Usuário foi inserido no banco mesmo recusando o TCLE!');
        allPassed = false;
      }
    } else {
      console.error('   ✖ [FAIL] Deveria ter rejeitado cadastro com termoEticoAceito=false:', resSemAceite.status, dataSemAceite);
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 7: CRITÉRIO DE ACEITE EM NÍVEL DE BANCO — Constraint Trigger PostgreSQL
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 7: Critério de Aceite Inegociável — Constraint Trigger no PostgreSQL');
    let triggerBlocked = false;
    let triggerErrorMessage = '';

    try {
      // Tentativa de inserção direta no banco 'usuarios' SEM registrar na tabela 'consentimentos_tcle'
      await query(
        `INSERT INTO usuarios (nome, email, senha_hash, role, status)
         VALUES ($1, $2, $3, 'docente_rfepct', 'ativo');`,
        ['Docente Fantasma Sem TCLE', `fantasma.${timestamp}@ufjf.br`, '$2b$12$hashqualquerparaserrejeitadopelotrigger123']
      );
    } catch (dbErr) {
      triggerBlocked = true;
      triggerErrorMessage = dbErr.message;
    }

    if (triggerBlocked && triggerErrorMessage.includes('Violacao de Conformidade Etica')) {
      console.log('   ✔ [PASS] PostgreSQL bloqueou a inserção direta via CONSTRAINT TRIGGER:');
      console.log(`      Mensagem de Erro do Banco: "${triggerErrorMessage.split('\n')[0]}"`);
      console.log('   ✔ [PASS] Provada a impossibilidade física de existir usuário no PostgreSQL sem TCLE!');
    } else {
      console.error('   ✖ [FAIL] Constraint trigger falhou em impedir inserção sem TCLE:', triggerBlocked, triggerErrorMessage);
      allPassed = false;
    }

    // -------------------------------------------------------------
    // TESTE 8: Auditoria Relacional Global da Base de Dados
    // -------------------------------------------------------------
    console.log('\n🔹 Teste 8: Auditoria Relacional Global (Zero Usuários Sem Consentimento)');
    const auditStats = await consentimentoTcleRepository.getAuditoriaConformidade();

    if (auditStats.usuariosSemConsentimento === 0 && auditStats.totalUsuarios > 0) {
      console.log('   ✔ [PASS] Auditoria Global Concluída com 100% de Conformidade Ética:');
      console.log(`      Total de Usuários no Banco:           ${auditStats.totalUsuarios}`);
      console.log(`      Total de Consentimentos Ativos:       ${auditStats.totalConsentimentosAtivos}`);
      console.log(`      Usuários Sem Consentimento:           ${auditStats.usuariosSemConsentimento} (ZERO VIOLAÇÕES)`);
      console.log(`      Taxa de Conformidade:                 ${auditStats.taxaConformidade}`);
      console.log(`      Status de Governança Ética:           ${auditStats.statusAuditoria}`);
    } else {
      console.error('   ✖ [FAIL] Base de dados possui usuários sem consentimento registrado:', auditStats);
      allPassed = false;
    }

  } catch (error) {
    console.error('❌ Exceção não tratada durante os testes de TCLE:', error);
    allPassed = false;
  } finally {
    server.close();
    await closePool();
  }

  console.log('\n================================================================');
  if (allPassed) {
    console.log('🎉 TODOS OS CRITÉRIOS DE ACEITE DO TERMO ÉTICO (TCLE) PASSARAM!');
  } else {
    console.error('💥 ALGUNS TESTES DE TCLE FALHARAM! Verifique os logs acima.');
    process.exit(1);
  }
  console.log('================================================================');
}

runTcleTests();

import http from 'http';
import app from './app.js';
import { tokenService } from './services/TokenService.js';
import { ROLES } from './config/roles.js';
import { authorizeRoles, requireAdmin, requirePesquisador, requireDocente } from './middlewares/rbacMiddleware.js';
import { closePool } from './config/database.js';

/**
 * Suite de Testes Automatizados: Middleware de Autorização e RBAC
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Critérios de Aceite Verificados:
 * 1. Requisições sem token retornando 401 Unauthorized
 * 2. Requisições com token inválido/malformado retornando 401 Unauthorized
 * 3. Requisições com papel insuficiente retornando 403 Forbidden
 * 4. Docente RFEPCT bloqueado em endpoints administrativos (403 Forbidden)
 * 5. Docente RFEPCT bloqueado em métricas da tese (403 Forbidden)
 * 6. Pesquisador de Doutorado autorizado em métricas da tese (200 OK)
 * 7. Pesquisador de Doutorado bloqueado em endpoints de admin da UFJF (403 Forbidden)
 * 8. Administrador UFJF com acesso a endpoints administrativos e métricas (200 OK)
 * 9. Respostas padronizadas RFC 7807 Problem Details
 */
async function makeRequest(baseUrl, path, method = 'GET', token = null, body = null) {
  const url = new URL(path, baseUrl);

  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(rawData);
          } catch (e) {
            json = { raw: rawData };
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: json,
          });
        });
      }
    );

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runRbacTests() {
  console.log('================================================================');
  console.log('🛡️ TESTE DO MIDDLEWARE DE AUTORIZAÇÃO E RBAC (CONTROLE DE ACESSO)');
  console.log('   Papeis: docente_rfepct | pesquisador_doutorado | administrador_ufjf');
  console.log('   Criterio: 401 Unauthorized (sem token) | 403 Forbidden (papel insuficiente)');
  console.log('================================================================\n');

  let allPassed = true;

  // ---------------------------------------------------------------------------
  // PARTE 1: TESTES UNITÁRIOS DO MIDDLEWARE authorizeRoles
  // ---------------------------------------------------------------------------
  console.log('📋 [PARTE 1] Testes Unitários de Lógica do Middleware RBAC');

  // Teste U1: Rejeição sem token nem req.user
  let errorU1 = null;
  const mwAdmin = authorizeRoles(ROLES.ADMINISTRADOR_UFJF);
  mwAdmin({ headers: {} }, {}, (err) => {
    errorU1 = err;
  });

  if (errorU1 && errorU1.statusCode === 401) {
    console.log('   ✔ [PASS] U1: authorizeRoles rejeitou requisição sem token com 401 Unauthorized');
  } else {
    console.error('   ✖ [FAIL] U1: authorizeRoles não retornou 401 para falta de token:', errorU1);
    allPassed = false;
  }

  // Teste U2: Rejeição com papel insuficiente (docente tentando rota admin)
  let errorU2 = null;
  const mockReqDocente = { user: { id: '1', role: ROLES.DOCENTE_RFEPCT, nome: 'Docente Teste' } };
  mwAdmin(mockReqDocente, {}, (err) => {
    errorU2 = err;
  });

  if (errorU2 && errorU2.statusCode === 403) {
    console.log('   ✔ [PASS] U2: authorizeRoles rejeitou docente em rota admin com 403 Forbidden');
    console.log(`      Mensagem: "${errorU2.message}"`);
  } else {
    console.error('   ✖ [FAIL] U2: authorizeRoles não retornou 403 para papel insuficiente:', errorU2);
    allPassed = false;
  }

  // Teste U3: Autorização de administrador
  let nextCalledU3 = false;
  const mockReqAdmin = { user: { id: '2', role: ROLES.ADMINISTRADOR_UFJF, nome: 'Admin Teste' } };
  mwAdmin(mockReqAdmin, {}, (err) => {
    if (!err) nextCalledU3 = true;
  });

  if (nextCalledU3) {
    console.log('   ✔ [PASS] U3: authorizeRoles autorizou administrador_ufjf com sucesso');
  } else {
    console.error('   ✖ [FAIL] U3: authorizeRoles barrou administrador_ufjf indevidamente');
    allPassed = false;
  }

  // Teste U4: Middleware pré-configurado requirePesquisador aceita pesquisador e admin, mas rejeita docente
  let nextPesq = false;
  let nextAdmin = false;
  let errDoc = null;
  requirePesquisador({ user: { role: ROLES.PESQUISADOR_DOUTORADO } }, {}, (err) => { if (!err) nextPesq = true; });
  requirePesquisador({ user: { role: ROLES.ADMINISTRADOR_UFJF } }, {}, (err) => { if (!err) nextAdmin = true; });
  requirePesquisador({ user: { role: ROLES.DOCENTE_RFEPCT } }, {}, (err) => { errDoc = err; });

  if (nextPesq && nextAdmin && errDoc && errDoc.statusCode === 403) {
    console.log('   ✔ [PASS] U4: requirePesquisador validou pesquisador e admin e rejeitou docente');
  } else {
    console.error('   ✖ [FAIL] U4: requirePesquisador falhou no controle de múltiplos papéis');
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // PARTE 2: TESTES DE INTEGRAÇÃO HTTP END-TO-END (SERVIDOR EFÊMERO)
  // ---------------------------------------------------------------------------
  console.log('\n📡 [PARTE 2] Testes de Integração HTTP End-to-End via API Express');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`   Servidor de teste ouvindo em ${baseUrl}\n`);

  try {
    // Gerar tokens JWT assinados para cada papel
    const tokenDocente = tokenService.generateAccessToken({
      id: 'd1111111-1111-1111-1111-111111111111',
      email: 'professor.ept@ifsudestemg.edu.br',
      role: ROLES.DOCENTE_RFEPCT,
      nome: 'Prof. Carlos Eduardo Silveira',
    });

    const tokenPesquisador = tokenService.generateAccessToken({
      id: 'd2222222-2222-2222-2222-222222222222',
      email: 'maycon.magalhaes@ifnmg.edu.br',
      role: ROLES.PESQUISADOR_DOUTORADO,
      nome: 'Maycon Luiz Amaral Magalhães',
    });

    const tokenAdmin = tokenService.generateAccessToken({
      id: 'd3333333-3333-3333-3333-333333333333',
      email: 'admin.infra@ufjf.br',
      role: ROLES.ADMINISTRADOR_UFJF,
      nome: 'Administrador de Sistemas UFJF',
    });

    // CENÁRIO 1: Requisições SEM TOKEN para endpoints restritos -> 401 Unauthorized
    console.log('🔹 Cenário 1: Requisições sem token (Critério 401 Unauthorized)');
    const resNoTokenAdmin = await makeRequest(baseUrl, '/api/admin/usuarios');
    const resNoTokenMetricas = await makeRequest(baseUrl, '/api/metricas/tese');

    const is401Admin = resNoTokenAdmin.status === 401 && resNoTokenAdmin.body.status === 401;
    const is401Metricas = resNoTokenMetricas.status === 401 && resNoTokenMetricas.body.status === 401;

    if (is401Admin && is401Metricas) {
      console.log('   ✔ [PASS] GET /api/admin/usuarios sem token retornou 401 Unauthorized (RFC 7807)');
      console.log('   ✔ [PASS] GET /api/metricas/tese sem token retornou 401 Unauthorized (RFC 7807)');
    } else {
      console.error('   ✖ [FAIL] Falha na rejeição de requisição sem token:', { resNoTokenAdmin, resNoTokenMetricas });
      allPassed = false;
    }

    // CENÁRIO 2: Requisição com TOKEN ADULTERADO/MALFORMADO -> 401 Unauthorized
    console.log('\n🔹 Cenário 2: Requisição com token inválido/adulterado');
    const resInvalidToken = await makeRequest(baseUrl, '/api/admin/usuarios', 'GET', 'token_completamente_invalido_123');

    if (resInvalidToken.status === 401) {
      console.log('   ✔ [PASS] Token inválido bloqueado com 401 Unauthorized');
    } else {
      console.error('   ✖ [FAIL] Token inválido não retornou 401:', resInvalidToken.status);
      allPassed = false;
    }

    // CENÁRIO 3: Docente RFEPCT tentando acessar endpoint administrativo -> 403 Forbidden
    console.log('\n🔹 Cenário 3: Docente RFEPCT em endpoint administrativo (Critério 403 Forbidden)');
    const resDocenteAdmin = await makeRequest(baseUrl, '/api/admin/usuarios', 'GET', tokenDocente);

    if (resDocenteAdmin.status === 403 && resDocenteAdmin.body.status === 403) {
      console.log('   ✔ [PASS] GET /api/admin/usuarios com token docente retornou 403 Forbidden');
      console.log(`      Problem Details: "${resDocenteAdmin.body.detail}"`);
    } else {
      console.error('   ✖ [FAIL] Docente não recebeu 403 em rota de admin:', resDocenteAdmin);
      allPassed = false;
    }

    // CENÁRIO 4: Docente RFEPCT tentando acessar métricas da tese -> 403 Forbidden
    console.log('\n🔹 Cenário 4: Docente RFEPCT em métricas da tese (Critério 403 Forbidden)');
    const resDocenteMetricas = await makeRequest(baseUrl, '/api/metricas/tese', 'GET', tokenDocente);

    if (resDocenteMetricas.status === 403 && resDocenteMetricas.body.status === 403) {
      console.log('   ✔ [PASS] GET /api/metricas/tese com token docente retornou 403 Forbidden');
      console.log(`      Problem Details: "${resDocenteMetricas.body.detail}"`);
    } else {
      console.error('   ✖ [FAIL] Docente não recebeu 403 em métricas da tese:', resDocenteMetricas);
      allPassed = false;
    }

    // CENÁRIO 5: Pesquisador de Doutorado tentando acessar rota administrativa -> 403 Forbidden
    console.log('\n🔹 Cenário 5: Pesquisador de Doutorado em rota exclusiva de administrador');
    const resPesqAdmin = await makeRequest(baseUrl, '/api/admin/usuarios', 'GET', tokenPesquisador);

    if (resPesqAdmin.status === 403) {
      console.log('   ✔ [PASS] Pesquisador bloqueado em rota exclusiva de administrador com 403 Forbidden');
    } else {
      console.error('   ✖ [FAIL] Pesquisador acessou indevidamente rota restrita ao admin:', resPesqAdmin);
      allPassed = false;
    }

    // CENÁRIO 6: Pesquisador de Doutorado acessando métricas da tese -> 200 OK
    console.log('\n🔹 Cenário 6: Pesquisador de Doutorado acessando métricas da tese (200 OK)');
    const resPesqMetricas = await makeRequest(baseUrl, '/api/metricas/tese', 'GET', tokenPesquisador);

    if (resPesqMetricas.status === 200 && resPesqMetricas.body.sucesso) {
      console.log('   ✔ [PASS] GET /api/metricas/tese autorizado para pesquisador_doutorado (200 OK)');
      console.log(`      Tese: ${resPesqMetricas.body.metadadosPesquisa?.doutorando} (${resPesqMetricas.body.metadadosPesquisa?.programa})`);
      console.log(`      Alerta Ético presente: "${resPesqMetricas.body.alertaEticoObrigatorio ? 'SIM' : 'NÃO'}"`);
    } else {
      console.error('   ✖ [FAIL] Falha no acesso a métricas pelo pesquisador:', resPesqMetricas);
      allPassed = false;
    }

    // CENÁRIO 7: Administrador UFJF acessando endpoints administrativos -> 200 OK
    console.log('\n🔹 Cenário 7: Administrador UFJF acessando endpoints administrativos (200 OK)');
    const resAdminUsuarios = await makeRequest(baseUrl, '/api/admin/usuarios', 'GET', tokenAdmin);
    const resAdminAuditoria = await makeRequest(baseUrl, '/api/admin/auditoria', 'GET', tokenAdmin);
    const resAdminEstatisticas = await makeRequest(baseUrl, '/api/admin/estatisticas', 'GET', tokenAdmin);

    const is200Usuarios = resAdminUsuarios.status === 200 && resAdminUsuarios.body.sucesso;
    const is200Auditoria = resAdminAuditoria.status === 200 && resAdminAuditoria.body.sucesso;
    const is200Estatisticas = resAdminEstatisticas.status === 200 && resAdminEstatisticas.body.sucesso;

    if (is200Usuarios && is200Auditoria && is200Estatisticas) {
      console.log('   ✔ [PASS] GET /api/admin/usuarios autorizado para administrador_ufjf (200 OK)');
      console.log(`      Total de usuários retornados: ${resAdminUsuarios.body.total}`);
      console.log('   ✔ [PASS] GET /api/admin/auditoria autorizado para administrador_ufjf (200 OK)');
      console.log('   ✔ [PASS] GET /api/admin/estatisticas autorizado para administrador_ufjf (200 OK)');
    } else {
      console.error('   ✖ [FAIL] Administrador bloqueado em endpoints administrativos:', {
        usuariosStatus: resAdminUsuarios.status,
        auditoriaStatus: resAdminAuditoria.status,
        statsStatus: resAdminEstatisticas.status,
      });
      allPassed = false;
    }

    // CENÁRIO 8: Administrador UFJF acessando métricas da tese -> 200 OK
    console.log('\n🔹 Cenário 8: Administrador UFJF com acesso a métricas da tese');
    const resAdminMetricas = await makeRequest(baseUrl, '/api/metricas/tese', 'GET', tokenAdmin);

    if (resAdminMetricas.status === 200 && resAdminMetricas.body.sucesso) {
      console.log('   ✔ [PASS] Administrador UFJF autorizado a visualizar métricas científicas (200 OK)');
    } else {
      console.error('   ✖ [FAIL] Administrador não conseguiu acessar métricas:', resAdminMetricas);
      allPassed = false;
    }

    // CENÁRIO 9: Rota descritiva da API (/api) listando as permissões RBAC
    console.log('\n🔹 Cenário 9: Rota descritiva GET /api com mapa de permissões');
    const resDesc = await makeRequest(baseUrl, '/api');

    if (resDesc.status === 200 && resDesc.body.rotasDisponiveis?.adminUsuarios) {
      console.log('   ✔ [PASS] Documentação de rotas (/api) atualizada com RBAC');
      console.log(`      adminUsuarios: ${resDesc.body.rotasDisponiveis.adminUsuarios}`);
      console.log(`      metricasTese:  ${resDesc.body.rotasDisponiveis.metricasTese}`);
    } else {
      console.error('   ✖ [FAIL] Falha no catálogo descritivo de rotas:', resDesc);
      allPassed = false;
    }

    console.log('\n================================================================');
    if (allPassed) {
      console.log('🎉 TODOS OS TESTES DE RBAC PASSARAM COM 100% DE SUCESSO!');
      console.log('   Critérios de Aceite cumpridos:');
      console.log('   - 401 Unauthorized para requisições sem token');
      console.log('   - 403 Forbidden para requisições com papel insuficiente');
      console.log('   - Endpoints administrativos e métricas da tese restritos');
    } else {
      console.error('💥 ALGUNS TESTES DE RBAC FALHARAM.');
    }
    console.log('================================================================\n');
  } finally {
    server.close();
    await closePool();
  }

  if (!allPassed) {
    process.exit(1);
  }
}

runRbacTests().catch((err) => {
  console.error('❌ Erro fatal nos testes RBAC:', err);
  process.exit(1);
});

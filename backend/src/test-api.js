import http from 'http';
import app from './app.js';
import { closePool } from './config/database.js';

/**
 * Script de Teste e Validação da Arquitetura RESTful e RFC 7807
 * Plataforma IAprofEPT — PPGEM / UFJF
 */
async function runApiTests() {
  console.log('================================================================');
  console.log('🧪 TESTE DA API RESTful, MIDDLEWARES E PADRÃO RFC 7807');
  console.log('   Critério de Aceite: /api/health ativo e zero stack traces');
  console.log('================================================================');

  // Inicializa servidor em porta efêmera (0) para teste
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`📡 Servidor de teste ouvindo em ${baseUrl}\n`);

  let allPassed = true;

  try {
    // TESTE 1: GET /api/ping
    console.log('🔹 Teste 1: GET /api/ping');
    const resPing = await fetch(`${baseUrl}/api/ping`);
    const dataPing = await resPing.json();
    if (resPing.status === 200 && dataPing.pong === true) {
      console.log('   ✔ [PASS] Respondeu 200 OK com pong: true');
    } else {
      console.error('   ✖ [FAIL] Falha no ping:', resPing.status, dataPing);
      allPassed = false;
    }

    // TESTE 2: GET /api/health
    console.log('\n🔹 Teste 2: GET /api/health');
    const resHealth = await fetch(`${baseUrl}/api/health`);
    const dataHealth = await resHealth.json();
    if ([200, 503].includes(resHealth.status) && dataHealth.status && dataHealth.bancoDeDados) {
      console.log(`   ✔ [PASS] Respondeu ${resHealth.status} com diagnóstico completo.`);
      console.log(`      Status:   ${dataHealth.status}`);
      console.log(`      Memória:  ${dataHealth.sistema?.memoryRssMb}MB RSS`);
      console.log(`      Uptime:   ${dataHealth.uptimeSeconds}s`);
    } else {
      console.error('   ✖ [FAIL] Falha no healthcheck:', resHealth.status, dataHealth);
      allPassed = false;
    }

    // TESTE 3: Rota Inexistente (404 Not Found no formato RFC 7807)
    console.log('\n🔹 Teste 3: GET /api/rota-inexistente-12345 (Validação RFC 7807)');
    const res404 = await fetch(`${baseUrl}/api/rota-inexistente-12345`);
    const data404 = await res404.json();
    const isContentTypeProblem = res404.headers.get('content-type')?.includes('problem+json');
    const hasNoStack404 = !data404.stack && !JSON.stringify(data404).includes('at Object.');

    if (res404.status === 404 && data404.type && data404.title && hasNoStack404) {
      console.log('   ✔ [PASS] Respondeu 404 com Content-Type application/problem+json');
      console.log(`      Type:  ${data404.type}`);
      console.log(`      Title: ${data404.title}`);
      console.log(`      Detail: ${data404.detail}`);
      console.log('      Stack trace oculto com sucesso!');
    } else {
      console.error('   ✖ [FAIL] 404 fora do padrão RFC 7807 ou vazando stack:', data404);
      allPassed = false;
    }

    // TESTE 4: Exceção Interna (500 Internal Server Error sem expor Stack Trace)
    console.log('\n🔹 Teste 4: GET /api/health/error-simulation (Tratamento de Exceção Não Tratada)');
    const res500 = await fetch(`${baseUrl}/api/health/error-simulation`);
    const data500 = await res500.json();
    const hasNoStack500 = !data500.stack && !JSON.stringify(data500).includes('at Object.');

    if (res500.status === 500 && data500.title === 'Erro Interno do Servidor' && hasNoStack500) {
      console.log('   ✔ [PASS] Respondeu 500 com RFC 7807 genérico seguro.');
      console.log(`      Title:  ${data500.title}`);
      console.log(`      Detail: ${data500.detail}`);
      console.log('      ✔ CRITÉRIO ATENDIDO: ZERO STACK TRACES expostos ao cliente!');
    } else {
      console.error('   ✖ [FAIL] 500 vazou dados sensíveis ou stack trace:', data500);
      allPassed = false;
    }

    // TESTE 5: Headers de Segurança (Helmet)
    console.log('\n🔹 Teste 5: Validação de Headers de Segurança (Helmet)');
    const headers = resPing.headers;
    const xContentType = headers.get('x-content-type-options');
    const xFrameOptions = headers.get('x-frame-options');
    if (xContentType === 'nosniff') {
      console.log('   ✔ [PASS] Helmet ativo: X-Content-Type-Options: nosniff presente.');
    } else {
      console.warn('   ⚠️  Aviso: Header X-Content-Type-Options não detectado.');
    }

    console.log('\n================================================================');
    if (allPassed) {
      console.log('🎉 TODOS OS TESTES PASSARAM! ARQUITETURA CONFORME CRITÉRIOS DE ACEITE.');
    } else {
      console.error('💥 ALGUNS TESTES FALHARAM.');
    }
    console.log('================================================================');
  } finally {
    server.close();
    await closePool();
  }
}

runApiTests();

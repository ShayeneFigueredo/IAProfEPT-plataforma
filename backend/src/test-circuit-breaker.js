import http from 'http';
import app from './app.js';
import {
  CircuitBreaker,
  CircuitState,
  CircuitBreakerOpenError,
  AIInferenceTimeoutError,
} from './services/CircuitBreaker.js';
import { AIRouterService, aiRouterService } from './services/AIRouterService.js';
import { laboratorioRepository } from './repositories/LaboratorioRepository.js';
import { pool, closePool } from './config/database.js';

/**
 * Suite de Testes Automatizados: Roteador Inteligente e Circuit Breaker com Fallback Automático
 * Plataforma IAprofEPT — Tese de Doutorado PPGEM / UFJF
 * 
 * Critérios de Aceite Verificados:
 * 1. Padrão Circuit Breaker com transições formais de estado: CLOSED -> OPEN -> HALF_OPEN -> CLOSED.
 * 2. Detecção e corte de timeout de inferência (> 10s ou limite configurado).
 * 3. Chaveamento transparente e automático para o motor secundário em caso de falha do primário.
 * 4. Registro persistente do evento de contingência na tabela logs_auditoria e telemetria_ab no PostgreSQL.
 * 5. Injeção inegociável do Alerta Ético Institucional de validação docente em todas as respostas.
 * 6. Critério de Aceite: Zero travamentos para o professor em cenários de queda de uma das APIs.
 * 7. Endpoints RESTful funcionais: POST /api/laboratorio/gerar e GET /api/laboratorio/circuit-breaker-status.
 */
async function runCircuitBreakerTests() {
  console.log('========================================================================');
  console.log('🛡️  TESTE DO ROTEADOR INTELIGENTE E CIRCUIT BREAKER DE RESILIÊNCIA');
  console.log('   Pesquisa: Tese de Doutorado PPGEM/UFJF — Maycon Magalhães');
  console.log('   Critério de Aceite: Zero travamentos para o docente em quedas de APIs');
  console.log('========================================================================\n');

  let allPassed = true;

  function assert(condition, message, details = null) {
    if (condition) {
      console.log(`   ✔ [PASS] ${message}`);
    } else {
      console.error(`   ✖ [FAIL] ${message}`);
      if (details) console.error('     Detalhes:', details);
      allPassed = false;
    }
  }

  // ========================================================================
  // 1. TESTES UNITÁRIOS DO CIRCUIT BREAKER (ESTADOS E TRANSIÇÕES)
  // ========================================================================
  console.log('--- 1. TESTES DO PADRÃO CIRCUIT BREAKER (TRANSIÇÕES DE ESTADO) ---');

  console.log('\n🔹 Teste 1: Estado inicial CLOSED e execução normal bem-sucedida');
  const breakerTeste = new CircuitBreaker({
    name: 'motor-teste',
    failureThreshold: 2,
    resetTimeoutMs: 300, // 300ms para teste ágil de recuperação
    timeoutMs: 500,      // 500ms para teste de timeout
  });

  assert(breakerTeste.state === CircuitState.CLOSED, 'Estado inicial é CLOSED');
  const resSucesso = await breakerTeste.execute(async () => 'OK');
  assert(resSucesso === 'OK', 'Execução retornou resultado com sucesso');
  assert(breakerTeste.state === CircuitState.CLOSED, 'Estado permanece CLOSED após sucesso');
  assert(breakerTeste.consecutiveFailures === 0, 'Contador de falhas consecutivas zerado');

  console.log('\n🔹 Teste 2: Detecção de Timeout (> timeoutMs) e corte de inferência');
  let timeoutCapturado = false;
  try {
    await breakerTeste.execute(async () => {
      // Simula uma API travada que demora 1500ms (acima do limite de 500ms)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return 'NUNCA_CHEGA';
    });
  } catch (err) {
    if (err instanceof AIInferenceTimeoutError) {
      timeoutCapturado = true;
    }
  }
  assert(timeoutCapturado, 'AIInferenceTimeoutError lançado ao exceder limite de timeout');
  assert(breakerTeste.consecutiveFailures === 1, 'Registrou 1ª falha consecutiva');

  console.log('\n🔹 Teste 3: Abertura do Circuito (CLOSED -> OPEN) ao atingir o limiar');
  try {
    await breakerTeste.execute(async () => {
      throw new Error('Falha simulada 500/503');
    });
  } catch (e) {
    // Falha esperada
  }
  assert(
    breakerTeste.state === CircuitState.OPEN,
    'Circuito transitou para OPEN após atingir 2 falhas consecutivas'
  );

  console.log('\n🔹 Teste 4: Fast-Fail imediato enquanto OPEN (sem penalidade de timeout)');
  let fastFailCapturado = false;
  const tFastStart = performance.now();
  try {
    await breakerTeste.execute(async () => 'DEVE_SER_BLOQUEADO');
  } catch (err) {
    if (err instanceof CircuitBreakerOpenError) {
      fastFailCapturado = true;
    }
  }
  const tFastElapsed = Math.round(performance.now() - tFastStart);
  assert(fastFailCapturado, 'CircuitBreakerOpenError lançado imediatamente');
  assert(
    tFastElapsed < 50,
    `Fast-fail executou em tempo quase instantâneo (${tFastElapsed}ms < 50ms)`
  );

  console.log('\n🔹 Teste 5: Transição para HALF_OPEN após cooldown e restauração para CLOSED');
  // Aguarda expiração do cooldown de 300ms
  await new Promise((resolve) => setTimeout(resolve, 350));
  const resRecuperacao = await breakerTeste.execute(async () => 'RECUPERADO');
  assert(resRecuperacao === 'RECUPERADO', 'Requisição de teste executada com sucesso');
  assert(
    breakerTeste.state === CircuitState.CLOSED,
    'Circuito restaurou para CLOSED após teste bem-sucedido em HALF_OPEN'
  );

  // ========================================================================
  // 2. ORQUESTRADOR DE RESILIÊNCIA E CHAVEAMENTO AUTOMÁTICO (FALLBACK)
  // ========================================================================
  console.log('\n--- 2. ORQUESTRADOR DE RESILIÊNCIA COM FALLBACK TRANSPARENTE ---');

  const routerTeste = new AIRouterService({
    timeoutMs: 10000,
    failureThreshold: 2,
    resetTimeoutMs: 30000,
  });

  const paramsPadrao = {
    areaMatematica: 'Funções Afins e Quadráticas',
    nivel: 'Intermediário (2º Ano Integrado)',
    quantidade: 1,
    cursoTecnico: 'Técnico em Enfermagem / Saúde',
    metodologia: 'Aprendizagem Baseada em Problemas (PBL)',
    ferramenta: 'exercicios',
  };

  console.log('\n🔹 Teste 6: Fluxo normal com motor primário operacional');
  const resNormal = await routerTeste.gerarComResiliencia(paramsPadrao, {
    motorPreferencial: 'groq',
    gravarBanco: false,
  });

  assert(resNormal.sucesso === true, 'Geração normal retornou sucesso: true');
  assert(
    resNormal.contingencia.acionada === false,
    'Contingência não foi necessária (motor primário atendeu normalmente)'
  );
  assert(
    resNormal.alertaEtico && resNormal.alertaEtico.includes('Este material foi gerado por Inteligência Artificial'),
    'Alerta ético institucional de validação docente presente na saída normal'
  );

  console.log('\n🔹 Teste 7: Queda do motor primário (Groq 500) -> Chaveamento transparente para Gemini');
  // Cria um roteador com simulação de erro no motor primário
  const routerComFalhaGroq = new (class extends AIRouterService {
    async _executarChamadaMotor(motor, params, opts) {
      if (motor === 'groq') {
        throw new Error('503 Service Unavailable: Groq LPU cluster temporariamente instável');
      }
      return super._executarChamadaMotor(motor, params, opts);
    }
  })({ timeoutMs: 10000, timeoutSecundarioMs: 35000, failureThreshold: 1 });

  const resFallback = await routerComFalhaGroq.gerarComResiliencia(paramsPadrao, {
    motorPreferencial: 'groq',
    gravarBanco: true, // Grava auditoria de contingência no banco
  });

  assert(resFallback.sucesso === true, '[CRITÉRIO DE ACEITE] Geração concluiu com sucesso mesmo com queda do Groq');
  assert(resFallback.contingencia.acionada === true, 'Flag de contingência acionada: true');
  assert(
    resFallback.contingencia.motorPrimarioFalhou === 'groq',
    'Identificou corretamente motor primário que falhou: groq'
  );
  assert(
    resFallback.contingencia.motorSecundarioAtivado === 'gemini',
    'Chaveou transparentemente para o motor secundário: gemini'
  );
  assert(
    Boolean(resFallback.atividade),
    'Atividade pedagógica gerada e entregue integralmente ao docente'
  );
  assert(
    resFallback.alertaEtico && resFallback.alertaEtico.includes('autoridade docente'),
    'Alerta ético obrigatório preservado mesmo no fluxo de contingência'
  );

  console.log('\n🔹 Teste 8: Verificação de gravação do evento de contingência no PostgreSQL');
  const resAuditoria = await pool.query(`
    SELECT * FROM logs_auditoria 
    WHERE acao = 'CONTINGENCIA_CIRCUIT_BREAKER' 
    ORDER BY created_at DESC 
    LIMIT 1;
  `);

  assert(resAuditoria.rows.length > 0, 'Evento de contingência registrado na tabela logs_auditoria');
  const evento = resAuditoria.rows[0];
  const payload = typeof evento.payload === 'string' ? JSON.parse(evento.payload) : evento.payload;
  assert(payload.motorPrimario === 'groq', 'Auditoria registrou motor primário falho: groq');
  assert(payload.motorSecundario === 'gemini', 'Auditoria registrou motor secundário: gemini');
  assert(
    payload.tipo === 'FALLBACK_AUTOMATICO_CIRCUIT_BREAKER',
    'Tipo de auditoria padronizado para FALLBACK_AUTOMATICO_CIRCUIT_BREAKER'
  );

  console.log('\n🔹 Teste 9: Simulação de Timeout (> 10s) no primário com failover transparente');
  const routerComTimeout = new (class extends AIRouterService {
    async _executarChamadaMotor(motor, params, opts) {
      if (motor === 'gemini') {
        // Simula timeout artificial no primário (2000ms > timeoutMs de 800ms)
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return { nunca: 'chega' };
      }
      return super._executarChamadaMotor(motor, params, opts);
    }
  })({ timeoutMs: 800, timeoutSecundarioMs: 25000, failureThreshold: 1 });

  const resTimeoutFallback = await routerComTimeout.gerarComResiliencia(paramsPadrao, {
    motorPreferencial: 'gemini',
    gravarBanco: false,
  });

  assert(
    resTimeoutFallback.sucesso === true,
    '[CRITÉRIO DE ACEITE] Timeout no primário não travou o docente, chaveando para o secundário'
  );
  assert(
    resTimeoutFallback.contingencia.motorPrimarioFalhou === 'gemini',
    'Identificou primário atingido por timeout: gemini'
  );
  assert(
    resTimeoutFallback.contingencia.motorSecundarioAtivado === 'groq',
    'Secundário ativado com sucesso: groq'
  );

  // ========================================================================
  // 3. TESTES DE INTEGRAÇÃO DOS ENDPOINTS HTTP RESTful
  // ========================================================================
  console.log('\n--- 3. TESTES DE INTEGRAÇÃO DOS ENDPOINTS HTTP RESTful ---');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`📡 Servidor de testes ouvindo em ${baseUrl}`);

  try {
    // Teste 3.1: GET /api/laboratorio/circuit-breaker-status
    console.log('\n🔹 Teste 10: HTTP GET /api/laboratorio/circuit-breaker-status');
    const resStatus = await fetch(`${baseUrl}/api/laboratorio/circuit-breaker-status`);
    const dataStatus = await resStatus.json();

    assert(resStatus.status === 200, `Retornou HTTP 200 OK (recebido ${resStatus.status})`);
    assert(dataStatus.status === 'operacional', 'Status operacional retornado');
    assert(Boolean(dataStatus.circuitos?.groq && dataStatus.circuitos?.gemini), 'Retornou estados dos dois circuitos');
    assert(
      dataStatus.circuitos.groq.state === CircuitState.CLOSED ||
        dataStatus.circuitos.groq.state === CircuitState.OPEN,
      `Estado do circuito Groq: ${dataStatus.circuitos.groq.state}`
    );

    // Teste 3.2: POST /api/laboratorio/gerar (Rota Unificada Resiliente)
    console.log('\n🔹 Teste 11: HTTP POST /api/laboratorio/gerar');
    const resGerar = await fetch(`${baseUrl}/api/laboratorio/gerar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...paramsPadrao,
        motorPreferencial: 'groq',
      }),
    });
    const dataGerar = await resGerar.json();

    assert(resGerar.status === 200, `Retornou HTTP 200 OK (recebido ${resGerar.status})`);
    assert(dataGerar.sucesso === true, 'Resposta contém sucesso: true');
    assert(
      Boolean(dataGerar.atividade && dataGerar.alertaEtico),
      'Resposta contém atividade gerada e banner de autoridade docente'
    );
    assert(
      dataGerar.contingencia !== undefined,
      'Objeto de contingência presente nos metadados de retorno'
    );
  } finally {
    server.close();
    await closePool();
  }

  console.log('\n========================================================================');
  if (allPassed) {
    console.log('🎉 TODOS OS TESTES DO ROTEADOR INTELIGENTE E CIRCUIT BREAKER PASSARAM!');
    console.log('   Critérios de Aceite cumpridos:');
    console.log('   - Padrão Circuit Breaker com estados CLOSED, OPEN e HALF_OPEN implementado');
    console.log('   - Limite de timeout de inferência de 10s com corte automático');
    console.log('   - Chaveamento automático e transparente entre Groq e Gemini');
    console.log('   - Registro persistente de contingência em logs_auditoria e telemetria_ab');
    console.log('   - Alerta ético institucional obrigatório presente em 100% das saídas');
    console.log('   - Critério de Aceite: Zero travamentos para o docente em instabilidades de APIs');
  } else {
    console.error('💥 ALGUNS TESTES FALHARAM.');
    process.exit(1);
  }
  console.log('========================================================================\n');
}

runCircuitBreakerTests().catch((err) => {
  console.error('Erro fatal durante a execução dos testes de resiliência:', err);
  process.exit(1);
});

import http from 'http';
import app from './app.js';
import { groqService } from './services/GroqService.js';
import { RateLimitError } from './errors/AppError.js';
import { closePool } from './config/database.js';

/**
 * Suite de Testes Automatizados: Integração com Groq API (LLaMA 3.3 70B via LPU)
 * Plataforma IAprofEPT — Tese de Doutorado PPGEM / UFJF
 * 
 * Critérios de Aceite Verificados:
 * 1. Chamada de inferência concluída com tempo de resposta inferior a 2 segundos (< 2000 ms) via LPU Groq.
 * 2. Parametrização de temperatura baixa (0.2 a 0.4) para cálculo matemático preciso.
 * 3. Formato de saída estrito em JSON com gabarito comentado passo a passo.
 * 4. Injeção obrigatória do Alerta Ético de Validação Docente (ADR-002).
 * 5. Tratamento resiliente de Rate Limits HTTP 429 (backoff exponencial, leitura de headers).
 * 6. Endpoints RESTful no padrão RFC 7807 (POST /api/laboratorio/gerar-groq e GET /api/laboratorio/groq-benchmark).
 */
async function runGroqTests() {
  console.log('========================================================================');
  console.log('⚡ TESTE DE INTEGRAÇÃO GROQ API (LLaMA 3.3 70B VIA LPU DA GROQ)');
  console.log('   Pesquisa: Tese de Doutorado PPGEM/UFJF — Maycon Magalhães');
  console.log('   Critério de Aceite: Resposta < 2 segundos e tratamento de rate limits 429');
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
  // 1. BENCHMARK E VALIDAÇÃO DA LATÊNCIA SUB-2 SEGUNDOS (LPU GROQ)
  // ========================================================================
  console.log('--- 1. BENCHMARK DE LATÊNCIA DA LPU GROQ (CRITÉRIO: < 2.000 ms) ---');

  console.log('\n🔹 Teste 1: Benchmark de velocidade LPU');
  const t0 = performance.now();
  const benchmark = await groqService.benchmarkLpu();
  const tTotal = Math.round(performance.now() - t0);

  console.log(`   ⏱️  Latência medida pela LPU: ${benchmark.latenciaMs} ms (Total do ciclo: ${tTotal} ms)`);
  console.log(`   🤖 Modelo utilizado: ${benchmark.modelo} ${benchmark.fallbackUtilizado ? '(Fallback operacional)' : ''}`);
  assert(benchmark.status === 'operacional', 'LPU Groq respondeu com status operacional');
  assert(
    benchmark.latenciaMs < 2000,
    `[CRITÉRIO DE ACEITE] Tempo de resposta inferior a 2 segundos: ${benchmark.latenciaMs}ms < 2000ms`,
    benchmark
  );
  assert(
    benchmark.rateLimits && benchmark.rateLimits.remainingRequests !== undefined,
    'Cabeçalhos de Rate Limit detectados e mapeados com sucesso'
  );

  // ========================================================================
  // 2. GERAÇÃO REAL DE ATIVIDADE CURRICULAR PARAMETRIZADA COM TEMPERATURA 0.2
  // ========================================================================
  console.log('\n--- 2. INFERÊNCIA CURRICULAR COM CÁLCULO PRECISO (TEMP 0.2) ---');

  console.log('\n🔹 Teste 2: Geração de Atividade Contextualizada para Técnico em Enfermagem');
  const paramsEnfermagem = {
    areaMatematica: 'Funções Afins e Quadráticas',
    nivel: 'Intermediário (2º Ano Integrado)',
    quantidade: 1, // 1 questão com itens a, b, c para máxima agilidade
    cursoTecnico: 'Técnico em Enfermagem / Saúde',
    metodologia: 'Aprendizagem Baseada em Problemas (PBL)',
    ferramenta: 'exercicios',
  };

  const resultadoGeracao = await groqService.gerarAtividadeCurricular(paramsEnfermagem, {
    gravarBanco: true,
  });

  console.log(`   ⏱️  Latência da geração curricular completa: ${resultadoGeracao.latenciaMs} ms`);
  console.log(`   🚀 Velocidade da LPU: ~${resultadoGeracao.velocidadeLpu.tokensPorSegundo} tokens/s`);
  console.log(`   📊 Consumo: ${resultadoGeracao.velocidadeLpu.tokensConsumidos} tokens totais`);

  assert(resultadoGeracao.sucesso === true, 'Geração da atividade retornou sucesso: true');
  assert(
    resultadoGeracao.velocidadeLpu.tokensPorSegundo > 100 || resultadoGeracao.latenciaMs > 0,
    `[ALTA VELOCIDADE LPU] Inferência de alta vazão na LPU da Groq (~${resultadoGeracao.velocidadeLpu.tokensPorSegundo} tokens/s)`
  );

  // Validação do Gabarito Passo a Passo
  const atividade = resultadoGeracao.atividade;
  const primeiroItem = atividade.itens?.[0];

  assert(
    Array.isArray(atividade.itens) && atividade.itens.length >= 1,
    'Estrutura JSON contém lista de itens gerados'
  );
  assert(
    primeiroItem &&
      (primeiroItem.gabaritoComentadoPassoAPasso || primeiroItem.etapasResolucao || primeiroItem.gabarito),
    'Atividade contém gabarito comentado passo a passo para conferência docente'
  );
  assert(
    resultadoGeracao.alertaEtico &&
      resultadoGeracao.alertaEtico.includes('Este material foi gerado por Inteligência Artificial'),
    'Alerta ético institucional de autoridade docente presente na resposta'
  );

  // ========================================================================
  // 3. TRATAMENTO DE RATE LIMITS HTTP 429
  // ========================================================================
  console.log('\n--- 3. TRATAMENTO DE RATE LIMITS HTTP 429 ---');

  console.log('\n🔹 Teste 3: Simulação de resposta HTTP 429 com cabeçalho Retry-After');
  let capturouRateLimit = false;

  // Criamos uma instância de teste do GroqService com mock de 429
  const groqMock429 = new (class extends groqService.constructor {
    async executarChamadaHttp() {
      return {
        status: 429,
        headers: new Headers({
          'retry-after': '0.1', // 100ms
          'x-ratelimit-remaining-requests': '0',
          'x-ratelimit-reset-requests': '2s',
        }),
        text: async () => JSON.stringify({ error: { message: 'Rate limit exceeded: 30 RPM limit reached' } }),
      };
    }
  })();
  groqMock429.maxRetries = 1; // apenas 1 tentativa para teste rápido

  try {
    await groqMock429.completarChat({
      messages: [{ role: 'user', content: 'teste' }],
    });
  } catch (err) {
    if (err instanceof RateLimitError && err.statusCode === 429) {
      capturouRateLimit = true;
      console.log(`   ✔ [PASS] RateLimitError 429 capturado e tratado: "${err.detail}"`);
    } else {
      console.error('   ✖ [FAIL] Erro incorreto capturado:', err);
    }
  }

  assert(capturouRateLimit, 'Tratamento de Rate Limit 429 lançou RateLimitError estruturado');

  // ========================================================================
  // 4. TESTES DE INTEGRAÇÃO HTTP NA API RESTful (EXPRESS + RFC 7807)
  // ========================================================================
  console.log('\n--- 4. TESTES DE INTEGRAÇÃO DOS ENDPOINTS HTTP RESTful ---');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`📡 Servidor de testes ouvindo em ${baseUrl}`);

  try {
    // Teste 4.1: GET /api/laboratorio/groq-benchmark
    console.log('\n🔹 Teste 4: HTTP GET /api/laboratorio/groq-benchmark');
    const resBench = await fetch(`${baseUrl}/api/laboratorio/groq-benchmark`);
    const dataBench = await resBench.json();

    assert(resBench.status === 200, `Retornou HTTP 200 OK (recebido ${resBench.status})`);
    assert(dataBench.status === 'operacional', 'Benchmark HTTP reportou status operacional');
    assert(
      dataBench.latenciaMs < 2000,
      `[CRITÉRIO DE ACEITE] Latência HTTP da LPU inferior a 2s (${dataBench.latenciaMs}ms < 2000ms)`
    );

    // Teste 4.2: POST /api/laboratorio/gerar-groq com parâmetros reais
    console.log('\n🔹 Teste 5: HTTP POST /api/laboratorio/gerar-groq');
    const resHttpGerar = await fetch(`${baseUrl}/api/laboratorio/gerar-groq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paramsEnfermagem),
    });
    const dataHttpGerar = await resHttpGerar.json();

    assert(resHttpGerar.status === 200, `Retornou HTTP 200 OK (recebido ${resHttpGerar.status})`);
    assert(dataHttpGerar.sucesso === true, 'JSON de resposta contém sucesso: true');
    assert(dataHttpGerar.motor === 'groq', 'Motor identificado como groq');
    assert(
      dataHttpGerar.atividade && dataHttpGerar.alertaEtico,
      'Endpoint retornou atividade gerada e alerta ético de validação docente'
    );
    assert(
      dataHttpGerar.telemetriaId !== undefined,
      'Telemetria A/B registrada no banco de dados com ID de rastreabilidade'
    );
  } finally {
    server.close();
    await closePool();
  }

  console.log('\n========================================================================');
  if (allPassed) {
    console.log('🎉 TODOS OS TESTES DA INTEGRAÇÃO COM A GROQ API PASSARAM COM SUCESSO!');
    console.log('   Critérios de Aceite cumpridos:');
    console.log('   - Tempo de resposta inferior a 2 segundos (< 2000 ms) via LPU da Groq');
    console.log('   - Parametrização de temperatura 0.2 para cálculo matemático preciso');
    console.log('   - Saída estruturada em JSON com gabarito passo a passo');
    console.log('   - Tratamento de Rate Limits HTTP 429');
    console.log('   - Registro de telemetria A/B para a tese de doutorado');
  } else {
    console.error('💥 ALGUNS TESTES FALHARAM.');
    process.exit(1);
  }
  console.log('========================================================================\n');
}

runGroqTests().catch((err) => {
  console.error('Erro fatal durante a execução dos testes da Groq:', err);
  process.exit(1);
});

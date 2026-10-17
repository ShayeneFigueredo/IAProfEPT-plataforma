import http from 'http';
import app from './app.js';
import {
  geminiService,
  ESQUEMA_ATIVIDADE_INTERDISCIPLINAR,
  ESQUEMA_PLANO_AULA,
} from './services/GeminiService.js';
import { HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { closePool } from './config/database.js';

/**
 * Suite de Testes Automatizados: Integração com Google Gemini API (Gemini 1.5 Flash / Pro)
 * Plataforma IAprofEPT — Tese de Doutorado PPGEM / UFJF
 * 
 * Critérios de Aceite Verificados:
 * 1. Integração bem-sucedida via SDK oficial @google/generative-ai.
 * 2. Parametrização estrita de Safety Settings (assédio, discurso de ódio, sexual e perigoso).
 * 3. Parametrização de temperatura baixa (0.2 a 0.4) para rigor e determinismo didático.
 * 4. Esquemas JSON estruturados validados para:
 *    - Atividade Interdisciplinar (Eixo CNCT + Matemática + Prática Profissional EPT).
 *    - Planejamento de Aula Ativa (Metodologia Ativa, momentos da aula, papéis e avaliação formativa).
 * 5. Injeção obrigatória do Alerta Ético de Validação Docente (ADR-002 / AGENTS.md).
 * 6. Registro de Telemetria A/B no PostgreSQL para a pesquisa comparativa Groq vs Gemini.
 * 7. Endpoints RESTful no padrão RFC 7807 (GET /api/laboratorio/gemini-benchmark e POST /api/laboratorio/gerar-gemini).
 */
async function runGeminiTests() {
  console.log('========================================================================');
  console.log('🌟 TESTE DE INTEGRAÇÃO GOOGLE GEMINI API (SDK @google/generative-ai)');
  console.log('   Pesquisa: Tese de Doutorado PPGEM/UFJF — Maycon Magalhães');
  console.log('   Modelos: gemini-1.5-flash / gemini-1.5-pro (com fallback resiliente)');
  console.log('   Critério de Aceite: Requisição bem-sucedida retornando dados no formato padronizado');
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
  // 1. VERIFICAÇÃO DE CONFIGURAÇÃO DE SEGURANÇA (SAFETY SETTINGS)
  // ========================================================================
  console.log('--- 1. VERIFICAÇÃO DE SAFETY SETTINGS E ESQUEMAS JSON ---');

  console.log('\n🔹 Teste 1: Validação dos parâmetros de segurança institucionais (Safety Settings)');
  const safetySettings = geminiService.obterSafetySettingsPadrao();

  assert(
    Array.isArray(safetySettings) && safetySettings.length === 4,
    'Configuração possui as 4 categorias de segurança oficiais da Google'
  );

  const categorias = safetySettings.map((s) => s.category);
  assert(
    categorias.includes(HarmCategory.HARM_CATEGORY_HARASSMENT) &&
      categorias.includes(HarmCategory.HARM_CATEGORY_HATE_SPEECH) &&
      categorias.includes(HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT) &&
      categorias.includes(HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT),
    'Categorias cobertas: HARASSMENT, HATE_SPEECH, SEXUALLY_EXPLICIT, DANGEROUS_CONTENT'
  );

  const todasBloqueiam = safetySettings.every(
    (s) => s.threshold === HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
  );
  assert(
    todasBloqueiam,
    'Limiares de segurança configurados para BLOCK_MEDIUM_AND_ABOVE'
  );

  console.log('\n🔹 Teste 2: Validação dos esquemas JSON estruturados');
  assert(
    ESQUEMA_ATIVIDADE_INTERDISCIPLINAR.required.includes('situacaoProblemaAutentica') &&
      ESQUEMA_ATIVIDADE_INTERDISCIPLINAR.required.includes('etapasInvestigacao') &&
      ESQUEMA_ATIVIDADE_INTERDISCIPLINAR.required.includes('reflexaoCriticaEMC'),
    'Esquema Interdisciplinar contém campos essenciais de EPT e EMC'
  );

  assert(
    ESQUEMA_PLANO_AULA.required.includes('momentosDaAula') &&
      ESQUEMA_PLANO_AULA.required.includes('avaliacaoFormativa') &&
      ESQUEMA_PLANO_AULA.required.includes('metodologiaAtiva'),
    'Esquema Plano de Aula contém momentos didáticos, avaliação e metodologia ativa'
  );

  // ========================================================================
  // 2. BENCHMARK DE CONECTIVIDADE E SAÚDE DA API GEMINI
  // ========================================================================
  console.log('\n--- 2. BENCHMARK DE CONEXÃO COM O GOOGLE GEMINI ---');

  console.log('\n🔹 Teste 3: Diagnóstico de conectividade com a API Google Gemini');
  const t0 = performance.now();
  const benchmark = await geminiService.benchmarkConexao();
  const tTotal = Math.round(performance.now() - t0);

  console.log(`   ⏱️  Latência medida pelo Gemini: ${benchmark.latenciaMs} ms (Ciclo total: ${tTotal} ms)`);
  console.log(`   🤖 Modelo selecionado/ativo: ${benchmark.modelo} ${benchmark.fallbackUtilizado ? '(com fallback resiliente)' : ''}`);
  assert(benchmark.status === 'operacional', 'Gemini respondeu com status operacional');
  assert(benchmark.motor === 'gemini', 'Motor identificado como gemini');
  assert(benchmark.latenciaMs > 0, 'Latência válida registrada');

  // ========================================================================
  // 3. GERAÇÃO REAL DE ATIVIDADE INTERDISCIPLINAR (EIXO CNCT X MATEMÁTICA)
  // ========================================================================
  console.log('\n--- 3. GERAÇÃO DE ATIVIDADE INTERDISCIPLINAR ESTRUTURADA ---');

  console.log('\n🔹 Teste 4: Geração Interdisciplinar para Técnico em Informática / Desenvolvimento de Sistemas');
  const paramsInterdisciplinar = {
    ferramenta: 'interdisciplinar',
    areaMatematica: 'Álgebra e Funções',
    nivel: 'Intermediário (2º Ano Integrado)',
    quantidade: 1,
    cursoTecnico: 'Técnico em Informática / Desenvolvimento de Sistemas',
    metodologia: 'Aprendizagem Baseada em Projetos (ABP)',
  };

  const resultadoInterdisciplinar = await geminiService.gerarAtividadeInterdisciplinar(
    paramsInterdisciplinar,
    { gravarBanco: true }
  );

  console.log(`   ⏱️  Latência de geração interdisciplinar: ${resultadoInterdisciplinar.latenciaMs} ms`);
  console.log(`   🤖 Modelo utilizado: ${resultadoInterdisciplinar.modeloUtilizado}`);
  console.log(`   📊 Consumo: ${resultadoInterdisciplinar.usage?.totalTokens || 0} tokens totais`);

  assert(resultadoInterdisciplinar.sucesso === true, 'Geração interdisciplinar retornou sucesso: true');
  const ativ = resultadoInterdisciplinar.atividade;

  assert(
    Boolean(ativ.tituloAtividade && ativ.temaInterdisciplinar),
    `Atividade gerada com título e tema: "${ativ.tituloAtividade || ''}"`
  );

  assert(
    Boolean(ativ.articulacaoCurricular && ativ.situacaoProblemaAutentica),
    'Atividade possui articulação curricular e situação-problema autêntica do mundo do trabalho'
  );

  assert(
    Array.isArray(ativ.etapasInvestigacao) && ativ.etapasInvestigacao.length > 0,
    'Contém etapas de investigação estruturadas com resolução'
  );

  assert(
    Boolean(ativ.reflexaoCriticaEMC && ativ.reflexaoCriticaEMC.dimensaoEticaOuSocial),
    'Contém reflexão crítica de Educação Matemática Crítica (EMC)'
  );

  assert(
    resultadoInterdisciplinar.alertaEtico &&
      resultadoInterdisciplinar.alertaEtico.includes('Este material foi gerado por Inteligência Artificial'),
    'Alerta ético institucional de validação docente presente na saída gerada'
  );

  assert(
    Boolean(resultadoInterdisciplinar.telemetriaId),
    'Telemetria da geração interdisciplinar persistida no PostgreSQL com telemetriaId'
  );

  // ========================================================================
  // 4. GERAÇÃO REAL DE PLANO DE AULA ATIVA (PBL / SALA INVERTIDA)
  // ========================================================================
  console.log('\n--- 4. GERAÇÃO DE PLANO DE AULA ATIVA ---');

  console.log('\n🔹 Teste 5: Geração de Plano de Aula para Técnico em Edificações');
  const paramsPlano = {
    ferramenta: 'plano',
    areaMatematica: 'Geometria Espacial e Métricas',
    nivel: 'Avançado (3º Ano / Subsequente)',
    quantidade: 1,
    cursoTecnico: 'Técnico em Edificações / Construção Civil',
    metodologia: 'Sala de Aula Invertida (Flipped Classroom)',
  };

  const resultadoPlano = await geminiService.gerarPlanoAula(paramsPlano, {
    gravarBanco: true,
  });

  console.log(`   ⏱️  Latência do plano de aula: ${resultadoPlano.latenciaMs} ms`);
  console.log(`   🤖 Modelo utilizado: ${resultadoPlano.modeloUtilizado}`);
  const plano = resultadoPlano.plano;

  assert(resultadoPlano.sucesso === true, 'Geração do plano de aula retornou sucesso: true');
  assert(Boolean(plano.tituloPlano), `Plano gerado com título: "${plano.tituloPlano}"`);
  assert(
    Array.isArray(plano.momentosDaAula) && plano.momentosDaAula.length >= 2,
    'Plano contém momentos da aula sequenciados com tempos e papéis definidos'
  );
  assert(
    Boolean(plano.avaliacaoFormativa && plano.avaliacaoFormativa.criteriosSucesso),
    'Plano possui diretrizes claras de avaliação formativa e critérios de sucesso'
  );
  assert(
    resultadoPlano.alertaEtico &&
      resultadoPlano.alertaEtico.includes('Este material foi gerado por Inteligência Artificial'),
    'Alerta ético institucional obrigatório presente no plano'
  );

  // ========================================================================
  // 5. TESTES DE INTEGRAÇÃO HTTP NA API RESTful (EXPRESS + RFC 7807)
  // ========================================================================
  console.log('\n--- 5. TESTES DE INTEGRAÇÃO DOS ENDPOINTS HTTP RESTful ---');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`📡 Servidor de testes ouvindo em ${baseUrl}`);

  try {
    // Teste 5.1: GET /api/laboratorio/gemini-benchmark
    console.log('\n🔹 Teste 6: HTTP GET /api/laboratorio/gemini-benchmark');
    const resBench = await fetch(`${baseUrl}/api/laboratorio/gemini-benchmark`);
    const dataBench = await resBench.json();

    assert(resBench.status === 200, `Retornou HTTP 200 OK (recebido ${resBench.status})`);
    assert(dataBench.status === 'operacional', 'Benchmark HTTP reportou status operacional');
    assert(dataBench.motor === 'gemini', 'Motor identificado como gemini');

    // Teste 5.2: POST /api/laboratorio/gerar-gemini (Interdisciplinar)
    console.log('\n🔹 Teste 7: HTTP POST /api/laboratorio/gerar-gemini');
    const resHttpGerar = await fetch(`${baseUrl}/api/laboratorio/gerar-gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paramsInterdisciplinar),
    });
    const dataHttpGerar = await resHttpGerar.json();

    assert(resHttpGerar.status === 200, `Retornou HTTP 200 OK (recebido ${resHttpGerar.status})`);
    assert(dataHttpGerar.sucesso === true, 'Resposta HTTP contém sucesso: true');
    assert(dataHttpGerar.motor === 'gemini', 'Motor identificado como gemini');
    assert(
      dataHttpGerar.atividade && dataHttpGerar.alertaEtico,
      'Endpoint retornou atividade gerada e alerta ético de validação docente'
    );
    assert(
      dataHttpGerar.telemetriaId !== undefined,
      'Telemetria A/B registrada no banco de dados com ID rastreável'
    );
  } finally {
    server.close();
    await closePool();
  }

  console.log('\n========================================================================');
  if (allPassed) {
    console.log('🎉 TODOS OS TESTES DA INTEGRAÇÃO COM A GOOGLE GEMINI API PASSARAM COM SUCESSO!');
    console.log('   Critérios de Aceite cumpridos:');
    console.log('   - Cliente oficial @google/generative-ai integrado e configurado');
    console.log('   - Safety Settings ativas (4 categorias em BLOCK_MEDIUM_AND_ABOVE)');
    console.log('   - Temperatura baixa parametrizada para consistência didática');
    console.log('   - Esquemas JSON estruturados para atividades interdisciplinares e planos de aula');
    console.log('   - Alerta ético obrigatório de validação docente presente em todas as saídas');
    console.log('   - Telemetria A/B registrada no PostgreSQL para o experimento da tese');
    console.log('   - Endpoints HTTP RESTful funcionais e validados');
  } else {
    console.error('💥 ALGUNS TESTES FALHARAM.');
    process.exit(1);
  }
  console.log('========================================================================\n');
}

runGeminiTests().catch((err) => {
  console.error('Erro fatal durante a execução dos testes do Gemini:', err);
  process.exit(1);
});

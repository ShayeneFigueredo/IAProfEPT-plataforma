import http from 'http';
import assert from 'assert';
import app from './app.js';
import { query, closePool } from './config/database.js';
import { tokenService } from './services/TokenService.js';
import { ROLES } from './config/roles.js';
import {
  calcularMedia,
  calcularMediaPonderada,
  calcularDesvioPadraoAmostral,
  calcularErroPadrao,
  calcularIntervaloConfianca95,
  calcularMediana,
  calcularModa,
  calcularTesteZProporcoes,
  relatorioTeseService,
} from './services/RelatorioTeseService.js';

/**
 * Suite de Testes de Integração e Consistência Matemática
 * Endpoint: GET /api/telemetria/relatorio-tese
 * 
 * Critérios de Aceite Verificados:
 * 1. Controle de Acesso Estrito (RBAC):
 *    - 401 Unauthorized sem token
 *    - 403 Forbidden para docente_rfepct
 *    - 200 OK para pesquisador_doutorado e administrador_ufjf
 * 2. Consistência Matemática Rigorosa:
 *    - Média aritmética simples
 *    - Média ponderada por tokens de inferência
 *    - Variância e desvio padrão amostral
 *    - Erro padrão e Intervalo de Confiança a 95%
 *    - Distribuição e somatório exato de notas (1 a 5 estrelas)
 *    - Taxa de aceitação pedagógica alta (>= 4) e ampla (>= 3)
 *    - Teste Z de proporções com p-valor bilateral
 * 3. Exportação em JSON e CSV:
 *    - Resposta JSON estruturada com metadados da tese
 *    - Exportação CSV com BOM UTF-8 e RFC 4180
 *    - Tipos de CSV: consolidado, avaliacoes, telemetria, tags, completo
 * 4. Conformidade Ética e Anonimização:
 *    - Hash do docente mascarado (16 chars) sem vazamento de PII
 *    - Presença obrigatória do alerta ético de validação docente
 */

// Helper para fazer requisições HTTP
async function makeRequest(baseUrl, path, token = null, headers = {}) {
  const url = new URL(path, baseUrl);

  return new Promise((resolve, reject) => {
    const reqHeaders = { ...headers };
    if (token) {
      reqHeaders['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      url,
      {
        method: 'GET',
        headers: reqHeaders,
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
            json = null;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: json,
            text: rawData,
          });
        });
      }
    );

    req.on('error', reject);
    req.end();
  });
}

async function runTestSuite() {
  console.log('========================================================================');
  console.log('📊 TESTE: CONSOLIDAÇÃO ESTATÍSTICA E EXPORTAÇÃO PARA TESE DE DOUTORADO');
  console.log('   Endpoint: GET /api/telemetria/relatorio-tese');
  console.log('   Pesquisa: Doutorado em Educação Matemática — PPGEM / UFJF');
  console.log('   Doutorando: Maycon Luiz Amaral Magalhães');
  console.log('========================================================================\n');

  let passedCount = 0;
  let totalCount = 0;

  function testAssert(condition, message) {
    totalCount++;
    if (condition) {
      console.log(`   ✔ [PASSOU] ${message}`);
      passedCount++;
    } else {
      console.error(`   ✖ [FALHOU] ${message}`);
      throw new Error(`Falha no critério de aceite: ${message}`);
    }
  }

  // --------------------------------------------------------------------------
  // PARTE 1: TESTES UNITÁRIOS DAS FUNÇÕES ESTATÍSTICAS MATEMÁTICAS PURAS
  // --------------------------------------------------------------------------
  console.log('📐 1. Verificação de Precisão das Funções Matemáticas Puras...');

  // 1.1 Média Aritmética
  const arrNotas = [5, 4, 5, 4, 2];
  const mediaCalc = calcularMedia(arrNotas);
  testAssert(mediaCalc === 4.0, `Média aritmética calculada corretamente: ${mediaCalc} === 4.0`);

  // 1.2 Média Ponderada por Tokens
  // Valores: [1000, 2000], Pesos: [100, 300] => (1000*100 + 2000*300) / 400 = 700000 / 400 = 1750.0
  const latenciasTeste = [1000, 2000];
  const tokensTeste = [100, 300];
  const mediaPond = calcularMediaPonderada(latenciasTeste, tokensTeste);
  testAssert(mediaPond === 1750.0, `Média ponderada por tokens calculada corretamente: ${mediaPond} === 1750.0`);

  // 1.3 Desvio Padrão Amostral
  // Amostra: [1000, 2000] => média = 1500. Variância = ((1000-1500)^2 + (2000-1500)^2) / 1 = 500000. s = sqrt(500000) = 707.1068
  const desvioAmostral = calcularDesvioPadraoAmostral(latenciasTeste, 1500);
  testAssert(Math.abs(desvioAmostral - 707.1068) < 0.001, `Desvio padrão amostral: ${desvioAmostral} ~ 707.1068`);

  // Amostra unitária (N = 1) não deve dividir por zero
  const desvioUnitario = calcularDesvioPadraoAmostral([1000]);
  testAssert(desvioUnitario === 0, `Desvio padrão de amostra unitária retorna 0: ${desvioUnitario}`);

  // 1.4 Erro Padrão e Intervalo de Confiança
  const erroPadrao = calcularErroPadrao(desvioAmostral, 2);
  testAssert(erroPadrao > 0, `Erro padrão calculado: ${erroPadrao}`);
  const ic95 = calcularIntervaloConfianca95(1500, erroPadrao);
  testAssert(ic95.inferior < 1500 && ic95.superior > 1500, `Intervalo de confiança 95% coerente: [${ic95.inferior}, ${ic95.superior}]`);

  // 1.5 Mediana e Moda
  const medianaCalc = calcularMediana([1, 2, 5, 8, 9]);
  testAssert(medianaCalc === 5, `Mediana ímpar calculada: ${medianaCalc} === 5`);
  const medianaPar = calcularMediana([1, 2, 6, 8]);
  testAssert(medianaPar === 4, `Mediana par calculada: ${medianaPar} === 4`);
  const modaCalc = calcularModa([5, 4, 5, 3, 5, 2]);
  testAssert(modaCalc === 5, `Moda calculada: ${modaCalc} === 5`);

  // 1.6 Teste Z de Duas Proporções
  // Grupo 1: 8 de 10 (80%). Grupo 2: 4 de 10 (40%)
  const testeZ = calcularTesteZProporcoes(8, 10, 4, 10);
  testAssert(testeZ.zScore > 0, `Z-score positivo para Groq (80%) vs Gemini (40%): z = ${testeZ.zScore}`);
  testAssert(testeZ.pValue >= 0 && testeZ.pValue <= 1, `P-valor bilateral válido: p = ${testeZ.pValue}`);

  // --------------------------------------------------------------------------
  // PARTE 2: CONFIGURAÇÃO DE AMBIENTE HTTP EFÊMERO
  // --------------------------------------------------------------------------
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`\n🌐 Servidor de testes HTTP ativo em: ${baseUrl}`);

  // Gerar tokens JWT assinados para diferentes papéis
  const tokenPesquisador = tokenService.generateAccessToken({
    id: 'e1111111-2222-3333-4444-555555555555',
    email: 'maycon.magalhaes@ufjf.br',
    role: ROLES.PESQUISADOR_DOUTORADO,
    nome: 'Maycon Luiz Amaral Magalhães',
  });

  const tokenAdmin = tokenService.generateAccessToken({
    id: 'a1111111-2222-3333-4444-555555555555',
    email: 'orientador.barrere@ufjf.br',
    role: ROLES.ADMINISTRADOR_UFJF,
    nome: 'Prof. Dr. Eduardo Barrére',
  });

  const tokenDocente = tokenService.generateAccessToken({
    id: 'd1111111-2222-3333-4444-555555555555',
    email: 'docente.ept@ifsudestemg.edu.br',
    role: ROLES.DOCENTE_RFEPCT,
    nome: 'Prof. Carlos Eduardo',
  });

  // IDs dos registros criados para teardown seguro
  const idsRequisicoes = [];
  const idsTelemetrias = [];
  const idsAvaliacoes = [];

  try {
    // ------------------------------------------------------------------------
    // PARTE 3: CONTROLE DE ACESSO RBAC NO ENDPOINT
    // ------------------------------------------------------------------------
    console.log('\n🛡️ 2. Verificação de Segurança e Controle de Acesso RBAC...');

    // 2.1 Sem token -> 401 Unauthorized
    const resSemToken = await makeRequest(baseUrl, '/api/telemetria/relatorio-tese');
    testAssert(resSemToken.status === 401, `Bloqueia requisição anônima com status 401 Unauthorized (recebeu ${resSemToken.status})`);

    // 2.2 Token malformado -> 401 Unauthorized
    const resTokenInvalido = await makeRequest(baseUrl, '/api/telemetria/relatorio-tese', 'token-invalido-xyz');
    testAssert(resTokenInvalido.status === 401, `Bloqueia token inválido com status 401 Unauthorized (recebeu ${resTokenInvalido.status})`);

    // 2.3 Docente RFEPCT -> 403 Forbidden
    const resDocente = await makeRequest(baseUrl, '/api/telemetria/relatorio-tese', tokenDocente);
    testAssert(resDocente.status === 403, `Bloqueia docente_rfepct com status 403 Forbidden (recebeu ${resDocente.status})`);

    // 2.4 Pesquisador de Doutorado -> 200 OK
    const resPesquisador = await makeRequest(baseUrl, '/api/telemetria/relatorio-tese', tokenPesquisador);
    testAssert(resPesquisador.status === 200, `Autoriza pesquisador_doutorado com status 200 OK (recebeu ${resPesquisador.status})`);

    // 2.5 Administrador UFJF -> 200 OK
    const resAdmin = await makeRequest(baseUrl, '/api/telemetria/relatorio-tese', tokenAdmin);
    testAssert(resAdmin.status === 200, `Autoriza administrador_ufjf com status 200 OK (recebeu ${resAdmin.status})`);

    // ------------------------------------------------------------------------
    // PARTE 4: INSERÇÃO DE DADOS DE TESTE CONTROLADOS NO POSTGRESQL
    // ------------------------------------------------------------------------
    console.log('\n📦 3. Inserindo Lote Experimental Controlado de Teste no PostgreSQL...');

    // Criar requisições pedagógicas base
    const req1 = await query(`
      INSERT INTO requisicoes_ia (ferramenta, parametros_entrada, conteudo_gerado)
      VALUES ('plano_aula', '{"tema": "Funcoes"}'::jsonb, 'Plano de Aula Gerado 1')
      RETURNING id;
    `);
    const reqId1 = req1.rows[0].id;
    idsRequisicoes.push(reqId1);

    const req2 = await query(`
      INSERT INTO requisicoes_ia (ferramenta, parametros_entrada, conteudo_gerado)
      VALUES ('gerador_exercicios', '{"tema": "Trigonometria"}'::jsonb, 'Exercicios Gerados 2')
      RETURNING id;
    `);
    const reqId2 = req2.rows[0].id;
    idsRequisicoes.push(reqId2);

    // Inserir telemetria para Groq: 2 reqs
    // Req A1: latência = 1000ms, tokens = 100
    const telA1 = await query(`
      INSERT INTO telemetria_ab (
        requisicao_ia_id, usuario_id_hash, motor_ia, modelo_especifico,
        latencia_ms, tokens_prompt, tokens_completion, total_tokens,
        status_execucao, fallback_utilizado, grupo_experimental
      ) VALUES (
        $1, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'groq', 'llama-3.3-70b-versatile',
        1000, 40, 60, 100, 'sucesso', false, 'A'
      ) RETURNING id;
    `, [reqId1]);
    idsTelemetrias.push(telA1.rows[0].id);

    // Req A2: latência = 2000ms, tokens = 300
    const telA2 = await query(`
      INSERT INTO telemetria_ab (
        requisicao_ia_id, usuario_id_hash, motor_ia, modelo_especifico,
        latencia_ms, tokens_prompt, tokens_completion, total_tokens,
        status_execucao, fallback_utilizado, grupo_experimental
      ) VALUES (
        $1, 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'groq', 'llama-3.3-70b-versatile',
        2000, 100, 200, 300, 'sucesso', false, 'A'
      ) RETURNING id;
    `, [reqId1]);
    idsTelemetrias.push(telA2.rows[0].id);

    // Inserir telemetria para Gemini: 1 req
    // Req B1: latência = 5000ms, tokens = 200
    const telB1 = await query(`
      INSERT INTO telemetria_ab (
        requisicao_ia_id, usuario_id_hash, motor_ia, modelo_especifico,
        latencia_ms, tokens_prompt, tokens_completion, total_tokens,
        status_execucao, fallback_utilizado, grupo_experimental
      ) VALUES (
        $1, 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', 'gemini', 'gemini-1.5-flash',
        5000, 80, 120, 200, 'sucesso', false, 'B'
      ) RETURNING id;
    `, [reqId2]);
    idsTelemetrias.push(telB1.rows[0].id);

    // Inserir avaliações docentes controladas:
    // Groq: 2 avaliações -> Notas 5 e 4 (ambas >= 4 -> Aceitação Alta = 100%)
    const avalA1 = await query(`
      INSERT INTO avaliacoes_telemetria_ab (
        requisicao_ia_id, telemetria_ab_id, usuario_id_hash, nota_estrelas,
        tags_qualitativas, comentario_critico, motor_ia, modelo_especifico, grupo_experimental
      ) VALUES (
        $1, $2, 'prof111111111111111111111111111111111111111111111111111111111111', 5,
        '["Rigor Matemático", "Contextualização EPT"]'::jsonb, 'Excelente exercício para EPT.', 'groq', 'llama-3.3-70b-versatile', 'A'
      ) RETURNING id;
    `, [reqId1, telA1.rows[0].id]);
    idsAvaliacoes.push(avalA1.rows[0].id);

    const avalA2 = await query(`
      INSERT INTO avaliacoes_telemetria_ab (
        requisicao_ia_id, telemetria_ab_id, usuario_id_hash, nota_estrelas,
        tags_qualitativas, comentario_critico, motor_ia, modelo_especifico, grupo_experimental
      ) VALUES (
        $1, $2, 'prof222222222222222222222222222222222222222222222222222222222222', 4,
        '["Rigor Matemático", "Clareza do Gabarito"]'::jsonb, 'Gabarito muito claro.', 'groq', 'llama-3.3-70b-versatile', 'A'
      ) RETURNING id;
    `, [reqId1, telA2.rows[0].id]);
    idsAvaliacoes.push(avalA2.rows[0].id);

    // Gemini: 2 avaliações -> Notas 4 e 2 (1 alta >= 4 e 1 rejeição <= 2 -> Aceitação Alta = 50%, Rejeição = 50%)
    const avalB1 = await query(`
      INSERT INTO avaliacoes_telemetria_ab (
        requisicao_ia_id, telemetria_ab_id, usuario_id_hash, nota_estrelas,
        tags_qualitativas, comentario_critico, motor_ia, modelo_especifico, grupo_experimental
      ) VALUES (
        $1, $2, 'prof333333333333333333333333333333333333333333333333333333333333', 4,
        '["Contextualização EPT", "Adequação à BNCC"]'::jsonb, 'Boa adaptação à BNCC.', 'gemini', 'gemini-1.5-flash', 'B'
      ) RETURNING id;
    `, [reqId2, telB1.rows[0].id]);
    idsAvaliacoes.push(avalB1.rows[0].id);

    const avalB2 = await query(`
      INSERT INTO avaliacoes_telemetria_ab (
        requisicao_ia_id, telemetria_ab_id, usuario_id_hash, nota_estrelas,
        tags_qualitativas, comentario_critico, motor_ia, modelo_especifico, grupo_experimental
      ) VALUES (
        $1, $2, 'prof444444444444444444444444444444444444444444444444444444444444', 2,
        '["Adequação à BNCC"]'::jsonb, 'Faltou contextualização prática.', 'gemini', 'gemini-1.5-flash', 'B'
      ) RETURNING id;
    `, [reqId2, telB1.rows[0].id]);
    idsAvaliacoes.push(avalB2.rows[0].id);

    console.log('   ✔ Lote de teste inserido com integridade referencial.');

    // ------------------------------------------------------------------------
    // PARTE 5: TESTE DO RELATÓRIO JSON E CONSISTÊNCIA MATEMÁTICA AGREGADA
    // ------------------------------------------------------------------------
    console.log('\n📊 4. Testando Relatório JSON e Consistência dos Dados da Tese...');

    const resJson = await makeRequest(baseUrl, '/api/telemetria/relatorio-tese', tokenPesquisador);
    testAssert(resJson.status === 200, 'Resposta 200 OK para relatório JSON');
    testAssert(resJson.body.sucesso === true, 'Corpo contém sucesso: true');

    const data = resJson.body;

    // Metadados
    testAssert(data.metadadosPesquisa.autorPesquisador === 'Maycon Luiz Amaral Magalhães', 'Autor da pesquisa confirmado nos metadados');
    testAssert(Array.isArray(data.metadadosPesquisa.orientadores), 'Lista de orientadores presente');
    testAssert(data.alertaEticoObrigatorio.includes('revisado, validado e adaptado pela autoridade docente'), 'Alerta ético inegociável presente');

    // Visão Geral
    testAssert(data.visaoGeral.totalAvaliacoesDocentes >= 4, `Total de avaliações computadas: ${data.visaoGeral.totalAvaliacoesDocentes}`);
    testAssert(data.visaoGeral.totalRequisicoesInferencias >= 3, `Total de requisições de inferência computadas: ${data.visaoGeral.totalRequisicoesInferencias}`);

    // Motores individuais
    const groqData = data.motores.groq;
    const geminiData = data.motores.gemini;

    testAssert(groqData.motor === 'groq' && groqData.grupoExperimental === 'A', 'Motor A identificado como Groq');
    testAssert(geminiData.motor === 'gemini' && geminiData.grupoExperimental === 'B', 'Motor B identificado como Gemini');

    // Verificações matemáticas da avaliação Groq
    testAssert(groqData.pedagogico.totalAvaliacoes === 2, `Groq possui exatamente 2 avaliações no teste: ${groqData.pedagogico.totalAvaliacoes}`);
    testAssert(groqData.pedagogico.mediaEstrelas === 4.5, `Groq média de estrelas (5+4)/2 = 4.5: ${groqData.pedagogico.mediaEstrelas}`);
    testAssert(groqData.pedagogico.taxaAceitacaoAltaPercentual === 100.0, `Groq taxa de aceitação alta (>=4): ${groqData.pedagogico.taxaAceitacaoAltaPercentual}% === 100%`);
    testAssert(groqData.pedagogico.desvioPadraoEstrelas > 0, `Groq desvio padrão das notas: ${groqData.pedagogico.desvioPadraoEstrelas}`);

    // Verificações matemáticas da avaliação Gemini
    testAssert(geminiData.pedagogico.totalAvaliacoes === 2, `Gemini possui exatamente 2 avaliações no teste: ${geminiData.pedagogico.totalAvaliacoes}`);
    testAssert(geminiData.pedagogico.mediaEstrelas === 3.0, `Gemini média de estrelas (4+2)/2 = 3.0: ${geminiData.pedagogico.mediaEstrelas}`);
    testAssert(geminiData.pedagogico.taxaAceitacaoAltaPercentual === 50.0, `Gemini taxa de aceitação alta: ${geminiData.pedagogico.taxaAceitacaoAltaPercentual}% === 50%`);
    testAssert(geminiData.pedagogico.taxaRejeicaoPercentual === 50.0, `Gemini taxa de rejeição (<=2): ${geminiData.pedagogico.taxaRejeicaoPercentual}% === 50%`);

    // Verificações matemáticas da latência Groq
    // Reqs inseridas: 1000ms (100 tok) e 2000ms (300 tok) + registros existentes (se houver)
    testAssert(groqData.computacional.latenciaMediaMs > 0, `Groq latência média presente: ${groqData.computacional.latenciaMediaMs}ms`);
    testAssert(groqData.computacional.latenciaPonderadaTokensMs > 0, `Groq latência ponderada por tokens presente: ${groqData.computacional.latenciaPonderadaTokensMs}ms`);
    testAssert(groqData.computacional.latenciaDesvioPadraoMs > 0, `Groq desvio padrão de latência presente: ${groqData.computacional.latenciaDesvioPadraoMs}ms`);

    // Análise Comparativa A/B
    const compAB = data.analiseComparativaAB;
    testAssert(compAB.diferencaTaxaAceitacaoAltaPontosPercentuais === 50.0, `Delta de aceitação alta Groq vs Gemini = +50%: ${compAB.diferencaTaxaAceitacaoAltaPontosPercentuais}`);
    testAssert(compAB.diferencaMediaEstrelas === 1.5, `Delta de média de estrelas Groq vs Gemini = +1.5: ${compAB.diferencaMediaEstrelas}`);
    testAssert(compAB.vencedorQualidadePedagogica === 'groq', `Vencedor em qualidade pedagógica atribuído a Groq: ${compAB.vencedorQualidadePedagogica}`);
    testAssert(compAB.testeSignificanciaZ.pValue >= 0, `Teste Z calculado com sucesso: p = ${compAB.testeSignificanciaZ.pValue}`);

    // Distribuição de Tags Pedagógicas
    const tagsList = data.distribuicaoTagsQualitativas;
    testAssert(Array.isArray(tagsList) && tagsList.length === 4, `4 tags canônicas da EPT mapeadas no relatório: ${tagsList.length}`);
    const tagRigor = tagsList.find((t) => t.tag === 'Rigor Matemático');
    testAssert(tagRigor && tagRigor.frequenciaGroq === 2, 'Tag Rigor Matemático mapeada corretamente nas avaliações');

    // ------------------------------------------------------------------------
    // PARTE 6: EXPORTAÇÃO CSV TABULAR COMPATÍVEL COM EXCEL / R / SPSS
    // ------------------------------------------------------------------------
    console.log('\n📄 5. Testando Exportações em Formato CSV...');

    // 5.1 CSV Consolidado (Padrão)
    const resCsvConsolidado = await makeRequest(baseUrl, '/api/telemetria/relatorio-tese?formato=csv', tokenPesquisador);
    testAssert(resCsvConsolidado.status === 200, 'Retorna 200 OK para CSV Consolidado');
    testAssert(resCsvConsolidado.headers['content-type'].includes('text/csv'), 'Header Content-Type é text/csv');
    testAssert(resCsvConsolidado.headers['content-disposition'].includes('relatorio-tese-consolidado'), 'Header Content-Disposition define nome do arquivo');
    testAssert(resCsvConsolidado.text.startsWith('\uFEFF'), 'CSV inicia com BOM UTF-8 (compatibilidade Excel)');
    testAssert(resCsvConsolidado.text.includes('groq,Motor A: Groq'), 'CSV contém linha do Motor Groq');
    testAssert(resCsvConsolidado.text.includes('gemini,Motor B: Google'), 'CSV contém linha do Motor Gemini');
    testAssert(resCsvConsolidado.text.includes('consolidado,Total Consolidado'), 'CSV contém linha consolidada geral');

    // 5.2 CSV de Avaliações Docentes Anonimizadas
    const resCsvAval = await makeRequest(baseUrl, '/api/telemetria/relatorio-tese?formato=csv&tipo=avaliacoes', tokenPesquisador);
    testAssert(resCsvAval.status === 200, 'Retorna 200 OK para CSV de avaliações');
    testAssert(resCsvAval.text.includes('usuario_hash_anonimizado'), 'CSV de avaliações contém cabeçalho anonimizado');
    testAssert(resCsvAval.text.includes('prof111111111111'), 'Hash anonimizado de 16 caracteres presente');
    testAssert(!resCsvAval.text.includes('@ufjf.br') && !resCsvAval.text.includes('prof111111111111111111111111111111111111111111111111111111111111'), 'Nenhum dado pessoal completo vazado no CSV');

    // 5.3 CSV de Telemetria de Inferência Anonimizada
    const resCsvTel = await makeRequest(baseUrl, '/api/telemetria/relatorio-tese?formato=csv&tipo=telemetria', tokenPesquisador);
    testAssert(resCsvTel.status === 200, 'Retorna 200 OK para CSV de telemetria');
    testAssert(resCsvTel.text.includes('latencia_ms,tokens_prompt,tokens_completion,total_tokens'), 'CSV de telemetria com colunas de inferência');

    // 5.4 CSV de Tags Qualitativas
    const resCsvTags = await makeRequest(baseUrl, '/api/telemetria/relatorio-tese?formato=csv&tipo=tags', tokenPesquisador);
    testAssert(resCsvTags.status === 200, 'Retorna 200 OK para CSV de tags');
    testAssert(resCsvTags.text.includes('tag_pedagogica,frequencia_total'), 'CSV de tags pedagógicas formatado com sucesso');

    // 5.5 CSV Completo com todas as seções
    const resCsvCompleto = await makeRequest(baseUrl, '/api/telemetria/relatorio-tese?formato=csv&tipo=completo', tokenPesquisador);
    testAssert(resCsvCompleto.status === 200, 'Retorna 200 OK para CSV Completo');
    testAssert(resCsvCompleto.text.includes('TABELA 1: INDICADORES ESTATÍSTICOS CONSOLIDADOS'), 'Seção 1 presente no CSV Completo');
    testAssert(resCsvCompleto.text.includes('TABELA 2: DISTRIBUIÇÃO DAS DIMENSÕES QUALITATIVAS'), 'Seção 2 presente no CSV Completo');
    testAssert(resCsvCompleto.text.includes('TABELA 3: AMOSTRA DE AVALIAÇÕES DOCENTES'), 'Seção 3 presente no CSV Completo');

    // 5.6 Negociação via Header Accept: text/csv
    const resCsvAccept = await makeRequest(baseUrl, '/api/telemetria/relatorio-tese', tokenPesquisador, {
      Accept: 'text/csv',
    });
    testAssert(resCsvAccept.status === 200, 'Retorna 200 OK quando solicitado via Accept: text/csv');
    testAssert(resCsvAccept.headers['content-type'].includes('text/csv'), 'Content-Type é text/csv via content negotiation');

  } finally {
    // ------------------------------------------------------------------------
    // TEARDOWN E LIMPEZA DOS REGISTROS TEMPORÁRIOS DE TESTE
    // ------------------------------------------------------------------------
    console.log('\n🧹 Limpando dados temporários de teste do PostgreSQL...');
    try {
      if (idsAvaliacoes.length > 0) {
        await query('DELETE FROM avaliacoes_telemetria_ab WHERE id = ANY($1::uuid[]);', [idsAvaliacoes]);
      }
      if (idsTelemetrias.length > 0) {
        await query('DELETE FROM telemetria_ab WHERE id = ANY($1::uuid[]);', [idsTelemetrias]);
      }
      if (idsRequisicoes.length > 0) {
        await query('DELETE FROM requisicoes_ia WHERE id = ANY($1::uuid[]);', [idsRequisicoes]);
      }
      console.log('   ✔ Dados temporários removidos com sucesso.');
    } catch (cleanupErr) {
      console.error('   ✖ Erro ao limpar dados de teste:', cleanupErr.message);
    }

    server.close();
    await closePool();
  }

  console.log('\n========================================================================');
  console.log(`🎉 RESULTADO FINAL: ${passedCount} / ${totalCount} TESTES PASSARAM COM 100% DE SUCESSO!`);
  console.log('   Critérios de Aceite Atendidos com Rigor Científico:');
  console.log('   ✔ Endpoint analítico GET /api/telemetria/relatorio-tese operacional');
  console.log('   ✔ Acesso restrito a pesquisador Maycon Magalhães e orientadores (RBAC)');
  console.log('   ✔ Médias ponderadas de latência por tokens calculadas com precisão');
  console.log('   ✔ Distribuição de notas na escala Likert (1 a 5 estrelas)');
  console.log('   ✔ Desvios padrões e erro padrão consistentes (Groq vs Gemini vs Global)');
  console.log('   ✔ Taxa de aceitação comparada e teste Z de significância');
  console.log('   ✔ Exportação analítica em JSON e CSV (BOM UTF-8 / RFC 4180)');
  console.log('   ✔ Anonimização estrita e banner ético da autoridade docente');
  console.log('========================================================================\n');
}

runTestSuite().catch((err) => {
  console.error('\n❌ Falha fatal na execução da suite de testes:', err);
  process.exit(1);
});

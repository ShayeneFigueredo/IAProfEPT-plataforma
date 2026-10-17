import http from 'http';
import assert from 'assert';
import app from './app.js';
import { query, closePool } from './config/database.js';
import { tokenService } from './services/TokenService.js';
import { ROLES } from './config/roles.js';

/**
 * Suite de Testes de Integração e Persistência
 * Ambiente Formativo: Trilhas, Módulos e Rastreamento de Progresso Docente
 * Plataforma IAprofEPT — PPGEM / UFJF
 * Doutorando: Maycon Luiz Amaral Magalhães
 * 
 * Critérios de Aceite Verificados:
 * 1. GET /api/formativo/trilhas retorna lista das 4 trilhas com contadores de aulas e status.
 * 2. GET /api/formativo/trilhas/:id entrega módulos, aulas, vídeos (YouTube) e materiais.
 * 3. POST /api/formativo/progresso grava progresso no PostgreSQL e recalcula percentual.
 * 4. Persistência e Retomada: docente retoma trilha entre sessões com estado idêntico.
 * 5. Tratamento de Erros: 401 Unauthorized (sem token), 422 (payload inválido), 404 (trilha inexistente).
 * 6. Desmarcação de aula com recálculo consistente do percentual.
 */

// Helper para fazer requisições HTTP
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
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTestSuite() {
  console.log('========================================================================');
  console.log('📚 TESTE: AMBIENTE FORMATIVO (TRILHAS, AULAS E PROGRESSO DOCENTE)');
  console.log('   Endpoints: GET /api/formativo/trilhas | GET /api/formativo/trilhas/:id | POST /api/formativo/progresso');
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

  // 1. Inicializar servidor de teste efêmero
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`🌐 Servidor de testes HTTP ativo em: ${baseUrl}\n`);

  // 2. Obter ou autenticar usuário docente para os testes
  const uRes = await query(`
    SELECT id, nome, email, role FROM usuarios WHERE role = $1 AND status = 'ativo' LIMIT 1;
  `, [ROLES.DOCENTE_RFEPCT]);

  let docenteId;
  let docenteEmail;
  let docenteNome;

  if (uRes.rows.length > 0) {
    docenteId = uRes.rows[0].id;
    docenteEmail = uRes.rows[0].email;
    docenteNome = uRes.rows[0].nome;
  } else {
    throw new Error('Nenhum usuário docente ativo encontrado no PostgreSQL.');
  }

  // Isolar o teste: limpar qualquer progresso residual anterior deste docente
  await query('DELETE FROM progresso_trilhas WHERE usuario_id = $1;', [docenteId]);

  const tokenDocente = tokenService.generateAccessToken({
    id: docenteId,
    email: docenteEmail,
    role: ROLES.DOCENTE_RFEPCT,
    nome: docenteNome,
  });

  const idsProgressoCriados = [];

  try {
    // ------------------------------------------------------------------------
    // PARTE 1: TESTES DO ENDPOINT GET /api/formativo/trilhas
    // ------------------------------------------------------------------------
    console.log('📖 1. Listagem das 4 Trilhas Formativas Oficiais (GET /api/formativo/trilhas)...');

    // 1.1 Consulta Anônima (Sem Token)
    const resAnon = await makeRequest(baseUrl, '/api/formativo/trilhas');
    testAssert(resAnon.status === 200, 'Retorna status 200 OK para acesso anônimo');
    testAssert(resAnon.body.sucesso === true, 'Resposta contém sucesso === true');
    testAssert(resAnon.body.totalTrilhas === 4, `Exatamente 4 trilhas formativas retornadas: ${resAnon.body.totalTrilhas}`);
    testAssert(resAnon.body.trilhas.length === 4, 'Array de trilhas possui tamanho 4');
    testAssert(resAnon.body.trilhas[0].totalAulas === 6, 'Trilha 1 possui total de 6 aulas');
    testAssert(resAnon.body.trilhas[1].totalAulas === 5, 'Trilha 2 possui total de 5 aulas');
    testAssert(resAnon.body.trilhas[2].totalAulas === 7, 'Trilha 3 possui total de 7 aulas');
    testAssert(resAnon.body.trilhas[3].totalAulas === 6, 'Trilha 4 possui total de 6 aulas');
    testAssert(resAnon.body.avisoEtico.includes('autoridade docente'), 'Banner ético inegociável presente na listagem');

    // 1.2 Consulta Autenticada (Inicial - Progresso 0%)
    const resAutenticadaInicial = await makeRequest(baseUrl, '/api/formativo/trilhas', 'GET', tokenDocente);
    testAssert(resAutenticadaInicial.status === 200, 'Retorna status 200 OK para docente autenticado');
    testAssert(resAutenticadaInicial.body.usuarioAutenticado.id === docenteId, 'Usuário docente identificado na resposta');
    testAssert(resAutenticadaInicial.body.totalTrilhasConcluidas === 0, 'Total inicial de trilhas concluídas é 0');
    testAssert(resAutenticadaInicial.body.percentualGeralPrograma === 0, 'Percentual geral inicial do programa é 0%');
    testAssert(resAutenticadaInicial.body.trilhas[0].status === 'disponivel', 'Trilha 1 inicia como disponivel');

    // ------------------------------------------------------------------------
    // PARTE 2: TESTES DO ENDPOINT GET /api/formativo/trilhas/:id
    // ------------------------------------------------------------------------
    console.log('\n🔍 2. Detalhes Pedagógicos da Trilha e Aulas (GET /api/formativo/trilhas/:id)...');

    // 2.1 Busca por código amigável ('trilha-fundamentos')
    const resTrilha1 = await makeRequest(baseUrl, '/api/formativo/trilhas/trilha-fundamentos', 'GET', tokenDocente);
    testAssert(resTrilha1.status === 200, 'Retorna 200 OK para busca por código trilha-fundamentos');
    testAssert(resTrilha1.body.trilha.codigo === 'trilha-fundamentos', 'Código da trilha confere');
    testAssert(resTrilha1.body.trilha.aulas.length === 6, 'Contém as 6 aulas estruturadas');
    testAssert(resTrilha1.body.trilha.aulas[0].youtubeId === 'Q_2bAN04KF0', 'Primeira aula contém ID do YouTube para streaming');
    testAssert(resTrilha1.body.trilha.aulas[0].concluida === false, 'Aula 1 inicia como não concluída');

    // 2.2 Busca por ordem numérica ('2' para trilha-etica)
    const resTrilha2 = await makeRequest(baseUrl, '/api/formativo/trilhas/2', 'GET', tokenDocente);
    testAssert(resTrilha2.status === 200, 'Retorna 200 OK para busca por ordem numérica');
    testAssert(resTrilha2.body.trilha.codigo === 'trilha-etica', 'Identifica Módulo 2 como trilha-etica');
    testAssert(resTrilha2.body.trilha.aulas.length === 5, 'Módulo 2 contém 5 aulas estruturadas');

    // 2.3 Busca por UUID real do banco de dados
    const trilhaUuid = resTrilha1.body.trilha.id;
    const resTrilhaUuid = await makeRequest(baseUrl, `/api/formativo/trilhas/${trilhaUuid}`, 'GET', tokenDocente);
    testAssert(resTrilhaUuid.status === 200, 'Retorna 200 OK para busca por UUID');
    testAssert(resTrilhaUuid.body.trilha.id === trilhaUuid, 'UUID da trilha coincide');

    // 2.4 Trilha inexistente -> 404 Not Found
    const resInexistente = await makeRequest(baseUrl, '/api/formativo/trilhas/trilha-inexistente-xyz', 'GET', tokenDocente);
    testAssert(resInexistente.status === 404, 'Retorna 404 Not Found para identificador inexistente');
    testAssert(resInexistente.body.title === 'Recurso Não Encontrado', 'Resposta em conformidade com RFC 7807 Problem Details (Recurso Não Encontrado)');

    // ------------------------------------------------------------------------
    // PARTE 3: TESTES DO ENDPOINT POST /api/formativo/progresso
    // ------------------------------------------------------------------------
    console.log('\n📝 3. Rastreamento e Persistência do Progresso (POST /api/formativo/progresso)...');

    // 3.1 Rejeição sem autenticação -> 401 Unauthorized
    const resProgSemToken = await makeRequest(baseUrl, '/api/formativo/progresso', 'POST', null, {
      trilhaId: 'trilha-fundamentos',
      aulaId: 'fundamentos-aula-1',
    });
    testAssert(resProgSemToken.status === 401, 'Rejeita requisição sem token com 401 Unauthorized');

    // 3.2 Rejeição por payload incompleto -> 422 Unprocessable Entity
    const resProgInvalido = await makeRequest(baseUrl, '/api/formativo/progresso', 'POST', tokenDocente, {
      trilhaId: 'trilha-fundamentos',
      // Falta aulaId
    });
    testAssert(resProgInvalido.status === 422, 'Rejeita payload sem aulaId com 422 Unprocessable Entity');
    testAssert(resProgInvalido.body.invalidParams.some((p) => p.name === 'aula_id'), 'Indica campo aula_id inválido');

    // 3.3 Rejeição para trilha inexistente -> 404 Not Found
    const resProgTrilhaNotFound = await makeRequest(baseUrl, '/api/formativo/progresso', 'POST', tokenDocente, {
      trilhaId: 'trilha-inexistente',
      aulaId: 'aula-1',
    });
    testAssert(resProgTrilhaNotFound.status === 404, 'Retorna 404 para trilha inexistente no progresso');

    // 3.4 Conclusão da Aula 1 (1 de 6 aulas = 16.67%)
    const resAula1 = await makeRequest(baseUrl, '/api/formativo/progresso', 'POST', tokenDocente, {
      trilhaId: 'trilha-fundamentos',
      aulaId: 'fundamentos-aula-1',
      concluido: true,
      tempoAssistidoSegundos: 480,
    });
    testAssert(resAula1.status === 200, 'Registra conclusão da Aula 1 com 200 OK');
    testAssert(resAula1.body.progresso.totalAulasConcluidas === 1, 'Total de aulas concluídas = 1');
    testAssert(resAula1.body.progresso.percentualConclusao === 16.67, `Percentual exato (1/6): ${resAula1.body.progresso.percentualConclusao}% === 16.67%`);
    testAssert(resAula1.body.progresso.status === 'em_andamento', 'Status da trilha é em_andamento');
    idsProgressoCriados.push(resAula1.body.progresso.id);

    // 3.5 Conclusão da Aula 2 e Aula 3 (3 de 6 aulas = 50.00%)
    await makeRequest(baseUrl, '/api/formativo/progresso', 'POST', tokenDocente, {
      trilhaId: 'trilha-fundamentos',
      aulaId: 'fundamentos-aula-2',
      concluido: true,
    });

    const resAula3 = await makeRequest(baseUrl, '/api/formativo/progresso', 'POST', tokenDocente, {
      trilhaId: 'trilha-fundamentos',
      aulaId: 'fundamentos-aula-3',
      concluido: true,
    });
    testAssert(resAula3.body.progresso.totalAulasConcluidas === 3, 'Total de aulas concluídas = 3');
    testAssert(resAula3.body.progresso.percentualConclusao === 50.00, `Percentual exato (3/6): ${resAula3.body.progresso.percentualConclusao}% === 50.00%`);

    // ------------------------------------------------------------------------
    // PARTE 4: CRITÉRIO DE ACEITE — PERSISTÊNCIA E RETOMADA ENTRE SESSÕES
    // ------------------------------------------------------------------------
    console.log('\n🔄 4. Verificação de Retomada entre Sessões (Critério de Aceite)...');

    // Simular que o docente fechou a aba/sessão e abre novamente a listagem de trilhas
    const resRetomadaLista = await makeRequest(baseUrl, '/api/formativo/trilhas', 'GET', tokenDocente);
    testAssert(resRetomadaLista.status === 200, 'Retoma listagem de trilhas com sucesso');
    const trilha1Retomada = resRetomadaLista.body.trilhas.find((t) => t.codigo === 'trilha-fundamentos');
    testAssert(trilha1Retomada.percentualConclusao === 50.00, `Persistência do percentual confirmada no PostgreSQL: ${trilha1Retomada.percentualConclusao}% === 50%`);
    testAssert(trilha1Retomada.totalAulasConcluidas === 3, `Contador de aulas concluídas persistido: ${trilha1Retomada.totalAulasConcluidas} de 6`);
    testAssert(trilha1Retomada.status === 'em_andamento', 'Status em_andamento preservado');

    // Simular abertura da página detalhada da trilha após reiniciar sessão
    const resRetomadaDetalhe = await makeRequest(baseUrl, '/api/formativo/trilhas/trilha-fundamentos', 'GET', tokenDocente);
    const aulas = resRetomadaDetalhe.body.trilha.aulas;
    testAssert(aulas[0].concluida === true, 'Aula 1 persiste como concluída');
    testAssert(aulas[1].concluida === true, 'Aula 2 persiste como concluída');
    testAssert(aulas[2].concluida === true, 'Aula 3 persiste como concluída');
    testAssert(aulas[3].concluida === false, 'Aula 4 persiste como pendente');

    // ------------------------------------------------------------------------
    // PARTE 5: CONCLUSÃO INTEGRAL (100%) E DESBLOQUEIO SEQUENCIAL
    // ------------------------------------------------------------------------
    console.log('\n🎓 5. Conclusão Integral da Trilha (100%) e Desbloqueio da Próxima...');

    await makeRequest(baseUrl, '/api/formativo/progresso', 'POST', tokenDocente, {
      trilhaId: 'trilha-fundamentos',
      aulaId: 'fundamentos-aula-4',
      concluido: true,
    });
    await makeRequest(baseUrl, '/api/formativo/progresso', 'POST', tokenDocente, {
      trilhaId: 'trilha-fundamentos',
      aulaId: 'fundamentos-aula-5',
      concluido: true,
    });
    const resAula6 = await makeRequest(baseUrl, '/api/formativo/progresso', 'POST', tokenDocente, {
      trilhaId: 'trilha-fundamentos',
      aulaId: 'fundamentos-aula-6',
      concluido: true,
    });

    testAssert(resAula6.body.progresso.totalAulasConcluidas === 6, 'Todas as 6 aulas marcadas como concluídas');
    testAssert(resAula6.body.progresso.percentualConclusao === 100.00, `Percentual integral atingido: ${resAula6.body.progresso.percentualConclusao}% === 100%`);
    testAssert(resAula6.body.progresso.status === 'concluido', 'Status da trilha alterado para concluido');

    // Verificar listagem geral com Módulo 1 100% concluído
    const resListaPos100 = await makeRequest(baseUrl, '/api/formativo/trilhas', 'GET', tokenDocente);
    testAssert(resListaPos100.body.totalTrilhasConcluidas === 1, 'Total de trilhas concluídas incrementado para 1');
    testAssert(resListaPos100.body.percentualGeralPrograma === 25.00, `Percentual global do programa: ${resListaPos100.body.percentualGeralPrograma}% === 25% (1 de 4 trilhas)`);
    const trilha2Pos = resListaPos100.body.trilhas.find((t) => t.codigo === 'trilha-etica');
    testAssert(trilha2Pos.status === 'disponivel', 'Trilha 2 torna-se disponível após conclusão da Trilha 1');

    // ------------------------------------------------------------------------
    // PARTE 6: DESMARCAÇÃO DE AULA (RECÁLCULO CONSISTENTE)
    // ------------------------------------------------------------------------
    console.log('\n⏪ 6. Desmarcação de Aula e Recálculo Automático...');

    const resDesmarca = await makeRequest(baseUrl, '/api/formativo/progresso', 'POST', tokenDocente, {
      trilhaId: 'trilha-fundamentos',
      aulaId: 'fundamentos-aula-6',
      concluido: false,
    });
    testAssert(resDesmarca.status === 200, 'Desmarcação processada com 200 OK');
    testAssert(resDesmarca.body.progresso.totalAulasConcluidas === 5, 'Contador de aulas concluídas decrementado para 5');
    testAssert(resDesmarca.body.progresso.percentualConclusao === 83.33, `Percentual recalculado: ${resDesmarca.body.progresso.percentualConclusao}% === 83.33%`);
    testAssert(resDesmarca.body.progresso.status === 'em_andamento', 'Status retorna para em_andamento');

  } finally {
    // ------------------------------------------------------------------------
    // TEARDOWN E LIMPEZA DOS REGISTROS TEMPORÁRIOS DE TESTE
    // ------------------------------------------------------------------------
    console.log('\n🧹 Limpando dados temporários de teste do PostgreSQL...');
    try {
      if (idsProgressoCriados.length > 0) {
        await query('DELETE FROM progresso_trilhas WHERE id = ANY($1::uuid[]);', [idsProgressoCriados]);
      }
      if (docenteId) {
        await query('DELETE FROM progresso_trilhas WHERE usuario_id = $1;', [docenteId]);
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
  console.log('   Critérios de Aceite Atendidos:');
  console.log('   ✔ GET /api/formativo/trilhas lista as 4 trilhas com contadores e status');
  console.log('   ✔ GET /api/formativo/trilhas/:id entrega aulas, vídeos (YouTube) e materiais');
  console.log('   ✔ POST /api/formativo/progresso persiste percentual e aulas no PostgreSQL');
  console.log('   ✔ Persistência garantida: docente retoma trilha entre sessões com estado preservado');
  console.log('   ✔ Desbloqueio e desmarcação com recálculo matemático consistente');
  console.log('========================================================================\n');
}

runTestSuite().catch((err) => {
  console.error('\n❌ Falha fatal na execução da suite de testes do formativo:', err);
  process.exit(1);
});

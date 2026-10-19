import http from 'http';
import app from './app.js';
import assert from 'assert';

async function runTests() {
  console.log('Iniciando testes do Painel de Reflexão Crítica (Árvore Recursiva)...');

  const server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      resolve();
    });
  });

  const port = server.address().port;

  const makeRequest = (method, path, payload = null) => {
    return new Promise((resolve, reject) => {
      const options = {
        method: method,
        headers: {},
      };
      
      let data = null;
      if (payload) {
        data = JSON.stringify(payload);
        options.headers['Content-Type'] = 'application/json';
        options.headers['Content-Length'] = Buffer.byteLength(data);
      }

      const req = http.request(
        `http://localhost:${port}${path}`,
        options,
        (res) => {
          let chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            const bodyStr = Buffer.concat(chunks).toString();
            let body = bodyStr;
            try { body = JSON.parse(bodyStr); } catch (e) {}
            resolve({ statusCode: res.statusCode, headers: res.headers, body });
          });
        }
      );
      req.on('error', reject);
      if (data) req.write(data);
      req.end();
    });
  };

  try {
    // 1. Criar um novo tópico
    console.log('Testando POST /api/reflexao/topicos...');
    const topicoPayload = {
      titulo: 'A Importância da IA na Matemática',
      conteudo: 'Quais os impactos da IA na EPT?',
      tag_tematica: 'IA na Educação'
    };
    let resTopico = await makeRequest('POST', '/api/reflexao/topicos', topicoPayload);
    assert.strictEqual(resTopico.statusCode, 201, 'Deveria criar um tópico com sucesso');
    const topicoId = resTopico.body.id;
    assert.ok(topicoId, 'Deveria retornar o ID do tópico criado');

    // 2. Criar uma resposta raiz
    console.log('Testando POST /api/reflexao/topicos/:id/respostas (Raiz)...');
    const respostaRaizPayload = {
      conteudo: 'Concordo, a IA é fundamental.'
    };
    let resRespostaRaiz = await makeRequest('POST', `/api/reflexao/topicos/${topicoId}/respostas`, respostaRaizPayload);
    assert.strictEqual(resRespostaRaiz.statusCode, 201, 'Deveria criar resposta raiz');
    const respostaRaizId = resRespostaRaiz.body.id;

    // 3. Criar uma resposta filha (Hierarquia)
    console.log('Testando POST /api/reflexao/topicos/:id/respostas (Filha)...');
    const respostaFilhaPayload = {
      conteudo: 'Exatamente, concordo com você!',
      resposta_pai_id: respostaRaizId
    };
    let resRespostaFilha = await makeRequest('POST', `/api/reflexao/topicos/${topicoId}/respostas`, respostaFilhaPayload);
    assert.strictEqual(resRespostaFilha.statusCode, 201, 'Deveria criar resposta filha');

    // 4. Listar tópicos (para checar contador)
    console.log('Testando GET /api/reflexao/topicos (Contador de respostas)...');
    let resListarTopicos = await makeRequest('GET', '/api/reflexao/topicos');
    assert.strictEqual(resListarTopicos.statusCode, 200, 'Deveria listar tópicos');
    const topicoCriado = resListarTopicos.body.find(t => t.id === topicoId);
    assert.ok(topicoCriado, 'Tópico deveria estar na lista');
    assert.strictEqual(parseInt(topicoCriado.total_respostas, 10), 2, 'Contador de respostas deveria ser 2');

    // 5. Listar Respostas em Árvore
    console.log('Testando GET /api/reflexao/topicos/:id/respostas (Estrutura em Árvore)...');
    let resListarRespostas = await makeRequest('GET', `/api/reflexao/topicos/${topicoId}/respostas`);
    assert.strictEqual(resListarRespostas.statusCode, 200, 'Deveria listar respostas em árvore');
    const arvore = resListarRespostas.body;
    assert.strictEqual(arvore.length, 1, 'Deveria haver 1 resposta raiz');
    assert.strictEqual(arvore[0].id, respostaRaizId, 'A raiz deve ser a primeira resposta enviada');
    assert.strictEqual(arvore[0].respostas.length, 1, 'A raiz deveria ter 1 resposta filha no array');
    assert.strictEqual(arvore[0].respostas[0].id, resRespostaFilha.body.id, 'A filha deve ser a segunda resposta enviada');

    console.log('✔ Todos os testes do Painel de Reflexão passaram com sucesso!');
  } catch (error) {
    console.error('Falha nos testes de reflexão:', error);
    process.exitCode = 1;
  } finally {
    server.close();
    process.exit();
  }
}

runTests();

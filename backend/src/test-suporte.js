import http from 'http';
import app from './app.js';
import assert from 'assert';
import { query } from './config/database.js';
import { tokenService } from './services/TokenService.js';

async function runTests() {
  console.log('Iniciando testes de Suporte e Métricas do Docente...');

  const server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      resolve();
    });
  });

  const port = server.address().port;

  const mockUser = {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'suporte@teste.com',
    role: 'docente',
    nome: 'Docente Suporte'
  };

  const userResult = await query('SELECT id FROM usuarios LIMIT 1');
  let realUserId = null;
  if (userResult.rowCount > 0) {
    realUserId = userResult.rows[0].id;
    mockUser.id = realUserId;
  }

  const token = tokenService.generateAccessToken(mockUser);

  const makeRequest = (method, path, payload = null, useAuth = false) => {
    return new Promise((resolve, reject) => {
      const options = {
        method: method,
        headers: {},
      };
      
      if (useAuth) {
        options.headers['Authorization'] = `Bearer ${token}`;
      }

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
    // 1. Inserir mock data para métricas
    if (realUserId) {
      await query(`INSERT INTO topicos_forum (titulo, conteudo, tag_tematica, usuario_id) VALUES ('Topico Suporte Teste', 'Teste', 'Outros', $1)`, [realUserId]);
      await query(`INSERT INTO respostas_forum (topico_id, conteudo, usuario_id) VALUES ((SELECT id FROM topicos_forum WHERE titulo = 'Topico Suporte Teste' LIMIT 1), 'Teste Resposta', $1)`, [realUserId]);
    }

    // 2. Testar GET Métricas
    console.log('Testando GET /api/suporte/metricas-docente...');
    let resMetricas = await makeRequest('GET', '/api/suporte/metricas-docente', null, true);
    assert.strictEqual(resMetricas.statusCode, 200);
    assert.ok(resMetricas.body.hasOwnProperty('trilhasConcluidas'), 'Falta a métrica trilhasConcluidas');
    assert.ok(resMetricas.body.hasOwnProperty('materiaisGerados'), 'Falta a métrica materiaisGerados');
    assert.ok(resMetricas.body.hasOwnProperty('praticasCompartilhadas'), 'Falta a métrica praticasCompartilhadas');
    assert.ok(resMetricas.body.hasOwnProperty('participacaoForuns'), 'Falta a métrica participacaoForuns');

    if (realUserId) {
      assert.ok(resMetricas.body.participacaoForuns >= 2, 'Deveria ter contado o tópico e a resposta de teste');
    }

    // 3. Testar POST Ticket
    console.log('Testando POST /api/suporte/ticket...');
    const ticketPayload = {
      assunto: 'Bug na plataforma',
      mensagem: 'O botão de gerar atividade sumiu',
      tipo: 'bug'
    };
    let resTicket = await makeRequest('POST', '/api/suporte/ticket', ticketPayload, true);
    assert.strictEqual(resTicket.statusCode, 201);
    assert.ok(resTicket.body.ticket.id, 'O ticket deveria retornar um ID');
    assert.strictEqual(resTicket.body.ticket.status, 'aberto', 'O status inicial do ticket deveria ser aberto');

    // 4. Limpar banco de teste
    if (realUserId) {
      await query(`DELETE FROM respostas_forum WHERE conteudo = 'Teste Resposta' AND usuario_id = $1`, [realUserId]);
      await query(`DELETE FROM topicos_forum WHERE titulo = 'Topico Suporte Teste' AND usuario_id = $1`, [realUserId]);
    }
    await query(`DELETE FROM tickets_suporte WHERE assunto = 'Bug na plataforma'`);

    console.log('✔ Todos os testes de Suporte e Métricas passaram com sucesso!');
  } catch (error) {
    console.error('Falha nos testes de suporte e métricas:', error);
    process.exitCode = 1;
  } finally {
    server.close();
    process.exit();
  }
}

runTests();

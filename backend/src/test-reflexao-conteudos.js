import http from 'http';
import app from './app.js';
import assert from 'assert';
import { query } from './config/database.js';
import { tokenService } from './services/TokenService.js';

async function runTests() {
  console.log('Iniciando testes de Conteúdos Curados (Artigos/Provocações)...');

  const server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      resolve();
    });
  });

  const port = server.address().port;

  // Mock um usuário para gerar token e testar interações
  const mockUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'teste@reflexao.com',
    role: 'docente',
    nome: 'Docente Teste'
  };

  // Pegar um usuário real do banco para o teste de foreign key
  const userResult = await query('SELECT id FROM usuarios LIMIT 1');
  let realUserId = null;
  if (userResult.rowCount > 0) {
    realUserId = userResult.rows[0].id;
    mockUser.id = realUserId;
  } else {
    console.log('Nenhum usuário no banco. Pulando teste de Interações com FK.');
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
    // 1. Inserir artigo e provocação mock no banco para testar
    const resArtigo = await query(`
      INSERT INTO artigos_reflexao (titulo, resumo, conteudo, autor, referencias_bibliograficas, tag_tematica) 
      VALUES ('Artigo 1', 'Resumo 1', 'Conteudo 1', 'Autor 1', 'Ref 1', 'IA') 
      RETURNING id
    `);
    const artigoId = resArtigo.rows[0].id;

    const resProvocacao = await query(`
      INSERT INTO provocacoes_reflexao (titulo, conteudo, autor, tag_tematica) 
      VALUES ('Provocacao 1', 'Conteudo Provocacao 1', 'Autor 2', 'Etica') 
      RETURNING id
    `);
    const provocacaoId = resProvocacao.rows[0].id;

    // 2. Testar GET Artigos
    console.log('Testando GET /api/reflexao/artigos...');
    let resListarArtigos = await makeRequest('GET', '/api/reflexao/artigos');
    assert.strictEqual(resListarArtigos.statusCode, 200);
    assert.ok(Array.isArray(resListarArtigos.body.data));
    assert.strictEqual(resListarArtigos.body.meta.page, 1);

    // 3. Testar GET Provocações
    console.log('Testando GET /api/reflexao/provocacoes...');
    let resListarProv = await makeRequest('GET', '/api/reflexao/provocacoes');
    assert.strictEqual(resListarProv.statusCode, 200);
    assert.ok(Array.isArray(resListarProv.body.data));

    // 4. Testar POST Interação (Lido) - requer Auth
    console.log('Testando POST /api/reflexao/interacoes...');
    const interacaoPayload = {
      tipo_item: 'artigo',
      item_id: artigoId,
      lido: true,
      favorito: true
    };
    let resInteracao = await makeRequest('POST', '/api/reflexao/interacoes', interacaoPayload, true);
    assert.strictEqual(resInteracao.statusCode, 200);
    assert.strictEqual(resInteracao.body.lido, true);
    assert.strictEqual(resInteracao.body.favorito, true);

    // 5. Testar GET Artigo detalhado (verificando se o 'lido' veio atrelado ao usuário)
    console.log('Testando GET /api/reflexao/artigos/:id com Auth...');
    let resArtigoDetalhe = await makeRequest('GET', `/api/reflexao/artigos/${artigoId}`, null, true);
    assert.strictEqual(resArtigoDetalhe.statusCode, 200);
    assert.strictEqual(resArtigoDetalhe.body.lido, true, 'O artigo deveria estar marcado como lido para este usuário');
    assert.strictEqual(resArtigoDetalhe.body.favorito, true, 'O artigo deveria estar marcado como favorito');

    // Limpeza dos mocks
    await query('DELETE FROM interacoes_reflexao WHERE item_id = $1', [artigoId]);
    await query('DELETE FROM artigos_reflexao WHERE id = $1', [artigoId]);
    await query('DELETE FROM provocacoes_reflexao WHERE id = $1', [provocacaoId]);

    console.log('✔ Todos os testes de Conteúdos da Reflexão passaram com sucesso!');
  } catch (error) {
    console.error('Falha nos testes de conteúdos reflexão:', error);
    process.exitCode = 1;
  } finally {
    server.close();
    process.exit();
  }
}

runTests();

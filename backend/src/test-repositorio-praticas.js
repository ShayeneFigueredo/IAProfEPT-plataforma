import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import assert from 'assert';
import app from './app.js';
import { query, closePool } from './config/database.js';
import { tokenService } from './services/TokenService.js';

/**
 * Suíte de Testes Automatizados: CRUD Completo do Repositório de Práticas Docentes
 * Plataforma IAprofEPT — Tese de Doutorado PPGEM / UFJF
 * 
 * Critérios de Aceite Verificados:
 * 1. POST /api/repositorio/praticas: Compartilhamento de prática com transação consistente (201 Created).
 * 2. Bloqueio de POST sem autenticação (401 Unauthorized).
 * 3. GET /api/repositorio/praticas: Listagem paginada com metadados, busca textual e filtros.
 * 4. GET /api/repositorio/praticas/:id: Detalhes completos com gabarito estruturado e autor.
 * 5. PUT /api/repositorio/praticas/:id: Edição autorizada pelo autor original (200 OK).
 * 6. Bloqueio de edição por usuário não-autorizado (403 Forbidden).
 * 7. DELETE /api/repositorio/praticas/:id: Exclusão com Soft Delete (200 OK, deleted_at preenchido).
 * 8. Bloqueio de exclusão por usuário não-autorizado (403 Forbidden).
 * 9. Práticas excluídas (soft delete) somem da listagem e retornam 404 Not Found em busca por ID.
 */

async function makeRequest(baseUrl, path, method = 'GET', body = null, headers = {}) {
  const url = new URL(path, baseUrl);

  return new Promise((resolve, reject) => {
    const payloadStr = body ? JSON.stringify(body) : null;
    const reqHeaders = { ...headers };

    if (payloadStr) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payloadStr);
    }

    const req = http.request(
      url,
      {
        method,
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
            json = { raw: rawData };
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: json,
          });
        });
      }
    );

    req.on('error', reject);
    if (payloadStr) {
      req.write(payloadStr);
    }
    req.end();
  });
}

let server;
let baseUrl;
let passedTests = 0;
let totalTests = 0;

function it(description, fn) {
  totalTests++;
  return fn()
    .then(() => {
      passedTests++;
      console.log(`  \x1b[32m✔\x1b[0m ${description}`);
    })
    .catch((err) => {
      console.error(`  \x1b[31m✖\x1b[0m ${description}`);
      console.error(err);
      throw err;
    });
}

async function run() {
  console.log('\n========================================================================');
  console.log('📚 Teste do CRUD Completo do Repositório de Práticas Docentes');
  console.log('Pesquisa de Doutorado PPGEM / UFJF — Maycon Magalhães');
  console.log('========================================================================\n');

  let autorId;
  let outroUsuarioId;
  let tokenAutor;
  let tokenOutroUsuario;
  let praticaCriadaId;

  try {
    // 1. Iniciar servidor HTTP dinâmico
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
    console.log(`Servidor de testes ativo em: ${baseUrl}\n`);

    // 2. Resolução de dois usuários ativos no PostgreSQL (com TCLE em conformidade)
    let autor;
    let outroUsuario;

    const resUsers = await query(
      `SELECT id, nome, email, role FROM usuarios WHERE status = 'ativo' ORDER BY created_at ASC LIMIT 2;`
    );

    if (resUsers.rows.length >= 2) {
      autor = resUsers.rows[0];
      outroUsuario = resUsers.rows[1];
    } else {
      // Caso não existam 2 usuários, criar atômico com TCLE para satisfazer a constraint trg_garantir_consentimento_tcle
      const client = await (await import('./config/database.js')).getClient();
      try {
        await client.query('BEGIN');
        const r1 = await client.query(
          `INSERT INTO usuarios (nome, email, senha_hash, role, status)
           VALUES ('Prof. Autor Teste', 'autor.test.' || extract(epoch from now()) || '@ufjf.br', 'hash_fake', 'docente_rfepct', 'ativo')
           RETURNING id, nome, email, role;`
        );
        await client.query(
          `INSERT INTO consentimentos_tcle (usuario_id, versao_termo, aceito, ip_anonimizado, user_agent)
           VALUES ($1, '1.0', TRUE, '127.0.0.1', 'Node-Test-Suite');`,
          [r1.rows[0].id]
        );

        const r2 = await client.query(
          `INSERT INTO usuarios (nome, email, senha_hash, role, status)
           VALUES ('Prof. Outro Docente', 'outro.test.' || extract(epoch from now()) || '@ufjf.br', 'hash_fake', 'docente_rfepct', 'ativo')
           RETURNING id, nome, email, role;`
        );
        await client.query(
          `INSERT INTO consentimentos_tcle (usuario_id, versao_termo, aceito, ip_anonimizado, user_agent)
           VALUES ($1, '1.0', TRUE, '127.0.0.1', 'Node-Test-Suite');`,
          [r2.rows[0].id]
        );

        await client.query('COMMIT');
        autor = r1.rows[0];
        outroUsuario = r2.rows[0];
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }

    autorId = autor.id;
    tokenAutor = tokenService.generateAccessToken({
      id: autorId,
      email: autor.email,
      role: autor.role,
      nome: autor.nome,
    });

    outroUsuarioId = outroUsuario.id;
    tokenOutroUsuario = tokenService.generateAccessToken({
      id: outroUsuarioId,
      email: outroUsuario.email,
      role: outroUsuario.role,
      nome: outroUsuario.nome,
    });

    console.log('--- 1. Compartilhamento de Prática (POST /api/repositorio/praticas) ---');

    await it('Rejeita criação de prática sem token de autenticação com HTTP 401 Unauthorized', async () => {
      const res = await makeRequest(baseUrl, '/api/repositorio/praticas', 'POST', {
        titulo: 'Tentativa não autenticada',
        conteudoCompleto: 'Conteúdo qualquer pedagógico',
        cursoTecnico: 'Técnico em Agropecuária / Agricultura',
        temaMatematico: 'Geometria Espacial e Volume',
      });

      assert.strictEqual(res.statusCode, 401);
      assert.ok(res.body.detail || res.body.message);
    });

    await it('Compartilha nova prática pedagógica com sucesso retornando HTTP 201 Created', async () => {
      const payloadPratica = {
        titulo: 'Dimensionamento de Silos Graneleiros em Agropecuária',
        descricao: 'Sequência didática aplicando cálculo de volume de sólidos combinados (cilindro + cone).',
        conteudoCompleto: JSON.stringify({
          tipoAtividade: 'exercicios',
          tituloAtividade: 'Dimensionamento de Silos Graneleiros em Agropecuária',
          itens: [
            {
              numero: 1,
              tituloItem: 'Cálculo de Capacidade Volumétrica Útil',
              perguntas: ['Calcule o volume total útil do silo.'],
              gabaritoComentadoPassoAPasso: [
                'Passo 1: Volume do cilindro V1 = pi * r^2 * H',
                'Passo 2: Volume do cone V2 = (1/3) * pi * r^2 * h',
                'Resposta Final: Volume Total = 450 m³',
              ],
            },
          ],
        }),
        cursoTecnico: 'Técnico em Agropecuária / Agricultura',
        temaMatematico: 'Geometria Espacial e Volume',
        habilidadesBncc: [{ codigo: 'EM13MAT308', descricao: 'Geometria Espacial e Volume' }],
        publicado: true,
      };

      const res = await makeRequest(baseUrl, '/api/repositorio/praticas', 'POST', payloadPratica, {
        Authorization: `Bearer ${tokenAutor}`,
      });

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.sucesso, true);
      assert.ok(res.body.pratica.id);
      assert.strictEqual(res.body.pratica.titulo, payloadPratica.titulo);
      assert.strictEqual(res.body.pratica.curso_tecnico, 'Técnico em Agropecuária / Agricultura');
      assert.strictEqual(res.body.pratica.eixo_cnct, 'Recursos Naturais'); // auto-resolvido!
      assert.strictEqual(res.body.pratica.autor.nome, autor.nome);

      praticaCriadaId = res.body.pratica.id;
    });

    console.log('\n--- 2. Listagem Paginada e Filtros (GET /api/repositorio/praticas) ---');

    await it('Retorna listagem paginada de práticas com metadados e total de registros', async () => {
      const res = await makeRequest(baseUrl, '/api/repositorio/praticas?page=1&limit=5', 'GET');

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.sucesso, true);
      assert.ok(Array.isArray(res.body.praticas));
      assert.ok(res.body.praticas.length >= 1);
      assert.strictEqual(res.body.paginacao.paginaAtual, 1);
      assert.strictEqual(res.body.paginacao.itensPorPagina, 5);
      assert.ok(res.body.paginacao.totalRegistros >= 1);

      const pratica = res.body.praticas.find((p) => p.id === praticaCriadaId);
      assert.ok(pratica, 'Prática recém-criada deve constar na listagem');
      assert.strictEqual(pratica.autor.nome, autor.nome);
    });

    await it('Filtra práticas por cursoTecnico e temaMatematico', async () => {
      const res = await makeRequest(
        baseUrl,
        `/api/repositorio/praticas?cursoTecnico=${encodeURIComponent('Técnico em Agropecuária / Agricultura')}`,
        'GET'
      );

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.praticas.every((p) => p.cursoTecnico === 'Técnico em Agropecuária / Agricultura'));
    });

    await it('Realiza busca textual tolerante por palavra-chave no título/descrição', async () => {
      const res = await makeRequest(baseUrl, '/api/repositorio/praticas?busca=Silos', 'GET');

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.praticas.some((p) => p.id === praticaCriadaId));
    });

    console.log('\n--- 3. Visualização Detalhada (GET /api/repositorio/praticas/:id) ---');

    await it('Retorna detalhes completos com gabarito estruturado e autor', async () => {
      const res = await makeRequest(baseUrl, `/api/repositorio/praticas/${praticaCriadaId}`, 'GET');

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.sucesso, true);
      assert.strictEqual(res.body.pratica.id, praticaCriadaId);
      assert.ok(res.body.pratica.conteudoCompleto);
      assert.ok(Array.isArray(res.body.pratica.gabarito), 'Deve conter gabarito estruturado desaninhado');
      assert.ok(res.body.pratica.gabarito[0].gabaritoComentadoPassoAPasso.some((passo) => passo.includes('450 m³')));
      assert.strictEqual(res.body.pratica.autor.nome, autor.nome);
    });

    await it('Retorna HTTP 404 Not Found para UUID inexistente', async () => {
      const res = await makeRequest(
        baseUrl,
        '/api/repositorio/praticas/00000000-0000-0000-0000-000000000000',
        'GET'
      );

      assert.strictEqual(res.statusCode, 404);
      assert.ok(res.body.title || res.body.detail);
    });

    await it('Retorna HTTP 400 Bad Request para ID com formato não-UUID', async () => {
      const res = await makeRequest(baseUrl, '/api/repositorio/praticas/id-invalido-123', 'GET');

      assert.strictEqual(res.statusCode, 400);
    });

    console.log('\n--- 4. Edição de Prática (PUT /api/repositorio/praticas/:id) ---');

    await it('Bloqueia tentativa de edição por usuário que não é o autor (403 Forbidden)', async () => {
      const res = await makeRequest(
        baseUrl,
        `/api/repositorio/praticas/${praticaCriadaId}`,
        'PUT',
        { titulo: 'Tentativa de Hack por Outro Usuário' },
        { Authorization: `Bearer ${tokenOutroUsuario}` }
      );

      assert.strictEqual(res.statusCode, 403);
      assert.ok(res.body.detail.includes('autor') || res.body.title.includes('Proibido'));
    });

    await it('Permite ao autor original atualizar a prática pedagógica (200 OK)', async () => {
      const payloadUpdate = {
        titulo: 'Dimensionamento de Silos Graneleiros em Agropecuária (Revisado)',
        descricao: 'Descrição aprimorada com novas variáveis de compactação de grãos de milho.',
      };

      const res = await makeRequest(
        baseUrl,
        `/api/repositorio/praticas/${praticaCriadaId}`,
        'PUT',
        payloadUpdate,
        { Authorization: `Bearer ${tokenAutor}` }
      );

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.sucesso, true);
      assert.strictEqual(res.body.pratica.titulo, payloadUpdate.titulo);
      assert.strictEqual(res.body.pratica.descricao, payloadUpdate.descricao);
    });

    console.log('\n--- 5. Exclusão e Soft Delete (DELETE /api/repositorio/praticas/:id) ---');

    await it('Bloqueia exclusão de prática por outro usuário (403 Forbidden)', async () => {
      const res = await makeRequest(
        baseUrl,
        `/api/repositorio/praticas/${praticaCriadaId}`,
        'DELETE',
        null,
        { Authorization: `Bearer ${tokenOutroUsuario}` }
      );

      assert.strictEqual(res.statusCode, 403);
    });

    await it('Permite ao autor realizar o Soft Delete da prática (200 OK)', async () => {
      const res = await makeRequest(
        baseUrl,
        `/api/repositorio/praticas/${praticaCriadaId}`,
        'DELETE',
        null,
        { Authorization: `Bearer ${tokenAutor}` }
      );

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.deletado, true);
      assert.ok(res.body.deletedAt, 'deleted_at deve ter sido preenchido no PostgreSQL');
    });

    await it('Prática com soft delete não aparece na listagem geral GET /api/repositorio/praticas', async () => {
      const res = await makeRequest(baseUrl, '/api/repositorio/praticas', 'GET');

      assert.strictEqual(res.statusCode, 200);
      assert.ok(!res.body.praticas.some((p) => p.id === praticaCriadaId));
    });

    await it('Buscar prática excluída por ID retorna HTTP 404 Not Found', async () => {
      const res = await makeRequest(baseUrl, `/api/repositorio/praticas/${praticaCriadaId}`, 'GET');

      assert.strictEqual(res.statusCode, 404);
    });

    console.log('\n========================================================================');
    console.log(`🎉 SUCESSO: Todos os ${passedTests}/${totalTests} testes do CRUD do Repositório passaram!`);
    console.log('Critério de Aceite: Operações transacionais consistentes no PostgreSQL com soft delete.');
    console.log('========================================================================\n');
  } finally {
    if (praticaCriadaId) {
      try {
        await query('DELETE FROM praticas_repositorio WHERE id = $1', [praticaCriadaId]);
      } catch (e) {
        // Ignora erro no teardown
      }
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await closePool();
  }
}

run().catch((err) => {
  console.error('\n💥 Falha na execução da suíte de testes do repositório:', err);
  process.exit(1);
});

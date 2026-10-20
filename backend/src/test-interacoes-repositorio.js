import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import assert from 'assert';
import app from './app.js';
import { query, closePool } from './config/database.js';
import { tokenService } from './services/TokenService.js';

/**
 * Suíte de Testes Automatizados: Sistema de Curtidas, Favoritos e Avaliação Comunitária
 * Plataforma IAprofEPT — Tese de Doutorado PPGEM / UFJF
 * 
 * Critérios de Aceite Verificados:
 * 1. POST /api/repositorio/praticas/:id/curtir: Toggle atômico de like no PostgreSQL (200 OK).
 * 2. POST /api/repositorio/praticas/:id/favoritar: Toggle atômico de favorito no PostgreSQL (200 OK).
 * 3. POST /api/repositorio/praticas/:id/comentarios: Publicação de relatos de experiência e comentários (201 Created).
 * 4. GET /api/repositorio/praticas/:id/comentarios: Listagem paginada com metadados do autor.
 * 5. GET /api/repositorio/praticas/:id/interacoes: Verificação de status de curtida e favorito do docente.
 * 6. DELETE /api/repositorio/comentarios/:comentarioId: Soft delete com controle de permissão (403/200).
 * 7. CRITÉRIO DE ACEITE: Contadores atômicos atualizados consistentemente sem condições de corrida (Race Conditions).
 */

async function makeRequest(baseUrl, path, method = 'GET', body = null, headers = {}) {
  const url = new URL(path, baseUrl);

  return new Promise((resolve, reject) => {
    const reqHeaders = { ...headers };
    let payload = body;

    if (body && typeof body === 'object') {
      payload = JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
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
    if (payload) {
      req.write(payload);
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
  console.log('❤️  Teste do Sistema de Curtidas, Favoritos e Relatos Comunitários');
  console.log('Pesquisa de Doutorado PPGEM / UFJF — Maycon Magalhães');
  console.log('Critério de Aceite: Contadores atômicos sem condições de corrida');
  console.log('========================================================================\n');

  let autor;
  let outroUsuario;
  let tokenAutor;
  let tokenOutroUsuario;
  let praticaTesteId;
  let comentarioCriadoId;

  try {
    // 1. Iniciar servidor HTTP
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
    console.log(`Servidor de testes ativo em: ${baseUrl}\n`);

    // 2. Resolução de usuários ativos no PostgreSQL
    const resUsers = await query(
      `SELECT id, nome, email, role FROM usuarios WHERE status = 'ativo' ORDER BY created_at ASC LIMIT 2;`
    );

    if (resUsers.rows.length >= 2) {
      autor = resUsers.rows[0];
      outroUsuario = resUsers.rows[1];
    } else {
      throw new Error('Necessário ao menos 2 usuários na base para executar a suíte de testes.');
    }

    tokenAutor = tokenService.generateAccessToken({
      id: autor.id,
      email: autor.email,
      role: autor.role,
      nome: autor.nome,
    });

    tokenOutroUsuario = tokenService.generateAccessToken({
      id: outroUsuario.id,
      email: outroUsuario.email,
      role: outroUsuario.role,
      nome: outroUsuario.nome,
    });

    // 3. Criação de prática de teste no PostgreSQL
    const resPratica = await query(
      `INSERT INTO praticas_repositorio (
        usuario_id, titulo, descricao, conteudo_completo,
        curso_tecnico, eixo_cnct, tema_matematico,
        total_curtidas, total_favoritos, total_avaliacoes, total_comentarios, media_estrelas,
        publicado, created_at, updated_at
      ) VALUES (
        $1, 'Prática para Teste de Interações Comunitárias', 'Descrição da prática teste', 'Conteúdo da prática teste',
        'Técnico em Agropecuária / Agricultura', 'Recursos Naturais', 'Geometria Espacial e Volume',
        0, 0, 0, 0, 0.00,
        TRUE, NOW(), NOW()
      ) RETURNING id;`,
      [autor.id]
    );
    praticaTesteId = resPratica.rows[0].id;

    console.log('--- 1. Sistema de Curtidas (Toggle de Like Atômico) ---');

    await it('Rejeita curtida sem token de autenticação com HTTP 401 Unauthorized', async () => {
      const res = await makeRequest(baseUrl, `/api/repositorio/praticas/${praticaTesteId}/curtir`, 'POST');
      assert.strictEqual(res.statusCode, 401);
    });

    await it('Realiza toggle de like (1ª vez: curtir) e incrementa contador atômico (200 OK)', async () => {
      const res = await makeRequest(
        baseUrl,
        `/api/repositorio/praticas/${praticaTesteId}/curtir`,
        'POST',
        null,
        { Authorization: `Bearer ${tokenAutor}` }
      );

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.sucesso, true);
      assert.strictEqual(res.body.curtido, true);
      assert.strictEqual(res.body.totalCurtidas, 1);

      // Verificação no banco de dados
      const dbRes = await query('SELECT total_curtidas FROM praticas_repositorio WHERE id = $1', [praticaTesteId]);
      assert.strictEqual(dbRes.rows[0].total_curtidas, 1);
    });

    await it('Realiza toggle de like (2ª vez: descurtir) e decrementa contador atômico (200 OK)', async () => {
      const res = await makeRequest(
        baseUrl,
        `/api/repositorio/praticas/${praticaTesteId}/curtir`,
        'POST',
        null,
        { Authorization: `Bearer ${tokenAutor}` }
      );

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.sucesso, true);
      assert.strictEqual(res.body.curtido, false);
      assert.strictEqual(res.body.totalCurtidas, 0);

      const dbRes = await query('SELECT total_curtidas FROM praticas_repositorio WHERE id = $1', [praticaTesteId]);
      assert.strictEqual(dbRes.rows[0].total_curtidas, 0);
    });

    await it('Garante atomicidade concorrente (prevenção de Race Conditions) com múltiplos usuários', async () => {
      // Ambos os usuários curtem simultaneamente via Promise.all
      const [res1, res2] = await Promise.all([
        makeRequest(baseUrl, `/api/repositorio/praticas/${praticaTesteId}/curtir`, 'POST', null, {
          Authorization: `Bearer ${tokenAutor}`,
        }),
        makeRequest(baseUrl, `/api/repositorio/praticas/${praticaTesteId}/curtir`, 'POST', null, {
          Authorization: `Bearer ${tokenOutroUsuario}`,
        }),
      ]);

      assert.strictEqual(res1.statusCode, 200);
      assert.strictEqual(res2.statusCode, 200);
      assert.strictEqual(res1.body.curtido, true);
      assert.strictEqual(res2.body.curtido, true);

      // Verifica total no banco de dados: deve ser estritamente 2
      const dbPratica = await query('SELECT total_curtidas FROM praticas_repositorio WHERE id = $1', [praticaTesteId]);
      assert.strictEqual(dbPratica.rows[0].total_curtidas, 2);

      const dbLikes = await query('SELECT COUNT(*)::int AS count FROM curtidas_praticas WHERE pratica_id = $1', [praticaTesteId]);
      assert.strictEqual(dbLikes.rows[0].count, 2);
    });

    console.log('\n--- 2. Sistema de Favoritos (Toggle de Favorito Atômico) ---');

    await it('Realiza toggle de favorito (favoritar) e incrementa contador atômico (200 OK)', async () => {
      const res = await makeRequest(
        baseUrl,
        `/api/repositorio/praticas/${praticaTesteId}/favoritar`,
        'POST',
        null,
        { Authorization: `Bearer ${tokenAutor}` }
      );

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.sucesso, true);
      assert.strictEqual(res.body.favoritado, true);
      assert.strictEqual(res.body.totalFavoritos, 1);

      const dbRes = await query('SELECT total_favoritos FROM praticas_repositorio WHERE id = $1', [praticaTesteId]);
      assert.strictEqual(dbRes.rows[0].total_favoritos, 1);
    });

    await it('Consulta status de interação do usuário (curtido=true, favoritado=true)', async () => {
      const res = await makeRequest(
        baseUrl,
        `/api/repositorio/praticas/${praticaTesteId}/interacoes`,
        'GET',
        null,
        { Authorization: `Bearer ${tokenAutor}` }
      );

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.curtido, true);
      assert.strictEqual(res.body.favoritado, true);
    });

    console.log('\n--- 3. Comentários e Relatos de Experiência Docente na EPT ---');

    await it('Rejeita comentário vazio ou com menos de 3 caracteres com HTTP 422 Unprocessable Entity', async () => {
      const res = await makeRequest(
        baseUrl,
        `/api/repositorio/praticas/${praticaTesteId}/comentarios`,
        'POST',
        { texto: 'Oi' },
        { Authorization: `Bearer ${tokenAutor}` }
      );

      assert.strictEqual(res.statusCode, 422);
      assert.ok(res.body.detail || res.body.invalidParams);
    });

    await it('Publica relato de experiência de aplicação em sala de aula com avaliação por estrelas (201 Created)', async () => {
      const payloadRelato = {
        texto: 'Apliquei esta atividade com a turma do 2º ano de Agropecuária. Os estudantes calcularam com precisão a capacidade volumétrica e demonstraram alto engajamento.',
        relatoExperiencia: true,
        turmaContexto: '2º ano Integrado em Agropecuária (IF Sudeste MG)',
        notaEstrelas: 5,
      };

      const res = await makeRequest(
        baseUrl,
        `/api/repositorio/praticas/${praticaTesteId}/comentarios`,
        'POST',
        payloadRelato,
        { Authorization: `Bearer ${tokenAutor}` }
      );

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.sucesso, true);
      assert.ok(res.body.comentario.id);
      assert.strictEqual(res.body.comentario.relatoExperiencia, true);
      assert.strictEqual(res.body.comentario.turmaContexto, payloadRelato.turmaContexto);
      assert.strictEqual(res.body.comentario.notaEstrelas, 5);
      assert.strictEqual(res.body.comentario.autor.id, autor.id);

      comentarioCriadoId = res.body.comentario.id;

      // Verifica recálculo atômico da média de estrelas e contadores na prática
      const dbPratica = await query(
        'SELECT total_comentarios, total_avaliacoes, media_estrelas FROM praticas_repositorio WHERE id = $1',
        [praticaTesteId]
      );
      assert.strictEqual(dbPratica.rows[0].total_comentarios, 1);
      assert.strictEqual(dbPratica.rows[0].total_avaliacoes, 1);
      assert.strictEqual(Number(dbPratica.rows[0].media_estrelas), 5.00);
    });

    await it('Publica um segundo comentário da comunidade docente com nota 4 estrelas (201 Created)', async () => {
      const payloadComentario = {
        texto: 'Excelente material didático! Sugiro apenas incluir uma dica sobre a conversão de metros cúbicos para litros.',
        relatoExperiencia: false,
        notaEstrelas: 4,
      };

      const res = await makeRequest(
        baseUrl,
        `/api/repositorio/praticas/${praticaTesteId}/comentarios`,
        'POST',
        payloadComentario,
        { Authorization: `Bearer ${tokenOutroUsuario}` }
      );

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.comentario.relatoExperiencia, false);

      // Média agora deve ser (5 + 4) / 2 = 4.50
      const dbPratica = await query(
        'SELECT total_comentarios, total_avaliacoes, media_estrelas FROM praticas_repositorio WHERE id = $1',
        [praticaTesteId]
      );
      assert.strictEqual(dbPratica.rows[0].total_comentarios, 2);
      assert.strictEqual(dbPratica.rows[0].total_avaliacoes, 2);
      assert.strictEqual(Number(dbPratica.rows[0].media_estrelas), 4.50);
    });

    console.log('\n--- 4. Listagem e Moderação de Comentários ---');

    await it('Lista comentários vinculados à prática de forma paginada com metadados do autor (200 OK)', async () => {
      const res = await makeRequest(
        baseUrl,
        `/api/repositorio/praticas/${praticaTesteId}/comentarios`,
        'GET'
      );

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.sucesso, true);
      assert.strictEqual(res.body.paginacao.totalRegistros, 2);
      assert.ok(Array.isArray(res.body.comentarios));
      assert.strictEqual(res.body.comentarios.length, 2);

      const relato = res.body.comentarios.find((c) => c.relatoExperiencia === true);
      assert.ok(relato, 'Deve conter o relato de experiência');
      assert.ok(relato.turmaContexto);
      assert.ok(relato.autor.nome);
    });

    await it('Filtra apenas relatos de experiência em sala de aula (relatoExperiencia=true)', async () => {
      const res = await makeRequest(
        baseUrl,
        `/api/repositorio/praticas/${praticaTesteId}/comentarios?relatoExperiencia=true`,
        'GET'
      );

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.comentarios.every((c) => c.relatoExperiencia === true));
    });

    await it('Bloqueia exclusão de comentário por usuário que não é o autor (403 Forbidden)', async () => {
      const res = await makeRequest(
        baseUrl,
        `/api/repositorio/comentarios/${comentarioCriadoId}`,
        'DELETE',
        null,
        { Authorization: `Bearer ${tokenOutroUsuario}` }
      );

      assert.strictEqual(res.statusCode, 403);
    });

    await it('Permite ao autor excluir seu comentário via Soft Delete decrementando contador (200 OK)', async () => {
      const res = await makeRequest(
        baseUrl,
        `/api/repositorio/comentarios/${comentarioCriadoId}`,
        'DELETE',
        null,
        { Authorization: `Bearer ${tokenAutor}` }
      );

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.sucesso, true);

      // Comentário deletado não aparece mais na listagem
      const listRes = await makeRequest(baseUrl, `/api/repositorio/praticas/${praticaTesteId}/comentarios`, 'GET');
      assert.strictEqual(listRes.body.paginacao.totalRegistros, 1);
    });

    console.log('\n========================================================================');
    console.log(`🎉 SUCESSO: Todos os ${passedTests}/${totalTests} testes de Curtidas, Favoritos e Comentários passaram!`);
    console.log('Critério de Aceite: Contadores atômicos sem condições de corrida atendido.');
    console.log('========================================================================\n');
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    // Cleanup da prática criada e tabelas relacionadas
    if (praticaTesteId) {
      try {
        await query('DELETE FROM praticas_repositorio WHERE id = $1', [praticaTesteId]);
      } catch (e) {
        // Ignora erro no teardown
      }
    }
    await closePool();
  }
}

run().catch((err) => {
  console.error('\n💥 Falha na execução da suíte de testes de interações:', err);
  process.exit(1);
});

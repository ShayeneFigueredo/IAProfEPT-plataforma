import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import assert from 'assert';
import app from './app.js';
import { query, closePool } from './config/database.js';
import { tokenService } from './services/TokenService.js';

/**
 * Suíte de Testes Automatizados: Motor de Busca Avançada no Repositório
 * Plataforma IAprofEPT — Tese de Doutorado PPGEM / UFJF
 * 
 * Critérios de Aceite Verificados:
 * 1. GET /api/repositorio/buscar: filtros combinados (curso_tecnico, eixo_cnct, habilidade_bncc, tema_matematico, termo).
 * 2. Busca textual aproximada utilizando os índices Trigram (pg_trgm) e Full-Text Search (FTS).
 * 3. Filtro relacional JSONB por Habilidade BNCC (ex: 'EM13MAT305').
 * 4. Ordenação por:
 *    a) 'mais_curtidos' (total_curtidas DESC)
 *    b) 'melhor_avaliados' (media_estrelas DESC)
 *    c) 'mais_recentes' (created_at DESC)
 * 5. Resultados paginados com metadados completos (paginacao, autor, contadores, filtrosAplicados).
 * 6. CRITÉRIO DE ACEITE: tempo de resposta da busca < 100ms em todas as operações.
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

    const t0 = performance.now();
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
          const clientLatencyMs = Math.round(performance.now() - t0);
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
            clientLatencyMs,
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
  console.log('🔍 Teste do Motor de Busca Avançada do Repositório (pg_trgm + BNCC)');
  console.log('Pesquisa de Doutorado PPGEM / UFJF — Maycon Magalhães');
  console.log('Critério de Aceite: Tempo de execução < 100ms com metadados completos');
  console.log('========================================================================\n');

  let autor;
  let outroUsuario;
  let tokenAutor;
  let seededPraticasIds = [];

  try {
    // 1. Iniciar servidor HTTP
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
    console.log(`Servidor de testes ativo em: ${baseUrl}\n`);

    // 2. Resolução de usuários de teste no PostgreSQL
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

    // 3. Semeadura de Dados Específicos para Teste da Busca Avançada
    console.log('--- Preparação do Ambiente: Semeadura de Práticas Curriculares EPT ---');

    const seedData = [
      {
        titulo: 'Cálculo de Demanda de Potência em Instalações Rurais',
        descricao: 'Sequência didática aplicando análise trigonométrica e fasores de corrente em circuitos monofásicos.',
        conteudo_completo: 'Conteúdo detalhado de Eletrotécnica Rural com trigonometria.',
        curso_tecnico: 'Técnico em Eletrotécnica',
        eixo_cnct: 'Controle e Processos Industriais',
        tema_matematico: 'Trigonometria e Funções Periódicas',
        habilidades_bncc: JSON.stringify([{ codigo: 'EM13MAT305', descricao: 'Trigonometria' }]),
        total_curtidas: 45,
        total_favoritos: 10,
        total_avaliacoes: 12,
        media_estrelas: 4.80,
        publicado: true,
      },
      {
        titulo: 'Topografia e Nivelamento Geométrico de Terrenos Agrícolas',
        descricao: 'Aplicação prática da trigonometria e lei dos senos em medições de curvas de nível.',
        conteudo_completo: 'Conteúdo prático de topografia agrícola com agrimensura e triângulos.',
        curso_tecnico: 'Técnico em Agropecuária / Agricultura',
        eixo_cnct: 'Recursos Naturais',
        tema_matematico: 'Trigonometria e Funções Periódicas',
        habilidades_bncc: JSON.stringify([
          { codigo: 'EM13MAT305', descricao: 'Trigonometria' },
          { codigo: 'EM13MAT201', descricao: 'Grandezas e Medidas' },
        ]),
        total_curtidas: 20,
        total_favoritos: 5,
        total_avaliacoes: 8,
        media_estrelas: 4.20,
        publicado: true,
      },
      {
        titulo: 'Modelagem de Dispersão de Poluentes Atmosféricos',
        descricao: 'Estudo de funções exponenciais e logarítmicas na dispersão de particulados industriais.',
        conteudo_completo: 'Conteúdo interdisciplinar de modelagem de qualidade do ar com cálculo exponencial.',
        curso_tecnico: 'Técnico em Meio Ambiente',
        eixo_cnct: 'Ambiente e Saúde',
        tema_matematico: 'Funções Exponenciais e Logarítmicas',
        habilidades_bncc: JSON.stringify([{ codigo: 'EM13MAT403', descricao: 'Funções Exponenciais' }]),
        total_curtidas: 95,
        total_favoritos: 40,
        total_avaliacoes: 30,
        media_estrelas: 4.95,
        publicado: true,
      },
      {
        titulo: 'Otimização Logística e Teoria dos Grafos em Cadeias de Suprimentos',
        descricao: 'Análise combinatória e matrizes no planejamento de rotas de transporte de cargas.',
        conteudo_completo: 'Estudo de caso em logística aplicada com matrizes e redes.',
        curso_tecnico: 'Técnico em Logística',
        eixo_cnct: 'Gestão e Negócios',
        tema_matematico: 'Matrizes e Sistemas Lineares',
        habilidades_bncc: JSON.stringify([{ codigo: 'EM13MAT102', descricao: 'Matrizes e Álgebra' }]),
        total_curtidas: 60,
        total_favoritos: 15,
        total_avaliacoes: 18,
        media_estrelas: 4.60,
        publicado: true,
      },
    ];

    for (const item of seedData) {
      const ins = await query(
        `INSERT INTO praticas_repositorio (
          usuario_id, titulo, descricao, conteudo_completo,
          curso_tecnico, eixo_cnct, tema_matematico, habilidades_bncc,
          total_curtidas, total_favoritos, total_avaliacoes, media_estrelas,
          publicado, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW() - interval '1 hour', NOW()
        ) RETURNING id;`,
        [
          autor.id,
          item.titulo,
          item.descricao,
          item.conteudo_completo,
          item.curso_tecnico,
          item.eixo_cnct,
          item.tema_matematico,
          item.habilidades_bncc,
          item.total_curtidas,
          item.total_favoritos,
          item.total_avaliacoes,
          item.media_estrelas,
          item.publicado,
        ]
      );
      seededPraticasIds.push(ins.rows[0].id);
    }

    console.log(`✔ Semeadura concluída: ${seededPraticasIds.length} práticas de teste cadastradas.\n`);

    console.log('--- 1. Filtros Curriculares Combinados (Curso Técnico, Eixo e BNCC) ---');

    await it('Filtra práticas combinando curso_tecnico e habilidade_bncc com tempo < 100ms', async () => {
      const res = await makeRequest(
        baseUrl,
        `/api/repositorio/buscar?curso_tecnico=${encodeURIComponent('Técnico em Eletrotécnica')}&habilidade_bncc=EM13MAT305`,
        'GET'
      );

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.sucesso, true);
      assert.ok(res.body.tempoRespostaMs < 100, `Tempo no servidor (${res.body.tempoRespostaMs}ms) deve ser < 100ms`);
      assert.strictEqual(res.body.criterioAceiteMenorQue100ms, true);
      assert.ok(Array.isArray(res.body.resultados));
      assert.ok(res.body.resultados.length >= 1);

      const pratica = res.body.resultados[0];
      assert.strictEqual(pratica.cursoTecnico, 'Técnico em Eletrotécnica');
      assert.ok(
        pratica.habilidadesBncc.some((h) => h.codigo === 'EM13MAT305'),
        'Deve conter a habilidade BNCC informada'
      );
      assert.ok(pratica.autor.nome, 'Metadados do autor devem estar preenchidos');
    });

    await it('Filtra práticas por Eixo Tecnológico CNCT (Recursos Naturais)', async () => {
      const res = await makeRequest(
        baseUrl,
        `/api/repositorio/buscar?eixo_cnct=${encodeURIComponent('Recursos Naturais')}`,
        'GET'
      );

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.tempoRespostaMs < 100);
      assert.ok(res.body.resultados.length >= 1);
      assert.ok(res.body.resultados.every((p) => p.eixoCnct === 'Recursos Naturais'));
    });

    await it('Filtra práticas por código de Habilidade BNCC no campo JSONB', async () => {
      const res = await makeRequest(
        baseUrl,
        `/api/repositorio/buscar?habilidade_bncc=EM13MAT403`,
        'GET'
      );

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.tempoRespostaMs < 100);
      assert.ok(res.body.resultados.length >= 1);
      const pratica = res.body.resultados.find((p) => p.titulo.includes('Poluentes Atmosféricos'));
      assert.ok(pratica, 'Deve encontrar a prática com habilidade EM13MAT403');
    });

    await it('Filtra práticas por Tema Matemático (Trigonometria e Funções Periódicas)', async () => {
      const res = await makeRequest(
        baseUrl,
        `/api/repositorio/buscar?tema_matematico=${encodeURIComponent('Trigonometria e Funções Periódicas')}`,
        'GET'
      );

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.tempoRespostaMs < 100);
      assert.ok(res.body.resultados.length >= 2);
      assert.ok(res.body.resultados.every((p) => p.temaMatematico === 'Trigonometria e Funções Periódicas'));
    });

    console.log('\n--- 2. Busca Textual Otimizada com pg_trgm (Fuzzy Matching) ---');

    await it('Realiza busca textual tolerante a erros de digitação (Fuzzy Search via pg_trgm) em < 100ms', async () => {
      // "topografia nivelamento geometric" com erro intencional de grafia
      const res = await makeRequest(
        baseUrl,
        `/api/repositorio/buscar?termo=${encodeURIComponent('topografia nivelamento geometric')}`,
        'GET'
      );

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.tempoRespostaMs < 100, `Latência (${res.body.tempoRespostaMs}ms) deve ser < 100ms`);
      assert.ok(res.body.resultados.length >= 1);
      const topMatch = res.body.resultados[0];
      assert.ok(topMatch.titulo.includes('Topografia'));
      assert.ok(topMatch.scoreRelevancia > 0, 'Score de relevância deve ser positivo');
    });

    await it('Realiza busca textual por palavra-chave no corpo/descrição ("poluentes industriais")', async () => {
      const res = await makeRequest(
        baseUrl,
        `/api/repositorio/buscar?termo=${encodeURIComponent('poluentes industriais')}`,
        'GET'
      );

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.tempoRespostaMs < 100);
      assert.ok(res.body.resultados.some((p) => p.titulo.includes('Poluentes Atmosféricos')));
    });

    console.log('\n--- 3. Ordenações Suportadas (Mais Curtidos, Mais Recentes, Melhor Avaliados) ---');

    await it('Ordena por mais curtidos (total_curtidas DESC) em < 100ms', async () => {
      const res = await makeRequest(
        baseUrl,
        '/api/repositorio/buscar?ordenarPor=mais_curtidos',
        'GET'
      );

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.tempoRespostaMs < 100);
      const resultados = res.body.resultados;
      assert.ok(resultados.length >= 3);

      for (let i = 0; i < resultados.length - 1; i++) {
        assert.ok(
          resultados[i].totalCurtidas >= resultados[i + 1].totalCurtidas,
          `Prática ${i} (${resultados[i].totalCurtidas}) deve ter curtidas >= prática ${i + 1} (${resultados[i + 1].totalCurtidas})`
        );
      }
    });

    await it('Ordena por melhor avaliados (media_estrelas DESC) em < 100ms', async () => {
      const res = await makeRequest(
        baseUrl,
        '/api/repositorio/buscar?ordenarPor=melhor_avaliados',
        'GET'
      );

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.tempoRespostaMs < 100);
      const resultados = res.body.resultados;
      assert.ok(resultados.length >= 3);

      for (let i = 0; i < resultados.length - 1; i++) {
        assert.ok(
          resultados[i].mediaEstrelas >= resultados[i + 1].mediaEstrelas,
          `Prática ${i} (${resultados[i].mediaEstrelas}) deve ter estrelas >= prática ${i + 1} (${resultados[i + 1].mediaEstrelas})`
        );
      }
    });

    await it('Ordena por mais recentes (created_at DESC) em < 100ms', async () => {
      const res = await makeRequest(
        baseUrl,
        '/api/repositorio/buscar?ordenarPor=mais_recentes',
        'GET'
      );

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.tempoRespostaMs < 100);
      const resultados = res.body.resultados;
      assert.ok(resultados.length >= 2);

      const d1 = new Date(resultados[0].createdAt).getTime();
      const d2 = new Date(resultados[1].createdAt).getTime();
      assert.ok(d1 >= d2);
    });

    console.log('\n--- 4. Paginação e Metadados Completos ---');

    await it('Retorna estrutura paginada completa com totalRegistros, totalPaginas e indicadores', async () => {
      const res = await makeRequest(
        baseUrl,
        '/api/repositorio/buscar?page=1&limit=2',
        'GET'
      );

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.tempoRespostaMs < 100);
      assert.strictEqual(res.body.paginacao.paginaAtual, 1);
      assert.strictEqual(res.body.paginacao.itensPorPagina, 2);
      assert.ok(res.body.paginacao.totalRegistros >= 4);
      assert.ok(res.body.paginacao.totalPaginas >= 2);
      assert.strictEqual(res.body.paginacao.temProximaPagina, true);
      assert.strictEqual(res.body.paginacao.temPaginaAnterior, false);
      assert.strictEqual(res.body.resultados.length, 2);
    });

    await it('Verifica alias conveniente GET /api/repositorio/praticas/buscar', async () => {
      const res = await makeRequest(
        baseUrl,
        '/api/repositorio/praticas/buscar?termo=logistica',
        'GET'
      );

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.tempoRespostaMs < 100);
      assert.ok(res.body.resultados.some((p) => p.cursoTecnico === 'Técnico em Logística'));
    });

    console.log('\n========================================================================');
    console.log(`🎉 SUCESSO: Todos os ${passedTests}/${totalTests} testes do Motor de Busca Avançada passaram!`);
    console.log('Critério de Aceite: Resultados paginados com metadados em < 100ms plenamente atendido.');
    console.log('========================================================================\n');
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    // Cleanup das práticas semeadas
    if (seededPraticasIds.length > 0) {
      try {
        await query(
          `DELETE FROM praticas_repositorio WHERE id = ANY($1);`,
          [seededPraticasIds]
        );
      } catch (e) {
        // Ignora erro no teardown
      }
    }
    await closePool();
  }
}

run().catch((err) => {
  console.error('\n💥 Falha na execução da suíte de testes de busca avançada:', err);
  process.exit(1);
});

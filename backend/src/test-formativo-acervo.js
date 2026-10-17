import http from 'http';
import assert from 'assert';
import app from './app.js';
import { closePool } from './config/database.js';

/**
 * Suite de Testes de Integração
 * API de Gestão do Acervo de Documentos Oficiais e E-book de Prompts
 * Plataforma IAprofEPT — PPGEM / UFJF
 * Doutorando: Maycon Luiz Amaral Magalhães
 * 
 * Critérios de Aceite Verificados:
 * 1. GET /api/formativo/documentos entrega catálogo completo com links e metadados.
 * 2. Filtragem por tags canônicas: Legislacao EPT, Relatorios UNESCO, Plano Brasileiro de IA.
 * 3. Tolerância a variações/slugs de tags (ex.: 'unesco', 'pbia', 'legislacao').
 * 4. Filtragem por busca textual e ano de publicação.
 * 5. Metadados de publicação completos (órgão emissor, páginas, formato, URLs funcionais).
 * 6. GET /api/formativo/ebook-prompts entrega modelos estruturados para Educação Matemática.
 * 7. Modelos contêm parâmetros formais, exemplos, dicas docentes e eixos do CNCT.
 * 8. Filtragem de prompts por categoria, busca textual e eixo tecnológico.
 * 9. Cumprimento do Alerta Ético Obrigatório em todas as saídas.
 * 10. Desempenho e velocidade de resposta (< 50ms).
 */

async function makeRequest(baseUrl, path, method = 'GET') {
  const url = new URL(path, baseUrl);

  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method,
        headers: {
          'Accept': 'application/json',
        },
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
  console.log('\n=============================================================');
  console.log('🧪 Iniciando Testes do Acervo de Documentos Oficiais & E-book');
  console.log('Pesquisa de Doutorado PPGEM / UFJF — Maycon Magalhães');
  console.log('=============================================================\n');

  try {
    // 1. Iniciar servidor de teste em porta dinâmica
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        console.log(`Servidor de testes rodando em: ${baseUrl}\n`);
        resolve();
      });
    });

    // =========================================================================
    // SEÇÃO 1: ACERVO DE DOCUMENTOS OFICIAIS (GET /api/formativo/documentos)
    // =========================================================================
    console.log('--- 1. Acervo de Documentos Oficiais ---');

    await it('GET /api/formativo/documentos retorna lista geral com status 200 e metadados', async () => {
      const start = Date.now();
      const res = await makeRequest(baseUrl, '/api/formativo/documentos');
      const duration = Date.now() - start;

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.sucesso, true);
      assert.ok(Array.isArray(res.body.documentos));
      assert.ok(res.body.total >= 5, `Esperava pelo menos 5 documentos, obteve ${res.body.total}`);
      assert.ok(Array.isArray(res.body.tagsDisponiveis));
      assert.ok(res.body.contagemPorTag && typeof res.body.contagemPorTag === 'object');
      assert.ok(res.body.avisoEtico && res.body.avisoEtico.includes('Inteligência Artificial'));
      assert.ok(duration < 50, `Tempo de resposta deve ser < 50ms (foi ${duration}ms)`);
    });

    await it('Cada documento contém metadados completos de publicação e link funcional', async () => {
      const res = await makeRequest(baseUrl, '/api/formativo/documentos');
      assert.strictEqual(res.statusCode, 200);

      for (const doc of res.body.documentos) {
        assert.ok(doc.id, 'Documento deve conter id');
        assert.ok(doc.titulo, 'Documento deve conter título');
        assert.ok(doc.descricao, 'Documento deve conter descrição');
        assert.ok(doc.orgaoEmissor, 'Documento deve conter órgão emissor');
        assert.ok(typeof doc.anoPublicacao === 'number', 'Documento deve conter ano numérico');
        assert.ok(doc.formato, 'Documento deve conter formato');
        assert.ok(doc.tamanhoEstimado, 'Documento deve conter tamanho estimado');
        assert.ok(doc.url, 'Documento deve conter url');
        assert.ok(
          doc.url.startsWith('http://') || doc.url.startsWith('https://'),
          `URL deve ser link funcional e absoluto: ${doc.url}`
        );
        assert.ok(Array.isArray(doc.tags), 'Documento deve conter array de tags');
      }
    });

    await it('Filtragem por tag "Legislacao EPT" retorna apenas documentos legais/curriculares', async () => {
      const res = await makeRequest(baseUrl, '/api/formativo/documentos?tag=Legislacao%20EPT');
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.total > 0);

      for (const doc of res.body.documentos) {
        const temTag = doc.tagPrincipal === 'Legislacao EPT' || doc.tags.includes('Legislacao EPT');
        assert.ok(temTag, `Documento ${doc.titulo} deve conter tag Legislacao EPT`);
      }
    });

    await it('Filtragem por tag "Relatorios UNESCO" retorna documentos da UNESCO', async () => {
      const res = await makeRequest(baseUrl, '/api/formativo/documentos?tag=Relatorios%20UNESCO');
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.total >= 2);

      for (const doc of res.body.documentos) {
        const temTag = doc.tagPrincipal === 'Relatorios UNESCO' || doc.tags.includes('Relatorios UNESCO');
        assert.ok(temTag, `Documento ${doc.titulo} deve pertencer à UNESCO`);
      }
    });

    await it('Filtragem por tag "Plano Brasileiro de IA" retorna PBIA', async () => {
      const res = await makeRequest(baseUrl, '/api/formativo/documentos?tag=Plano%20Brasileiro%20de%20IA');
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.total >= 1);

      const pbia = res.body.documentos.find((d) => d.id === 'doc-pbia-2024');
      assert.ok(pbia, 'Deve encontrar o PBIA 2024');
      assert.strictEqual(pbia.anoPublicacao, 2024);
      assert.ok(pbia.orgaoEmissor.includes('MCTI'));
    });

    await it('Tolerância de tags: "unesco" minúsculo é mapeado para "Relatorios UNESCO"', async () => {
      const res = await makeRequest(baseUrl, '/api/formativo/documentos?tag=unesco');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.filtroAplicado.tagResolvida, 'Relatorios UNESCO');
      assert.ok(res.body.total >= 2);
    });

    await it('Tolerância de tags: "pbia" é mapeado para "Plano Brasileiro de IA"', async () => {
      const res = await makeRequest(baseUrl, '/api/formativo/documentos?tag=pbia');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.filtroAplicado.tagResolvida, 'Plano Brasileiro de IA');
      assert.ok(res.body.total >= 1);
    });

    await it('Tolerância de tags: "legislacao" é mapeado para "Legislacao EPT"', async () => {
      const res = await makeRequest(baseUrl, '/api/formativo/documentos?tag=legislacao');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.filtroAplicado.tagResolvida, 'Legislacao EPT');
      assert.ok(res.body.total >= 3);
    });

    await it('Filtragem textual por termo específico ("Skovsmose")', async () => {
      const res = await makeRequest(baseUrl, '/api/formativo/documentos?busca=Skovsmose');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.total, 1);
      assert.strictEqual(res.body.documentos[0].id, 'doc-skovsmose-2022');
      assert.ok(res.body.documentos[0].descricao.includes('matemacia'));
    });

    await it('Filtragem por ano de publicação ("2024")', async () => {
      const res = await makeRequest(baseUrl, '/api/formativo/documentos?ano=2024');
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.total >= 2);

      for (const doc of res.body.documentos) {
        assert.strictEqual(doc.anoPublicacao, 2024);
      }
    });

    await it('Filtragem combinada: busca + ano ("MEC" e "2024")', async () => {
      const res = await makeRequest(baseUrl, '/api/formativo/documentos?busca=MEC&ano=2024');
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.total >= 1);

      for (const doc of res.body.documentos) {
        assert.strictEqual(doc.anoPublicacao, 2024);
      }
    });

    await it('Busca sem correspondência retorna lista vazia e total 0 com status 200', async () => {
      const res = await makeRequest(baseUrl, '/api/formativo/documentos?busca=termo_completamente_inexistente_xyz');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.sucesso, true);
      assert.strictEqual(res.body.total, 0);
      assert.deepStrictEqual(res.body.documentos, []);
    });

    // =========================================================================
    // SEÇÃO 2: MODELOS DE PROMPTS DO E-BOOK (GET /api/formativo/ebook-prompts)
    // =========================================================================
    console.log('\n--- 2. Modelos Estruturados do E-book de Prompts ---');

    await it('GET /api/formativo/ebook-prompts retorna lista com status 200 e metadados pedagógicos', async () => {
      const start = Date.now();
      const res = await makeRequest(baseUrl, '/api/formativo/ebook-prompts');
      const duration = Date.now() - start;

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.sucesso, true);
      assert.ok(Array.isArray(res.body.prompts));
      assert.ok(res.body.total >= 8, `Esperava pelo menos 8 modelos de prompts, obteve ${res.body.total}`);
      assert.ok(Array.isArray(res.body.categoriasDisponiveis));
      assert.ok(res.body.contagemPorCategoria && typeof res.body.contagemPorCategoria === 'object');
      assert.ok(res.body.avisoEtico && res.body.avisoEtico.includes('Inteligência Artificial'));
      assert.ok(duration < 50, `Tempo de resposta deve ser < 50ms (foi ${duration}ms)`);
    });

    await it('Cada modelo de prompt contém campos estruturados, parâmetros e dicas docentes', async () => {
      const res = await makeRequest(baseUrl, '/api/formativo/ebook-prompts');
      assert.strictEqual(res.statusCode, 200);

      for (const prompt of res.body.prompts) {
        assert.ok(prompt.id, 'Prompt deve conter id');
        assert.ok(prompt.codigo, 'Prompt deve conter código mnemônico');
        assert.ok(prompt.titulo, 'Prompt deve conter título');
        assert.ok(prompt.categoria, 'Prompt deve conter categoria');
        assert.ok(prompt.descricao, 'Prompt deve conter descrição');
        assert.ok(prompt.template, 'Prompt deve conter template');
        assert.ok(prompt.exemploUso, 'Prompt deve conter exemplo de uso');
        assert.ok(prompt.dicaDocente, 'Prompt deve conter dica docente');
        assert.ok(Array.isArray(prompt.parametros), 'Prompt deve conter lista de parâmetros');
        assert.ok(Array.isArray(prompt.eixosRecomendados), 'Prompt deve conter eixos recomendados');

        // Valida estrutura interna dos parâmetros
        for (const param of prompt.parametros) {
          assert.ok(param.nome, 'Parâmetro deve conter nome');
          assert.ok(param.descricao, 'Parâmetro deve conter descrição');
          assert.strictEqual(typeof param.obrigatorio, 'boolean', 'Obrigatoriedade deve ser booleana');
        }
      }
    });

    await it('Filtragem por categoria "Diagnóstico" retorna modelo de sondagem', async () => {
      const res = await makeRequest(baseUrl, '/api/formativo/ebook-prompts?categoria=Diagnóstico');
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.total >= 1);

      for (const p of res.body.prompts) {
        assert.strictEqual(p.categoria, 'Diagnóstico');
      }
    });

    await it('Filtragem por categoria "Contextualização" retorna modelo BNCC x CNCT', async () => {
      const res = await makeRequest(baseUrl, '/api/formativo/ebook-prompts?categoria=Contextualização');
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.total >= 1);

      const bnccPrompt = res.body.prompts.find((p) => p.codigo === 'CTX-BNCC-CNCT');
      assert.ok(bnccPrompt, 'Deve encontrar modelo CTX-BNCC-CNCT');
      assert.ok(bnccPrompt.template.includes('[HABILIDADE_BNCC]'));
    });

    await it('Filtragem por busca textual "Erro Produtivo" encontra modelo de obstáculos cognitivos', async () => {
      const res = await makeRequest(baseUrl, '/api/formativo/ebook-prompts?busca=Erro%20Produtivo');
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.total >= 1);

      const modelo = res.body.prompts[0];
      assert.strictEqual(modelo.codigo, 'MET-ERRO-PRODUTIVO');
      assert.ok(modelo.template.includes('resoluções incorretas hipotéticas'));
    });

    await it('Filtragem por busca textual "Podcast" encontra modelo de roteiro dialógico', async () => {
      const res = await makeRequest(baseUrl, '/api/formativo/ebook-prompts?busca=Podcast');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.total, 1);
      assert.strictEqual(res.body.prompts[0].codigo, 'POD-ROTEIRO-DIALOGADO');
    });

    await it('Filtragem por eixo tecnológico "Informação e Comunicação"', async () => {
      const res = await makeRequest(baseUrl, '/api/formativo/ebook-prompts?eixo=Informação%20e%20Comunicação');
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.total >= 2);

      for (const p of res.body.prompts) {
        assert.ok(
          p.eixosRecomendados.includes('Informação e Comunicação'),
          `Modelo ${p.titulo} deve conter eixo Informação e Comunicação`
        );
      }
    });

    await it('Metadados de conformidade ética da autoridade docente em ambos os endpoints', async () => {
      const resDocs = await makeRequest(baseUrl, '/api/formativo/documentos');
      const resEbook = await makeRequest(baseUrl, '/api/formativo/ebook-prompts');

      const textoEsperado =
        'Este material foi gerado por Inteligência Artificial e deve ser revisado, validado e adaptado pela autoridade docente antes de sua aplicação em sala de aula.';

      assert.strictEqual(resDocs.body.avisoEtico, textoEsperado);
      assert.strictEqual(resEbook.body.avisoEtico, textoEsperado);
    });

    console.log('\n=============================================================');
    console.log(`🎉 TODOS OS ${passedTests} TESTES PASSARAM COM SUCESSO!`);
    console.log('API de Acervo de Documentos Oficiais e E-book Homologada.');
    console.log('=============================================================\n');

  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await closePool();
  }
}

run().catch((err) => {
  console.error('\n❌ Falha na execução da suíte de testes:');
  console.error(err);
  process.exit(1);
});

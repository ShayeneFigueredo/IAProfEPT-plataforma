import http from 'http';
import app from './app.js';
import assert from 'assert';

async function runTests() {
  console.log('Iniciando testes de Exportação (PDF/DOCX)...');

  const server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      resolve();
    });
  });

  const port = server.address().port;

  const makeRequest = (payload) => {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(payload);
      const req = http.request(
        `http://localhost:${port}/api/export`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
          },
        },
        (res) => {
          let chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            const body = Buffer.concat(chunks);
            resolve({ statusCode: res.statusCode, headers: res.headers, body });
          });
        }
      );
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  };

  try {
    const payload = {
      titulo: 'Atividade Teste',
      conteudo: '<p>Este é o conteúdo com equação: \\( E = mc^2 \\)</p>',
      cursoTecnico: 'Técnico em Informática',
      format: 'pdf',
    };

    console.log('Testando exportação PDF...');
    let res = await makeRequest(payload);

    assert.strictEqual(res.statusCode, 200, 'Status code deveria ser 200 para PDF');
    assert.strictEqual(res.headers['content-type'], 'application/pdf', 'Header Content-Type deveria ser application/pdf');
    assert.ok(res.body.length > 0, 'O buffer do PDF não pode ser vazio');
    console.log('✔ Exportação PDF passou!');

    console.log('Testando exportação DOCX...');
    payload.format = 'docx';
    res = await makeRequest(payload);

    assert.strictEqual(res.statusCode, 200, 'Status code deveria ser 200 para DOCX');
    assert.ok(
      res.headers['content-type'].includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
      'Header Content-Type deveria ser DOCX'
    );
    assert.ok(res.body.length > 0, 'O buffer do DOCX não pode ser vazio');
    console.log('✔ Exportação DOCX passou!');

    console.log('Todos os testes de exportação passaram!');
  } catch (error) {
    console.error('Falha nos testes de exportação:', error);
    process.exitCode = 1;
  } finally {
    server.close();
    process.exit();
  }
}

runTests();

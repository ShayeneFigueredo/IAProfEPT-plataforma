import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import assert from 'assert';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import app from './app.js';
import { query, closePool } from './config/database.js';
import { tokenService } from './services/TokenService.js';
import { fileSecurityScanner, MAX_FILE_SIZE_BYTES } from './services/FileSecurityScanner.js';

/**
 * Suíte de Testes Automatizados: Upload e Armazenamento Seguro de Anexos
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Critérios de Aceite Verificados:
 * 1. Upload multipart/form-data com autenticação obrigatória (401 sem token).
 * 2. Validação estrita de MIME types (PDF, DOCX, DOC, JPEG, PNG, WEBP).
 * 3. Rejeição de formatos não autorizados (.exe, .sh, .php, .js) com 422 Unprocessable Entity.
 * 4. Validação profunda de assinaturas binárias (Magic Bytes) contra extensões mascaradas.
 * 5. Escaneamento heurístico de segurança contra injeção de scripts (XSS/Polyglot).
 * 6. Limite máximo institucional de 15MB com retorno HTTP 413 Payload Too Large.
 * 7. Armazenamento persistente em disco institucional com integridade SHA-256 no PostgreSQL.
 * 8. Download protegido com cabeçalhos de segurança, suporte a ETag SHA-256 e HTTP 304.
 * 9. Exclusão lógica com Soft Delete (deleted_at) e controle de permissões (403 Forbidden).
 */

function createMultipartBody(boundary, fields = {}, file = null) {
  const crlf = '\r\n';
  const chunks = [];

  for (const [key, value] of Object.entries(fields)) {
    chunks.push(
      Buffer.from(
        `--${boundary}${crlf}Content-Disposition: form-data; name="${key}"${crlf}${crlf}${value}${crlf}`
      )
    );
  }

  if (file) {
    const fieldname = file.fieldname || 'arquivo';
    const filename = file.filename || 'anexo.pdf';
    const contentType = file.contentType || 'application/pdf';
    const content = Buffer.isBuffer(file.content) ? file.content : Buffer.from(file.content);

    chunks.push(
      Buffer.from(
        `--${boundary}${crlf}Content-Disposition: form-data; name="${fieldname}"; filename="${filename}"${crlf}Content-Type: ${contentType}${crlf}${crlf}`
      )
    );
    chunks.push(content);
    chunks.push(Buffer.from(crlf));
  }

  chunks.push(Buffer.from(`--${boundary}--${crlf}`));
  return Buffer.concat(chunks);
}

async function makeRequest(baseUrl, path, method = 'GET', body = null, headers = {}) {
  const url = new URL(path, baseUrl);

  return new Promise((resolve, reject) => {
    const reqHeaders = { ...headers };
    let payload = body;

    if (body && !Buffer.isBuffer(body) && typeof body === 'object') {
      payload = JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    } else if (Buffer.isBuffer(body)) {
      reqHeaders['Content-Length'] = body.length;
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const rawBuffer = Buffer.concat(chunks);
          const rawData = rawBuffer.toString('utf-8');
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
            buffer: rawBuffer,
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
  console.log('📎 Teste do Serviço de Upload e Armazenamento Seguro de Anexos');
  console.log('Pesquisa de Doutorado PPGEM / UFJF — Maycon Magalhães');
  console.log('========================================================================\n');

  let autor;
  let outroUsuario;
  let tokenAutor;
  let tokenOutroUsuario;
  let anexoPdfCriadoId;
  let anexoSha256Original;
  let storedFilesToCleanup = [];

  try {
    // 1. Iniciar servidor HTTP
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
    console.log(`Servidor de testes ativo em: ${baseUrl}\n`);

    // 2. Resolução de dois usuários de teste ativos no PostgreSQL
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

    console.log('--- 1. Autenticação e Validação Básica no Endpoint de Upload ---');

    await it('Rejeita upload sem token de autenticação com HTTP 401 Unauthorized', async () => {
      const boundary = '----TestBoundary' + Date.now();
      const body = createMultipartBody(
        boundary,
        {},
        {
          filename: 'teste.pdf',
          contentType: 'application/pdf',
          content: Buffer.from('%PDF-1.4 Exemplo de teste'),
        }
      );

      const res = await makeRequest(baseUrl, '/api/repositorio/anexos', 'POST', body, {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      });

      assert.strictEqual(res.statusCode, 401);
      assert.ok(res.body.detail || res.body.message);
    });

    await it('Rejeita requisição sem arquivo anexo com HTTP 400 Bad Request', async () => {
      const boundary = '----TestBoundary' + Date.now();
      const body = createMultipartBody(boundary, { praticaId: '123' }, null);

      const res = await makeRequest(baseUrl, '/api/repositorio/anexos', 'POST', body, {
        Authorization: `Bearer ${tokenAutor}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      });

      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.body.detail.includes('Nenhum arquivo enviado'));
    });

    console.log('\n--- 2. Upload Concluído de Formatos Homologados (PDF, DOCX, PNG, JPEG) ---');

    await it('Realiza upload de documento PDF autêntico com cálculo de SHA-256 e URL protegida (201 Created)', async () => {
      const pdfBuffer = Buffer.concat([
        Buffer.from('%PDF-1.7\n%âãÏÓ\n'),
        Buffer.from('1 0 obj\n<< /Title (Geometria Aplicada à Agropecuária) >>\nendobj\nxref\n0 1\ntrailer\n<<>>\nstartxref\n%%EOF'),
      ]);
      const expectedSha256 = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

      const boundary = '----TestBoundary' + Date.now();
      const body = createMultipartBody(
        boundary,
        {},
        {
          filename: 'geometria_espacial_agropecuaria.pdf',
          contentType: 'application/pdf',
          content: pdfBuffer,
        }
      );

      const res = await makeRequest(baseUrl, '/api/repositorio/anexos', 'POST', body, {
        Authorization: `Bearer ${tokenAutor}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      });

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.sucesso, true);
      assert.ok(res.body.anexo.id);
      assert.strictEqual(res.body.anexo.mimeType, 'application/pdf');
      assert.strictEqual(res.body.anexo.extensao, '.pdf');
      assert.strictEqual(res.body.anexo.hashSha256, expectedSha256);
      assert.ok(res.body.anexo.urlProtegida.includes(res.body.anexo.id));
      assert.strictEqual(res.body.anexo.autor.id, autor.id);

      anexoPdfCriadoId = res.body.anexo.id;
      anexoSha256Original = expectedSha256;
    });

    await it('Realiza upload de documento DOCX autêntico (PK zip header) com sucesso (201 Created)', async () => {
      // DOCX inicia com ZIP header PK\x03\x04
      const docxBuffer = Buffer.concat([
        Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]),
        Buffer.from('word/document.xml conteúdo pedagógico em DOCX para EPT'),
      ]);
      const expectedSha256 = crypto.createHash('sha256').update(docxBuffer).digest('hex');

      const boundary = '----TestBoundary' + Date.now();
      const body = createMultipartBody(
        boundary,
        {},
        {
          filename: 'plano_aula_eletrotecnica.docx',
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          content: docxBuffer,
        }
      );

      const res = await makeRequest(baseUrl, '/api/repositorio/anexos', 'POST', body, {
        Authorization: `Bearer ${tokenAutor}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      });

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.anexo.mimeType, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      assert.strictEqual(res.body.anexo.hashSha256, expectedSha256);
    });

    await it('Realiza upload de imagem PNG com magic bytes válidos (\\x89PNG) (201 Created)', async () => {
      const pngBuffer = Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        Buffer.from('IHDR data de simulação de circuito'),
      ]);

      const boundary = '----TestBoundary' + Date.now();
      const body = createMultipartBody(
        boundary,
        {},
        {
          filename: 'esquema_eletrico.png',
          contentType: 'image/png',
          content: pngBuffer,
        }
      );

      const res = await makeRequest(baseUrl, '/api/repositorio/anexos', 'POST', body, {
        Authorization: `Bearer ${tokenAutor}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      });

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.anexo.mimeType, 'image/png');
    });

    await it('Realiza upload de imagem JPEG com magic bytes válidos (\\xFF\\xD8\\xFF) (201 Created)', async () => {
      const jpegBuffer = Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]),
        Buffer.from('dados fotográficos da aula prática'),
      ]);

      const boundary = '----TestBoundary' + Date.now();
      const body = createMultipartBody(
        boundary,
        {},
        {
          filename: 'foto_aula_campo.jpg',
          contentType: 'image/jpeg',
          content: jpegBuffer,
        }
      );

      const res = await makeRequest(baseUrl, '/api/repositorio/anexos', 'POST', body, {
        Authorization: `Bearer ${tokenAutor}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      });

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.anexo.mimeType, 'image/jpeg');
    });

    console.log('\n--- 3. Escaneamento de Segurança e Bloqueio de Ameaças ---');

    await it('Rejeita extensão executável maliciosa (.exe / .sh / .js) com 422 Unprocessable Entity', async () => {
      const boundary = '----TestBoundary' + Date.now();
      const body = createMultipartBody(
        boundary,
        {},
        {
          filename: 'malware_script.exe',
          contentType: 'application/octet-stream',
          content: Buffer.from('MZ executavel malicioso'),
        }
      );

      const res = await makeRequest(baseUrl, '/api/repositorio/anexos', 'POST', body, {
        Authorization: `Bearer ${tokenAutor}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      });

      assert.strictEqual(res.statusCode, 422);
      assert.ok(res.body.detail.includes('não permitido'));
    });

    await it('Detecta e rejeita extensão falsificada/mascarada (executável renomeado para .pdf) via Magic Bytes', async () => {
      // Arquivo com extensão .pdf e MIME application/pdf, mas corpo executável PE (MZ)
      const fakePdfBuffer = Buffer.from('MZ executável disfarçado de documento acadêmico');

      const boundary = '----TestBoundary' + Date.now();
      const body = createMultipartBody(
        boundary,
        {},
        {
          filename: 'trojan_disfarcado.pdf',
          contentType: 'application/pdf',
          content: fakePdfBuffer,
        }
      );

      const res = await makeRequest(baseUrl, '/api/repositorio/anexos', 'POST', body, {
        Authorization: `Bearer ${tokenAutor}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      });

      assert.strictEqual(res.statusCode, 422);
      assert.ok(
        res.body.detail.includes('assinatura de bytes') ||
        res.body.detail.includes('executável binário')
      );
    });

    await it('Detecta e rejeita injeção de script embutido em arquivo de imagem (Polyglot / XSS) com 422', async () => {
      const xssImageBuffer = Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        Buffer.from('PNG_DATA<script>alert("XSS")</script>END_DATA'),
      ]);

      const boundary = '----TestBoundary' + Date.now();
      const body = createMultipartBody(
        boundary,
        {},
        {
          filename: 'imagem_com_script.png',
          contentType: 'image/png',
          content: xssImageBuffer,
        }
      );

      const res = await makeRequest(baseUrl, '/api/repositorio/anexos', 'POST', body, {
        Authorization: `Bearer ${tokenAutor}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      });

      assert.strictEqual(res.statusCode, 422);
      assert.ok(res.body.detail.includes('código executável/script detectado'));
    });

    await it('Sanitiza nomes maliciosos com path traversal (../) e caracteres perigosos', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 Documento seguro com nome hostil');
      const boundary = '----TestBoundary' + Date.now();
      const body = createMultipartBody(
        boundary,
        {},
        {
          filename: '../../../etc/passwd_malicioso.pdf',
          contentType: 'application/pdf',
          content: pdfBuffer,
        }
      );

      const res = await makeRequest(baseUrl, '/api/repositorio/anexos', 'POST', body, {
        Authorization: `Bearer ${tokenAutor}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      });

      assert.strictEqual(res.statusCode, 201);
      assert.ok(!res.body.anexo.nomeOriginal.includes('..'));
      assert.ok(!res.body.anexo.nomeOriginal.includes('/'));
    });

    console.log('\n--- 4. Limite de Tamanho Máximo (15MB) ---');

    await it('Validador rejeita arquivo maior que 15MB com HTTP 413 Payload Too Large', async () => {
      const fakeLargeBuffer = Buffer.alloc(100); // Buffer pequeno simulado
      const fakeSize = 16 * 1024 * 1024; // 16MB

      // Testa a camada de segurança do validador diretamente
      assert.throws(
        () => {
          fileSecurityScanner.scanAndValidate({
            buffer: fakeLargeBuffer,
            size: fakeSize,
            originalname: 'arquivo_gigante.pdf',
            mimetype: 'application/pdf',
          });
        },
        (err) => {
          return err.statusCode === 413 && err.detail.includes('15MB');
        }
      );
    });

    console.log('\n--- 5. Consulta e Download Protegido (GET /api/repositorio/anexos/:id) ---');

    await it('Consulta metadados cadastrais do anexo por ID com hash SHA-256 e autor (200 OK)', async () => {
      const res = await makeRequest(baseUrl, `/api/repositorio/anexos/${anexoPdfCriadoId}`, 'GET', null, {
        Authorization: `Bearer ${tokenAutor}`,
      });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.sucesso, true);
      assert.strictEqual(res.body.anexo.id, anexoPdfCriadoId);
      assert.strictEqual(res.body.anexo.hashSha256, anexoSha256Original);
      assert.strictEqual(res.body.anexo.mimeType, 'application/pdf');
    });

    await it('Realiza download protegido recebendo stream binário com ETag SHA-256 e nosniff (200 OK)', async () => {
      const res = await makeRequest(
        baseUrl,
        `/api/repositorio/anexos/${anexoPdfCriadoId}/download`,
        'GET',
        null,
        {
          Authorization: `Bearer ${tokenAutor}`,
        }
      );

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.headers['content-type'], 'application/pdf');
      assert.strictEqual(res.headers['etag'], `"${anexoSha256Original}"`);
      assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
      assert.strictEqual(res.headers['x-file-integrity-sha256'], anexoSha256Original);

      // Validação de integridade do stream recebido
      const hashRecebido = crypto.createHash('sha256').update(res.buffer).digest('hex');
      assert.strictEqual(hashRecebido, anexoSha256Original);
    });

    await it('Retorna HTTP 304 Not Modified quando cliente envia If-None-Match com o ETag correspondente', async () => {
      const res = await makeRequest(
        baseUrl,
        `/api/repositorio/anexos/${anexoPdfCriadoId}/download`,
        'GET',
        null,
        {
          Authorization: `Bearer ${tokenAutor}`,
          'if-none-match': `"${anexoSha256Original}"`,
        }
      );

      assert.strictEqual(res.statusCode, 304);
    });

    console.log('\n--- 6. Exclusão Lógica e Controle de Acesso (DELETE /api/repositorio/anexos/:id) ---');

    await it('Bloqueia exclusão de anexo por usuário que não é o autor (403 Forbidden)', async () => {
      const res = await makeRequest(
        baseUrl,
        `/api/repositorio/anexos/${anexoPdfCriadoId}`,
        'DELETE',
        null,
        {
          Authorization: `Bearer ${tokenOutroUsuario}`,
        }
      );

      assert.strictEqual(res.statusCode, 403);
    });

    await it('Permite ao autor original realizar o Soft Delete do anexo (200 OK)', async () => {
      const res = await makeRequest(
        baseUrl,
        `/api/repositorio/anexos/${anexoPdfCriadoId}`,
        'DELETE',
        null,
        {
          Authorization: `Bearer ${tokenAutor}`,
        }
      );

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.sucesso, true);
      assert.ok(res.body.deletedAt);
    });

    await it('Anexo excluído retorna HTTP 404 Not Found em consultas subsequentes', async () => {
      const res = await makeRequest(baseUrl, `/api/repositorio/anexos/${anexoPdfCriadoId}`, 'GET', null, {
        Authorization: `Bearer ${tokenAutor}`,
      });

      assert.strictEqual(res.statusCode, 404);
    });

    console.log('\n========================================================================');
    console.log(`🎉 SUCESSO: Todos os ${passedTests}/${totalTests} testes de Upload e Armazenamento Seguro passaram!`);
    console.log('Critério de Aceite: Upload concluído com geração de URL protegida e hash SHA-256 de integridade.');
    console.log('========================================================================\n');
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    // Cleanup de registros criados nos testes
    try {
      await query(
        `DELETE FROM anexos_repositorio WHERE nome_original LIKE '%agropecuaria%' OR nome_original LIKE '%eletrotecnica%' OR nome_original LIKE '%esquema%' OR nome_original LIKE '%foto%' OR nome_original LIKE '%passwd%';`
      );
    } catch (e) {
      // Ignore cleanup error
    }
    await closePool();
  }
}

run().catch((err) => {
  console.error('\n💥 Falha na execução da suíte de testes de upload:', err);
  process.exit(1);
});

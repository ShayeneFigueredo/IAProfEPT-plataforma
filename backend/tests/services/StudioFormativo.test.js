import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { CertificatePdfService } from '../../src/services/CertificatePdfService.js';

describe('Suite de Testes: Studio de Gestão & Autoria do Ambiente Formativo', () => {
  let docCriadoId = null;
  let videoCriadoId = null;

  it('1. GET /api/formativo/documentos deve listar os documentos cadastrados', async () => {
    const res = await request(app).get('/api/formativo/documentos');
    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(Array.isArray(res.body.documentos)).toBe(true);
    expect(res.body.documentos.length).toBeGreaterThan(0);
  });

  it('2. POST /api/formativo/documentos deve criar novo documento com sucesso', async () => {
    const res = await request(app)
      .post('/api/formativo/documentos')
      .field('titulo', 'Documento de Teste Automatizado Vitest')
      .field('orgaoEmissor', 'PPGEM / UFJF')
      .field('tagPrincipal', 'Legislação EPT')
      .field('anoPublicacao', 2026)
      .field('descricao', 'Descrição do documento de teste')
      .attach('arquivo', Buffer.from('%PDF-1.4 Mock PDF Content'), 'teste_studio.pdf');

    expect(res.status).toBe(201);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.documento).toBeDefined();
    expect(res.body.documento.titulo).toBe('Documento de Teste Automatizado Vitest');
    expect(res.body.documento.url).toContain('/uploads/documentos/');
    docCriadoId = res.body.documento.id;
  });

  it('3. PUT /api/formativo/documentos/:id deve atualizar metadados do documento', async () => {
    expect(docCriadoId).toBeDefined();

    const res = await request(app)
      .put(`/api/formativo/documentos/${docCriadoId}`)
      .send({
        titulo: 'Documento Vitest Atualizado',
        orgaoEmissor: 'MEC / SETEC',
      });

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.documento.titulo).toBe('Documento Vitest Atualizado');
    expect(res.body.documento.orgaoEmissor).toBe('MEC / SETEC');
  });

  it('4. DELETE /api/formativo/documentos/:id deve excluir documento com sucesso', async () => {
    expect(docCriadoId).toBeDefined();

    const res = await request(app).delete(`/api/formativo/documentos/${docCriadoId}`);
    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);

    // Confirma exclusão
    const resCheck = await request(app).get('/api/formativo/documentos');
    const encontrado = resCheck.body.documentos.find((d) => d.id === docCriadoId);
    expect(encontrado).toBeUndefined();
  });

  it('5. GET /api/formativo/videos deve listar vídeos cadastrados', async () => {
    const res = await request(app).get('/api/formativo/videos');
    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(Array.isArray(res.body.videos)).toBe(true);
    expect(res.body.videos.length).toBeGreaterThan(0);
  });

  it('6. POST /api/formativo/videos deve cadastrar novo vídeo extraindo ID do YouTube', async () => {
    const res = await request(app)
      .post('/api/formativo/videos')
      .send({
        titulo: 'Palestra sobre IA e Modelagem Matemática na EPT',
        youtubeId: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        autor: 'Prof. Maycon Magalhães',
        categoria: 'Metodologia e Práticas',
        descricao: 'Vídeo explicativo sobre modelagem matemática mediada por LLMs.',
        objetivoPedagogico: 'Promover a transposição didática com ferramentas generativas.',
      });

    expect(res.status).toBe(201);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.video.youtubeId).toBe('dQw4w9WgXcQ'); // ID extraído da URL completa
    videoCriadoId = res.body.video.id;
  });

  it('7. PUT /api/formativo/videos/:id deve atualizar vídeo cadastrado', async () => {
    expect(videoCriadoId).toBeDefined();

    const res = await request(app)
      .put(`/api/formativo/videos/${videoCriadoId}`)
      .send({
        titulo: 'Palestra sobre IA e Modelagem Matemática na EPT (Revisada)',
        duracao: '25 min',
      });

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.video.titulo).toBe('Palestra sobre IA e Modelagem Matemática na EPT (Revisada)');
  });

  it('8. DELETE /api/formativo/videos/:id deve excluir o vídeo cadastrado', async () => {
    expect(videoCriadoId).toBeDefined();

    const res = await request(app).delete(`/api/formativo/videos/${videoCriadoId}`);
    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
  });

  it('9. CertificatePdfService deve diagramar HTML A4 Paisagem com bandeira ética e dados acadêmicos', () => {
    const html = CertificatePdfService.buildCertificateHtml({
      alunoNome: 'Professora Ana Paula Santos',
      cursoNome: 'Letramento em Inteligência Artificial na Educação Matemática',
      cargaHoraria: '40 horas',
    });

    expect(html).toContain('Professora Ana Paula Santos');
    expect(html).toContain('Letramento em Inteligência Artificial na Educação Matemática');
    expect(html).toContain('UNIVERSIDADE FEDERAL DE JUIZ DE FORA');
    expect(html).toContain('PPGEM');
    expect(html).toContain('AVISO ÉTICO:');
    expect(html).toContain('A4 landscape');
  });
});

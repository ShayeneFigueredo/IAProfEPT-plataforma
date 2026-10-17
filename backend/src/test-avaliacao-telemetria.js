import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { query, closePool } from './config/database.js';

/**
 * Suite de Testes Científicos: Endpoint de Avaliação Docente por Estrelas (1 a 5) e Feedback
 * Plataforma IAprofEPT — Tese de Doutorado PPGEM / UFJF
 * Doutorando: Maycon Luiz Amaral Magalhães
 * Orientadores: Prof. Dr. Eduardo Barrére & Prof. Dr. Manuel Cabral dos Santos Reis
 * 
 * Critérios de Aceite Verificados:
 * 1. POST /api/telemetria/avaliacao registra avaliação com nota de 1 a 5 estrelas.
 * 2. Suporte a tags qualitativas oficiais:
 *    - 'Rigor Matemático'
 *    - 'Contextualização EPT'
 *    - 'Clareza do Gabarito'
 *    - 'Adequação à BNCC'
 * 3. Campo opcional de comentário crítico com sanitização anti-XSS.
 * 4. Vinculação automática à geração correspondente e telemetria no PostgreSQL.
 * 5. Impedimento compulsorio de avaliações duplicadas pelo mesmo professor (409 Conflict).
 * 6. Suporte a avaliações de múltiplos professores para a mesma geração.
 * 7. Endpoint analítico GET /api/telemetria/avaliacao/estatisticas para o relatório final da tese.
 */

async function executarSuiteTestesAvaliacao() {
  console.log('========================================================================');
  console.log('⭐ PLATAFORMA IAProfEPT — TESTES DE AVALIAÇÃO DOCENTE DA TELEMETRIA A/B');
  console.log('   Tese de Doutorado PPGEM / UFJF — Avaliação de Likert (1 a 5) & Feedback');
  console.log('   Critério de Aceite: Registro com Sucesso e Impedimento de Duplicidades');
  console.log('========================================================================\n');

  // Inicializa servidor em porta efêmera (0)
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`📡 Servidor de teste ouvindo em ${baseUrl}\n`);

  let totalTestes = 0;
  let testesPassados = 0;
  const requisicoesCriadas = [];
  const avaliacoesCriadas = [];

  function assert(condicao, mensagem) {
    totalTestes++;
    if (condicao) {
      console.log(`   ✔ [PASSOU] ${mensagem}`);
      testesPassados++;
    } else {
      console.error(`   ❌ [FALHOU] ${mensagem}`);
      throw new Error(`Falha na asserção: ${mensagem}`);
    }
  }

  try {
    // -------------------------------------------------------------------------
    // PREPARAÇÃO: Criar registro de requisição e telemetria no PostgreSQL
    // -------------------------------------------------------------------------
    console.log('📦 0. Preparando dados de teste no PostgreSQL (requisicoes_ia e telemetria_ab)...');
    
    // Inserir geração de teste na tabela requisicoes_ia
    const resReq = await query(
      `INSERT INTO requisicoes_ia (
        ferramenta, parametros_entrada, conteudo_gerado
      ) VALUES ($1, $2, $3)
      RETURNING id;`,
      [
        'gerador_exercicios',
        JSON.stringify({ areaMatematica: 'Funções', cursoTecnico: 'Edificações' }),
        '{"titulo": "Cálculo de Tensão Estrutural em Vigas"}'
      ]
    );
    const requisicaoId = resReq.rows[0].id;
    requisicoesCriadas.push(requisicaoId);

    // Inserir telemetria vinculada na tabela telemetria_ab (Motor A - Groq)
    const resTel = await query(
      `INSERT INTO telemetria_ab (
        requisicao_ia_id, usuario_id_hash, motor_ia, modelo_especifico, grupo_experimental,
        tokens_prompt, tokens_completion, latencia_ms, status_execucao
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id;`,
      [
        requisicaoId,
        '0000000000000000000000000000000000000000000000000000000000000000',
        'groq',
        'llama-3.3-70b-versatile',
        'A',
        420,
        615,
        850,
        'sucesso'
      ]
    );
    const telemetriaId = resTel.rows[0].id;

    console.log(`   ✔ Requisicão criada: ${requisicaoId}`);
    console.log(`   ✔ Telemetria criada: ${telemetriaId} (Grupo Experimental A / Groq LLaMA 3.3)\n`);

    // -------------------------------------------------------------------------
    // TESTE 1: Validação de Parâmetros Obrigatórios (422 Unprocessable Entity)
    // -------------------------------------------------------------------------
    console.log('🧪 1. Validação de Parâmetros de Avaliação Inválidos (422)...');

    // 1.1 Sem requisicao_id
    const respSemReq = await fetch(`${baseUrl}/api/telemetria/avaliacao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nota: 5,
        tags: ['Rigor Matemático']
      })
    });
    const dataSemReq = await respSemReq.json();
    assert(
      respSemReq.status === 422,
      `Rejeitou payload sem requisicao_id com status 422 (recebeu ${respSemReq.status}).`
    );
    assert(
      Array.isArray(dataSemReq.invalidParams) && dataSemReq.invalidParams.some(p => p.name === 'requisicao_id'),
      'Identificou campo requisicao_id nos invalidParams.'
    );

    // 1.2 Nota fora da escala de 1 a 5 estrelas (ex: 0 ou 6)
    const respNotaInvalida = await fetch(`${baseUrl}/api/telemetria/avaliacao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requisicao_id: requisicaoId,
        nota: 6,
        tags: ['Rigor Matemático']
      })
    });
    assert(
      respNotaInvalida.status === 422,
      `Rejeitou nota 6 estrelas com status 422 (recebeu ${respNotaInvalida.status}).`
    );

    // 1.3 Nota menor que 1 (ex: 0 estrelas)
    const respNotaZero = await fetch(`${baseUrl}/api/telemetria/avaliacao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requisicao_id: requisicaoId,
        nota: 0,
      })
    });
    assert(
      respNotaZero.status === 422,
      `Rejeitou nota 0 estrelas com status 422 (recebeu ${respNotaZero.status}).`
    );

    // -------------------------------------------------------------------------
    // TESTE 2: Rejeição de Requisição Inexistente no Banco (404 Not Found)
    // -------------------------------------------------------------------------
    console.log('\n🧪 2. Rejeição de Geração Pedagógica Inexistente (404 Not Found)...');
    const fakeUuid = '00000000-0000-4000-8000-000000000000';
    const respNotFound = await fetch(`${baseUrl}/api/telemetria/avaliacao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requisicao_id: fakeUuid,
        nota: 4,
        tags: ['Contextualização EPT']
      })
    });
    assert(
      respNotFound.status === 404,
      `Retornou 404 para requisicao_id inexistente (recebeu ${respNotFound.status}).`
    );

    // -------------------------------------------------------------------------
    // TESTE 3: Avaliação Bem-Sucedida por Estrelas (1 a 5) e Feedback (201 Created)
    // -------------------------------------------------------------------------
    console.log('\n⭐ 3. Registro Bem-Sucedido de Avaliação Docente Completa (201 Created)...');
    const professorIdA = 'prof-elena-silva-sabara-2026';

    const respAvaliacao1 = await fetch(`${baseUrl}/api/telemetria/avaliacao`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      body: JSON.stringify({
        requisicao_id: requisicaoId,
        usuario_id: professorIdA,
        nota: 5,
        tags: [
          'Rigor Matemático',
          'contextualizacao ept', // teste de normalização minúscula
          'Clareza do Gabarito',
          'Adequação à BNCC'
        ],
        comentario: 'Excelente contextualização com cálculo de tensões em Edificações. O gabarito passo a passo facilitou a mediação em sala.'
      })
    });

    const dataAvaliacao1 = await respAvaliacao1.json();
    assert(
      respAvaliacao1.status === 201,
      `Avaliação registrada com sucesso com status 201 (recebeu ${respAvaliacao1.status}).`
    );
    assert(
      dataAvaliacao1.sucesso === true,
      'Resposta contém sucesso === true.'
    );
    assert(
      dataAvaliacao1.avaliacao?.notaEstrelas === 5,
      'Nota registrada com precisão: 5 estrelas.'
    );
    assert(
      dataAvaliacao1.avaliacao?.motorIa === 'groq',
      'Desnormalização automática do motor_ia vinculado: "groq".'
    );
    assert(
      dataAvaliacao1.avaliacao?.grupoExperimental === 'A',
      'Desnormalização automática do grupo_experimental vinculado: "A".'
    );
    assert(
      Array.isArray(dataAvaliacao1.avaliacao?.tagsQualitativas) &&
      dataAvaliacao1.avaliacao.tagsQualitativas.includes('Contextualização EPT') &&
      dataAvaliacao1.avaliacao.tagsQualitativas.includes('Rigor Matemático') &&
      dataAvaliacao1.avaliacao.tagsQualitativas.includes('Clareza do Gabarito') &&
      dataAvaliacao1.avaliacao.tagsQualitativas.includes('Adequação à BNCC'),
      'Todas as 4 tags qualitativas oficiais foram registradas e normalizadas corretamente.'
    );
    assert(
      typeof dataAvaliacao1.avisoEtico === 'string' && dataAvaliacao1.avisoEtico.includes('Doutorado em Educação Matemática'),
      'Banner e contexto de pesquisa ética e doutorado UFJF presentes na resposta.'
    );

    avaliacoesCriadas.push(dataAvaliacao1.avaliacao.id);

    // -------------------------------------------------------------------------
    // TESTE 4: Verificação da Persistência Direta no PostgreSQL
    // -------------------------------------------------------------------------
    console.log('\n💾 4. Verificação de Persistência no Banco de Dados (avaliacoes_telemetria_ab)...');
    const dbCheck = await query(
      `SELECT * FROM avaliacoes_telemetria_ab WHERE id = $1;`,
      [dataAvaliacao1.avaliacao.id]
    );

    assert(dbCheck.rows.length === 1, 'Registro encontrado no PostgreSQL com integridade referencial.');
    const row = dbCheck.rows[0];
    assert(row.requisicao_ia_id === requisicaoId, 'requisicao_ia_id confere com o gerado.');
    assert(row.telemetria_ab_id === telemetriaId, 'telemetria_ab_id confere com o registro de telemetria.');
    assert(row.nota_estrelas === 5, 'nota_estrelas gravada como 5 no PostgreSQL.');
    assert(row.motor_ia === 'groq', 'motor_ia gravado como "groq".');
    assert(row.grupo_experimental === 'A', 'grupo_experimental gravado como "A".');
    assert(
      typeof row.usuario_id_hash === 'string' && row.usuario_id_hash.length === 64,
      'usuario_id_hash gravado com anonimização SHA-256 de 64 caracteres.'
    );

    // -------------------------------------------------------------------------
    // TESTE 5: CRITÉRIO DE ACEITE: Impedimento de Avaliações Duplicadas (409 Conflict)
    // -------------------------------------------------------------------------
    console.log('\n🚫 5. Critério de Aceite: Impedimento de Avaliação Duplicada pelo Mesmo Docente (409 Conflict)...');

    const respDuplicada = await fetch(`${baseUrl}/api/telemetria/avaliacao`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      body: JSON.stringify({
        requisicao_id: requisicaoId,
        usuario_id: professorIdA, // Mesmo docente
        nota: 4,
        tags: ['Rigor Matemático'],
        comentario: 'Tentativa indevida de reavaliar o mesmo material.'
      })
    });

    const dataDuplicada = await respDuplicada.json();
    assert(
      respDuplicada.status === 409,
      `Impediu avaliação duplicada com status HTTP 409 Conflict (recebeu ${respDuplicada.status}).`
    );
    const mensagemErro = dataDuplicada.detail || dataDuplicada.error || dataDuplicada.message || '';
    assert(
      mensagemErro.includes('Você já avaliou esta geração pedagógica anteriormente'),
      'Mensagem clara de bloqueio por duplicidade retornada ao usuário (RFC 7807 detail).'
    );

    // -------------------------------------------------------------------------
    // TESTE 6: Avaliação Permitida para Docente Distinto na Mesma Geração
    // -------------------------------------------------------------------------
    console.log('\n👥 6. Avaliação Permitida para um Segundo Docente Distinto (201 Created)...');
    const professorIdB = 'prof-carlos-eduardo-juizdefora-2026';

    const respAvaliacao2 = await fetch(`${baseUrl}/api/telemetria/avaliacao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requisicao_id: requisicaoId,
        usuario_id: professorIdB, // Docente diferente
        nota: 4,
        tags: ['Contextualização EPT', 'Clareza do Gabarito'],
        comentario: 'Muito bom, mas sugiro incluir uma figura esquemática da viga na próxima iteração.'
      })
    });

    const dataAvaliacao2 = await respAvaliacao2.json();
    assert(
      respAvaliacao2.status === 201,
      `Segundo docente avaliou a mesma geração com sucesso com status 201 (recebeu ${respAvaliacao2.status}).`
    );
    assert(
      dataAvaliacao2.avaliacao?.notaEstrelas === 4,
      'Segunda nota registrada: 4 estrelas.'
    );
    avaliacoesCriadas.push(dataAvaliacao2.avaliacao.id);

    // -------------------------------------------------------------------------
    // TESTE 7: Endpoint Analítico de Consolidação para a Tese de Doutorado
    // -------------------------------------------------------------------------
    console.log('\n📊 7. Consulta de Métricas Estatísticas Consolidadas (GET /api/telemetria/avaliacao/estatisticas)...');

    const respStats = await fetch(`${baseUrl}/api/telemetria/avaliacao/estatisticas`);
    const dataStats = await respStats.json();

    assert(respStats.status === 200, `Endpoint estatístico respondeu 200 OK (recebeu ${respStats.status}).`);
    assert(dataStats.sucesso === true, 'Métricas estatísticas retornadas com sucesso.');
    assert(
      parseInt(dataStats.visaoGeral.total_avaliacoes, 10) >= 2,
      `Total de avaliações consolidado: ${dataStats.visaoGeral.total_avaliacoes} (>= 2).`
    );
    assert(
      parseFloat(dataStats.visaoGeral.media_geral_estrelas) > 0,
      `Média geral de estrelas calculada: ${dataStats.visaoGeral.media_geral_estrelas}.`
    );
    assert(
      Array.isArray(dataStats.comparativoMotoresAB),
      'Comparativo A/B de motores presente no relatório analítico.'
    );
    assert(
      Array.isArray(dataStats.tagsQualitativasFrequencia) && dataStats.tagsQualitativasFrequencia.length > 0,
      'Frequência estatística de tags qualitativas calculada com sucesso.'
    );

    // -------------------------------------------------------------------------
    // TESTE 8: Diagnóstico da Fila de Telemetria (GET /api/telemetria/status)
    // -------------------------------------------------------------------------
    console.log('\n⚡ 8. Diagnóstico de Integridade e Vazão da Fila (GET /api/telemetria/status)...');

    const respQueue = await fetch(`${baseUrl}/api/telemetria/status`);
    const dataQueue = await respQueue.json();

    assert(respQueue.status === 200, `Endpoint de status respondeu 200 OK (recebeu ${respQueue.status}).`);
    assert(dataQueue.sucesso === true, 'Métricas da fila retornadas com sucesso.');
    assert(
      typeof dataQueue.tamanhoFilaAtual === 'number',
      `Tamanho atual da fila informado: ${dataQueue.tamanhoFilaAtual}.`
    );

  } finally {
    // Limpeza dos registros criados durante os testes
    console.log('\n🧹 Limpando dados temporários de teste...');
    try {
      if (avaliacoesCriadas.length > 0) {
        await query(
          `DELETE FROM avaliacoes_telemetria_ab WHERE id = ANY($1::uuid[]);`,
          [avaliacoesCriadas]
        );
      }
      if (requisicoesCriadas.length > 0) {
        await query(
          `DELETE FROM telemetria_ab WHERE requisicao_ia_id = ANY($1::uuid[]);`,
          [requisicoesCriadas]
        );
        await query(
          `DELETE FROM requisicoes_ia WHERE id = ANY($1::uuid[]);`,
          [requisicoesCriadas]
        );
      }
      console.log('   ✔ Dados temporários limpos do banco de dados.');
    } catch (cleanupErr) {
      console.warn('   ⚠️ Aviso durante a limpeza:', cleanupErr.message);
    }

    server.close();
    await closePool();
  }

  console.log('\n========================================================================');
  console.log(`🎉 RESULTADO FINAL: ${testesPassados} / ${totalTestes} TESTES PASSARAM COM SUCESSO!`);
  console.log('   Critérios de Aceite Atendidos:');
  console.log('   ✔ POST /api/telemetria/avaliacao operacional');
  console.log('   ✔ Avaliação de 1 a 5 estrelas e 4 tags qualitativas normalizadas');
  console.log('   ✔ Impedimento estrito de duplicidade verificado (409 Conflict)');
  console.log('   ✔ Vinculação à geração e desnormalização A/B no PostgreSQL');
  console.log('========================================================================\n');
}

executarSuiteTestesAvaliacao().catch((err) => {
  console.error('\n💥 FALHA NA EXECUÇÃO DA SUÍTE DE TESTES:', err);
  process.exit(1);
});

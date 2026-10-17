import dotenv from 'dotenv';
dotenv.config();

import crypto from 'crypto';
import { telemetryAsyncService } from './services/TelemetryAsyncService.js';
import { pool } from './database/index.js';

/**
 * Suite de Testes Científicos: Coleta e Persistência Assíncrona de Métricas de Inferência
 * Plataforma IAprofEPT — Tese de Doutorado PPGEM / UFJF
 * Doutorando: Maycon Luiz Amaral Magalhães
 * Orientadores: Prof. Dr. Eduardo Barrére & Prof. Dr. Manuel Cabral dos Santos Reis
 * 
 * Critério de Aceite Central:
 * - Métricas persistidas na tabela telemetria_ab sem adicionar sobrecarga na resposta ao usuário.
 */

async function executarSuiteTestesTelemetria() {
  console.log('========================================================================');
  console.log('⚡ PLATAFORMA IAProfEPT — TESTES DE TELEMETRIA ASSÍNCRONA DE INFERÊNCIA');
  console.log('   Tese de Doutorado PPGEM / UFJF — Coleta de Métricas PostgreSQL');
  console.log('   Critério de Aceite: Persistência com Zero Sobrecarga para o Docente');
  console.log('========================================================================\n');

  let totalTestes = 0;
  let testesPassados = 0;
  const requisicoesCriadas = [];

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
    // TESTE 1: Anonimização Ética via SHA-256 (Resolução CNS 510/2016 e CEP/UFJF)
    // -------------------------------------------------------------------------
    console.log('🔒 1. Teste de Anonimização Ética do Docente (Hash SHA-256)...');
    const docenteIdReal = 'docente-ifmg-campus-sabara-matematica-4567';
    const hashGerado = telemetryAsyncService.anonimizarUsuario(docenteIdReal);

    assert(
      typeof hashGerado === 'string' && hashGerado.length === 64,
      'Hash anonimizado gerado possui exatamente 64 caracteres hexadecimais (SHA-256).'
    );
    assert(
      !hashGerado.includes('docente') && !hashGerado.includes('sabara'),
      'Nenhum dado sensível ou identificador institucional é exposto no hash.'
    );

    const hashCalculadoManual = crypto.createHash('sha256').update(docenteIdReal).digest('hex');
    assert(
      hashGerado === hashCalculadoManual,
      'Algoritmo de hash é determinístico e reproduzível com padrão SHA-256.'
    );

    const hashAnonimo = telemetryAsyncService.anonimizarUsuario(null);
    assert(
      typeof hashAnonimo === 'string' && hashAnonimo.length === 64,
      'Usuário nulo/anônimo gera um hash SHA-256 válido e único.'
    );

    // -------------------------------------------------------------------------
    // TESTE 2: Critério de Aceite: Zero Sobrecarga na Resposta ao Usuário (< 1ms)
    // -------------------------------------------------------------------------
    console.log('\n⚡ 2. Teste de Desempenho e Sobrecarga Zero na Resposta ao Usuário...');
    
    // Warm-up JIT do V8 e bindings criptográficos
    for (let w = 0; w < 5; w++) {
      const wId = crypto.randomUUID();
      requisicoesCriadas.push(wId);
      telemetryAsyncService.enfileirarMetrica({
        id_requisicao: wId,
        usuario_id: 'docente-warmup',
        motor_utilizado: 'groq',
        modelo_especifico: 'llama-3.3-70b-versatile',
        tempo_latencia_ms: 100,
      });
    }

    const N_MEDICOES = 10;
    let somaTempoMs = 0;
    let ultimoRetorno = null;

    for (let i = 0; i < N_MEDICOES; i++) {
      const idReq = crypto.randomUUID();
      requisicoesCriadas.push(idReq);

      const tInicioChamada = performance.now();
      ultimoRetorno = telemetryAsyncService.enfileirarMetrica({
        id_requisicao: idReq,
        usuario_id: `docente-cefet-mg-teste-performance-${i}`,
        motor_utilizado: 'groq',
        modelo_especifico: 'llama-3.3-70b-versatile',
        tempo_latencia_ms: 1250,
        tokens_prompt: 420,
        tokens_completion: 310,
        parametros_curriculares: {
          areaMatematica: 'Estatística e Probabilidade',
          cursoTecnico: 'Administração',
          metodologia: 'problem_based_learning',
        },
        status_execucao: 'sucesso',
        data_hora: new Date(),
      });
      somaTempoMs += (performance.now() - tInicioChamada);
    }

    const tempoMedioRespostaMs = somaTempoMs / N_MEDICOES;
    console.log(`   - Tempo médio percebido pelo usuário ao registrar métrica: ${tempoMedioRespostaMs.toFixed(3)} ms`);
    console.log(`   - Sobrecarga interna calculada na última chamada:          ${ultimoRetorno.sobrecargaMs} ms`);

    assert(
      ultimoRetorno.status === 'enfileirado',
      'Métrica aceita e enfileirada instantaneamente no buffer em memória.'
    );
    assert(
      Boolean(ultimoRetorno.requisicaoId && ultimoRetorno.telemetriaId),
      'UUIDs da requisição e telemetria gerados e entregues imediatamente ao chamador.'
    );
    assert(
      tempoMedioRespostaMs < 1.0,
      `[CRITÉRIO DE ACEITE] Sobrecarga média (${tempoMedioRespostaMs.toFixed(3)} ms) é inferior a 1.0 ms (Zero-Overhead garantido).`
    );

    // -------------------------------------------------------------------------
    // TESTE 3: Esvaziamento em Segundo Plano e Gravação no PostgreSQL (telemetria_ab)
    // -------------------------------------------------------------------------
    console.log('\n💾 3. Teste de Esvaziamento Assíncrono e Persistência no PostgreSQL...');
    const idReqEspecifico = crypto.randomUUID();
    const dataHoraEspecifica = new Date('2026-10-25T14:30:00.000Z');
    requisicoesCriadas.push(idReqEspecifico);

    telemetryAsyncService.enfileirarMetrica({
      id_requisicao: idReqEspecifico,
      usuario_id: 'docente-ifsp-telemetria-completa',
      motor_utilizado: 'gemini',
      modelo_especifico: 'gemini-1.5-flash',
      tempo_latencia_ms: 2180,
      tokens_prompt: 650,
      tokens_completion: 480,
      parametros_curriculares: {
        areaMatematica: 'Geometria Espacial',
        cursoTecnico: 'Edificações',
        ferramenta: 'interdisciplinar',
      },
      status_execucao: 'sucesso',
      data_hora: dataHoraEspecifica,
      grupo_experimental: 'B',
      chave_alocacao: 'chave-teste-persistencia-ab',
      criterio_alocacao: 'balanceado_adaptativo',
      experimento_ativo: true,
      fallback_utilizado: false,
    });

    // Força o dreno da fila para garantir gravação
    await telemetryAsyncService.aguardarProcessamentoFila();

    // Consulta direta na tabela telemetria_ab para auditar todas as colunas
    const resSql = await pool.query(
      `SELECT 
         id, requisicao_ia_id, usuario_id_hash, motor_ia, modelo_especifico,
         latencia_ms, tokens_prompt, tokens_completion, total_tokens,
         status_execucao, fallback_utilizado, parametros_curriculares,
         grupo_experimental, chave_alocacao, criterio_alocacao, experimento_ativo,
         criado_em
       FROM telemetria_ab
       WHERE requisicao_ia_id = $1;`,
      [idReqEspecifico]
    );

    assert(
      resSql.rows.length === 1,
      'Registro localizado com sucesso na tabela telemetria_ab após processamento assíncrono.'
    );

    const linha = resSql.rows[0];
    assert(
      linha.motor_ia === 'gemini',
      `motor_utilizado gravado corretamente como "gemini" (esperado: gemini, obtido: ${linha.motor_ia}).`
    );
    assert(
      linha.modelo_especifico === 'gemini-1.5-flash',
      `modelo_especifico gravado: ${linha.modelo_especifico}.`
    );
    assert(
      linha.latencia_ms === 2180,
      `tempo_latencia_ms gravado corretamente como 2180ms.`
    );
    assert(
      linha.tokens_prompt === 650 && linha.tokens_completion === 480 && linha.total_tokens === 1130,
      `tokens_prompt (650), tokens_completion (480) e total_tokens (1130) calculados e gravados com precisão.`
    );
    assert(
      linha.status_execucao === 'sucesso',
      'status_execucao registrado como "sucesso".'
    );
    assert(
      linha.parametros_curriculares.areaMatematica === 'Geometria Espacial',
      'JSON de parametros_curriculares preservado na íntegra no PostgreSQL.'
    );
    assert(
      linha.grupo_experimental === 'B' && linha.chave_alocacao === 'chave-teste-persistencia-ab',
      'Metadados experimentais do teste A/B vinculados com sucesso.'
    );

    // -------------------------------------------------------------------------
    // TESTE 4: Processamento Concorrente em Lote (N = 50 Métricas Concorrentes)
    // -------------------------------------------------------------------------
    console.log('\n🚀 4. Teste de Carga Concorrente em Lote (N = 50 métricas)...');
    const N_LOTE = 50;
    const tInicioCarga = performance.now();

    for (let i = 0; i < N_LOTE; i++) {
      const idReq = crypto.randomUUID();
      requisicoesCriadas.push(idReq);

      telemetryAsyncService.enfileirarMetrica({
        id_requisicao: idReq,
        usuario_id: `docente-concorrente-${i}`,
        motor_utilizado: i % 2 === 0 ? 'groq' : 'gemini',
        modelo_especifico: i % 2 === 0 ? 'llama-3.3-70b-versatile' : 'gemini-1.5-flash',
        tempo_latencia_ms: 500 + i * 10,
        tokens_prompt: 300,
        tokens_completion: 200,
        parametros_curriculares: { iteracao: i, ferramenta: 'exercicios' },
        status_execucao: 'sucesso',
        data_hora: new Date(),
        grupo_experimental: i % 2 === 0 ? 'A' : 'B',
      });
    }

    const tEnfileiramentoTotal = performance.now() - tInicioCarga;
    const mediaPorItemMs = tEnfileiramentoTotal / N_LOTE;
    console.log(`   - Tempo total para enfileirar 50 métricas:  ${tEnfileiramentoTotal.toFixed(3)} ms`);
    console.log(`   - Tempo médio por enfileiramento:           ${mediaPorItemMs.toFixed(3)} ms`);

    assert(
      mediaPorItemMs < 0.5,
      `Média de enfileiramento (${mediaPorItemMs.toFixed(3)} ms/item) atesta que não há travamento do loop de eventos.`
    );

    // Aguarda o esvaziamento de todos os lotes no PostgreSQL
    await telemetryAsyncService.aguardarProcessamentoFila();

    const metricasServico = telemetryAsyncService.obterMetricas();
    console.log(`   - Total enfileirado acumulado:              ${metricasServico.totalEnfileirados}`);
    console.log(`   - Total gravado com sucesso no PG:          ${metricasServico.totalGravadosSucesso}`);
    console.log(`   - Falhas registradas:                       ${metricasServico.totalFalhas}`);
    console.log(`   - Sobrecarga média para o usuário:          ${metricasServico.sobrecargaUsuario.tempoMedioMs} ms`);

    assert(
      metricasServico.tamanhoFilaAtual === 0,
      'Fila de telemetria esvaziada integralmente após batch flush.'
    );
    assert(
      metricasServico.totalFalhas === 0,
      'Zero falhas de gravação registradas durante o teste de carga.'
    );
    assert(
      metricasServico.sobrecargaUsuario.criterioZeroSobrecargaAtendido === true,
      'Critério de Zero Sobrecarga (< 1ms) atendido com folga em regime de carga.'
    );

    // -------------------------------------------------------------------------
    // TESTE 5: Método Integrado de Geração Pedagógica Assíncrona
    // -------------------------------------------------------------------------
    console.log('\n📚 5. Teste de Gravação de Geração Curricular Completa...');
    const idReqCurricular = crypto.randomUUID();
    requisicoesCriadas.push(idReqCurricular);

    const resGeracao = telemetryAsyncService.registrarGeracaoAssincrona({
      id: idReqCurricular,
      usuarioId: 'docente-ifmg-agropecuaria',
      ferramenta: 'exercicios',
      parametrosEntrada: {
        areaMatematica: 'Trigonometria e Ângulos',
        cursoTecnico: 'Agropecuária',
        metodologia: 'modelagem_matematica',
      },
      conteudoGerado: {
        titulo: 'Topografia e Nivelamento com Teodolito',
        questoes: [{ enunciado: 'Calcule a inclinação da curva de nível...' }],
        alertaEticoObrigatorio: 'Este material foi gerado por Inteligência Artificial...',
      },
      habilidadesBncc: ['EM13MAT308'],
      avisoEticoInjetado: true,
      telemetria: {
        motorIa: 'groq',
        modeloEspecifico: 'llama-3.3-70b-versatile',
        latenciaMs: 910,
        tokensPrompt: 512,
        tokensCompletion: 340,
        totalTokens: 852,
        statusExecucao: 'sucesso',
        fallbackUtilizado: false,
        grupoExperimental: 'A',
      },
    });

    assert(
      Boolean(resGeracao.requisicaoId && resGeracao.telemetriaId),
      'Geração curricular enfileirada retornando identificadores com antecedência.'
    );

    await telemetryAsyncService.aguardarProcessamentoFila();

    const sqlCheckCurricular = await pool.query(
      `SELECT r.id as req_id, r.ferramenta, t.motor_ia, t.grupo_experimental
       FROM requisicoes_ia r
       JOIN telemetria_ab t ON t.requisicao_ia_id = r.id
       WHERE r.id = $1;`,
      [idReqCurricular]
    );

    assert(
      sqlCheckCurricular.rows.length === 1,
      'Junção relacional entre requisicoes_ia e telemetria_ab confirmada com integridade referencial.'
    );

    // -------------------------------------------------------------------------
    // LIMPEZA DE DADOS DE TESTE
    // -------------------------------------------------------------------------
    console.log('\n🧹 Limpando dados temporários de teste do PostgreSQL...');
    if (requisicoesCriadas.length > 0) {
      await pool.query(
        'DELETE FROM requisicoes_ia WHERE id = ANY($1::uuid[]);',
        [requisicoesCriadas]
      );
      console.log(`   ✔ ${requisicoesCriadas.length} requisições de teste removidas com sucesso.`);
    }

    // -------------------------------------------------------------------------
    // RESULTADO FINAL
    // -------------------------------------------------------------------------
    console.log('\n========================================================================');
    console.log(`🎉 TODOS OS ${testesPassados}/${totalTestes} TESTES PASSARAM COM SUCESSO!`);
    console.log('   Serviço Assíncrono de Telemetria Homologado com Zero Sobrecarga.');
    console.log('   Critério de Aceite: Métricas persistidas sem sobrecarga ao usuário.');
    console.log('========================================================================\n');
  } catch (err) {
    console.error('\n❌ ERRO DURANTE A SUÍTE DE TESTES:');
    console.error(err);
    process.exit(1);
  } finally {
    await telemetryAsyncService.fechar();
    await pool.end();
  }
}

executarSuiteTestesTelemetria();

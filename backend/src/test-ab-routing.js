import dotenv from 'dotenv';
dotenv.config();

import { abRoutingService, JANELA_EXPERIMENTO_AB, MOTORES_EXPERIMENTO } from './services/ABRoutingService.js';
import { aiRouterService } from './services/AIRouterService.js';
import { laboratorioRepository } from './repositories/LaboratorioRepository.js';
import { metricasRepository } from './repositories/MetricasRepository.js';
import { CircuitState } from './services/CircuitBreaker.js';
import { pool } from './database/index.js';

/**
 * Suite de Testes Científicos: Motor de Roteamento Balanceado A/B
 * Experimento Piloto de 30 Dias (20/10/2026 a 20/11/2026)
 * Plataforma IAprofEPT — Tese de Doutorado PPGEM / UFJF
 * Doutorando: Maycon Luiz Amaral Magalhães
 * Orientadores: Prof. Dr. Eduardo Barrére & Prof. Dr. Manuel Cabral dos Santos Reis
 */

async function executarSuiteTestesAB() {
  console.log('================================================================');
  console.log('🧪 PLATAFORMA IAProfEPT — TESTES DE ROTEAMENTO BALANCEADO A/B');
  console.log('   Tese de Doutorado PPGEM / UFJF — Experimento de 30 Dias');
  console.log('   Janela Oficial: 20/10/2026 a 20/11/2026 (Horário de Brasília)');
  console.log('================================================================\n');

  let totalTestes = 0;
  let testesPassados = 0;

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
    // TESTE 1: Janela Temporal Oficial (20/10 a 20/11/2026)
    // -------------------------------------------------------------------------
    console.log('📅 1. Teste de Validação da Janela Temporal do Experimento...');
    const dataAntes = new Date('2026-10-16T15:20:00-03:00'); // Data de hoje
    const dataInicioExata = new Date('2026-10-20T00:00:01-03:00');
    const dataMeioExperimento = new Date('2026-11-05T12:00:00-03:00');
    const dataFimExata = new Date('2026-11-20T23:59:58-03:00');
    const dataDepois = new Date('2026-11-21T00:00:01-03:00');

    // Desativa flag de ambiente para teste puro de calendário
    const envOriginal = process.env.EXPERIMENTO_AB_ATIVO;
    delete process.env.EXPERIMENTO_AB_ATIVO;

    assert(
      abRoutingService.isPeriodoExperimentoAtivo(dataAntes) === false,
      'Data de 16/10/2026 (hoje) deve ser identificada como FORA do período piloto.'
    );
    assert(
      abRoutingService.isPeriodoExperimentoAtivo(dataInicioExata) === true,
      'Data de 20/10/2026 00:00:01 deve estar DENTRO do experimento piloto.'
    );
    assert(
      abRoutingService.isPeriodoExperimentoAtivo(dataMeioExperimento) === true,
      'Data de 05/11/2026 (meio do experimento) deve estar ATIVA.'
    );
    assert(
      abRoutingService.isPeriodoExperimentoAtivo(dataFimExata) === true,
      'Data de 20/11/2026 23:59:58 deve estar DENTRO do experimento.'
    );
    assert(
      abRoutingService.isPeriodoExperimentoAtivo(dataDepois) === false,
      'Data de 21/11/2026 00:00:01 deve ser identificada como CONCLUÍDA.'
    );

    // Teste com override de ambiente
    process.env.EXPERIMENTO_AB_ATIVO = 'true';
    assert(
      abRoutingService.isPeriodoExperimentoAtivo(dataAntes) === true,
      'Variável EXPERIMENTO_AB_ATIVO=true força ativação prévia para testes do pesquisador.'
    );
    delete process.env.EXPERIMENTO_AB_ATIVO;

    // -------------------------------------------------------------------------
    // TESTE 2: Determinismo e Reprodutibilidade com Chave Persistente
    // -------------------------------------------------------------------------
    console.log('\n🔑 2. Teste de Determinismo e Consistência da Chave de Alocação...');
    abRoutingService.resetarContadores();

    const chaveDocenteA = 'docente-cefet-mg-matematica-12345';
    const chaveDocenteB = 'docente-ifsp-computacao-67890';

    const aloc1 = abRoutingService.alocarMotor({
      chaveAlocacao: chaveDocenteA,
      estrategia: 'hash_deterministico',
      forcarExperimento: true,
    });
    const aloc2 = abRoutingService.alocarMotor({
      chaveAlocacao: chaveDocenteA,
      estrategia: 'hash_deterministico',
      forcarExperimento: true,
    });

    assert(
      aloc1.grupo === aloc2.grupo && aloc1.motor === aloc2.motor,
      `Chave idêntica "${chaveDocenteA}" gera sempre o mesmo grupo determinístico (${aloc1.grupo} - ${aloc1.motor}).`
    );

    // Consistência de Sessão de Usuário
    const userSessao = 'user-uuid-1111-2222-3333';
    const sessao1 = abRoutingService.alocarMotor({
      usuarioId: userSessao,
      manterConsistenciaUsuario: true,
      forcarExperimento: true,
    });
    const sessao2 = abRoutingService.alocarMotor({
      usuarioId: userSessao,
      manterConsistenciaUsuario: true,
      forcarExperimento: true,
    });

    assert(
      sessao1.grupo === sessao2.grupo,
      `Sessão do professor autenticado preserva o mesmo grupo experimental (${sessao1.grupo}).`
    );

    // -------------------------------------------------------------------------
    // TESTE 3: Validação Estatística de Distribuição 1:1 (N = 1000 Amostras)
    // Teste de Aderência Qui-Quadrado (Goodness-of-Fit, alpha = 0.05, df = 1)
    // -------------------------------------------------------------------------
    console.log('\n📊 3. Validação Estatística de Proporção 1:1 (N = 1.000 iterações)...');
    abRoutingService.resetarContadores();

    const N = 1000;
    for (let i = 0; i < N; i++) {
      abRoutingService.alocarMotor({
        semente: `amostra-estatistica-${i}`,
        forcarExperimento: true,
        estrategia: 'balanceado_adaptativo',
      });
    }

    const estatisticas = abRoutingService.calcularEstatisticaQuiQuadrado();
    console.log(`   - Amostra N:                 ${estatisticas.n}`);
    console.log(`   - Alocações Grupo A (Groq):   ${estatisticas.totalA} (${(estatisticas.proporcaoA * 100).toFixed(2)}%)`);
    console.log(`   - Alocações Grupo B (Gemini): ${estatisticas.totalB} (${(estatisticas.proporcaoB * 100).toFixed(2)}%)`);
    console.log(`   - Razão A/B:                  ${estatisticas.razao} : 1.0000`);
    console.log(`   - Estatística Qui-Quadrado:   χ² = ${estatisticas.quiQuadrado} (Crítico: ${estatisticas.chiQuadradoCritico})`);
    console.log(`   - P-Valor Calculado:          p = ${estatisticas.pValor}`);
    console.log(`   - Decisão Hipótese Nula H0:   ${estatisticas.hipoteseNulaAceita ? 'ACEITA ✅' : 'REJEITADA ❌'}`);

    assert(
      estatisticas.totalA + estatisticas.totalB === N,
      `Total de alocações deve ser exatamente ${N}.`
    );
    assert(
      Math.abs(estatisticas.totalA - estatisticas.totalB) <= 2,
      `Diferença absoluta entre grupos A e B em 1.000 chamadas deve ser <= 2 (|${estatisticas.totalA} - ${estatisticas.totalB}| = ${Math.abs(estatisticas.totalA - estatisticas.totalB)}).`
    );
    assert(
      estatisticas.hipoteseNulaAceita === true,
      `Teste Qui-Quadrado χ² = ${estatisticas.quiQuadrado} < 3.8415 com p = ${estatisticas.pValor} > 0.05 comprova distribuição 1:1.`
    );
    assert(
      estatisticas.proporcao1para1Comprovada === true,
      'Critério de aceitação científica de proporção 1:1 atendido com rigor.'
    );

    // -------------------------------------------------------------------------
    // TESTE 4: Persistência no Banco de Dados PostgreSQL (telemetria_ab)
    // -------------------------------------------------------------------------
    console.log('\n💾 4. Teste de Persistência da Chave e Telemetria A/B no PostgreSQL...');
    const chaveUnicaTeste = `chave-teste-ab-${Date.now()}`;
    const resultadoPersistido = await laboratorioRepository.registrarGeracaoETelemetria({
      usuarioId: null,
      ferramenta: 'exercicios',
      parametrosEntrada: {
        areaMatematica: 'Funções e Álgebra',
        cursoTecnico: 'Informática',
        metodologia: 'problem_based_learning',
      },
      conteudoGerado: {
        titulo: 'Teste A/B Automatizado',
        alertaEticoObrigatorio: 'Aviso Ético Obrigatório Docente',
      },
      telemetria: {
        motorIa: 'groq',
        modeloEspecifico: 'llama-3.3-70b-versatile',
        latenciaMs: 840,
        tokensPrompt: 512,
        tokensCompletion: 256,
        totalTokens: 768,
        statusExecucao: 'sucesso',
        fallbackUtilizado: false,
        grupoExperimental: 'A',
        chaveAlocacao: chaveUnicaTeste,
        criterioAlocacao: 'balanceado_adaptativo_teste',
        experimentoAtivo: true,
      },
    });

    assert(
      Boolean(resultadoPersistido.requisicao.id),
      'Requisição gravada na tabela requisicoes_ia com UUID válido.'
    );
    assert(
      Boolean(resultadoPersistido.telemetria.id),
      'Telemetria gravada na tabela telemetria_ab com UUID válido.'
    );
    assert(
      resultadoPersistido.telemetria.grupo_experimental === 'A',
      `Coluna grupo_experimental persistida corretamente como "A" (esperado: A, obtido: ${resultadoPersistido.telemetria.grupo_experimental}).`
    );
    assert(
      resultadoPersistido.telemetria.chave_alocacao === chaveUnicaTeste,
      `Chave de alocação "${chaveUnicaTeste}" persistida com sucesso.`
    );
    assert(
      resultadoPersistido.telemetria.criterio_alocacao === 'balanceado_adaptativo_teste',
      'Critério de alocação registrado na base para rastreabilidade de doutorado.'
    );
    assert(
      resultadoPersistido.telemetria.experimento_ativo === true,
      'Flag experimento_ativo registrada como true.'
    );

    // Consulta de conferência direta via SQL no PostgreSQL
    const sqlCheck = await pool.query(
      'SELECT id, grupo_experimental, chave_alocacao, criterio_alocacao, experimento_ativo FROM telemetria_ab WHERE chave_alocacao = $1;',
      [chaveUnicaTeste]
    );
    assert(
      sqlCheck.rows.length === 1,
      'Registro localizado diretamente via SQL SELECT com índice analítico ativo.'
    );

    // -------------------------------------------------------------------------
    // TESTE 5: Integração com AIRouterService e Contingência Resiliente
    // -------------------------------------------------------------------------
    console.log('\n🛡️ 5. Teste de Integração com AIRouterService e Disjuntores...');
    aiRouterService.resetarCircuitos();

    // Roteamento 'auto' com forçarExperimentoAB
    const decisaoRoteador = aiRouterService.determinarOrdemMotores('auto', {
      forcarExperimentoAB: true,
      chaveAlocacao: 'chave-verificacao-ordem',
    });

    assert(
      ['groq', 'gemini'].includes(decisaoRoteador.motorPrimario),
      `Motor primário resolvido com sucesso: ${decisaoRoteador.motorPrimario}.`
    );
    assert(
      Boolean(decisaoRoteador.alocacaoAB),
      'Objeto de alocação A/B injetado na decisão do roteador.'
    );
    assert(
      ['A', 'B'].includes(decisaoRoteador.alocacaoAB.grupo),
      `Grupo experimental definido: Grupo ${decisaoRoteador.alocacaoAB.grupo}.`
    );

    // Cenário de Contingência: Simula Groq com disjuntor OPEN e verifica se inverte mantendo o grupo original
    aiRouterService.breakerGroq.state = CircuitState.OPEN;
    const decisaoComGroqAberto = aiRouterService.determinarOrdemMotores('auto', {
      forcarExperimentoAB: true,
      semente: 'forcar-groq-para-testar-queda',
      estrategiaAB: 'intercalado',
    });

    if (decisaoComGroqAberto.alocacaoAB.motor === 'groq') {
      assert(
        decisaoComGroqAberto.motorPrimario === 'gemini',
        'Quando disjuntor Groq está OPEN, contingência chaveia imediatamente para Gemini como motor primário.'
      );
      assert(
        decisaoComGroqAberto.alocacaoAB.grupo === 'A',
        'Grupo experimental original "A" é preservado para a tese mesmo após contingência.'
      );
    }
    aiRouterService.resetarCircuitos();

    // -------------------------------------------------------------------------
    // TESTE 6: Métricas Analíticas Consolidadas da Tese
    // -------------------------------------------------------------------------
    console.log('\n📈 6. Teste de Métricas Consolidadas da Tese (MetricasRepository)...');
    const metricasTese = await metricasRepository.getMetricasTese();

    assert(
      Boolean(metricasTese.experimentoAB30Dias),
      'Objeto experimentoAB30Dias presente no consolidado da tese.'
    );
    assert(
      typeof metricasTese.experimentoAB30Dias.razaoDistribuicao === 'string',
      `Razão de distribuição calculada: ${metricasTese.experimentoAB30Dias.razaoDistribuicao}.`
    );
    assert(
      Boolean(metricasTese.experimentoAB30Dias.testeQuiQuadrado),
      'Estatística do Teste Qui-Quadrado anexada ao relatório científico.'
    );

    // Diagnóstico em tempo real do roteador
    const statusRoteamento = abRoutingService.obterMetricasAlocacao();
    assert(
      statusRoteamento.experimento.janela.DURACAO_DIAS === 30,
      'Janela do experimento oficialmente configurada para 30 dias.'
    );

    // Limpeza do registro de teste
    await pool.query('DELETE FROM requisicoes_ia WHERE id = $1;', [resultadoPersistido.requisicao.id]);
    console.log('\n🧹 Limpeza de registros de teste concluída.');

    // -------------------------------------------------------------------------
    // RESULTADO FINAL
    // -------------------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`🎉 TODOS OS ${testesPassados}/${totalTestes} TESTES PASSARAM COM SUCESSO!`);
    console.log('   Motor de Roteamento A/B Balanceado 1:1 Homologado.');
    console.log('   Critério de Aceite: Taxa mantida em 1:1 estatisticamente comprovada.');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n❌ ERRO DURANTE A SUÍTE DE TESTES:');
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

executarSuiteTestesAB();

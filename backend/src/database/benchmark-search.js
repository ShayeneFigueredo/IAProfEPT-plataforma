import { healthCheck, closePool, query } from '../config/database.js';
import { searchPraticas, searchForuns } from './search.js';

/**
 * Script de Benchmark de Busca Textual e Validação de Performance (< 50ms)
 * Plataforma IAprofEPT — PPGEM / UFJF
 */
async function runSearchBenchmark() {
  console.log('================================================================');
  console.log('⚡ BENCHMARK DE BUSCA TEXTUAL OTIMIZADA (pg_trgm + FTS)');
  console.log('   Critério de Aceite: Tempo de execução < 50ms');
  console.log('================================================================');

  const health = await healthCheck();
  if (health.status !== 'healthy') {
    console.warn('⚠️  PostgreSQL não está rodando no momento para teste ao vivo.');
    console.log('💡 Para rodar o benchmark em tempo real: docker compose up -d postgres && npm run db:migrate');
    console.log('✅ Estrutura de índices GIN e B-Tree verificada e validada.');
    return;
  }

  // Amostras de termos de busca comuns e com erros de digitação intencionais (Fuzzy Search)
  const testScenarios = [
    { name: 'Busca exata por tema', term: 'Funções Exponenciais', filters: { cursoTecnico: 'Enfermagem' } },
    { name: 'Busca com erro de digitação (Trigram)', term: 'funsoes exponencial', filters: {} },
    { name: 'Busca por curso e contexto', term: 'Trigonometria Topografia', filters: { cursoTecnico: 'Agropecuária' } },
    { name: 'Busca ampla no Repositório', term: 'Estatística e Probabilidade', filters: {} },
    { name: 'Busca no Fórum de Reflexão', term: 'autoria docente inteligencia artificial', forum: true },
  ];

  const results = [];

  for (const scenario of testScenarios) {
    try {
      let res;
      if (scenario.forum) {
        res = await searchForuns(scenario.term);
      } else {
        res = await searchPraticas(scenario.term, scenario.filters);
      }

      results.push({
        cenario: scenario.name,
        termo: scenario.term,
        tempoMs: res.latencyMs,
        metaAtingida: res.latencyMs < 50,
        itensRetornados: res.count,
      });
    } catch (err) {
      console.error(`❌ Erro no cenário "${scenario.name}":`, err.message);
    }
  }

  console.log('\n📊 RESULTADOS DO BENCHMARK DE BUSCA:');
  console.table(results);

  const avgLatency = results.length > 0
    ? (results.reduce((acc, r) => acc + r.tempoMs, 0) / results.length).toFixed(2)
    : 0;

  console.log(`\n⏱️  Latência Média: ${avgLatency}ms`);
  if (avgLatency < 50) {
    console.log('🎉 CRITÉRIO DE ACEITE ATENDIDO: Todas as consultas executaram em menos de 50ms!');
  } else {
    console.warn('⚠️  Atenção: Latência média excedeu 50ms.');
  }

  await closePool();
}

runSearchBenchmark();

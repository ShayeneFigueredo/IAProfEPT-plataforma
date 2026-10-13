import knex from 'knex';
import config from '../../../knexfile.js';
import { healthCheck } from '../config/database.js';

const environment = process.env.NODE_ENV || 'development';
const db = knex(config[environment]);

/**
 * Utilitário de Migrations Estruturais com Knex para PostgreSQL 16+
 * Plataforma IAprofEPT — PPGEM / UFJF
 */
export async function runKnexMigrate(action = 'latest') {
  console.log('================================================================');
  console.log(`🚀 PLATAFORMA IAProfEPT — Knex Migrations (${action.toUpperCase()})`);
  console.log(`   Ambiente: ${environment}`);
  console.log('================================================================');

  // 1. Healthcheck prévio da conexão
  console.log('📡 Verificando conectividade com o PostgreSQL...');
  const health = await healthCheck();
  if (health.status !== 'healthy') {
    console.error('❌ Não foi possível conectar ao banco de dados:', health.error);
    throw new Error(`Conexão com PostgreSQL falhou: ${health.error}`);
  }
  console.log(`✅ Conexão ativa! Versão: ${health.version} | Charset: ${health.encoding}`);

  try {
    if (action === 'latest') {
      console.log('⚡ Executando migrações pendentes (knex.migrate.latest)...');
      const [batchNo, log] = await db.migrate.latest();
      if (log.length === 0) {
        console.log('✨ Nenhuma migração pendente. O banco de dados já está na versão mais recente!');
      } else {
        console.log(`🎉 Sucesso! Batch ${batchNo} executou as seguintes migrações:`);
        log.forEach((file) => console.log(`   ✔ ${file}`));
      }
    } else if (action === 'rollback') {
      console.log('⏪ Executando reversão do último lote (knex.migrate.rollback)...');
      const [batchNo, log] = await db.migrate.rollback();
      if (log.length === 0) {
        console.log('✨ Nenhuma migração para reverter.');
      } else {
        console.log(`↩ Reversão concluída! Lote ${batchNo} revertido:`);
        log.forEach((file) => console.log(`   ✖ ${file}`));
      }
    } else if (action === 'status') {
      console.log('🔍 Verificando status das migrações...');
      const status = await db.migrate.status();
      console.log(`📊 Status code: ${status} (0 = todas executadas)`);
    }

    // 2. Auditoria e Validação das 12 Tabelas e Constraints
    console.log('\n🔍 Auditando integridade referencial das tabelas gerenciadas:');
    const tables = [
      'instituicoes_rfepct',
      'usuarios',
      'perfis_docentes',
      'trilhas_formativas',
      'progresso_trilhas',
      'requisicoes_ia',
      'telemetria_ab',
      'praticas_repositorio',
      'avaliacoes_praticas',
      'topicos_forum',
      'respostas_forum',
      'logs_auditoria',
    ];

    for (const table of tables) {
      const exists = await db.schema.hasTable(table);
      if (exists) {
        console.log(`   ✔ Tabela '${table}' verificada e ativa.`);
      } else if (action === 'latest') {
        console.error(`   ✖ ATENÇÃO: Tabela '${table}' ausente!`);
      }
    }

    console.log('================================================================');
  } catch (err) {
    console.error('❌ Erro durante a execução das migrations:', err.message);
    throw err;
  } finally {
    await db.destroy();
  }
}

// Execução via linha de comando: node knex-migrate.js [latest|rollback|status]
const arg = process.argv[2] || 'latest';
if (process.argv[1] && process.argv[1].endsWith('knex-migrate.js')) {
  runKnexMigrate(arg)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

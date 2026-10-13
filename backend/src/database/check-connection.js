import { healthCheck, closePool, pool } from '../config/database.js';

/**
 * Script de verificação rápida de conectividade com o PostgreSQL 16+
 * Uso: npm run db:check ou node backend/src/database/check-connection.js
 */
async function runCheck() {
  console.log('--- TESTE DE CONEXÃO COM POSTGRESQL 16+ ---');
  console.log(`Host:     ${pool.options.host || 'via connectionString'}`);
  console.log(`Porta:    ${pool.options.port}`);
  console.log(`Banco:    ${pool.options.database}`);
  console.log(`Usuário:  ${pool.options.user}`);
  console.log(`SSL:      ${pool.options.ssl ? 'Habilitado' : 'Desabilitado'}`);
  console.log(`Encoding: ${pool.options.client_encoding}`);
  console.log('-------------------------------------------');

  const health = await healthCheck();

  if (health.status === 'healthy') {
    console.log('✅ CONEXÃO ESTABELECIDA COM SUCESSO!');
    console.log(`   - Banco de Dados: ${health.database}`);
    console.log(`   - Versão do PG:   ${health.version}`);
    console.log(`   - Charset Atual:  ${health.encoding} (Critério UTF-8 atendido)`);
    console.log(`   - Latência:       ${health.latencyMs}ms`);
  } else {
    console.error('❌ ERRO NA CONEXÃO:', health.error);
    console.error('\n💡 Para subir o PostgreSQL local com Docker, execute:');
    console.error('   docker compose up -d postgres');
  }

  await closePool();
}

runCheck();

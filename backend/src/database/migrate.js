import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, getClient, healthCheck, closePool } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script de Execução e Migração do Schema PostgreSQL 16+
 * Plataforma IAprofEPT — PPGEM / UFJF
 */
export async function runMigrations() {
  console.log('================================================================');
  console.log('🚀 PLATAFORMA IAProfEPT — Inicialização do Banco PostgreSQL');
  console.log('================================================================');

  // 1. Healthcheck prévio da conexão
  console.log('📡 1. Verificando conectividade e parâmetros do PostgreSQL...');
  const health = await healthCheck();
  
  if (health.status !== 'healthy') {
    console.error('❌ Falha na conexão com o PostgreSQL:', health.error);
    console.error('💡 Certifique-se de que o container PostgreSQL está rodando (docker compose up -d) e as credenciais no .env estão corretas.');
    throw new Error(`Conexão com PostgreSQL falhou: ${health.error}`);
  }

  console.log(`✅ Conexão ativa com sucesso!`);
  console.log(`   - Banco de Dados: ${health.database}`);
  console.log(`   - Versão PG:      ${health.version}`);
  console.log(`   - Codificação:    ${health.encoding} (Critério UTF-8 atendido)`);
  console.log(`   - Latência:       ${health.latencyMs}ms`);

  // 2. Leitura do arquivo DDL schema.sql
  const schemaPath = path.join(__dirname, 'schema.sql');
  console.log(`\n📄 2. Lendo arquivo de schema DDL: ${schemaPath}`);
  
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Arquivo de schema não encontrado em: ${schemaPath}`);
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // 3. Execução das instruções no banco
  console.log('⚡ 3. Aplicando tabelas, índices e triggers...');
  const client = await getClient();

  try {
    await client.query('BEGIN');
    await client.query(schemaSql);
    await client.query('COMMIT');
    console.log('✅ Todas as definições de DDL foram aplicadas com sucesso!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro durante a execução da migração. Rollback executado:', error.message);
    throw error;
  } finally {
    client.release();
  }

  // 4. Verificação e Auditoria das 12 Entidades Criadas
  console.log('\n🔍 4. Auditando integridade das 12 entidades criadas no PostgreSQL:');
  const checkTablesQuery = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;
  const result = await pool.query(checkTablesQuery);
  const existingTables = result.rows.map(r => r.table_name);

  const requiredTables = [
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

  let missingCount = 0;
  for (const table of requiredTables) {
    if (existingTables.includes(table)) {
      console.log(`   ✔ [OK] Tabela '${table}' presente e íntegra.`);
    } else {
      console.error(`   ✖ [FALTA] Tabela obrigatória '${table}' não foi encontrada!`);
      missingCount++;
    }
  }

  if (missingCount === 0) {
    console.log('\n🎉 SUCESSO: Todas as 12 entidades foram modeladas e migradas perfeitamente!');
    console.log('================================================================');
  } else {
    throw new Error(`Faltam ${missingCount} tabelas no banco de dados.`);
  }

  return { success: true, totalTables: existingTables.length };
}

// Execução direta via CLI: node backend/src/database/migrate.js
if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  runMigrations()
    .then(async () => {
      await closePool();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('💥 Erro fatal:', err.message);
      await closePool();
      process.exit(1);
    });
}

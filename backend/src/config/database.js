import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Carrega variáveis de ambiente do .env
dotenv.config();

/**
 * Configuração de conexão com o banco de dados PostgreSQL 16+
 * Plataforma IAprofEPT - PPGEM / UFJF
 * 
 * Atende aos requisitos:
 * - Pool de conexões estável e resiliente
 * - Charset UTF-8 explícito para preservar notação matemática e acentuação da língua portuguesa
 * - Suporte configurável a SSL (UFJF institucional / AWS RDS / Docker local)
 * - Monitoramento de eventos do pool e health check
 */

// Tratamento de SSL configurável
function resolveSslConfig() {
  const sslMode = (process.env.PGSSLMODE || process.env.DATABASE_SSL || 'prefer').toLowerCase();
  
  if (sslMode === 'disable' || sslMode === 'false' || sslMode === 'off') {
    return false;
  }

  // Em produção ou servidores com certificado emitido/auto-assinado pela UFJF
  const rejectUnauthorized = process.env.PGSSL_REJECT_UNAUTHORIZED === 'true';

  const sslConfig = {
    rejectUnauthorized,
  };

  if (process.env.PGSSL_CA) {
    sslConfig.ca = process.env.PGSSL_CA;
  }

  return sslConfig;
}

const poolConfig = {
  // Conexão via URL única ou parâmetros separados
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'iaprofept_db',
  
  // Parâmetros do Pool de Conexões
  max: parseInt(process.env.PG_MAX_POOL || '20', 10), // Máximo de clientes no pool
  min: parseInt(process.env.PG_MIN_POOL || '2', 10),  // Conexões mínimas ociosas
  idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT || '30000', 10), // 30s
  connectionTimeoutMillis: parseInt(process.env.PG_CONN_TIMEOUT || '5000', 10), // 5s

  // Forçar codificação UTF-8 e parâmetros de sessão
  client_encoding: 'UTF8',

  // Configuração SSL
  ssl: resolveSslConfig(),
};

// Se DATABASE_URL estiver definida, o driver 'pg' a prioriza; caso contrário, usa host/port/user
if (!process.env.DATABASE_URL) {
  delete poolConfig.connectionString;
}

export const pool = new Pool(poolConfig);

// Eventos de telemetria do pool de conexões
pool.on('connect', (client) => {
  // Garante explicitamente client_encoding UTF8 em toda nova conexão do pool
  client.query("SET client_encoding TO 'UTF8'")
    .catch((err) => console.error('[PostgreSQL] Erro ao aplicar client_encoding UTF8:', err.message));
});

pool.on('error', (err, client) => {
  console.error('[PostgreSQL Pool Error] Erro inesperado no cliente ocioso do pool:', err.message);
});

/**
 * Executa uma consulta SQL parametrizada no pool
 * @param {string} text - Consulta SQL com placeholders ($1, $2, ...)
 * @param {Array} params - Parâmetros da consulta
 * @returns {Promise<import('pg').QueryResult>}
 */
export async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.DEBUG_SQL === 'true') {
      console.log(`[PostgreSQL Query] Executada em ${duration}ms | Linhas: ${res.rowCount} | SQL: ${text.slice(0, 100)}...`);
    }
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`[PostgreSQL Query Error] Falha após ${duration}ms | SQL: ${text.slice(0, 100)}... | Erro:`, error.message);
    throw error;
  }
}

/**
 * Obtém um cliente exclusivo para operações transacionais (BEGIN / COMMIT / ROLLBACK)
 * @returns {Promise<import('pg').PoolClient>}
 */
export async function getClient() {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);

  // Sobrescreve release para garantir limpeza
  client.release = () => {
    return release();
  };

  return client;
}

/**
 * Health Check para monitoramento e rotas de status da API
 * @returns {Promise<{ status: string, latencyMs: number, database: string, version: string, encoding: string }>}
 */
export async function healthCheck() {
  const start = Date.now();
  try {
    const result = await pool.query(`
      SELECT 
        current_database() AS database_name,
        version() AS pg_version,
        pg_encoding_to_char(encoding) AS db_encoding,
        NOW() AS server_time
    `);
    const latencyMs = Date.now() - start;
    const row = result.rows[0];

    return {
      status: 'healthy',
      latencyMs,
      database: row.database_name,
      version: row.pg_version.split(' ')[0] + ' ' + row.pg_version.split(' ')[1],
      encoding: row.db_encoding,
      serverTime: row.server_time,
    };
  } catch (error) {
    const latencyMs = Date.now() - start;
    return {
      status: 'unhealthy',
      latencyMs,
      error: error.message,
    };
  }
}

/**
 * Fecha graciosamente o pool de conexões (usado em encerramento do processo ou testes)
 */
export async function closePool() {
  try {
    await pool.end();
    console.log('[PostgreSQL] Pool de conexões finalizado com sucesso.');
  } catch (err) {
    console.error('[PostgreSQL] Erro ao finalizar o pool de conexões:', err.message);
  }
}

export default {
  pool,
  query,
  getClient,
  healthCheck,
  closePool,
};

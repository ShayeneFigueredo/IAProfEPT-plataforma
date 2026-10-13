import dotenv from 'dotenv';
dotenv.config();

// Tratamento de SSL configurável
function resolveSslConfig() {
  const sslMode = (process.env.PGSSLMODE || process.env.DATABASE_SSL || 'prefer').toLowerCase();
  
  if (sslMode === 'disable' || sslMode === 'false' || sslMode === 'off') {
    return false;
  }

  const rejectUnauthorized = process.env.PGSSL_REJECT_UNAUTHORIZED === 'true';
  const sslConfig = { rejectUnauthorized };

  if (process.env.PGSSL_CA) {
    sslConfig.ca = process.env.PGSSL_CA;
  }

  return sslConfig;
}

const connection = process.env.DATABASE_URL 
  ? process.env.DATABASE_URL 
  : {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'iaprofept_db',
      ssl: resolveSslConfig(),
    };

/**
 * Configuração do Knex para controle de versão de migrations do PostgreSQL 16+
 * Plataforma IAprofEPT — PPGEM / UFJF
 */
const config = {
  development: {
    client: 'pg',
    connection,
    pool: {
      min: parseInt(process.env.PG_MIN_POOL || '2', 10),
      max: parseInt(process.env.PG_MAX_POOL || '20', 10),
    },
    migrations: {
      directory: './backend/src/database/migrations',
      tableName: 'knex_migrations',
      extension: 'js',
      loadExtensions: ['.js', '.mjs'],
    },
    seeds: {
      directory: './backend/src/database/seeds',
      extension: 'js',
      loadExtensions: ['.js', '.mjs'],
    },
  },

  test: {
    client: 'pg',
    connection: process.env.DATABASE_URL_TEST || {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE_TEST || 'iaprofept_test_db',
      ssl: false,
    },
    pool: { min: 1, max: 5 },
    migrations: {
      directory: './backend/src/database/migrations',
      tableName: 'knex_migrations',
    },
  },

  production: {
    client: 'pg',
    connection,
    pool: {
      min: 5,
      max: 50,
    },
    migrations: {
      directory: './backend/src/database/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './backend/src/database/seeds',
    },
  },
};

export default config;

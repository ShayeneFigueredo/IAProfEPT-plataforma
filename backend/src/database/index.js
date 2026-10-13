import { pool, query, getClient, healthCheck, closePool } from '../config/database.js';
import { searchPraticas, searchForuns } from './search.js';

/**
 * Ponto central de exportação da camada de banco de dados PostgreSQL
 * Plataforma IAprofEPT (PPGEM / UFJF)
 */

export {
  pool,
  query,
  getClient,
  healthCheck,
  closePool,
  searchPraticas,
  searchForuns,
};

export default {
  pool,
  query,
  getClient,
  healthCheck,
  closePool,
  searchPraticas,
  searchForuns,
};

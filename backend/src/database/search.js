import { pool, query } from '../config/database.js';

/**
 * Módulo de Busca Otimizada com pg_trgm e Full-Text Search (FTS)
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Atende aos critérios:
 * - Busca textual rápida e tolerante a erros de digitação (fuzzy matching)
 * - Filtragem composta por Curso Técnico, Eixo CNCT e Tema Matemático
 * - Tempo de execução das consultas < 50ms
 */

/**
 * Busca práticas no Repositório combinando trigramas e full-text search
 * @param {string} term - Termo de busca digitado pelo docente
 * @param {object} filters - Filtros de curso, eixo e tema
 * @param {object} options - Paginação e ordenação
 * @returns {Promise<{ items: Array, total: number, latencyMs: number }>}
 */
export async function searchPraticas(term = '', filters = {}, options = {}) {
  const start = Date.now();
  const { cursoTecnico, eixoCnct, temaMatematico } = filters;
  const limit = parseInt(options.limit || '12', 10);
  const offset = parseInt(options.offset || '0', 10);

  const cleanTerm = (term || '').trim();
  const conditions = ['p.deleted_at IS NULL', 'p.publicado = TRUE'];
  const params = [];
  let paramIdx = 1;

  // Filtro exato por Curso Técnico
  if (cursoTecnico && cursoTecnico !== 'Todos') {
    conditions.push(`p.curso_tecnico = $${paramIdx++}`);
    params.push(cursoTecnico);
  }

  // Filtro por Eixo Tecnológico CNCT
  if (eixoCnct && eixoCnct !== 'Todos') {
    conditions.push(`p.eixo_cnct = $${paramIdx++}`);
    params.push(eixoCnct);
  }

  // Filtro por Tema Matemático
  if (temaMatematico && temaMatematico !== 'Todos') {
    conditions.push(`p.tema_matematico = $${paramIdx++}`);
    params.push(temaMatematico);
  }

  let selectScore = '1.0 AS relevance_score';
  let orderBy = 'p.created_at DESC';

  if (cleanTerm) {
    const termPlaceholder = `$${paramIdx++}`;
    params.push(cleanTerm);

    // Combina Trigram Similarity (pg_trgm) com Full-Text Search rank
    selectScore = `
      (
        similarity(p.titulo, ${termPlaceholder}) * 0.6 +
        similarity(COALESCE(p.descricao, ''), ${termPlaceholder}) * 0.2 +
        similarity(p.tema_matematico, ${termPlaceholder}) * 0.2
      ) AS relevance_score
    `;

    // Filtra por similaridade mínima ou correspondência de trigramas/FTS
    conditions.push(`
      (
        p.titulo % ${termPlaceholder}
        OR p.descricao % ${termPlaceholder}
        OR p.conteudo_completo % ${termPlaceholder}
        OR to_tsvector('portuguese', p.titulo || ' ' || COALESCE(p.descricao, '') || ' ' || p.tema_matematico) 
           @@ plainto_tsquery('portuguese', ${termPlaceholder})
      )
    `);

    orderBy = 'relevance_score DESC, p.created_at DESC';
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Query otimizada com índices B-Tree e GIN Trigram
  const sql = `
    SELECT 
      p.id,
      p.titulo,
      p.descricao,
      p.curso_tecnico,
      p.eixo_cnct,
      p.tema_matematico,
      p.habilidades_bncc,
      p.total_curtidas,
      p.total_favoritos,
      p.total_avaliacoes,
      p.media_estrelas,
      p.created_at,
      u.nome AS autor_nome,
      ${selectScore}
    FROM praticas_repositorio p
    LEFT JOIN usuarios u ON p.usuario_id = u.id
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT $${paramIdx++} OFFSET $${paramIdx++};
  `;

  params.push(limit, offset);

  const result = await query(sql, params);
  const latencyMs = Date.now() - start;

  return {
    items: result.rows,
    count: result.rows.length,
    latencyMs,
    targetMet: latencyMs < 50,
  };
}

/**
 * Busca tópicos e debates no Fórum de Reflexão Crítica com trigramas
 * @param {string} term - Termo de busca
 * @param {object} filters - Tag temática
 * @returns {Promise<{ items: Array, latencyMs: number }>}
 */
export async function searchForuns(term = '', filters = {}, options = {}) {
  const start = Date.now();
  const { tagTematica } = filters;
  const limit = parseInt(options.limit || '10', 10);
  const offset = parseInt(options.offset || '0', 10);

  const cleanTerm = (term || '').trim();
  const conditions = [];
  const params = [];
  let paramIdx = 1;

  if (tagTematica && tagTematica !== 'todas') {
    conditions.push(`t.tag_tematica = $${paramIdx++}`);
    params.push(tagTematica);
  }

  let selectScore = '1.0 AS relevance_score';
  let orderBy = 't.fixado DESC, t.updated_at DESC';

  if (cleanTerm) {
    const termPlaceholder = `$${paramIdx++}`;
    params.push(cleanTerm);

    selectScore = `
      (
        similarity(t.titulo, ${termPlaceholder}) * 0.7 +
        similarity(t.conteudo, ${termPlaceholder}) * 0.3
      ) AS relevance_score
    `;

    conditions.push(`
      (
        t.titulo % ${termPlaceholder}
        OR t.conteudo % ${termPlaceholder}
        OR to_tsvector('portuguese', t.titulo || ' ' || t.conteudo) @@ plainto_tsquery('portuguese', ${termPlaceholder})
      )
    `);

    orderBy = 't.fixado DESC, relevance_score DESC, t.updated_at DESC';
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      t.id,
      t.titulo,
      t.conteudo,
      t.tag_tematica,
      t.total_respostas,
      t.fixado,
      t.created_at,
      t.updated_at,
      u.nome AS autor_nome,
      ${selectScore}
    FROM topicos_forum t
    LEFT JOIN usuarios u ON t.usuario_id = u.id
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT $${paramIdx++} OFFSET $${paramIdx++};
  `;

  params.push(limit, offset);

  const result = await query(sql, params);
  const latencyMs = Date.now() - start;

  return {
    items: result.rows,
    count: result.rows.length,
    latencyMs,
    targetMet: latencyMs < 50,
  };
}

export default {
  searchPraticas,
  searchForuns,
};

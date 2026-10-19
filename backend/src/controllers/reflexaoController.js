import { query, getClient } from '../config/database.js';

export const reflexaoController = {
  // GET /api/reflexao/topicos
  async listarTopicos(req, res, next) {
    try {
      const sql = `
        SELECT t.id, t.titulo, t.conteudo, t.tag_tematica, t.total_respostas, t.fixado, t.created_at, t.updated_at,
               u.nome as autor_nome
        FROM topicos_forum t
        LEFT JOIN usuarios u ON t.usuario_id = u.id
        ORDER BY t.fixado DESC, t.updated_at DESC
      `;
      const result = await query(sql);
      res.status(200).json(result.rows);
    } catch (error) {
      next(error);
    }
  },

  // POST /api/reflexao/topicos
  async criarTopico(req, res, next) {
    try {
      const { titulo, conteudo, tag_tematica } = req.body;
      const usuario_id = req.user ? req.user.id : null; // Se mockado no teste
      
      if (!titulo || !conteudo || !tag_tematica) {
        return res.status(400).json({ error: 'Título, conteúdo e tag temática são obrigatórios.' });
      }

      const sql = `
        INSERT INTO topicos_forum (titulo, conteudo, tag_tematica, usuario_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const result = await query(sql, [titulo, conteudo, tag_tematica, usuario_id]);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  },

  // GET /api/reflexao/topicos/:id/respostas
  async listarRespostas(req, res, next) {
    try {
      const topico_id = req.params.id;

      // Recursive CTE para buscar árvore de respostas
      const sql = `
        WITH RECURSIVE arvore_respostas AS (
          -- Caso base: Respostas diretas ao tópico (sem pai)
          SELECT 
            r.id, r.topico_id, r.resposta_pai_id, r.conteudo, r.created_at, r.updated_at,
            u.nome as autor_nome,
            1 AS nivel,
            ARRAY[r.created_at] as caminho_ordenacao
          FROM respostas_forum r
          LEFT JOIN usuarios u ON r.usuario_id = u.id
          WHERE r.topico_id = $1 AND r.resposta_pai_id IS NULL

          UNION ALL

          -- Passo recursivo: Respostas das respostas
          SELECT 
            r.id, r.topico_id, r.resposta_pai_id, r.conteudo, r.created_at, r.updated_at,
            u.nome as autor_nome,
            ar.nivel + 1 AS nivel,
            ar.caminho_ordenacao || r.created_at as caminho_ordenacao
          FROM respostas_forum r
          JOIN arvore_respostas ar ON r.resposta_pai_id = ar.id
          LEFT JOIN usuarios u ON r.usuario_id = u.id
        )
        SELECT * FROM arvore_respostas
        ORDER BY caminho_ordenacao;
      `;
      
      const result = await query(sql, [topico_id]);

      // Função para estruturar a árvore no backend antes de devolver
      const montarArvore = (respostas) => {
        const mapa = {};
        const raizes = [];
        respostas.forEach(r => {
          mapa[r.id] = { ...r, respostas: [] };
        });
        respostas.forEach(r => {
          if (r.resposta_pai_id) {
             if (mapa[r.resposta_pai_id]) {
                mapa[r.resposta_pai_id].respostas.push(mapa[r.id]);
             }
          } else {
             raizes.push(mapa[r.id]);
          }
        });
        return raizes;
      };

      const arvore = montarArvore(result.rows);
      res.status(200).json(arvore);
    } catch (error) {
      next(error);
    }
  },

  // POST /api/reflexao/topicos/:id/respostas
  async adicionarResposta(req, res, next) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      
      const topico_id = req.params.id;
      const { conteudo, resposta_pai_id } = req.body;
      const usuario_id = req.user ? req.user.id : null;

      if (!conteudo) {
        return res.status(400).json({ error: 'Conteúdo da resposta é obrigatório.' });
      }

      // Validar existência do tópico
      const topicoCheck = await client.query('SELECT id FROM topicos_forum WHERE id = $1', [topico_id]);
      if (topicoCheck.rowCount === 0) {
        throw new Error('Tópico não encontrado');
      }

      // Inserir a resposta
      const insertSql = `
        INSERT INTO respostas_forum (topico_id, resposta_pai_id, conteudo, usuario_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const result = await client.query(insertSql, [topico_id, resposta_pai_id || null, conteudo, usuario_id]);
      
      // Incrementar contador de respostas no tópico
      await client.query(`
        UPDATE topicos_forum 
        SET total_respostas = total_respostas + 1, updated_at = NOW() 
        WHERE id = $1
      `, [topico_id]);

      await client.query('COMMIT');
      res.status(201).json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.message === 'Tópico não encontrado') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    } finally {
      client.release();
    }
  }
};

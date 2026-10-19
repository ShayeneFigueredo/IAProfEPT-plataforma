import { query } from '../config/database.js';

export const conteudosReflexaoController = {
  // GET /api/reflexao/artigos
  async listarArtigos(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const usuario_id = req.user ? req.user.id : null;

      // Buscar artigos com paginação e status de lido/favorito
      const sql = `
        SELECT 
          a.id, a.titulo, a.resumo, a.autor, a.tempo_leitura_minutos, a.tag_tematica, a.created_at,
          COALESCE(i.lido, false) as lido,
          COALESCE(i.favorito, false) as favorito
        FROM artigos_reflexao a
        LEFT JOIN interacoes_reflexao i 
          ON a.id = i.item_id AND i.tipo_item = 'artigo' AND i.usuario_id = $1
        ORDER BY a.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      const result = await query(sql, [usuario_id, limit, offset]);
      
      const countSql = `SELECT COUNT(*) FROM artigos_reflexao`;
      const countResult = await query(countSql);
      const total = parseInt(countResult.rows[0].count);

      res.status(200).json({
        data: result.rows,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/reflexao/artigos/:id
  async detalharArtigo(req, res, next) {
    try {
      const { id } = req.params;
      const usuario_id = req.user ? req.user.id : null;

      const sql = `
        SELECT 
          a.*,
          COALESCE(i.lido, false) as lido,
          COALESCE(i.favorito, false) as favorito
        FROM artigos_reflexao a
        LEFT JOIN interacoes_reflexao i 
          ON a.id = i.item_id AND i.tipo_item = 'artigo' AND i.usuario_id = $1
        WHERE a.id = $2
      `;
      const result = await query(sql, [usuario_id, id]);

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Artigo não encontrado.' });
      }

      res.status(200).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  },

  // GET /api/reflexao/provocacoes
  async listarProvocacoes(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const usuario_id = req.user ? req.user.id : null;

      const sql = `
        SELECT 
          p.id, p.titulo, p.autor, p.tempo_leitura_minutos, p.tag_tematica, p.created_at,
          COALESCE(i.lido, false) as lido,
          COALESCE(i.favorito, false) as favorito
        FROM provocacoes_reflexao p
        LEFT JOIN interacoes_reflexao i 
          ON p.id = i.item_id AND i.tipo_item = 'provocacao' AND i.usuario_id = $1
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      const result = await query(sql, [usuario_id, limit, offset]);

      const countSql = `SELECT COUNT(*) FROM provocacoes_reflexao`;
      const countResult = await query(countSql);
      const total = parseInt(countResult.rows[0].count);

      res.status(200).json({
        data: result.rows,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/reflexao/provocacoes/:id
  async detalharProvocacao(req, res, next) {
    try {
      const { id } = req.params;
      const usuario_id = req.user ? req.user.id : null;

      const sql = `
        SELECT 
          p.*,
          COALESCE(i.lido, false) as lido,
          COALESCE(i.favorito, false) as favorito
        FROM provocacoes_reflexao p
        LEFT JOIN interacoes_reflexao i 
          ON p.id = i.item_id AND i.tipo_item = 'provocacao' AND i.usuario_id = $1
        WHERE p.id = $2
      `;
      const result = await query(sql, [usuario_id, id]);

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Provocação não encontrada.' });
      }

      res.status(200).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  },

  // POST /api/reflexao/interacoes
  // Marca lido/favorito
  async registrarInteracao(req, res, next) {
    try {
      const { tipo_item, item_id, lido, favorito } = req.body;
      const usuario_id = req.user ? req.user.id : null;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }

      if (!tipo_item || !item_id || !['artigo', 'provocacao'].includes(tipo_item)) {
        return res.status(400).json({ error: 'Parâmetros inválidos.' });
      }

      // Upsert
      const sql = `
        INSERT INTO interacoes_reflexao (usuario_id, tipo_item, item_id, lido, favorito)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (usuario_id, tipo_item, item_id)
        DO UPDATE SET 
          lido = COALESCE($4, interacoes_reflexao.lido),
          favorito = COALESCE($5, interacoes_reflexao.favorito),
          updated_at = NOW()
        RETURNING *
      `;
      
      const lidoVal = lido !== undefined ? lido : null;
      const favoritoVal = favorito !== undefined ? favorito : null;

      const result = await query(sql, [usuario_id, tipo_item, item_id, lidoVal, favoritoVal]);
      res.status(200).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
};

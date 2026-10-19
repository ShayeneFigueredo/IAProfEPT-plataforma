import { query } from '../config/database.js';

export const suporteController = {
  // GET /api/suporte/metricas-docente
  async getMetricasDocente(req, res, next) {
    try {
      const usuarioId = req.user ? req.user.id : null;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }

      // 1. Trilhas Concluídas
      const trilhasSql = `SELECT COUNT(*) FROM progresso_trilhas WHERE usuario_id = $1 AND status = 'concluida'`;
      const trilhasResult = await query(trilhasSql, [usuarioId]);
      
      // 2. Materiais Gerados no Laboratório de IA
      const labSql = `SELECT COUNT(*) FROM requisicoes_ia WHERE usuario_id = $1`;
      const labResult = await query(labSql, [usuarioId]);

      // 3. Práticas Compartilhadas no Repositório
      const praticasSql = `SELECT COUNT(*) FROM praticas_repositorio WHERE usuario_id = $1`;
      const praticasResult = await query(praticasSql, [usuarioId]);

      // 4. Participação em Fóruns (Tópicos + Respostas)
      const topicosSql = `SELECT COUNT(*) FROM topicos_forum WHERE usuario_id = $1`;
      const topicosResult = await query(topicosSql, [usuarioId]);

      const respostasSql = `SELECT COUNT(*) FROM respostas_forum WHERE usuario_id = $1`;
      const respostasResult = await query(respostasSql, [usuarioId]);

      const participacaoForuns = parseInt(topicosResult.rows[0].count) + parseInt(respostasResult.rows[0].count);

      res.status(200).json({
        trilhasConcluidas: parseInt(trilhasResult.rows[0].count),
        materiaisGerados: parseInt(labResult.rows[0].count),
        praticasCompartilhadas: parseInt(praticasResult.rows[0].count),
        participacaoForuns: participacaoForuns
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/suporte/ticket
  async criarTicket(req, res, next) {
    try {
      const { assunto, mensagem, tipo } = req.body;
      const usuarioId = req.user ? req.user.id : null;

      if (!assunto || !mensagem) {
        return res.status(400).json({ error: 'Assunto e mensagem são obrigatórios.' });
      }

      const tipoTicket = tipo || 'duvida';

      const sql = `
        INSERT INTO tickets_suporte (usuario_id, assunto, mensagem, tipo)
        VALUES ($1, $2, $3, $4)
        RETURNING id, status, created_at
      `;

      const result = await query(sql, [usuarioId, assunto, mensagem, tipoTicket]);

      res.status(201).json({
        mensagem: 'Ticket enviado com sucesso!',
        ticket: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }
};

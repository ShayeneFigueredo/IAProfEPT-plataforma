import { maiconService } from '../services/maiconService.js';

export const maiconController = {
  async chat(req, res, next) {
    try {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Parâmetro "messages" ausente ou inválido.' });
      }

      // Configuração dos headers para Server-Sent Events (SSE)
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        // Necessário para evitar buffering no Nginx ou proxy institucional
        'X-Accel-Buffering': 'no'
      });

      // Stream via Groq (compatível com LLaMA3) ou Gemini
      await maiconService.streamChat(messages, res);

    } catch (error) {
      console.error('[mAIcon] Erro no streaming de chat:', error);
      // Se os headers já foram enviados, precisamos terminar o stream com erro
      if (!res.headersSent) {
        next(error);
      } else {
        res.write(`data: [DONE]\n\n`);
        res.end();
      }
    }
  }
};


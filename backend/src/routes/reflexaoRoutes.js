import { Router } from 'express';
import { reflexaoController } from '../controllers/reflexaoController.js';
import { conteudosReflexaoController } from '../controllers/conteudosReflexaoController.js';
import { optionalAuthenticateToken, authenticateToken } from '../middlewares/authMiddleware.js';

const reflexaoRoutes = Router();

// Fóruns
reflexaoRoutes.get('/topicos', reflexaoController.listarTopicos);
reflexaoRoutes.post('/topicos', optionalAuthenticateToken, reflexaoController.criarTopico);
reflexaoRoutes.get('/topicos/:id/respostas', reflexaoController.listarRespostas);
reflexaoRoutes.post('/topicos/:id/respostas', optionalAuthenticateToken, reflexaoController.adicionarResposta);

// Conteúdos Curados (Artigos e Provocações)
reflexaoRoutes.get('/artigos', optionalAuthenticateToken, conteudosReflexaoController.listarArtigos);
reflexaoRoutes.get('/artigos/:id', optionalAuthenticateToken, conteudosReflexaoController.detalharArtigo);
reflexaoRoutes.get('/provocacoes', optionalAuthenticateToken, conteudosReflexaoController.listarProvocacoes);
reflexaoRoutes.get('/provocacoes/:id', optionalAuthenticateToken, conteudosReflexaoController.detalharProvocacao);

// Interações (Lido / Favorito)
reflexaoRoutes.post('/interacoes', authenticateToken, conteudosReflexaoController.registrarInteracao);

export default reflexaoRoutes;


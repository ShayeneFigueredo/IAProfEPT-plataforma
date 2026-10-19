import { Router } from 'express';
import { reflexaoController } from '../controllers/reflexaoController.js';
import { optionalAuthenticateToken, authenticateToken } from '../middlewares/authMiddleware.js';

const reflexaoRoutes = Router();

// Protegendo as rotas de criação para associar o usuário (se logado, req.user será setado)
// Utilizaremos optionalAuthenticateToken para permitir a criação (pode ser anônimo no teste, mas o sistema pode requerer)
reflexaoRoutes.get('/topicos', reflexaoController.listarTopicos);
reflexaoRoutes.post('/topicos', optionalAuthenticateToken, reflexaoController.criarTopico);
reflexaoRoutes.get('/topicos/:id/respostas', reflexaoController.listarRespostas);
reflexaoRoutes.post('/topicos/:id/respostas', optionalAuthenticateToken, reflexaoController.adicionarResposta);

export default reflexaoRoutes;

import { Router } from 'express';
import { maiconController } from '../controllers/maiconController.js';
import { optionalAuthenticateToken } from '../middlewares/authMiddleware.js';

const maiconRoutes = Router();

// Endpoint de Chatbot SSE - Rota protegida por autenticação (ou opcional no teste)
maiconRoutes.post('/chat', optionalAuthenticateToken, maiconController.chat);

export default maiconRoutes;

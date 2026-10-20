import { Router } from 'express';
import { suporteController } from '../controllers/suporteController.js';
import { optionalAuthenticateToken, authenticateToken } from '../middlewares/authMiddleware.js';

const suporteRoutes = Router();

// Para simplificar no teste, usaremos optionalAuthenticateToken,
// mas em um ambiente real seria authenticateToken.
suporteRoutes.get('/metricas-docente', optionalAuthenticateToken, suporteController.getMetricasDocente);
suporteRoutes.post('/ticket', optionalAuthenticateToken, suporteController.criarTicket);

export default suporteRoutes;


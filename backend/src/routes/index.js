import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';

const apiRouter = Router();

// Rota descritiva da API
apiRouter.get('/', (req, res) => {
  res.json({
    plataforma: 'IAprofEPT API',
    versao: '1.0.0',
    pesquisa: 'Tese de Doutorado PPGEM / UFJF',
    doutorando: 'Maycon Luiz Amaral Magalhães',
    orientadores: ['Prof. Dr. Eduardo Barrére', 'Prof. Dr. Manuel Cabral dos Santos Reis'],
    rotasDisponiveis: {
      health: '/api/health',
      ping: '/api/ping',
      authRegister: 'POST /api/auth/register',
      authLogin: 'POST /api/auth/login',
      authForgotPassword: 'POST /api/auth/forgot-password',
      authResetPassword: 'POST /api/auth/reset-password',
      authMe: 'GET /api/auth/me',
      authTermoEtico: 'GET /api/auth/termo-etico',
    },
    avisoEtico: 'Este ecossistema promove a autoridade docente e o uso pedagógico responsável de Inteligência Artificial na EPT.',
  });
});

// Acoplamento de módulos de rota
apiRouter.use('/', healthRoutes);
apiRouter.use('/auth', authRoutes);

export default apiRouter;

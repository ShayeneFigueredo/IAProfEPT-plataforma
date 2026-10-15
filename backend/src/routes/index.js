import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import adminRoutes from './adminRoutes.js';
import metricasRoutes from './metricasRoutes.js';

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
      health: 'GET /api/health',
      ping: 'GET /api/ping',
      authRegister: 'POST /api/auth/register',
      authLogin: 'POST /api/auth/login',
      authForgotPassword: 'POST /api/auth/forgot-password',
      authResetPassword: 'POST /api/auth/reset-password',
      authMe: 'GET /api/auth/me [Autenticado]',
      authTermoEtico: 'GET /api/auth/termo-etico',
      metricasTese: 'GET /api/metricas/tese [RBAC: pesquisador_doutorado, administrador_ufjf]',
      metricasTelemetria: 'GET /api/metricas/telemetria-ab [RBAC: pesquisador_doutorado, administrador_ufjf]',
      adminUsuarios: 'GET /api/admin/usuarios [RBAC: administrador_ufjf]',
      adminUsuarioStatus: 'PATCH /api/admin/usuarios/:id/status [RBAC: administrador_ufjf]',
      adminAuditoria: 'GET /api/admin/auditoria [RBAC: administrador_ufjf]',
      adminEstatisticas: 'GET /api/admin/estatisticas [RBAC: administrador_ufjf]',
    },
    avisoEtico: 'Este ecossistema promove a autoridade docente e o uso pedagógico responsável de Inteligência Artificial na EPT.',
  });
});

// Acoplamento de módulos de rota
apiRouter.use('/', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/metricas', metricasRoutes);

export default apiRouter;


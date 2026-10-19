import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import adminRoutes from './adminRoutes.js';
import metricasRoutes from './metricasRoutes.js';
import laboratorioRoutes from './laboratorioRoutes.js';
import telemetriaRoutes from './telemetriaRoutes.js';
import formativoRoutes from './formativoRoutes.js';
import repositorioRoutes from './repositorioRoutes.js';
import exportRoutes from './exportRoutes.js';
import reflexaoRoutes from './reflexaoRoutes.js';

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
      formativoTrilhas: 'GET /api/formativo/trilhas [Lista das 4 Trilhas e Progresso Docente]',
      formativoTrilhaDetalhes: 'GET /api/formativo/trilhas/:id [Conteúdo das Aulas e Vídeos]',
      formativoProgresso: 'POST /api/formativo/progresso [Persistência de Progresso do Docente no PostgreSQL]',
      formativoDocumentos: 'GET /api/formativo/documentos [Acervo Oficial com Filtro por Tags e Links]',
      formativoEbookPrompts: 'GET /api/formativo/ebook-prompts [Modelos Estruturados de Prompts para Ed. Matemática]',
      laboratorioGerar: 'POST /api/laboratorio/gerar [Circuit Breaker + Fallback Automático]',
      laboratorioCircuitBreakerStatus: 'GET /api/laboratorio/circuit-breaker-status',
      laboratorioMontarPrompt: 'POST /api/laboratorio/montar-prompt',
      laboratorioGerarGroq: 'POST /api/laboratorio/gerar-groq',
      laboratorioGroqBenchmark: 'GET /api/laboratorio/groq-benchmark',
      laboratorioGerarGemini: 'POST /api/laboratorio/gerar-gemini',
      laboratorioGeminiBenchmark: 'GET /api/laboratorio/gemini-benchmark',
      laboratorioParametros: 'GET /api/laboratorio/parametros-curriculares',
      repositorioCriarPratica: 'POST /api/repositorio/praticas [Autenticado - Compartilhamento]',
      repositorioListarPraticas: 'GET /api/repositorio/praticas [Listagem Paginada, Filtros e Busca]',
      repositorioBuscar: 'GET /api/repositorio/buscar [Busca Avançada: Curso Técnico, BNCC, pg_trgm < 100ms]',
      repositorioPraticaDetalhes: 'GET /api/repositorio/praticas/:id [Detalhes com Gabarito]',
      repositorioAtualizarPratica: 'PUT /api/repositorio/praticas/:id [Autenticado - Autor ou Admin]',
      repositorioDeletarPratica: 'DELETE /api/repositorio/praticas/:id [Autenticado - Soft Delete]',
      repositorioUploadAnexo: 'POST /api/repositorio/anexos [Autenticado - Multipart/form-data, 15MB, SHA-256]',
      repositorioDetalhesAnexo: 'GET /api/repositorio/anexos/:id [Metadados e Integridade]',
      repositorioDownloadAnexo: 'GET /api/repositorio/anexos/:id/download [Download Protegido com ETag SHA-256]',
      repositorioDeletarAnexo: 'DELETE /api/repositorio/anexos/:id [Autenticado - Soft Delete]',
      repositorioCurtir: 'POST /api/repositorio/praticas/:id/curtir [Autenticado - Toggle Atômico]',
      repositorioFavoritar: 'POST /api/repositorio/praticas/:id/favoritar [Autenticado - Toggle Atômico]',
      repositorioComentarios: 'POST /api/repositorio/praticas/:id/comentarios [Autenticado - Comentários e Relatos EPT]',
      repositorioListarComentarios: 'GET /api/repositorio/praticas/:id/comentarios [Listagem Paginada]',
      telemetriaAvaliacao: 'POST /api/telemetria/avaliacao [1 a 5 Estrelas, Tags Qualitativas & Feedback Docente]',
      telemetriaAvaliacaoEstatisticas: 'GET /api/telemetria/avaliacao/estatisticas [Consolidação A/B para Tese]',
      telemetriaRelatorioTese: 'GET /api/telemetria/relatorio-tese [Consolidação Estatística e Exportação JSON/CSV - RBAC: pesquisador_doutorado, administrador_ufjf]',
      telemetriaStatus: 'GET /api/telemetria/status [Vazão e Fila de Telemetria]',
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
apiRouter.use('/formativo', formativoRoutes);
apiRouter.use('/laboratorio', laboratorioRoutes);
apiRouter.use('/repositorio', repositorioRoutes);
apiRouter.use('/telemetria', telemetriaRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/metricas', metricasRoutes);
apiRouter.use('/export', exportRoutes);
apiRouter.use('/reflexao', reflexaoRoutes);

export default apiRouter;



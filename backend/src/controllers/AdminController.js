import { userRepository } from '../repositories/UserRepository.js';
import { BadRequestError, NotFoundError } from '../errors/AppError.js';

const VALID_STATUSES = ['ativo', 'pendente', 'suspenso', 'inativo'];

/**
 * Controller de Gestão Administrativa e Governança Institucional
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Acesso Restrito: administrador_ufjf
 */
export class AdminController {
  /**
   * GET /api/admin/usuarios
   * Listagem paginada de usuários da plataforma com seus perfis (sem expor hash de senha)
   */
  async listUsers(req, res, next) {
    try {
      const { page, limit, role, status, search } = req.query;
      const result = await userRepository.listUsers({ page, limit, role, status, search });
      return res.status(200).json({
        sucesso: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/admin/usuarios/:id/status
   * Altera status da conta de um usuário (ativo, pendente, suspenso, inativo)
   */
  async updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !VALID_STATUSES.includes(status)) {
        throw new BadRequestError(
          `Status inválido. Deve ser um dos seguintes valores: ${VALID_STATUSES.join(', ')}.`
        );
      }

      const updated = await userRepository.updateUserStatus(id, status, req.user?.id);
      if (!updated) {
        throw new NotFoundError(`Usuário com ID '${id}' não foi encontrado.`);
      }

      return res.status(200).json({
        sucesso: true,
        mensagem: `Status do usuário atualizado para '${status}' com sucesso.`,
        usuario: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/auditoria
   * Consulta paginada aos logs de auditoria do sistema
   */
  async getAuditLogs(req, res, next) {
    try {
      const { page, limit, acao, recurso, usuarioId } = req.query;
      const result = await userRepository.findAuditLogs({ page, limit, acao, recurso, usuarioId });
      return res.status(200).json({
        sucesso: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/estatisticas
   * Visão geral de métricas do sistema e adoção docente para administração UFJF
   */
  async getSystemStats(req, res, next) {
    try {
      const stats = await userRepository.getSystemStats();
      return res.status(200).json({
        sucesso: true,
        estatisticas: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
export default adminController;

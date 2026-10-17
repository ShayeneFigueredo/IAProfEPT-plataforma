import { formativoRepository } from '../repositories/FormativoRepository.js';
import { validarAtualizacaoProgresso } from '../validators/formativoValidator.js';
import { UnauthorizedError } from '../errors/AppError.js';

/**
 * Controller do Ambiente Formativo
 * Plataforma IAprofEPT — PPGEM / UFJF
 * Doutorando: Maycon Luiz Amaral Magalhães
 */
export class FormativoController {
  constructor() {
    this.getTrilhas = this.getTrilhas.bind(this);
    this.getTrilhaDetalhes = this.getTrilhaDetalhes.bind(this);
    this.atualizarProgresso = this.atualizarProgresso.bind(this);
  }

  /**
   * GET /api/formativo/trilhas
   * Retorna a lista das 4 trilhas oficiais com contadores de aulas,
   * carga horária estimada e porcentagem de conclusão do docente autenticado.
   */
  async getTrilhas(req, res, next) {
    try {
      const usuarioId = req.user?.id || null;
      const resultado = await formativoRepository.listarTrilhasComProgresso(usuarioId);

      return res.status(200).json({
        sucesso: true,
        totalTrilhas: resultado.totalTrilhas,
        totalTrilhasConcluidas: resultado.totalTrilhasConcluidas,
        percentualGeralPrograma: resultado.percentualGeralPrograma,
        trilhas: resultado.trilhas,
        usuarioAutenticado: req.user
          ? {
              id: req.user.id,
              nome: req.user.nome,
              email: req.user.email,
              role: req.user.role,
            }
          : null,
        avisoEtico:
          'Este ecossistema promove a autoridade docente e a formação continuada em Inteligência Artificial na Educação Profissional e Tecnológica.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/formativo/trilhas/:id
   * Retorna o conteúdo completo de uma trilha (módulos, aulas, vídeos e materiais)
   * com o status de conclusão individualizado de cada aula.
   */
  async getTrilhaDetalhes(req, res, next) {
    try {
      const { id } = req.params;
      const usuarioId = req.user?.id || null;

      const trilha = await formativoRepository.buscarTrilhaDetalhada(id, usuarioId);

      return res.status(200).json({
        sucesso: true,
        trilha,
        avisoEtico:
          'Os materiais didáticos do Ambiente Formativo devem ser criticamente avaliados e adaptados pela autoridade docente antes de sua transposição para a sala de aula.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/formativo/progresso
   * Registra a conclusão ou desmarcação de aula pelo docente no PostgreSQL,
   * recalculando a porcentagem da trilha e permitindo retomar entre sessões.
   */
  async atualizarProgresso(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        throw new UnauthorizedError('Autenticação necessária para registrar progresso formativo.');
      }

      // Validação estrita do payload
      const dadosValidados = validarAtualizacaoProgresso(req.body);

      // Atualização no repositório
      const progressoAtualizado = await formativoRepository.atualizarProgressoDocente({
        usuarioId: req.user.id,
        trilhaIdentificador: dadosValidados.trilhaId,
        aulaId: dadosValidados.aulaId,
        concluido: dadosValidados.concluido,
        tempoAssistidoSegundos: dadosValidados.tempoAssistidoSegundos,
      });

      return res.status(200).json({
        sucesso: true,
        mensagem: 'Progresso formativo persistido com sucesso.',
        progresso: progressoAtualizado,
        avisoEtico:
          'Sua jornada formativa valoriza a autonomia docente e a apropriação crítica das tecnologias de Inteligência Artificial na EPT.',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const formativoController = new FormativoController();
export default formativoController;

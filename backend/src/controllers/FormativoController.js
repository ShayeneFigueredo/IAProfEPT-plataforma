import fs from 'fs';
import path from 'path';
import { formativoRepository } from '../repositories/FormativoRepository.js';
import { acervoFormativoRepository } from '../repositories/AcervoFormativoRepository.js';
import { CertificatePdfService } from '../services/CertificatePdfService.js';
import { validarAtualizacaoProgresso } from '../validators/formativoValidator.js';
import { UnauthorizedError, BadRequestError, NotFoundError } from '../errors/AppError.js';

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
    this.getDocumentos = this.getDocumentos.bind(this);
    this.getEbookPrompts = this.getEbookPrompts.bind(this);
    this.criarDocumento = this.criarDocumento.bind(this);
    this.atualizarDocumento = this.atualizarDocumento.bind(this);
    this.excluirDocumento = this.excluirDocumento.bind(this);
    this.listarVideos = this.listarVideos.bind(this);
    this.criarVideo = this.criarVideo.bind(this);
    this.atualizarVideo = this.atualizarVideo.bind(this);
    this.excluirVideo = this.excluirVideo.bind(this);
    this.gerarCertificado = this.gerarCertificado.bind(this);
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

  /**
   * GET /api/formativo/documentos
   * Lista documentos oficiais, relatórios e marcos regulatórios da EPT
   * com suporte a filtragem por tags (Legislacao EPT, Relatorios UNESCO, Plano Brasileiro de IA),
   * busca textual e ano de publicação.
   */
  async getDocumentos(req, res, next) {
    try {
      const { tag, busca, ano } = req.query;

      const resultado = await acervoFormativoRepository.listarDocumentos({
        tag: tag ? String(tag).trim() : null,
        busca: busca ? String(busca).trim() : null,
        ano: ano ? String(ano).trim() : null,
      });

      return res.status(200).json({
        sucesso: true,
        total: resultado.total,
        totalGeralAcervo: resultado.totalGeralAcervo,
        filtroAplicado: resultado.filtroAplicado,
        tagsDisponiveis: resultado.tagsDisponiveis,
        contagemPorTag: resultado.contagemPorTag,
        documentos: resultado.documentos,
        avisoEtico:
          'Este material foi gerado por Inteligência Artificial e deve ser revisado, validado e adaptado pela autoridade docente antes de sua aplicação em sala de aula.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/formativo/ebook-prompts
   * Entrega os modelos estruturados de prompts para Educação Matemática na EPT,
   * permitindo filtragem por categoria pedagógica, busca textual e eixo tecnológico.
   */
  async getEbookPrompts(req, res, next) {
    try {
      const { categoria, busca, eixo } = req.query;

      const resultado = await acervoFormativoRepository.listarPromptsEbook({
        categoria: categoria ? String(categoria).trim() : null,
        busca: busca ? String(busca).trim() : null,
        eixo: eixo ? String(eixo).trim() : null,
      });

      return res.status(200).json({
        sucesso: true,
        total: resultado.total,
        totalGeralEbook: resultado.totalGeralEbook,
        filtroAplicado: resultado.filtroAplicado,
        categoriasDisponiveis: resultado.categoriasDisponiveis,
        contagemPorCategoria: resultado.contagemPorCategoria,
        prompts: resultado.prompts,
        avisoEtico:
          'Este material foi gerado por Inteligência Artificial e deve ser revisado, validado e adaptado pela autoridade docente antes de sua aplicação em sala de aula.',
      });
    } catch (err) {
      next(err);
    }
  }

  /* ========================================================================
     STUDIO: DOCUMENTOS (UPLOAD, EDIÇÃO E EXCLUSÃO)
     ======================================================================== */

  /**
   * POST /api/formativo/documentos
   * Salva documento no acervo, com suporte a upload de arquivo PDF via multer
   */
  async criarDocumento(req, res, next) {
    try {
      const { titulo, orgaoEmissor, categoria, tagPrincipal, anoPublicacao, descricao, url } = req.body;

      if (!titulo) {
        throw new BadRequestError('O título do documento é obrigatório.');
      }

      let docUrl = url || '';
      let tamanhoEstimado = '1.0 MB';
      let arquivoNome = null;

      if (req.file) {
        const uploadDir = path.resolve(process.cwd(), 'uploads', 'documentos');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const sanitizado = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filename = `${Date.now()}_${sanitizado}`;
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, req.file.buffer);

        docUrl = `/uploads/documentos/${filename}`;
        arquivoNome = req.file.originalname;
        tamanhoEstimado = `${(req.file.size / (1024 * 1024)).toFixed(1)} MB`;
      }

      const tagEscolhida = tagPrincipal || categoria || 'Legislação EPT';

      const novoDoc = acervoFormativoRepository.adicionarDocumento({
        titulo: String(titulo).trim(),
        orgaoEmissor: orgaoEmissor ? String(orgaoEmissor).trim() : 'MEC / Órgão Oficial',
        anoPublicacao: anoPublicacao || new Date().getFullYear(),
        tagPrincipal: tagEscolhida,
        tags: [tagEscolhida],
        descricao: descricao ? String(descricao).trim() : 'Documento inserido via Studio IAprofEPT.',
        url: docUrl,
        formato: 'PDF',
        tamanhoEstimado,
        arquivoNome,
      });

      return res.status(201).json({
        sucesso: true,
        mensagem: 'Documento cadastrado com sucesso no Ambiente Formativo.',
        documento: novoDoc,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/formativo/documentos/:id
   * Atualiza metadados e/ou substitui o arquivo PDF de um documento existente
   */
  async atualizarDocumento(req, res, next) {
    try {
      const { id } = req.params;
      const { titulo, orgaoEmissor, categoria, tagPrincipal, anoPublicacao, descricao, url } = req.body;

      const dadosAtualizar = {};
      if (titulo !== undefined) dadosAtualizar.titulo = String(titulo).trim();
      if (orgaoEmissor !== undefined) dadosAtualizar.orgaoEmissor = String(orgaoEmissor).trim();
      if (anoPublicacao !== undefined) dadosAtualizar.anoPublicacao = anoPublicacao;
      if (descricao !== undefined) dadosAtualizar.descricao = String(descricao).trim();
      if (url !== undefined) dadosAtualizar.url = url;

      const tagEscolhida = tagPrincipal || categoria;
      if (tagEscolhida) {
        dadosAtualizar.tagPrincipal = tagEscolhida;
        dadosAtualizar.tags = [tagEscolhida];
      }

      if (req.file) {
        const uploadDir = path.resolve(process.cwd(), 'uploads', 'documentos');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const sanitizado = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filename = `${Date.now()}_${sanitizado}`;
        fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);

        dadosAtualizar.url = `/uploads/documentos/${filename}`;
        dadosAtualizar.arquivoNome = req.file.originalname;
        dadosAtualizar.tamanhoEstimado = `${(req.file.size / (1024 * 1024)).toFixed(1)} MB`;
      }

      const atualizado = acervoFormativoRepository.atualizarDocumento(id, dadosAtualizar);
      if (!atualizado) {
        throw new NotFoundError('Documento não encontrado para atualização.');
      }

      return res.status(200).json({
        sucesso: true,
        mensagem: 'Documento atualizado com sucesso.',
        documento: atualizado,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/formativo/documentos/:id
   * Remove documento do acervo formativo
   */
  async excluirDocumento(req, res, next) {
    try {
      const { id } = req.params;
      const removido = acervoFormativoRepository.excluirDocumento(id);
      if (!removido) {
        throw new NotFoundError('Documento não encontrado para exclusão.');
      }

      return res.status(200).json({
        sucesso: true,
        mensagem: 'Documento removido com sucesso.',
      });
    } catch (err) {
      next(err);
    }
  }

  /* ========================================================================
     STUDIO: VÍDEOS (LISTAGEM, UPLOAD, EDIÇÃO E EXCLUSÃO)
     ======================================================================== */

  /**
   * GET /api/formativo/videos
   */
  async listarVideos(req, res, next) {
    try {
      const videos = acervoFormativoRepository.listarVideos();
      return res.status(200).json({
        sucesso: true,
        total: videos.length,
        videos,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/formativo/videos
   */
  async criarVideo(req, res, next) {
    try {
      const { titulo, youtubeId, descricao, objetivoPedagogico, autor, categoria, duracao } = req.body;

      if (!titulo || !youtubeId) {
        throw new BadRequestError('Título e ID ou URL do YouTube são obrigatórios.');
      }

      // Extrai ID do YouTube caso o usuário tenha colado o link completo
      const match = String(youtubeId).match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      const cleanYoutubeId = match ? match[1] : String(youtubeId).trim();

      const novoVideo = acervoFormativoRepository.adicionarVideo({
        titulo: String(titulo).trim(),
        youtubeId: cleanYoutubeId,
        descricao: descricao ? String(descricao).trim() : '',
        objetivoPedagogico: objetivoPedagogico ? String(objetivoPedagogico).trim() : '',
        autor: autor ? String(autor).trim() : 'Prof. Maycon Magalhães',
        categoria: categoria ? String(categoria).trim() : 'Fundamentos',
        duracao: duracao || '10 min',
      });

      return res.status(201).json({
        sucesso: true,
        mensagem: 'Vídeo adicionado com sucesso ao Ambiente Formativo.',
        video: novoVideo,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/formativo/videos/:id
   */
  async atualizarVideo(req, res, next) {
    try {
      const { id } = req.params;
      const { titulo, youtubeId, descricao, objetivoPedagogico, autor, categoria, duracao } = req.body;

      let cleanYoutubeId = youtubeId;
      if (youtubeId) {
        const match = String(youtubeId).match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
        cleanYoutubeId = match ? match[1] : String(youtubeId).trim();
      }

      const atualizado = acervoFormativoRepository.atualizarVideo(id, {
        titulo,
        youtubeId: cleanYoutubeId,
        descricao,
        objetivoPedagogico,
        autor,
        categoria,
        duracao,
      });

      if (!atualizado) {
        throw new NotFoundError('Vídeo não encontrado para atualização.');
      }

      return res.status(200).json({
        sucesso: true,
        mensagem: 'Vídeo atualizado com sucesso.',
        video: atualizado,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/formativo/videos/:id
   */
  async excluirVideo(req, res, next) {
    try {
      const { id } = req.params;
      const removido = acervoFormativoRepository.excluirVideo(id);
      if (!removido) {
        throw new NotFoundError('Vídeo não encontrado para exclusão.');
      }

      return res.status(200).json({
        sucesso: true,
        mensagem: 'Vídeo removido com sucesso.',
      });
    } catch (err) {
      next(err);
    }
  }

  /* ========================================================================
     STUDIO: GERAÇÃO REAL DE CERTIFICADO EM PDF (PUPPETEER)
     ======================================================================== */

  /**
   * POST /api/formativo/certificados/gerar
   */
  async gerarCertificado(req, res, next) {
    try {
      const { alunoNome, cursoNome, cargaHoraria, dataConclusao } = req.body;

      if (!alunoNome || !cursoNome) {
        throw new BadRequestError('Nome do aluno e nome do curso são obrigatórios para a emissão do certificado.');
      }

      const pdfBuffer = await CertificatePdfService.generateCertificatePdf({
        alunoNome: String(alunoNome).trim(),
        cursoNome: String(cursoNome).trim(),
        cargaHoraria: cargaHoraria || '40 horas',
        dataConclusao: dataConclusao || null,
      });

      const nomeSanitizado = String(alunoNome).replace(/[^a-zA-Z0-9]/g, '_');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Certificado_${nomeSanitizado}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.send(pdfBuffer);
    } catch (err) {
      console.error('[FormativoController] Erro ao gerar certificado PDF:', err);
      next(err);
    }
  }
}

export const formativoController = new FormativoController();
export default formativoController;

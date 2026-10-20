import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  DOCUMENTOS_OFICIAIS_ACERVO,
  TAGS_DOCUMENTOS_CANONICAS,
  MAPA_NORMALIZACAO_TAGS_DOCS,
} from '../config/documentosOficiais.js';

import {
  MODELOS_EBOOK_PROMPTS,
  CATEGORIAS_PROMPTS_CANONICAS,
} from '../config/ebookPromptsContent.js';

import { VIDEOS_FORMATIVO_INICIAIS } from '../config/videosFormativo.js';

/**
 * Normaliza strings removendo acentos e convertendo para minúsculas
 */
function normalizarTexto(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Repositório em memória do Acervo de Documentos Oficiais e E-book de Prompts
 * Plataforma IAprofEPT — PPGEM / UFJF
 * Doutorando: Maycon Luiz Amaral Magalhães
 * 
 * Atende aos requisitos de retorno ultra-rápido (< 20ms) e integridade de metadados.
 */
export class AcervoFormativoRepository {
  constructor() {
    this.persistencePath = path.resolve(process.cwd(), 'uploads', 'custom_acervo.json');
    this.documentos = [...DOCUMENTOS_OFICIAIS_ACERVO];
    this.promptsEbook = [...MODELOS_EBOOK_PROMPTS];
    this.videos = [...VIDEOS_FORMATIVO_INICIAIS];
    this.customDocs = [];
    this.customVideos = [];
    
    this.carregarDadosPersistidos();
  }

  /**
   * Carrega acervo customizado salvo em disco
   */
  carregarDadosPersistidos() {
    try {
      if (fs.existsSync(this.persistencePath)) {
        const raw = fs.readFileSync(this.persistencePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.customDocs)) {
          this.customDocs = parsed.customDocs;
          // Anexa os customizados garantindo que não há duplicidade de id
          const idsExistentes = new Set(this.documentos.map(d => d.id));
          for (const doc of this.customDocs) {
            if (!idsExistentes.has(doc.id)) {
              this.documentos.unshift(doc);
              idsExistentes.add(doc.id);
            }
          }
        }
        if (Array.isArray(parsed.customVideos)) {
          this.customVideos = parsed.customVideos;
          const idsExistentes = new Set(this.videos.map(v => v.id));
          for (const vid of this.customVideos) {
            if (!idsExistentes.has(vid.id)) {
              this.videos.unshift(vid);
              idsExistentes.add(vid.id);
            }
          }
        }
      }
    } catch (e) {
      console.warn('[AcervoFormativoRepository] Aviso ao carregar acervo customizado:', e.message);
    }
  }

  /**
   * Salva dados customizados em disco de forma síncrona/atômica
   */
  salvarDadosPersistidos() {
    try {
      const dir = path.dirname(this.persistencePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        this.persistencePath,
        JSON.stringify({ customDocs: this.customDocs, customVideos: this.customVideos }, null, 2),
        'utf8'
      );
    } catch (e) {
      console.error('[AcervoFormativoRepository] Erro ao salvar acervo customizado:', e.message);
    }
  }

  /**
   * Resolve e normaliza a tag informada na requisição
   * Mapeia variações como 'unesco' -> 'Relatorios UNESCO', 'pbia' -> 'Plano Brasileiro de IA'
   */
  resolverTagCanonica(tagRaw) {
    if (!tagRaw || typeof tagRaw !== 'string') return null;
    const chave = normalizarTexto(tagRaw);

    // 1. Mapeamento direto
    if (MAPA_NORMALIZACAO_TAGS_DOCS[chave]) {
      return MAPA_NORMALIZACAO_TAGS_DOCS[chave];
    }

    // 2. Procura nas tags canônicas
    const encontrada = TAGS_DOCUMENTOS_CANONICAS.find(
      (c) => normalizarTexto(c) === chave
    );
    if (encontrada) return encontrada;

    // 3. Busca por substring se houver correspondência inequívoca
    if (chave.includes('unesco')) return 'Relatorios UNESCO';
    if (chave.includes('pbia') || chave.includes('plano') && chave.includes('ia')) return 'Plano Brasileiro de IA';
    if (chave.includes('legislacao') || chave.includes('lei') || chave.includes('cnct')) return 'Legislacao EPT';
    if (chave.includes('mec') || chave.includes('diretriz')) return 'Diretriz MEC';
    if (chave.includes('teoria') || chave.includes('skovsmose')) return 'Fundamentação Teórica';

    return tagRaw.trim();
  }

  /**
   * Lista documentos oficiais com filtragem avançada e contadores
   * 
   * @param {Object} [filtros]
   * @param {string} [filtros.tag] - Tag canônica ou termo associado
   * @param {string} [filtros.busca] - Termo de busca textual
   * @param {number|string} [filtros.ano] - Ano de publicação
   * @returns {Object} Lista filtrada e metadados estatísticos
   */
  async listarDocumentos({ tag = null, busca = null, ano = null } = {}) {
    let lista = [...this.documentos];

    const tagResolvida = tag ? this.resolverTagCanonica(tag) : null;
    const tagNorm = tagResolvida ? normalizarTexto(tagResolvida) : null;
    const buscaNorm = busca ? normalizarTexto(busca) : null;
    const anoNum = ano ? parseInt(ano, 10) : null;

    if (tagNorm) {
      lista = lista.filter((doc) => {
        const tagPrincipalNorm = normalizarTexto(doc.tagPrincipal);
        const tagsArrayNorm = (doc.tags || []).map((t) => normalizarTexto(t));
        return tagPrincipalNorm === tagNorm || tagsArrayNorm.includes(tagNorm);
      });
    }

    if (buscaNorm) {
      lista = lista.filter((doc) => {
        const tituloNorm = normalizarTexto(doc.titulo);
        const descNorm = normalizarTexto(doc.descricao);
        const emissorNorm = normalizarTexto(doc.orgaoEmissor);
        const tagsStr = (doc.tags || []).map((t) => normalizarTexto(t)).join(' ');

        return (
          tituloNorm.includes(buscaNorm) ||
          descNorm.includes(buscaNorm) ||
          emissorNorm.includes(buscaNorm) ||
          tagsStr.includes(buscaNorm)
        );
      });
    }

    if (anoNum && !Number.isNaN(anoNum)) {
      lista = lista.filter((doc) => doc.anoPublicacao === anoNum);
    }

    // Calcula contagem de documentos por tag canônica para navegação no frontend
    const contagemPorTag = {};
    for (const tagCanonica of TAGS_DOCUMENTOS_CANONICAS) {
      const canonicaNorm = normalizarTexto(tagCanonica);
      contagemPorTag[tagCanonica] = this.documentos.filter((doc) => {
        const principalNorm = normalizarTexto(doc.tagPrincipal);
        const tagsArr = (doc.tags || []).map((t) => normalizarTexto(t));
        return principalNorm === canonicaNorm || tagsArr.includes(canonicaNorm);
      }).length;
    }

    return {
      documentos: lista,
      total: lista.length,
      totalGeralAcervo: this.documentos.length,
      filtroAplicado: {
        tagOriginal: tag || null,
        tagResolvida: tagResolvida || null,
        busca: busca || null,
        ano: anoNum || null,
      },
      tagsDisponiveis: TAGS_DOCUMENTOS_CANONICAS,
      contagemPorTag,
    };
  }

  /**
   * Lista modelos estruturados de prompts para Educação Matemática no E-book
   * 
   * @param {Object} [filtros]
   * @param {string} [filtros.categoria] - Categoria pedagógica
   * @param {string} [filtros.busca] - Termo textual
   * @param {string} [filtros.eixo] - Eixo tecnológico recomendado
   * @returns {Object} Lista de prompts estruturados e metadados
   */
  async listarPromptsEbook({ categoria = null, busca = null, eixo = null } = {}) {
    let lista = [...this.promptsEbook];

    const catNorm = categoria ? normalizarTexto(categoria) : null;
    const buscaNorm = busca ? normalizarTexto(busca) : null;
    const eixoNorm = eixo ? normalizarTexto(eixo) : null;

    if (catNorm) {
      lista = lista.filter((p) => {
        const promptCatNorm = normalizarTexto(p.categoria);
        return promptCatNorm.includes(catNorm) || catNorm.includes(promptCatNorm);
      });
    }

    if (buscaNorm) {
      lista = lista.filter((p) => {
        const tituloNorm = normalizarTexto(p.titulo);
        const descNorm = normalizarTexto(p.descricao);
        const templateNorm = normalizarTexto(p.template);
        const dicaNorm = normalizarTexto(p.dicaDocente);
        const codNorm = normalizarTexto(p.codigo);

        return (
          tituloNorm.includes(buscaNorm) ||
          descNorm.includes(buscaNorm) ||
          templateNorm.includes(buscaNorm) ||
          dicaNorm.includes(buscaNorm) ||
          codNorm.includes(buscaNorm)
        );
      });
    }

    if (eixoNorm) {
      lista = lista.filter((p) => {
        return (p.eixosRecomendados || []).some((e) =>
          normalizarTexto(e).includes(eixoNorm)
        );
      });
    }

    // Calcula distribuição por categoria
    const contagemPorCategoria = {};
    for (const cat of CATEGORIAS_PROMPTS_CANONICAS) {
      const cNorm = normalizarTexto(cat);
      contagemPorCategoria[cat] = this.promptsEbook.filter(
        (p) => normalizarTexto(p.categoria) === cNorm
      ).length;
    }

    return {
      prompts: lista,
      total: lista.length,
      totalGeralEbook: this.promptsEbook.length,
      filtroAplicado: {
        categoria: categoria || null,
        busca: busca || null,
        eixo: eixo || null,
      },
      categoriasDisponiveis: CATEGORIAS_PROMPTS_CANONICAS,
      contagemPorCategoria,
    };
  }

  /* ========================================================================
     MÉTODOS DE GERÊNCIA E CRUD PARA O STUDIO IAprofEPT (DOCUMENTOS)
     ======================================================================== */

  buscarDocumentoPorId(id) {
    return this.documentos.find((d) => String(d.id) === String(id)) || null;
  }

  adicionarDocumento(docData) {
    const id = docData.id || `doc-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const novoDoc = {
      id,
      titulo: docData.titulo,
      descricao: docData.descricao || '',
      orgaoEmissor: docData.orgaoEmissor || 'UFJF / IAprofEPT',
      anoPublicacao: parseInt(docData.anoPublicacao, 10) || new Date().getFullYear(),
      tagPrincipal: docData.tagPrincipal || docData.categoria || 'Legislação EPT',
      tags: docData.tags || [docData.tagPrincipal || docData.categoria || 'Legislação EPT'],
      url: docData.url || '',
      formato: docData.formato || 'PDF',
      paginas: docData.paginas || 0,
      tamanhoEstimado: docData.tamanhoEstimado || '1.0 MB',
      arquivoNome: docData.arquivoNome || null,
      ativo: true,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    this.documentos.unshift(novoDoc);
    this.customDocs.unshift(novoDoc);
    this.salvarDadosPersistidos();
    return novoDoc;
  }

  atualizarDocumento(id, docData) {
    const index = this.documentos.findIndex((d) => String(d.id) === String(id));
    if (index === -1) return null;

    const docExistente = this.documentos[index];
    const docAtualizado = {
      ...docExistente,
      titulo: docData.titulo !== undefined ? docData.titulo : docExistente.titulo,
      descricao: docData.descricao !== undefined ? docData.descricao : docExistente.descricao,
      orgaoEmissor: docData.orgaoEmissor !== undefined ? docData.orgaoEmissor : docExistente.orgaoEmissor,
      anoPublicacao: docData.anoPublicacao !== undefined ? parseInt(docData.anoPublicacao, 10) : docExistente.anoPublicacao,
      tagPrincipal: docData.tagPrincipal || docData.categoria || docExistente.tagPrincipal,
      tags: docData.tags || docExistente.tags,
      url: docData.url !== undefined ? docData.url : docExistente.url,
      formato: docData.formato !== undefined ? docData.formato : docExistente.formato,
      tamanhoEstimado: docData.tamanhoEstimado !== undefined ? docData.tamanhoEstimado : docExistente.tamanhoEstimado,
      arquivoNome: docData.arquivoNome !== undefined ? docData.arquivoNome : docExistente.arquivoNome,
      atualizadoEm: new Date().toISOString(),
    };

    this.documentos[index] = docAtualizado;

    // Atualiza também na lista de customizados (se já for customizado ou insere para persistir)
    const customIdx = this.customDocs.findIndex((d) => String(d.id) === String(id));
    if (customIdx >= 0) {
      this.customDocs[customIdx] = docAtualizado;
    } else {
      this.customDocs.unshift(docAtualizado);
    }

    this.salvarDadosPersistidos();
    return docAtualizado;
  }

  excluirDocumento(id) {
    const index = this.documentos.findIndex((d) => String(d.id) === String(id));
    if (index === -1) return false;

    this.documentos.splice(index, 1);
    this.customDocs = this.customDocs.filter((d) => String(d.id) !== String(id));
    this.salvarDadosPersistidos();
    return true;
  }

  /* ========================================================================
     MÉTODOS DE GERÊNCIA E CRUD PARA O STUDIO IAprofEPT (VÍDEOS)
     ======================================================================== */

  listarVideos() {
    return this.videos;
  }

  buscarVideoPorId(id) {
    return this.videos.find((v) => String(v.id) === String(id)) || null;
  }

  adicionarVideo(videoData) {
    const id = videoData.id || `vid-${Date.now()}`;
    const novoVideo = {
      id,
      titulo: videoData.titulo,
      youtubeId: videoData.youtubeId,
      duracao: videoData.duracao || '10 min',
      autor: videoData.autor || 'Prof. Maycon Magalhães',
      categoria: videoData.categoria || 'Fundamentos',
      descricao: videoData.descricao || '',
      objetivoPedagogico: videoData.objetivoPedagogico || '',
      ativo: true,
      dataCriacao: new Date().toISOString(),
    };

    this.videos.unshift(novoVideo);
    this.customVideos.unshift(novoVideo);
    this.salvarDadosPersistidos();
    return novoVideo;
  }

  atualizarVideo(id, videoData) {
    const index = this.videos.findIndex((v) => String(v.id) === String(id));
    if (index === -1) return null;

    const videoExistente = this.videos[index];
    const videoAtualizado = {
      ...videoExistente,
      titulo: videoData.titulo !== undefined ? videoData.titulo : videoExistente.titulo,
      youtubeId: videoData.youtubeId !== undefined ? videoData.youtubeId : videoExistente.youtubeId,
      duracao: videoData.duracao !== undefined ? videoData.duracao : videoExistente.duracao,
      autor: videoData.autor !== undefined ? videoData.autor : videoExistente.autor,
      categoria: videoData.categoria !== undefined ? videoData.categoria : videoExistente.categoria,
      descricao: videoData.descricao !== undefined ? videoData.descricao : videoExistente.descricao,
      objetivoPedagogico: videoData.objetivoPedagogico !== undefined ? videoData.objetivoPedagogico : videoExistente.objetivoPedagogico,
      atualizadoEm: new Date().toISOString(),
    };

    this.videos[index] = videoAtualizado;

    const customIdx = this.customVideos.findIndex((v) => String(v.id) === String(id));
    if (customIdx >= 0) {
      this.customVideos[customIdx] = videoAtualizado;
    } else {
      this.customVideos.unshift(videoAtualizado);
    }

    this.salvarDadosPersistidos();
    return videoAtualizado;
  }

  excluirVideo(id) {
    const index = this.videos.findIndex((v) => String(v.id) === String(id));
    if (index === -1) return false;

    this.videos.splice(index, 1);
    this.customVideos = this.customVideos.filter((v) => String(v.id) !== String(id));
    this.salvarDadosPersistidos();
    return true;
  }
}

export const acervoFormativoRepository = new AcervoFormativoRepository();
export default acervoFormativoRepository;

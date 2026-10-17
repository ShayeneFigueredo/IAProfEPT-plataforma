import {
  DOCUMENTOS_OFICIAIS_ACERVO,
  TAGS_DOCUMENTOS_CANONICAS,
  MAPA_NORMALIZACAO_TAGS_DOCS,
} from '../config/documentosOficiais.js';

import {
  MODELOS_EBOOK_PROMPTS,
  CATEGORIAS_PROMPTS_CANONICAS,
} from '../config/ebookPromptsContent.js';

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
    this.documentos = DOCUMENTOS_OFICIAIS_ACERVO;
    this.promptsEbook = MODELOS_EBOOK_PROMPTS;
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
}

export const acervoFormativoRepository = new AcervoFormativoRepository();
export default acervoFormativoRepository;

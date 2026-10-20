import { BaseRepository } from './BaseRepository.js';
import { NotFoundError, ForbiddenError } from '../errors/AppError.js';

/**
 * Repositório de Práticas Pedagógicas e Sequências Didáticas
 * Plataforma IAprofEPT — Tese de Doutorado PPGEM / UFJF
 * 
 * Gerencia operações transacionais e soft delete no PostgreSQL (tabela praticas_repositorio).
 */
export class RepositorioPraticasRepository extends BaseRepository {
  constructor() {
    super('praticas_repositorio');
  }

  /**
   * Compartilha e persiste uma prática pedagógica no repositório com transação consistente.
   * 
   * @param {Object} dados - Parâmetros validados da prática
   * @param {string} usuarioId - UUID do docente autor
   * @returns {Promise<Object>} Prática criada
   */
  async criarPratica(dados, usuarioId) {
    return this.transaction(async (client) => {
      const sql = `
        INSERT INTO praticas_repositorio (
          usuario_id,
          requisicao_ia_id,
          titulo,
          descricao,
          conteudo_completo,
          curso_tecnico,
          eixo_cnct,
          tema_matematico,
          habilidades_bncc,
          arquivo_anexo_url,
          publicado,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
        )
        RETURNING *;
      `;

      const params = [
        usuarioId,
        dados.requisicaoIaId || null,
        dados.titulo,
        dados.descricao || null,
        dados.conteudoCompleto,
        dados.cursoTecnico,
        dados.eixoCnct,
        dados.temaMatematico,
        JSON.stringify(dados.habilidadesBncc || []),
        dados.arquivoAnexoUrl || null,
        dados.publicado !== undefined ? dados.publicado : true,
      ];

      const res = await client.query(sql, params);
      const praticaCriada = res.rows[0];

      // Busca dados do autor para retorno enriquecido
      const autorRes = await client.query(
        `SELECT u.id, u.nome, u.email, u.role, inst.nome AS instituicao, inst.campus 
         FROM usuarios u 
         LEFT JOIN perfis_docentes pd ON pd.usuario_id = u.id
         LEFT JOIN instituicoes_rfepct inst ON pd.instituicao_id = inst.id
         WHERE u.id = $1;`,
        [usuarioId]
      );

      return {
        ...praticaCriada,
        autor: autorRes.rows[0] || null,
      };
    });
  }

  /**
   * Lista práticas pedagógicas de forma paginada com metadados, filtros e busca textual.
   * 
   * @param {Object} filtros - Critérios de filtro e paginação
   * @param {string|null} solicitanteId - UUID do usuário solicitante (opcional)
   * @param {boolean} isAdm - Indica se o solicitante possui papel de administrador
   * @returns {Promise<Object>}
   */
  async listarPraticas(filtros = {}, solicitanteId = null, isAdm = false) {
    const {
      page = 1,
      limit = 10,
      offset = 0,
      busca,
      cursoTecnico,
      eixoCnct,
      temaMatematico,
      usuarioId,
      ordenarPor = 'recentes',
    } = filtros;

    const conditions = ['p.deleted_at IS NULL'];
    const params = [];
    let paramIdx = 1;

    // Regra de visibilidade: práticas não publicadas são visíveis apenas para o próprio autor ou adm
    if (!isAdm) {
      if (solicitanteId) {
        conditions.push(`(p.publicado = TRUE OR p.usuario_id = $${paramIdx++})`);
        params.push(solicitanteId);
      } else {
        conditions.push('p.publicado = TRUE');
      }
    }

    // Filtro por autor específico
    if (usuarioId) {
      conditions.push(`p.usuario_id = $${paramIdx++}`);
      params.push(usuarioId);
    }

    // Filtro por Curso Técnico
    if (cursoTecnico) {
      conditions.push(`p.curso_tecnico = $${paramIdx++}`);
      params.push(cursoTecnico);
    }

    // Filtro por Eixo Tecnológico CNCT
    if (eixoCnct) {
      conditions.push(`p.eixo_cnct = $${paramIdx++}`);
      params.push(eixoCnct);
    }

    // Filtro por Tema Matemático / Área
    if (temaMatematico) {
      conditions.push(`p.tema_matematico = $${paramIdx++}`);
      params.push(temaMatematico);
    }

    // Busca textual com trigramas e Full-Text Search
    let selectRelevance = '1.0 AS relevancia';
    if (busca) {
      const buscaPlaceholder = `$${paramIdx++}`;
      params.push(busca);

      conditions.push(`
        (
          p.titulo ILIKE '%' || ${buscaPlaceholder} || '%'
          OR p.descricao ILIKE '%' || ${buscaPlaceholder} || '%'
          OR p.tema_matematico ILIKE '%' || ${buscaPlaceholder} || '%'
          OR p.curso_tecnico ILIKE '%' || ${buscaPlaceholder} || '%'
          OR to_tsvector('portuguese', coalesce(p.titulo, '') || ' ' || coalesce(p.descricao, '') || ' ' || coalesce(p.tema_matematico, ''))
             @@ plainto_tsquery('portuguese', ${buscaPlaceholder})
        )
      `);

      selectRelevance = `
        (
          similarity(p.titulo, ${buscaPlaceholder}) * 0.6 +
          similarity(coalesce(p.descricao, ''), ${buscaPlaceholder}) * 0.2 +
          similarity(p.tema_matematico, ${buscaPlaceholder}) * 0.2
        ) AS relevancia
      `;
    }

    // Ordenação
    let orderBySql = 'p.created_at DESC';
    if (ordenarPor === 'populares') {
      orderBySql = 'p.total_curtidas DESC, p.created_at DESC';
    } else if (ordenarPor === 'melhores_avaliadas') {
      orderBySql = 'p.media_estrelas DESC, p.total_avaliacoes DESC, p.created_at DESC';
    } else if (ordenarPor === 'alfabetica') {
      orderBySql = 'p.titulo ASC';
    } else if (busca) {
      orderBySql = 'relevancia DESC, p.created_at DESC';
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Consulta de contagem total
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM praticas_repositorio p
      ${whereClause};
    `;
    const countRes = await this.query(countSql, params);
    const total = countRes.rows[0]?.total || 0;

    // Consulta de registros paginados
    const dataSql = `
      SELECT 
        p.id,
        p.usuario_id,
        p.requisicao_ia_id,
        p.titulo,
        p.descricao,
        p.curso_tecnico,
        p.eixo_cnct,
        p.tema_matematico,
        p.habilidades_bncc,
        p.arquivo_anexo_url,
        p.total_curtidas,
        p.total_favoritos,
        p.total_avaliacoes,
        p.media_estrelas,
        p.publicado,
        p.created_at,
        p.updated_at,
        u.nome AS autor_nome,
        u.email AS autor_email,
        u.role AS autor_role,
        inst.nome AS autor_instituicao,
        inst.campus AS autor_campus,
        ${selectRelevance}
      FROM praticas_repositorio p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN perfis_docentes pd ON pd.usuario_id = u.id
      LEFT JOIN instituicoes_rfepct inst ON pd.instituicao_id = inst.id
      ${whereClause}
      ORDER BY ${orderBySql}
      LIMIT $${paramIdx++} OFFSET $${paramIdx++};
    `;

    const dataParams = [...params, limit, offset];
    const dataRes = await this.query(dataSql, dataParams);

    const praticas = dataRes.rows.map((row) => ({
      id: row.id,
      titulo: row.titulo,
      descricao: row.descricao,
      cursoTecnico: row.curso_tecnico,
      eixoCnct: row.eixo_cnct,
      temaMatematico: row.tema_matematico,
      habilidadesBncc: row.habilidades_bncc,
      arquivoAnexoUrl: row.arquivo_anexo_url,
      metricas: {
        totalCurtidas: row.total_curtidas,
        totalFavoritos: row.total_favoritos,
        totalAvaliacoes: row.total_avaliacoes,
        mediaEstrelas: parseFloat(row.media_estrelas || 0),
      },
      publicado: row.publicado,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      autor: {
        id: row.usuario_id,
        nome: row.autor_nome,
        email: row.autor_email,
        role: row.autor_role,
        instituicao: row.autor_instituicao,
        campus: row.autor_campus,
      },
      relevancia: row.relevancia !== undefined ? parseFloat(row.relevancia) : 1.0,
    }));

    return {
      praticas,
      paginacao: {
        paginaAtual: page,
        itensPorPagina: limit,
        totalRegistros: total,
        totalPaginas: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Busca prática por ID com detalhes completos, conteúdo íntegro e gabarito estruturado.
   * 
   * @param {string} id - UUID da prática
   * @param {string|null} solicitanteId - UUID do usuário solicitante
   * @param {boolean} isAdm - Indica se o solicitante é administrador
   * @returns {Promise<Object|null>}
   */
  async buscarPorId(id, solicitanteId = null, isAdm = false) {
    const sql = `
      SELECT 
        p.*,
        u.nome AS autor_nome,
        u.email AS autor_email,
        u.role AS autor_role,
        inst.nome AS autor_instituicao,
        inst.campus AS autor_campus
      FROM praticas_repositorio p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN perfis_docentes pd ON pd.usuario_id = u.id
      LEFT JOIN instituicoes_rfepct inst ON pd.instituicao_id = inst.id
      WHERE p.id = $1 AND p.deleted_at IS NULL
      LIMIT 1;
    `;

    const res = await this.query(sql, [id]);
    const row = res.rows[0];

    if (!row) {
      return null;
    }

    // Se a prática não for pública, apenas o autor ou administradores podem acessá-la
    if (!row.publicado && !isAdm && row.usuario_id !== solicitanteId) {
      throw new ForbiddenError('Esta prática pedagógica é privada e só pode ser visualizada pelo seu autor.');
    }

    // Processamento seguro do conteúdo estruturado e gabarito
    let conteudoEstruturado = null;
    let gabarito = null;

    try {
      if (row.conteudo_completo && (row.conteudo_completo.startsWith('{') || row.conteudo_completo.startsWith('['))) {
        conteudoEstruturado = JSON.parse(row.conteudo_completo);

        // Extrai gabarito se presente na estrutura JSON gerada pelo Laboratório
        if (conteudoEstruturado.gabarito) {
          gabarito = conteudoEstruturado.gabarito;
        } else if (Array.isArray(conteudoEstruturado.itens)) {
          gabarito = conteudoEstruturado.itens.map((item) => ({
            numero: item.numero,
            tituloItem: item.tituloItem || `Item ${item.numero}`,
            gabaritoComentadoPassoAPasso: item.gabaritoComentadoPassoAPasso || [],
          }));
        } else if (Array.isArray(conteudoEstruturado.etapasInvestigacao)) {
          gabarito = conteudoEstruturado.etapasInvestigacao.map((etapa) => ({
            etapa: etapa.etapa,
            gabaritoFinal: etapa.gabaritoFinal,
            etapasResolucao: etapa.etapasResolucao || [],
          }));
        } else if (conteudoEstruturado.desafioOuvinteComGabarito) {
          gabarito = conteudoEstruturado.desafioOuvinteComGabarito;
        } else if (conteudoEstruturado.avaliacaoFormativa) {
          gabarito = conteudoEstruturado.avaliacaoFormativa;
        }
      }
    } catch (e) {
      // Se não for JSON válido, mantém conteudoEstruturado como null
    }

    return {
      id: row.id,
      titulo: row.titulo,
      descricao: row.descricao,
      conteudoCompleto: row.conteudo_completo,
      conteudoEstruturado,
      gabarito,
      cursoTecnico: row.curso_tecnico,
      eixoCnct: row.eixo_cnct,
      temaMatematico: row.tema_matematico,
      habilidadesBncc: row.habilidades_bncc,
      arquivoAnexoUrl: row.arquivo_anexo_url,
      requisicaoIaId: row.requisicao_ia_id,
      publicado: row.publicado,
      metricas: {
        totalCurtidas: row.total_curtidas,
        totalFavoritos: row.total_favoritos,
        totalAvaliacoes: row.total_avaliacoes,
        mediaEstrelas: parseFloat(row.media_estrelas || 0),
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      autor: {
        id: row.usuario_id,
        nome: row.autor_nome,
        email: row.autor_email,
        instituicao: row.autor_instituicao,
        campus: row.autor_campus,
        avatarUrl: row.autor_avatar_url,
      },
    };
  }

  /**
   * Atualiza prática pedagógica garantindo verificação de autoria e transação consistente.
   * 
   * @param {string} id - UUID da prática
   * @param {Object} camposAtualizacao - Campos permitidos mapeados para snake_case
   * @param {string} usuarioId - UUID do usuário solicitante
   * @param {boolean} isAdm - Indica se o usuário é administrador
   * @returns {Promise<Object>} Prática atualizada
   */
  async atualizarPratica(id, camposAtualizacao, usuarioId, isAdm = false) {
    return this.transaction(async (client) => {
      // 1. Busca registro para verificação com lock de atualização (FOR UPDATE)
      const resCheck = await client.query(
        `SELECT id, usuario_id, titulo FROM praticas_repositorio WHERE id = $1 AND deleted_at IS NULL FOR UPDATE;`,
        [id]
      );

      const praticaExistente = resCheck.rows[0];
      if (!praticaExistente) {
        throw new NotFoundError(`Prática pedagógica com ID '${id}' não encontrada ou já excluída.`);
      }

      // 2. Verificação de Permissão: Apenas o autor ou administrador pode editar
      if (praticaExistente.usuario_id !== usuarioId && !isAdm) {
        throw new ForbiddenError('Apenas o autor ou administradores possuem permissão para editar esta prática pedagógica.');
      }

      // 3. Monta query dinâmica de atualização
      const updates = [];
      const params = [id];
      let paramIdx = 2;

      for (const [coluna, valor] of Object.entries(camposAtualizacao)) {
        updates.push(`${coluna} = $${paramIdx++}`);
        params.push(valor);
      }

      updates.push(`updated_at = NOW()`);

      const updateSql = `
        UPDATE praticas_repositorio
        SET ${updates.join(', ')}
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING *;
      `;

      const updateRes = await client.query(updateSql, params);
      const row = updateRes.rows[0];

      return {
        id: row.id,
        titulo: row.titulo,
        descricao: row.descricao,
        conteudoCompleto: row.conteudo_completo,
        cursoTecnico: row.curso_tecnico,
        eixoCnct: row.eixo_cnct,
        temaMatematico: row.tema_matematico,
        habilidadesBncc: row.habilidades_bncc,
        arquivoAnexoUrl: row.arquivo_anexo_url,
        publicado: row.publicado,
        updatedAt: row.updated_at,
      };
    });
  }

  /**
   * Remove prática do repositório utilizando Soft Delete (deleted_at = NOW(), publicado = FALSE).
   * 
   * @param {string} id - UUID da prática
   * @param {string} usuarioId - UUID do usuário solicitante
   * @param {boolean} isAdm - Indica se o usuário é administrador
   * @returns {Promise<Object>} Confirmação da exclusão
   */
  async deletarPraticaSoft(id, usuarioId, isAdm = false) {
    return this.transaction(async (client) => {
      // 1. Busca registro para verificação com lock
      const resCheck = await client.query(
        `SELECT id, usuario_id, titulo, deleted_at FROM praticas_repositorio WHERE id = $1 AND deleted_at IS NULL FOR UPDATE;`,
        [id]
      );

      const praticaExistente = resCheck.rows[0];
      if (!praticaExistente) {
        throw new NotFoundError(`Prática pedagógica com ID '${id}' não encontrada ou já excluída.`);
      }

      // 2. Verificação de Permissão: Apenas o autor ou administrador pode excluir
      if (praticaExistente.usuario_id !== usuarioId && !isAdm) {
        throw new ForbiddenError('Apenas o autor ou administradores possuem permissão para excluir esta prática pedagógica.');
      }

      // 3. Execução do Soft Delete
      const softDeleteSql = `
        UPDATE praticas_repositorio
        SET deleted_at = NOW(),
            publicado = FALSE,
            updated_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING id, titulo, deleted_at;
      `;

      const resDelete = await client.query(softDeleteSql, [id]);
      const row = resDelete.rows[0];

      return {
        id: row.id,
        titulo: row.titulo,
        deletado: true,
        deletedAt: row.deleted_at,
        mensagem: 'Prática pedagógica removida com sucesso do repositório (soft delete).',
      };
    });
  }

  /**
   * Motor de Busca Avançada no Repositório com filtros combinados:
   * curso_tecnico, eixo_cnct, habilidade_bncc, tema_matematico e termo textual (pg_trgm + FTS).
   * Suporta ordenações por mais_curtidos, mais_recentes e melhor_avaliados.
   * Atende ao critério de resposta paginada com metadados em < 100ms.
   * 
   * @param {Object} filtros
   * @param {string|null} solicitanteId
   * @param {boolean} isAdm
   * @returns {Promise<Object>}
   */
  async buscarPraticasAvancada(filtros = {}, solicitanteId = null, isAdm = false) {
    const t0 = performance.now();
    const {
      page = 1,
      limit = 12,
      offset = 0,
      termo,
      cursoTecnico,
      eixoCnct,
      habilidadeBncc,
      temaMatematico,
      ordenarPor = 'mais_recentes',
    } = filtros;

    const conditions = ['p.deleted_at IS NULL'];
    const params = [];
    let paramIdx = 1;

    // Regra de visibilidade
    if (!isAdm) {
      if (solicitanteId) {
        conditions.push(`(p.publicado = TRUE OR p.usuario_id = $${paramIdx++})`);
        params.push(solicitanteId);
      } else {
        conditions.push('p.publicado = TRUE');
      }
    }

    // 1. Filtro por Curso Técnico da EPT
    if (cursoTecnico) {
      conditions.push(`p.curso_tecnico = $${paramIdx++}`);
      params.push(cursoTecnico);
    }

    // 2. Filtro por Eixo Tecnológico CNCT
    if (eixoCnct) {
      conditions.push(`p.eixo_cnct = $${paramIdx++}`);
      params.push(eixoCnct);
    }

    // 3. Filtro por Tema Matemático
    if (temaMatematico) {
      conditions.push(`p.tema_matematico = $${paramIdx++}`);
      params.push(temaMatematico);
    }

    // 4. Filtro por Habilidade BNCC (JSONB: array de objetos { codigo: ... } ou string ou texto)
    if (habilidadeBncc) {
      const bnccPlaceholder = `$${paramIdx++}`;
      params.push(habilidadeBncc);
      conditions.push(`
        (
          p.habilidades_bncc @> jsonb_build_array(jsonb_build_object('codigo', ${bnccPlaceholder}::text))
          OR p.habilidades_bncc @> jsonb_build_array(${bnccPlaceholder}::text)
          OR p.habilidades_bncc::text ILIKE '%' || ${bnccPlaceholder} || '%'
        )
      `);
    }

    // 5. Termo Textual com Trigram Similarity (pg_trgm), Word Similarity e Full-Text Search
    let selectRelevancia = '1.0 AS score_relevancia';
    if (termo) {
      const termoPlaceholder = `$${paramIdx++}`;
      params.push(termo);

      conditions.push(`
        (
          p.titulo % ${termoPlaceholder}
          OR coalesce(p.descricao, '') % ${termoPlaceholder}
          OR p.conteudo_completo % ${termoPlaceholder}
          OR word_similarity(${termoPlaceholder}, p.titulo) > 0.3
          OR word_similarity(${termoPlaceholder}, coalesce(p.descricao, '')) > 0.3
          OR word_similarity(${termoPlaceholder}, p.curso_tecnico) > 0.3
          OR word_similarity(${termoPlaceholder}, p.tema_matematico) > 0.3
          OR p.titulo ILIKE '%' || ${termoPlaceholder} || '%'
          OR coalesce(p.descricao, '') ILIKE '%' || ${termoPlaceholder} || '%'
          OR p.tema_matematico ILIKE '%' || ${termoPlaceholder} || '%'
          OR p.curso_tecnico ILIKE '%' || ${termoPlaceholder} || '%'
          OR p.eixo_cnct ILIKE '%' || ${termoPlaceholder} || '%'
          OR to_tsvector('portuguese', coalesce(p.titulo, '') || ' ' || coalesce(p.descricao, '') || ' ' || coalesce(p.tema_matematico, '') || ' ' || coalesce(p.curso_tecnico, ''))
             @@ plainto_tsquery('portuguese', ${termoPlaceholder})
        )
      `);

      selectRelevancia = `
        greatest(
          word_similarity(${termoPlaceholder}, p.titulo),
          word_similarity(${termoPlaceholder}, coalesce(p.descricao, '')),
          word_similarity(${termoPlaceholder}, p.curso_tecnico),
          similarity(p.titulo, ${termoPlaceholder})
        ) AS score_relevancia
      `;
    }

    // 6. Ordenações Suportadas
    let orderByClause;
    switch (ordenarPor) {
      case 'mais_curtidos':
        orderByClause = 'p.total_curtidas DESC, p.media_estrelas DESC, p.created_at DESC';
        break;
      case 'melhor_avaliados':
        orderByClause = 'p.media_estrelas DESC, p.total_avaliacoes DESC, p.total_curtidas DESC, p.created_at DESC';
        break;
      case 'relevancia':
        orderByClause = 'score_relevancia DESC, p.total_curtidas DESC, p.created_at DESC';
        break;
      case 'mais_recentes':
      default:
        orderByClause = 'p.created_at DESC';
        break;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Contagem total para metadados de paginação
    const countSql = `SELECT COUNT(*)::int AS total FROM praticas_repositorio p ${whereClause};`;
    const countRes = await this.query(countSql, params);
    const totalRegistros = countRes.rows[0]?.total || 0;
    const totalPaginas = Math.ceil(totalRegistros / limit) || 1;

    // Consulta principal paginada com enriquecimento do autor e notas
    const queryParams = [...params, limit, offset];
    const limitPlaceholder = `$${paramIdx++}`;
    const offsetPlaceholder = `$${paramIdx++}`;

    const mainSql = `
      SELECT 
        p.id,
        p.usuario_id,
        p.requisicao_ia_id,
        p.titulo,
        p.descricao,
        p.conteudo_completo,
        p.curso_tecnico,
        p.eixo_cnct,
        p.tema_matematico,
        p.habilidades_bncc,
        p.arquivo_anexo_url,
        p.total_curtidas,
        p.total_favoritos,
        p.total_avaliacoes,
        p.media_estrelas,
        p.publicado,
        p.created_at,
        p.updated_at,
        ${selectRelevancia},
        u.nome AS autor_nome,
        u.email AS autor_email,
        u.role AS autor_role,
        inst.nome AS autor_instituicao,
        inst.campus AS autor_campus
      FROM praticas_repositorio p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN perfis_docentes pd ON pd.usuario_id = u.id
      LEFT JOIN instituicoes_rfepct inst ON pd.instituicao_id = inst.id
      ${whereClause}
      ORDER BY ${orderByClause}
      LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder};
    `;

    const mainRes = await this.query(mainSql, queryParams);
    const tempoRespostaMs = Math.round(performance.now() - t0);

    const praticasFormatadas = mainRes.rows.map((row) => ({
      id: row.id,
      titulo: row.titulo,
      descricao: row.descricao,
      conteudoCompleto: row.conteudo_completo,
      cursoTecnico: row.curso_tecnico,
      eixoCnct: row.eixo_cnct,
      temaMatematico: row.tema_matematico,
      habilidadesBncc: row.habilidades_bncc,
      arquivoAnexoUrl: row.arquivo_anexo_url,
      totalCurtidas: row.total_curtidas,
      totalFavoritos: row.total_favoritos,
      totalAvaliacoes: row.total_avaliacoes,
      mediaEstrelas: Number(row.media_estrelas),
      publicado: row.publicado,
      scoreRelevancia: row.score_relevancia ? Number(Number(row.score_relevancia).toFixed(4)) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      autor: row.usuario_id
        ? {
            id: row.usuario_id,
            nome: row.autor_nome,
            email: row.autor_email,
            role: row.autor_role,
            instituicao: row.autor_instituicao || null,
            campus: row.autor_campus || null,
          }
        : null,
    }));

    return {
      tempoRespostaMs,
      criterioAceiteMenorQue100ms: tempoRespostaMs < 100,
      paginacao: {
        paginaAtual: page,
        itensPorPagina: limit,
        totalRegistros,
        totalPaginas,
        temProximaPagina: page < totalPaginas,
        temPaginaAnterior: page > 1,
      },
      filtrosAplicados: {
        termo: termo || null,
        cursoTecnico: cursoTecnico || null,
        eixoCnct: eixoCnct || null,
        habilidadeBncc: habilidadeBncc || null,
        temaMatematico: temaMatematico || null,
        ordenarPor,
      },
      resultados: praticasFormatadas,
      praticas: praticasFormatadas,
    };
  }
}

export const repositorioPraticasRepository = new RepositorioPraticasRepository();
export default repositorioPraticasRepository;

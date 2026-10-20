import { z } from 'zod';
import { ValidationError, BadRequestError } from '../errors/AppError.js';
import { resolverCursoCatalogo, resolverAreaCatalogo } from '../config/curricularMatrix.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validador para IDs UUID recebidos em parâmetros de rota
 */
export function validarUuid(id, nomeParametro = 'id') {
  if (!id || typeof id !== 'string' || !UUID_REGEX.test(id.trim())) {
    throw new BadRequestError(`O parâmetro '${nomeParametro}' deve ser um UUID válido.`);
  }
  return id.trim();
}

/**
 * Schema Zod para criação de prática no repositório
 */
const criarPraticaSchema = z.object({
  titulo: z
    .string({
      required_error: 'O título da prática é obrigatório.',
      invalid_type_error: 'O título deve ser uma string.',
    })
    .trim()
    .min(3, 'O título deve conter pelo menos 3 caracteres.')
    .max(255, 'O título não pode exceder 255 caracteres.'),

  descricao: z.string().trim().max(2000, 'A descrição não pode exceder 2000 caracteres.').optional(),

  conteudoCompleto: z.union([z.string(), z.record(z.any()), z.array(z.any())], {
    required_error: 'O conteúdo completo da prática pedagógica é obrigatório.',
  }),

  cursoTecnico: z
    .string({
      required_error: 'O curso técnico é obrigatório.',
      invalid_type_error: 'O curso técnico deve ser uma string.',
    })
    .trim()
    .min(2, 'O curso técnico deve conter pelo menos 2 caracteres.')
    .max(150, 'O curso técnico não pode exceder 150 caracteres.'),

  eixoCnct: z.string().trim().max(150).optional(),

  temaMatematico: z
    .string({
      required_error: 'O tema matemático / área da matemática é obrigatório.',
      invalid_type_error: 'O tema matemático deve ser uma string.',
    })
    .trim()
    .min(2, 'O tema matemático deve conter pelo menos 2 caracteres.')
    .max(150, 'O tema matemático não pode exceder 150 caracteres.'),

  habilidadesBncc: z
    .union([z.array(z.any()), z.record(z.any())])
    .optional()
    .default([]),

  requisicaoIaId: z
    .string()
    .trim()
    .refine((val) => !val || UUID_REGEX.test(val), {
      message: 'O campo requisicaoIaId deve ser um UUID válido.',
    })
    .nullable()
    .optional(),

  arquivoAnexoUrl: z.string().trim().url('A URL do arquivo anexo deve ser válida.').nullable().optional(),

  publicado: z.boolean().optional().default(true),
});

/**
 * Normaliza os nomes de campos snake_case para camelCase
 */
function normalizarPayloadEntrada(body = {}) {
  return {
    titulo: body.titulo,
    descricao: body.descricao,
    conteudoCompleto: body.conteudoCompleto !== undefined ? body.conteudoCompleto : body.conteudo_completo,
    cursoTecnico: body.cursoTecnico || body.curso_tecnico || body.curso,
    eixoCnct: body.eixoCnct || body.eixo_cnct || body.eixo || body.eixoTecnologico,
    temaMatematico: body.temaMatematico || body.tema_matematico || body.areaMatematica || body.tema,
    habilidadesBncc: body.habilidadesBncc !== undefined ? body.habilidadesBncc : body.habilidades_bncc,
    requisicaoIaId: body.requisicaoIaId || body.requisicao_ia_id || body.requisicaoId,
    arquivoAnexoUrl: body.arquivoAnexoUrl || body.arquivo_anexo_url || body.anexoUrl,
    publicado: body.publicado !== undefined ? Boolean(body.publicado) : true,
  };
}

/**
 * Validador para criação de práticas pedagógicas (POST /api/repositorio/praticas)
 */
export function validarCriacaoPratica(body = {}) {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('O corpo da requisição deve ser um objeto JSON válido.', [
      { name: 'body', reason: 'Corpo da requisição ausente.' },
    ]);
  }

  const payloadNormalizado = normalizarPayloadEntrada(body);
  const result = criarPraticaSchema.safeParse(payloadNormalizado);

  if (!result.success) {
    const invalidParams = result.error.issues.map((err) => ({
      name: err.path.join('.') || 'parametro',
      reason: err.message,
    }));
    throw new ValidationError('Falha na validação dos campos da prática pedagógica.', invalidParams);
  }

  const dados = result.data;

  // Normalização de conteúdo completo se for objeto/array para JSON string
  let conteudoCompletoStr;
  if (typeof dados.conteudoCompleto === 'string') {
    conteudoCompletoStr = dados.conteudoCompleto.trim();
  } else {
    conteudoCompletoStr = JSON.stringify(dados.conteudoCompleto);
  }

  if (conteudoCompletoStr.length < 10) {
    throw new ValidationError('Conteúdo da prática muito curto.', [
      { name: 'conteudoCompleto', reason: 'O conteúdo da prática deve conter pelo menos 10 caracteres.' },
    ]);
  }

  // Tenta resolver o Eixo CNCT se tiver sido omitido
  let eixoFinal = dados.eixoCnct;
  const cursoResolvido = resolverCursoCatalogo(dados.cursoTecnico);
  if (!eixoFinal && cursoResolvido) {
    eixoFinal = cursoResolvido.eixoCNCT;
  }
  if (!eixoFinal) {
    eixoFinal = 'Formação Técnica Geral';
  }

  // Tenta normalizar a área da matemática
  let temaFinal = dados.temaMatematico;
  const areaResolvida = resolverAreaCatalogo(dados.temaMatematico);
  if (areaResolvida) {
    temaFinal = areaResolvida;
  }

  let cursoFinal = dados.cursoTecnico;
  if (cursoResolvido) {
    cursoFinal = cursoResolvido.nome;
  }

  return {
    titulo: dados.titulo,
    descricao: dados.descricao || null,
    conteudoCompleto: conteudoCompletoStr,
    cursoTecnico: cursoFinal,
    eixoCnct: eixoFinal,
    temaMatematico: temaFinal,
    habilidadesBncc: Array.isArray(dados.habilidadesBncc) ? dados.habilidadesBncc : [],
    requisicaoIaId: dados.requisicaoIaId || null,
    arquivoAnexoUrl: dados.arquivoAnexoUrl || null,
    publicado: dados.publicado,
  };
}

/**
 * Validador para atualização de práticas pedagógicas (PUT /api/repositorio/praticas/:id)
 */
export function validarAtualizacaoPratica(body = {}) {
  if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
    throw new ValidationError('Pelo menos um campo deve ser informado para atualização.', [
      { name: 'body', reason: 'Corpo vazio na requisição de atualização.' },
    ]);
  }

  const payload = normalizarPayloadEntrada(body);
  const camposAtualizacao = {};

  if (payload.titulo !== undefined) {
    if (typeof payload.titulo !== 'string' || payload.titulo.trim().length < 3) {
      throw new ValidationError('Título inválido.', [
        { name: 'titulo', reason: 'O título deve conter pelo menos 3 caracteres.' },
      ]);
    }
    camposAtualizacao.titulo = payload.titulo.trim();
  }

  if (payload.descricao !== undefined) {
    camposAtualizacao.descricao = payload.descricao ? String(payload.descricao).trim() : null;
  }

  if (payload.conteudoCompleto !== undefined) {
    let strContent =
      typeof payload.conteudoCompleto === 'string'
        ? payload.conteudoCompleto.trim()
        : JSON.stringify(payload.conteudoCompleto);
    if (strContent.length < 10) {
      throw new ValidationError('Conteúdo inválido.', [
        { name: 'conteudoCompleto', reason: 'O conteúdo deve conter pelo menos 10 caracteres.' },
      ]);
    }
    camposAtualizacao.conteudo_completo = strContent;
  }

  if (payload.cursoTecnico !== undefined) {
    const cursoResolvido = resolverCursoCatalogo(payload.cursoTecnico);
    camposAtualizacao.curso_tecnico = cursoResolvido ? cursoResolvido.nome : payload.cursoTecnico.trim();
    if (!payload.eixoCnct && cursoResolvido) {
      camposAtualizacao.eixo_cnct = cursoResolvido.eixoCNCT;
    }
  }

  if (payload.eixoCnct !== undefined) {
    camposAtualizacao.eixo_cnct = payload.eixoCnct.trim();
  }

  if (payload.temaMatematico !== undefined) {
    const areaResolvida = resolverAreaCatalogo(payload.temaMatematico);
    camposAtualizacao.tema_matematico = areaResolvida || payload.temaMatematico.trim();
  }

  if (payload.habilidadesBncc !== undefined) {
    camposAtualizacao.habilidades_bncc = JSON.stringify(
      Array.isArray(payload.habilidadesBncc) ? payload.habilidadesBncc : []
    );
  }

  if (payload.arquivoAnexoUrl !== undefined) {
    camposAtualizacao.arquivo_anexo_url = payload.arquivoAnexoUrl ? String(payload.arquivoAnexoUrl).trim() : null;
  }

  if (payload.publicado !== undefined) {
    camposAtualizacao.publicado = Boolean(payload.publicado);
  }

  if (Object.keys(camposAtualizacao).length === 0) {
    throw new ValidationError('Nenhum campo válido enviado para atualização.', [
      { name: 'body', reason: 'Nenhum dos campos informados é passível de alteração.' },
    ]);
  }

  return camposAtualizacao;
}

/**
 * Validador de filtros de listagem paginada (GET /api/repositorio/praticas)
 */
export function validarFiltrosListagem(query = {}) {
  const page = Math.max(1, parseInt(query.page || query.pagina || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || query.limite || '10', 10) || 10));
  const offset = (page - 1) * limit;

  const cleanString = (val) => (val && typeof val === 'string' && val.trim() !== 'Todos' ? val.trim() : null);

  const busca = cleanString(query.busca || query.q || query.term);
  const cursoTecnico = cleanString(query.cursoTecnico || query.curso_tecnico || query.curso);
  const eixoCnct = cleanString(query.eixoCnct || query.eixo_cnct || query.eixo);
  const temaMatematico = cleanString(query.temaMatematico || query.tema_matematico || query.tema || query.areaMatematica);
  const usuarioId = cleanString(query.usuarioId || query.usuario_id || query.autor);

  let ordenarPor = (query.ordenarPor || query.ordenacao || query.order || 'recentes').toLowerCase();
  const ordenacoesValidas = ['recentes', 'populares', 'melhores_avaliadas', 'alfabetica'];
  if (!ordenacoesValidas.includes(ordenarPor)) {
    ordenarPor = 'recentes';
  }

  return {
    page,
    limit,
    offset,
    busca,
    cursoTecnico,
    eixoCnct,
    temaMatematico,
    usuarioId,
    ordenarPor,
  };
}

/**
 * Validador para motor de busca avançada (GET /api/repositorio/buscar)
 * Filtros combinados: curso_tecnico, eixo_cnct, habilidade_bncc, tema_matematico e termo textual
 * Suporta ordenações: mais_curtidos, mais_recentes, melhor_avaliados
 */
export function validarFiltrosBuscaAvancada(query = {}) {
  const page = Math.max(1, parseInt(query.page || query.pagina || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || query.limite || '12', 10) || 12));
  const offset = (page - 1) * limit;

  const cleanString = (val) =>
    val && typeof val === 'string' && val.trim() !== '' && val.trim().toLowerCase() !== 'todos'
      ? val.trim()
      : null;

  const termo = cleanString(query.termo || query.q || query.busca || query.term);
  const cursoTecnico = cleanString(query.curso_tecnico || query.cursoTecnico || query.curso);
  const eixoCnct = cleanString(query.eixo_cnct || query.eixoCnct || query.eixo);
  const habilidadeBncc = cleanString(
    query.habilidade_bncc || query.habilidadeBncc || query.bncc || query.habilidade
  );
  const temaMatematico = cleanString(
    query.tema_matematico || query.temaMatematico || query.tema || query.areaMatematica
  );

  const rawOrdem = (query.ordenarPor || query.ordenar_por || query.ordem || query.order || '')
    .toLowerCase()
    .trim();

  let ordenarPor;
  if (['mais_curtidos', 'curtidas', 'populares', 'mais_curtido'].includes(rawOrdem)) {
    ordenarPor = 'mais_curtidos';
  } else if (['mais_recentes', 'recentes', 'recente', 'mais_recente'].includes(rawOrdem)) {
    ordenarPor = 'mais_recentes';
  } else if (
    ['melhor_avaliados', 'melhores_avaliadas', 'avaliacao', 'estrelas', 'melhor_avaliado'].includes(
      rawOrdem
    )
  ) {
    ordenarPor = 'melhor_avaliados';
  } else if (rawOrdem === 'relevancia' || (!rawOrdem && termo)) {
    ordenarPor = 'relevancia';
  } else {
    ordenarPor = 'mais_recentes';
  }

  return {
    page,
    limit,
    offset,
    termo,
    cursoTecnico,
    eixoCnct,
    habilidadeBncc,
    temaMatematico,
    ordenarPor,
  };
}

/**
 * Schema Zod para comentário / relato de experiência em sala de aula
 */
const comentarioPraticaSchema = z.object({
  texto: z
    .string({
      required_error: 'O texto do comentário ou relato é obrigatório.',
      invalid_type_error: 'O texto deve ser uma string.',
    })
    .trim()
    .min(3, 'O comentário deve conter no mínimo 3 caracteres.')
    .max(2000, 'O comentário deve conter no máximo 2000 caracteres.'),
  relatoExperiencia: z.boolean().optional().default(false),
  turmaContexto: z
    .string()
    .trim()
    .max(150, 'O contexto da turma deve ter no máximo 150 caracteres.')
    .nullable()
    .optional(),
  notaEstrelas: z
    .number()
    .int('A nota deve ser um número inteiro.')
    .min(1, 'A nota mínima é 1 estrela.')
    .max(5, 'A nota máxima é 5 estrelas.')
    .nullable()
    .optional(),
});

/**
 * Validador para payload de comentários e relatos de experiência
 */
export function validarComentarioPratica(body = {}) {
  const payload = {
    texto: body.texto || body.comentario,
    relatoExperiencia:
      body.relatoExperiencia !== undefined
        ? Boolean(body.relatoExperiencia)
        : body.relato_experiencia !== undefined
        ? Boolean(body.relato_experiencia)
        : false,
    turmaContexto: body.turmaContexto || body.turma_contexto || null,
    notaEstrelas:
      body.notaEstrelas !== undefined && body.notaEstrelas !== null
        ? Number(body.notaEstrelas)
        : body.nota_estrelas !== undefined && body.nota_estrelas !== null
        ? Number(body.nota_estrelas)
        : body.avaliacaoEstrelas !== undefined && body.avaliacaoEstrelas !== null
        ? Number(body.avaliacaoEstrelas)
        : null,
  };

  const parsed = comentarioPraticaSchema.safeParse(payload);
  if (!parsed.success) {
    const invalidParams = parsed.error.issues.map((issue) => ({
      name: issue.path.join('.'),
      reason: issue.message,
    }));
    throw new ValidationError('Falha na validação do comentário ou relato pedagógico.', invalidParams);
  }

  return parsed.data;
}

export default {
  validarUuid,
  validarCriacaoPratica,
  validarAtualizacaoPratica,
  validarFiltrosListagem,
  validarFiltrosBuscaAvancada,
  validarComentarioPratica,
};


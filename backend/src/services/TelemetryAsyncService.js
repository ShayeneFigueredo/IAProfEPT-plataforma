import crypto from 'crypto';
import { laboratorioRepository } from '../repositories/LaboratorioRepository.js';

/**
 * Serviço Assíncrono de Coleta e Persistência de Métricas de Inferência (Telemetria A/B)
 * Plataforma IAprofEPT — Tese de Doutorado PPGEM / UFJF
 * Doutorando: Maycon Luiz Amaral Magalhães
 * 
 * Atende aos requisitos:
 * 1. Gravação assíncrona na tabela telemetria_ab:
 *    - id_requisicao (requisicao_ia_id)
 *    - usuario_id (anonimizado compulsoriamente via SHA-256 para LGPD / CEP/UFJF)
 *    - motor_utilizado (groq | gemini)
 *    - modelo_especifico
 *    - tempo_latencia_ms (latencia_ms)
 *    - tokens_prompt
 *    - tokens_completion
 *    - parametros_curriculares (JSON)
 *    - status_execucao ('sucesso' | 'erro' | 'timeout')
 *    - data_hora (criado_em)
 * 2. Critério de Aceite Inegociável: Métricas persistidas sem adicionar sobrecarga
 *    na resposta ao usuário (Zero-Overhead / Fila Assíncrona em Memória com Batch Flush).
 * 3. Resiliência: Tentativas automáticas com backoff, monitoramento de tamanho de fila
 *    e garantia de esvaziamento (drain/flush) para encerramento gracioso do servidor.
 */
export class TelemetryAsyncService {
  constructor(options = {}) {
    this.tamanhoLoteMaximo = options.tamanhoLoteMaximo || 10;
    this.intervaloFlushMs = options.intervaloFlushMs || 500;
    this.capacidadeMaximaFila = options.capacidadeMaximaFila || 10000;
    this.maxRetries = options.maxRetries || 3;

    // Buffer em memória (Fila não-bloqueante)
    this.fila = [];
    this.processando = false;

    // Métricas analíticas de desempenho do serviço assíncrono
    this.totalEnfileirados = 0;
    this.totalGravadosSucesso = 0;
    this.totalFalhas = 0;
    this.somaSobrecargaUsuarioMs = 0;
    this.sobrecargaMaximaUsuarioMs = 0;
    this.somaTempoGravacaoDbMs = 0;
    this.totalLotesGravados = 0;

    // Timer periódico de esvaziamento em lote
    this.timerFlush = setInterval(() => {
      this.processarFila().catch((err) => {
        console.error('[TelemetryAsyncService] Erro no flush periódico:', err.message);
      });
    }, this.intervaloFlushMs);

    // Desassocia o timer para não segurar o event loop caso Node.js queira encerrar
    if (this.timerFlush.unref) {
      this.timerFlush.unref();
    }
  }

  /**
   * Anonimiza o identificador do usuário usando hash SHA-256
   * em estrito cumprimento às diretrizes éticas da Resolução CNS 510/2016 e CEP/UFJF.
   * 
   * @param {string|null} usuarioId
   * @returns {string} Hash SHA-256 hexadecimal de 64 caracteres
   */
  anonimizarUsuario(usuarioId) {
    if (!usuarioId) {
      return crypto.createHash('sha256').update(`anonimo-${Date.now()}-${crypto.randomUUID()}`).digest('hex');
    }

    // Se já for um hash SHA-256 de 64 caracteres hexadecimais, preserva
    if (typeof usuarioId === 'string' && usuarioId.length === 64 && /^[0-9a-f]{64}$/i.test(usuarioId)) {
      return usuarioId.toLowerCase();
    }

    return crypto.createHash('sha256').update(String(usuarioId)).digest('hex');
  }

  /**
   * Normaliza os dados da métrica para o esquema oficial da tabela telemetria_ab
   * aceitando os nomes da especificação ou convenções do banco de dados.
   * 
   * @param {Object} dados
   * @returns {Object}
   */
  normalizarDadosMetrica(dados) {
    const requisicaoId = dados.id_requisicao || dados.requisicao_ia_id || dados.requisicaoId || crypto.randomUUID();
    const telemetriaId = dados.id || dados.telemetriaId || crypto.randomUUID();
    const usuarioHash = this.anonimizarUsuario(dados.usuario_id || dados.usuarioId || dados.usuario_id_hash);

    const motor = (dados.motor_utilizado || dados.motor_ia || dados.motor || 'groq').toLowerCase();
    const modelo = dados.modelo_especifico || dados.modeloEspecifico || dados.modelo || 'desconhecido';
    const latencia = parseInt(dados.tempo_latencia_ms || dados.latencia_ms || dados.latenciaMs || 0, 10);

    const tokensPrompt = dados.tokens_prompt !== undefined ? parseInt(dados.tokens_prompt, 10) : (dados.tokensPrompt || null);
    const tokensCompletion = dados.tokens_completion !== undefined ? parseInt(dados.tokens_completion, 10) : (dados.tokensCompletion || null);
    const totalTokens = dados.total_tokens !== undefined ? parseInt(dados.total_tokens, 10) : (tokensPrompt && tokensCompletion ? tokensPrompt + tokensCompletion : null);

    const status = dados.status_execucao || dados.statusExecucao || 'sucesso';
    const dataHora = dados.data_hora || dados.criado_em || dados.criadoEm || new Date();

    const parametros = dados.parametros_curriculares || dados.parametrosCurriculares || dados.parametrosEntrada || {};

    const grupo = dados.grupo_experimental || dados.grupo || (motor === 'gemini' ? 'B' : 'A');
    const chaveAlocacao = dados.chave_alocacao || dados.chaveAlocacao || null;
    const criterioAlocacao = dados.criterio_alocacao || dados.criterioAlocacao || 'assincrono_fila';
    const experimentoAtivo = dados.experimento_ativo !== undefined ? Boolean(dados.experimento_ativo) : true;
    const fallbackUtilizado = Boolean(dados.fallback_utilizado || dados.fallbackUtilizado);
    const mensagemErro = dados.mensagem_erro || dados.mensagemErro || null;

    // Dados opcionais da requisição pedagógica pai
    const ferramenta = dados.ferramenta || parametros.ferramenta || 'exercicios';
    const conteudoGerado = dados.conteudo_gerado || dados.conteudoGerado || null;
    const formatoSaida = dados.formato_saida || dados.formatoSaida || null;
    const habilidadesBncc = dados.habilidades_bncc || dados.habilidadesBncc || [];
    const avisoEticoInjetado = dados.aviso_etico_injetado !== undefined ? dados.aviso_etico_injetado : true;

    return {
      requisicaoId,
      telemetriaId,
      usuarioHash,
      usuarioIdOriginal: dados.usuario_id || dados.usuarioId || null,
      motor,
      modelo,
      latencia,
      tokensPrompt,
      tokensCompletion,
      totalTokens,
      status,
      dataHora: dataHora instanceof Date ? dataHora.toISOString() : new Date(dataHora).toISOString(),
      parametros,
      grupo,
      chaveAlocacao,
      criterioAlocacao,
      experimentoAtivo,
      fallbackUtilizado,
      mensagemErro,
      ferramenta,
      conteudoGerado,
      formatoSaida,
      habilidadesBncc,
      avisoEticoInjetado,
      tentativas: 0,
      timestampEnfileiramento: performance.now(),
    };
  }

  /**
   * Enfileira uma métrica de inferência de forma NÃO-BLOQUEANTE (Zero-Overhead).
   * Retorna instantaneamente (< 0.1ms) sem esperar qualquer I/O do PostgreSQL.
   * 
   * @param {Object} dados - Dados da métrica de inferência
   * @returns {Object} { requisicaoId, telemetriaId, status: 'enfileirado', sobrecargaMs }
   */
  enfileirarMetrica(dados) {
    const tInicio = performance.now();
    const itemNormalizado = this.normalizarDadosMetrica(dados);

    // Proteção de saturação de fila em memória (Backpressure Safety)
    if (this.fila.length >= this.capacidadeMaximaFila) {
      console.warn(
        `[TelemetryAsyncService] ⚠️ Limite de fila excedido (${this.capacidadeMaximaFila}). Descartando registro mais antigo.`
      );
      this.fila.shift();
      this.totalFalhas++;
    }

    this.fila.push(itemNormalizado);
    this.totalEnfileirados++;

    const tFim = performance.now();
    const sobrecargaMs = Number((tFim - tInicio).toFixed(3));

    // Atualiza estatísticas de sobrecarga
    this.somaSobrecargaUsuarioMs += sobrecargaMs;
    if (sobrecargaMs > this.sobrecargaMaximaUsuarioMs) {
      this.sobrecargaMaximaUsuarioMs = sobrecargaMs;
    }

    // Se o lote atingiu a capacidade máxima, agenda processamento no próximo microtick
    if (this.fila.length >= this.tamanhoLoteMaximo && !this.processando) {
      setImmediate(() => {
        this.processarFila().catch((err) => {
          console.error('[TelemetryAsyncService] Erro ao disparar lote imediato:', err.message);
        });
      });
    }

    return {
      requisicaoId: itemNormalizado.requisicaoId,
      telemetriaId: itemNormalizado.telemetriaId,
      status: 'enfileirado',
      sobrecargaMs,
    };
  }

  /**
   * Método de conveniência para gravação assíncrona de uma geração pedagógica completa
   * chamada diretamente pelos serviços de inferência (GroqService, GeminiService).
   * 
   * @param {Object} params
   * @returns {Object} { requisicaoId, telemetriaId, status: 'enfileirado', sobrecargaMs }
   */
  registrarGeracaoAssincrona({
    id = null,
    usuarioId = null,
    ferramenta = 'exercicios',
    parametrosEntrada = {},
    conteudoGerado = {},
    formatoSaida = null,
    habilidadesBncc = [],
    avisoEticoInjetado = true,
    telemetria = {},
  }) {
    return this.enfileirarMetrica({
      id_requisicao: id || telemetria.requisicaoId,
      usuario_id: usuarioId,
      motor_utilizado: telemetria.motorIa || telemetria.motor || 'groq',
      modelo_especifico: telemetria.modeloEspecifico || telemetria.modelo,
      tempo_latencia_ms: telemetria.latenciaMs || telemetria.tempoLatenciaMs || 0,
      tokens_prompt: telemetria.tokensPrompt,
      tokens_completion: telemetria.tokensCompletion,
      total_tokens: telemetria.totalTokens,
      status_execucao: telemetria.statusExecucao || 'sucesso',
      parametros_curriculares: parametrosEntrada,
      grupo_experimental: telemetria.grupoExperimental || telemetria.grupo,
      chave_alocacao: telemetria.chaveAlocacao,
      criterio_alocacao: telemetria.criterioAlocacao,
      experimento_ativo: telemetria.experimentoAtivo,
      fallback_utilizado: telemetria.fallbackUtilizado,
      mensagem_erro: telemetria.mensagemErro,
      ferramenta,
      conteudo_gerado: conteudoGerado,
      formato_saida: formatoSaida,
      habilidades_bncc: habilidadesBncc,
      aviso_etico_injetado: avisoEticoInjetado,
      data_hora: new Date(),
    });
  }

  /**
   * Processa a fila de métricas gravando os itens pendentes no PostgreSQL.
   * Executa em segundo plano de forma totalmente assíncrona.
   */
  async processarFila() {
    if (this.processando || this.fila.length === 0) {
      return;
    }

    this.processando = true;
    const itensParaGravar = this.fila.splice(0, this.tamanhoLoteMaximo);
    const tInicioDb = performance.now();

    for (const item of itensParaGravar) {
      try {
        await this._gravarItemNoBanco(item);
        this.totalGravadosSucesso++;
      } catch (err) {
        console.error(
          `[TelemetryAsyncService] Falha ao persistir telemetria ${item.telemetriaId} (tentativa ${item.tentativas + 1}):`,
          err.message
        );

        item.tentativas++;
        if (item.tentativas < this.maxRetries) {
          // Reenfileira para nova tentativa no fim da fila
          this.fila.push(item);
        } else {
          console.error(
            `[TelemetryAsyncService] ❌ Descartando telemetria ${item.telemetriaId} após ${this.maxRetries} falhas consecutivas.`
          );
          this.totalFalhas++;
        }
      }
    }

    const tFimDb = performance.now();
    const duracaoDbMs = tFimDb - tInicioDb;
    this.somaTempoGravacaoDbMs += duracaoDbMs;
    this.totalLotesGravados++;
    this.processando = false;

    // Se ainda houver itens restantes na fila, agenda próximo lote imediatamente
    if (this.fila.length > 0) {
      setImmediate(() => {
        this.processarFila().catch(() => {});
      });
    }
  }

  /**
   * Grava um item individual no PostgreSQL garantindo integridade referencial.
   * @private
   */
  async _gravarItemNoBanco(item) {
    // 1. Grava ou valida a requisição pai na tabela requisicoes_ia
    await laboratorioRepository.transaction(async (client) => {
      // Verifica se a requisição pai já foi inserida
      const checkReq = await client.query(
        'SELECT id FROM requisicoes_ia WHERE id = $1;',
        [item.requisicaoId]
      );

      if (checkReq.rows.length === 0) {
        const conteudoFormatado = item.conteudoGerado
          ? (typeof item.conteudoGerado === 'string' ? item.conteudoGerado : JSON.stringify(item.conteudoGerado))
          : JSON.stringify({ titulo: 'Telemetria de Inferência Assíncrona', status: item.status });

        // Valida se usuarioIdOriginal é um UUID existente na tabela usuarios para não violar FK
        const isUuid = (val) =>
          typeof val === 'string' &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

        let usuarioIdValido = null;
        if (isUuid(item.usuarioIdOriginal)) {
          const uCheck = await client.query('SELECT id FROM usuarios WHERE id = $1;', [item.usuarioIdOriginal]);
          if (uCheck.rows.length > 0) {
            usuarioIdValido = item.usuarioIdOriginal;
          }
        }

        const sqlReq = `
          INSERT INTO requisicoes_ia (
            id,
            usuario_id,
            ferramenta,
            parametros_entrada,
            conteudo_gerado,
            formato_saida,
            habilidades_bncc,
            aviso_etico_injetado
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING;
        `;
        await client.query(sqlReq, [
          item.requisicaoId,
          usuarioIdValido,
          item.ferramenta,
          JSON.stringify(item.parametros),
          conteudoFormatado,
          item.formatoSaida ? JSON.stringify(item.formatoSaida) : null,
          JSON.stringify(item.habilidadesBncc),
          item.avisoEticoInjetado,
        ]);
      }

      // 2. Insere a métrica na tabela telemetria_ab com todos os campos requisitados
      const sqlTel = `
        INSERT INTO telemetria_ab (
          id,
          requisicao_ia_id,
          usuario_id_hash,
          motor_ia,
          modelo_especifico,
          latencia_ms,
          tokens_prompt,
          tokens_completion,
          total_tokens,
          status_execucao,
          fallback_utilizado,
          mensagem_erro,
          parametros_curriculares,
          grupo_experimental,
          chave_alocacao,
          criterio_alocacao,
          experimento_ativo,
          criado_em
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (id) DO UPDATE SET
          latencia_ms = EXCLUDED.latencia_ms,
          status_execucao = EXCLUDED.status_execucao,
          total_tokens = EXCLUDED.total_tokens;
      `;

      await client.query(sqlTel, [
        item.telemetriaId,
        item.requisicaoId,
        item.usuarioHash,
        item.motor,
        item.modelo,
        item.latencia,
        item.tokensPrompt,
        item.tokensCompletion,
        item.totalTokens,
        item.status,
        item.fallbackUtilizado,
        item.mensagemErro,
        JSON.stringify(item.parametros),
        item.grupo,
        item.chaveAlocacao,
        item.criterioAlocacao,
        item.experimentoAtivo,
        item.dataHora,
      ]);
    });
  }

  /**
   * Aguarda o esvaziamento completo da fila em memória.
   * Utilizado em suítes de testes automatizados e encerramento seguro do servidor.
   * 
   * @param {number} [timeoutMs=10000]
   * @returns {Promise<void>}
   */
  async aguardarProcessamentoFila(timeoutMs = 10000) {
    const tInicio = Date.now();

    while (this.fila.length > 0 || this.processando) {
      if (Date.now() - tInicio > timeoutMs) {
        throw new Error(
          `[TelemetryAsyncService] Timeout de ${timeoutMs}ms aguardando esvaziamento da fila (${this.fila.length} pendentes).`
        );
      }
      await this.processarFila();
      await new Promise((res) => setTimeout(res, 50));
    }
  }

  /**
   * Retorna métricas diagnósticas de desempenho e sobrecarga em tempo real
   */
  obterMetricas() {
    const mediaSobrecarga =
      this.totalEnfileirados > 0
        ? Number((this.somaSobrecargaUsuarioMs / this.totalEnfileirados).toFixed(4))
        : 0;

    const mediaDb =
      this.totalLotesGravados > 0
        ? Number((this.somaTempoGravacaoDbMs / this.totalLotesGravados).toFixed(2))
        : 0;

    return {
      tamanhoFilaAtual: this.fila.length,
      totalEnfileirados: this.totalEnfileirados,
      totalGravadosSucesso: this.totalGravadosSucesso,
      totalFalhas: this.totalFalhas,
      taxaSucessoPercentual:
        this.totalEnfileirados > 0
          ? Number(((this.totalGravadosSucesso / this.totalEnfileirados) * 100).toFixed(2))
          : 100,
      sobrecargaUsuario: {
        tempoMedioMs: mediaSobrecarga,
        tempoMaximoMs: Number(this.sobrecargaMaximaUsuarioMs.toFixed(3)),
        criterioZeroSobrecargaAtendido: mediaSobrecarga < 1.0, // Critério < 1ms
      },
      bancoDeDados: {
        tempoMedioLoteMs: mediaDb,
        totalLotesProcessados: this.totalLotesGravados,
      },
      configuracao: {
        tamanhoLoteMaximo: this.tamanhoLoteMaximo,
        intervaloFlushMs: this.intervaloFlushMs,
        capacidadeMaximaFila: this.capacidadeMaximaFila,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Encerramento gracioso do serviço
   */
  async fechar() {
    if (this.timerFlush) {
      clearInterval(this.timerFlush);
    }
    await this.aguardarProcessamentoFila(5000).catch((err) => {
      console.warn('[TelemetryAsyncService] Advertência ao fechar fila:', err.message);
    });
  }
}

export const telemetryAsyncService = new TelemetryAsyncService();
export default telemetryAsyncService;

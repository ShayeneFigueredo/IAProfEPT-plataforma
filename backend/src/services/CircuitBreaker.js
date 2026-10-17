import { AppError } from '../errors/AppError.js';

/**
 * Estados possíveis do Circuit Breaker
 */
export const CircuitState = Object.freeze({
  CLOSED: 'CLOSED',       // Circuito fechado: tráfego normal fluindo para o motor
  OPEN: 'OPEN',           // Circuito aberto: motor indisponível, fast-fail imediato para fallback
  HALF_OPEN: 'HALF_OPEN', // Meio-aberto: período de teste para verificar se o motor se recuperou
});

/**
 * Erro específico lançado quando o circuito está em estado OPEN
 */
export class CircuitBreakerOpenError extends AppError {
  constructor(motorName, resetTimeRemainingMs) {
    super(
      `Circuito Aberto para o Motor ${motorName}`,
      503,
      `O motor ${motorName} está temporariamente isolado devido a falhas consecutivas ou instabilidade. Recuperação em ${Math.ceil(resetTimeRemainingMs / 1000)}s.`
    );
    this.motorName = motorName;
    this.resetTimeRemainingMs = resetTimeRemainingMs;
    this.circuitOpen = true;
  }
}

/**
 * Erro de Timeout de Incerência (> 10s)
 */
export class AIInferenceTimeoutError extends AppError {
  constructor(motorName, timeoutMs) {
    super(
      `Timeout na Inferência de IA (${motorName})`,
      504,
      `A requisição ao motor ${motorName} excedeu o limite de segurança de ${timeoutMs / 1000}s sem resposta.`
    );
    this.motorName = motorName;
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Implementação do Padrão Circuit Breaker com Timeout de Segurança
 * Plataforma IAprofEPT — Tese de Doutorado PPGEM / UFJF
 * 
 * Protege a experiência do professor de Matemática da EPT contra:
 * 1. Timeouts de rede e APIs travadas (> 10s).
 * 2. Erros de Rate Limit (HTTP 429) e esgotamento de cotas.
 * 3. Instabilidades e erros de infraestrutura (HTTP 500, 502, 503, 504).
 */
export class CircuitBreaker {
  /**
   * @param {Object} options
   * @param {string} options.name - Nome identificador do motor (ex: 'groq', 'gemini')
   * @param {number} [options.failureThreshold=3] - Quantidade de falhas para abrir o circuito
   * @param {number} [options.resetTimeoutMs=30000] - Tempo em ms que o circuito permanece OPEN antes de HALF_OPEN
   * @param {number} [options.timeoutMs=10000] - Limite de timeout por requisição (padrão 10s)
   */
  constructor({
    name,
    failureThreshold = 3,
    resetTimeoutMs = 30000,
    timeoutMs = 10000,
  }) {
    this.name = name;
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
    this.timeoutMs = timeoutMs;

    this.state = CircuitState.CLOSED;
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.lastError = null;

    // Métricas para rastreabilidade e telemetria
    this.totalRequests = 0;
    this.totalSuccesses = 0;
    this.totalFailures = 0;
    this.totalTimeouts = 0;
    this.totalCircuitBreaks = 0;
  }

  /**
   * Executa uma função assíncrona protegida pelo Circuit Breaker e com timeout estrito
   * 
   * @param {Function} actionFn - Função assíncrona () => Promise<any>
   * @param {Object} [context] - Metadados de contexto
   */
  async execute(actionFn, context = {}) {
    this.totalRequests++;

    // 1. Verificação do Estado Atual do Circuito
    if (this.state === CircuitState.OPEN) {
      const now = Date.now();
      const tempoDecorrido = now - this.lastFailureTime;

      if (tempoDecorrido >= this.resetTimeoutMs) {
        // Transição para HALF_OPEN: permite que 1 requisição teste a recuperação do provedor
        console.warn(
          `[CircuitBreaker:${this.name}] 🟡 Cooldown expirado (${tempoDecorrido}ms). Transição de OPEN para HALF_OPEN.`
        );
        this.state = CircuitState.HALF_OPEN;
      } else {
        const tempoRestante = this.resetTimeoutMs - tempoDecorrido;
        // Fast-fail: rejeita imediatamente sem aguardar timeout
        throw new CircuitBreakerOpenError(this.name, tempoRestante);
      }
    }

    // 2. Execução com Timeout de Segurança (> 10s)
    let timeoutHandle = null;
    const timeoutEfetivo = context.timeoutMs || this.timeoutMs;

    try {
      const timeoutPromise = new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => {
          this.totalTimeouts++;
          reject(new AIInferenceTimeoutError(this.name, timeoutEfetivo));
        }, timeoutEfetivo);
      });

      // Competição entre a execução da ação e o temporizador de segurança
      const resultado = await Promise.race([actionFn(), timeoutPromise]);
      clearTimeout(timeoutHandle);

      this.onSuccess();
      return resultado;
    } catch (err) {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      this.onFailure(err);
      throw err;
    }
  }

  /**
   * Trata o sucesso da execução
   */
  onSuccess() {
    this.totalSuccesses++;
    this.consecutiveSuccesses++;
    this.lastSuccessTime = Date.now();
    this.consecutiveFailures = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      console.log(
        `[CircuitBreaker:${this.name}] 🟢 Teste bem-sucedido em HALF_OPEN. Circuito restaurado para CLOSED.`
      );
      this.state = CircuitState.CLOSED;
      this.lastError = null;
    }
  }

  /**
   * Trata a falha na execução
   */
  onFailure(error) {
    this.totalFailures++;
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();
    this.lastError = error?.message || String(error);

    if (this.state === CircuitState.HALF_OPEN) {
      console.warn(
        `[CircuitBreaker:${this.name}] 🔴 Falha durante HALF_OPEN: ${this.lastError}. Retornando imediatamente para OPEN.`
      );
      this.state = CircuitState.OPEN;
      this.totalCircuitBreaks++;
      return;
    }

    if (this.state === CircuitState.CLOSED && this.consecutiveFailures >= this.failureThreshold) {
      console.warn(
        `[CircuitBreaker:${this.name}] 🔴 Limite de ${this.failureThreshold} falhas consecutivas atingido. Circuito ABERTO (OPEN).`
      );
      this.state = CircuitState.OPEN;
      this.totalCircuitBreaks++;
    }
  }

  /**
   * Força a abertura manual do circuito (útil para testes de contingência)
   */
  forceOpen(reason = 'Abertura manual de teste') {
    this.state = CircuitState.OPEN;
    this.lastFailureTime = Date.now();
    this.lastError = reason;
    this.consecutiveFailures = this.failureThreshold;
    this.totalCircuitBreaks++;
    console.warn(`[CircuitBreaker:${this.name}] 🔴 Forçado para OPEN: ${reason}`);
  }

  /**
   * Força o fechamento manual do circuito
   */
  forceClose() {
    this.state = CircuitState.CLOSED;
    this.consecutiveFailures = 0;
    this.lastError = null;
    console.log(`[CircuitBreaker:${this.name}] 🟢 Forçado para CLOSED.`);
  }

  /**
   * Retorna os dados diagnósticos do Circuit Breaker
   */
  getStatus() {
    const now = Date.now();
    const tempoRestanteOpen =
      this.state === CircuitState.OPEN && this.lastFailureTime
        ? Math.max(0, this.resetTimeoutMs - (now - this.lastFailureTime))
        : 0;

    return {
      name: this.name,
      state: this.state,
      isAvailable: this.state === CircuitState.CLOSED || this.state === CircuitState.HALF_OPEN,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
      failureThreshold: this.failureThreshold,
      timeoutMs: this.timeoutMs,
      resetTimeoutMs: this.resetTimeoutMs,
      resetTimeRemainingMs: tempoRestanteOpen,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
      lastSuccessTime: this.lastSuccessTime ? new Date(this.lastSuccessTime).toISOString() : null,
      lastError: this.lastError,
      metrics: {
        totalRequests: this.totalRequests,
        totalSuccesses: this.totalSuccesses,
        totalFailures: this.totalFailures,
        totalTimeouts: this.totalTimeouts,
        totalCircuitBreaks: this.totalCircuitBreaks,
      },
    };
  }
}

export default CircuitBreaker;

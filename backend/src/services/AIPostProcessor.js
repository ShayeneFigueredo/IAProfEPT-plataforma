/**
 * Pipeline de Pós-Processamento de Saídas de IA (Sanitização, LaTeX e Banner Ético)
 * Plataforma IAprofEPT — Tese de Doutorado PPGEM / UFJF
 * 
 * Atende aos requisitos:
 * 1. Validação do formato da resposta (desempacotamento de markdown, parsing estrito de JSON).
 * 2. Sanitização de saídas indesejadas (XSS, scripts, vazamento de system prompt, caracteres nulos).
 * 3. Padronização de equações matemáticas em sintaxe LaTeX/KaTeX legível ($...$ e $$...$$).
 * 4. Injeção compulsória da nota institucional ética de autoridade docente (ADR-002).
 * 5. Critério de Aceite: Nenhuma saída entregue sem o texto de validação e fórmulas compatíveis com o front-end.
 */

export const NOTA_INSTITUCIONAL_VALIDACAO_DOCENTE =
  'Este material foi gerado por Inteligência Artificial e deve ser validado pela autoridade docente.';

export const ALERTA_ETICO_COMPLETO_UFJF =
  'Este material foi gerado por Inteligência Artificial e deve ser revisado, validado e adaptado pela autoridade docente antes de sua aplicação em sala de aula.';

/**
 * Padrões de saídas indesejadas e vazamento de prompts para remoção
 */
const PADROES_INDESEJADOS = [
  /\[SYSTEM\s+INSTRUCTION[\s\S]*?\]/gi,
  /\[SYSTEM\s+PROMPT[\s\S]*?\]/gi,
  /System\s*Prompt\s*:/gi,
  /Ignore\s+(all\s+)?previous\s+instructions/gi,
  /As\s+an\s+AI\s+language\s+model[\s\S]*?[,.]/gi,
  /Como\s+um\s+modelo\s+de\s+linguagem[\s\S]*?[,.]/gi,
  /Here\s+is\s+the\s+requested\s+JSON\s*:/gi,
  /Aqui\s+est[áa]\s+o\s+JSON\s+solicitado\s*:/gi,
  /<script[\s\S]*?<\/script>/gi,
  /<iframe[\s\S]*?<\/iframe>/gi,
  /<object[\s\S]*?<\/object>/gi,
  /<embed[\s\S]*?<\/embed>/gi,
  /javascript\s*:/gi,
  /onerror\s*=/gi,
  /onload\s*=/gi,
  /\u0000/g, // Null bytes
];

export class AIPostProcessor {
  /**
   * Sanitiza uma string removendo tags de risco, caracteres de controle e vazamentos de prompt.
   * 
   * @param {string} texto
   * @returns {string}
   */
  sanitizarTexto(texto) {
    if (typeof texto !== 'string') return texto;

    let limpo = texto;

    // Remove padrões indesejados
    for (const regex of PADROES_INDESEJADOS) {
      limpo = limpo.replace(regex, '');
    }

    // Normaliza quebras de linha excessivas
    limpo = limpo.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');

    return limpo.trim();
  }

  /**
   * Padroniza fórmulas e expressões matemáticas para sintaxe LaTeX/KaTeX legível.
   * 
   * @param {string} texto
   * @returns {string}
   */
  formatarLatexMatematico(texto) {
    if (typeof texto !== 'string') return texto;

    let resultado = texto;

    // 1. Normaliza delimitadores LaTeX alternativos para KaTeX padrão ($ e $$)
    resultado = resultado.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
    resultado = resultado.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

    // 2. Converte funções matemáticas clássicas fora de delimitadores (ex: sqrt(x) -> $\sqrt{x}$)
    resultado = resultado.replace(/(?<!\$)\b(?:sqrt|raiz)\(([^)]+)\)(?!\$)/gi, (m, arg) => {
      return `$\\sqrt{${this._normalizarComandosLatex(arg)}}$`;
    });

    // 3. Converte desigualdades e relações fora de delimitadores (ex: "x >= 0", "theta <= 90°")
    resultado = resultado.replace(
      /(?<!\$)\b([a-zA-Z\\][a-zA-Z0-9_]*)\s*(>=|<=|!=)\s*([0-9a-zA-Z_°\.\,\-]+)(?!\$)/g,
      (m, esq, op, dir) => {
        const opLatex = op === '>=' ? '\\ge' : op === '<=' ? '\\le' : '\\neq';
        const dirFormatado = this._normalizarComandosLatex(dir);
        const esqFormatado = this._normalizarComandosLatex(esq);
        return `$${esqFormatado} ${opLatex} ${dirFormatado}$`;
      }
    );

    // 4. Detecta equações explícitas isoladas (ex: "C(t) = 50 * (1/2)^(t/4)")
    resultado = this._detectarEEnvolverEquacoesBrutas(resultado);

    // 5. Normaliza conteúdo dentro de blocos matemáticos $$ ... $$ e $ ... $
    resultado = resultado.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
      return `$$${this._normalizarComandosLatex(formula)}$$`;
    });

    resultado = resultado.replace(/(?<!\$)\$([^\$\n]+?)\$(?!\$)/g, (match, formula) => {
      return `$${this._normalizarComandosLatex(formula)}$`;
    });

    // 6. Converte graus residuais fora de KaTeX (ex: "90°" -> "$90^\circ$")
    resultado = resultado.replace(/(?<!\$)\b(\d+)\s*°(?!\$)/g, '$$$1^\\circ$$');

    return resultado;
  }

  /**
   * Normaliza comandos e símbolos internos de uma expressão LaTeX
   * @private
   */
  _normalizarComandosLatex(formula) {
    let f = formula;

    // Operadores relacionais
    f = f.replace(/>=/g, ' \\ge ');
    f = f.replace(/<=/g, ' \\le ');
    f = f.replace(/!=/g, ' \\neq ');
    f = f.replace(/~=/g, ' \\approx ');

    // Multiplicação aritmética: " * " ou "\*" -> " \cdot "
    f = f.replace(/\\\*/g, ' \\cdot ');
    f = f.replace(/(?<=[0-9a-zA-Z\)])\s*\*\s*(?=[0-9a-zA-Z\(])/g, ' \\cdot ');

    // Raiz quadrada: "sqrt(x)" -> "\sqrt{x}"
    f = f.replace(/\bsqrt\(([^)]+)\)/gi, '\\sqrt{$1}');
    f = f.replace(/\braiz\(([^)]+)\)/gi, '\\sqrt{$1}');

    // Frações do tipo (a)/(b) ou parentizadas: (1/2) -> \frac{1}{2}
    f = f.replace(/\((\d+)\/(\d+)\)/g, '\\left(\\frac{$1}{$2}\\right)');

    // Potências compostas: ^(algo) -> ^{algo}
    f = f.replace(/\^\(([^)]+)\)/g, '^{$1}');

    // Símbolos gregos comuns em matemática da EPT
    f = f.replace(/\bDelta\b/g, '\\Delta');
    f = f.replace(/\bdelta\b/g, '\\delta');
    f = f.replace(/\bpi\b/g, '\\pi');
    f = f.replace(/\btheta\b/g, '\\theta');
    f = f.replace(/\balpha\b/g, '\\alpha');
    f = f.replace(/\bbeta\b/g, '\\beta');

    // Graus: "30°" -> "30^\circ"
    f = f.replace(/(\d+)\s*°/g, '$1^\\circ');

    // Limpa espaços duplicados
    f = f.replace(/\s{2,}/g, ' ').trim();

    return f;
  }

  /**
   * Detecta fórmulas matemáticas isoladas no texto sem capturar palavras em português
   * e envolve-as com "$ ... $" para que o frontend renderize perfeitamente.
   * @private
   */
  _detectarEEnvolverEquacoesBrutas(texto) {
    // Padrão que identifica equações funcionais: C(t) = ..., f(x) = ..., y = ...
    // Para antes de pontuação ou palavras em português comuns (determine, calcule, com, etc.)
    const padraoEquacao =
      /(?<!\$)\b([a-zA-Z](?:\([a-zA-Z0-9_]+\))?\s*=\s*[0-9a-zA-Z\+\-\*\/\^\(\)\{\}\\\_\.\,]+(?:\s*[\+\-\*\/\=]\s*[0-9a-zA-Z\+\-\*\/\^\(\)\{\}\\\_\.\,]+)*)(?!\$)/g;

    return texto.replace(padraoEquacao, (match, equacao) => {
      // Ignora atribuições puramente textuais ou já delimitadas
      if (
        equacao.includes('=') &&
        (equacao.includes('^') ||
          equacao.includes('*') ||
          equacao.includes('/') ||
          /\d/.test(equacao))
      ) {
        return `$${this._normalizarComandosLatex(equacao)}$`;
      }
      return match;
    });
  }

  /**
   * Percorre recursivamente todas as chaves e valores de um objeto JSON
   * aplicando sanitização e formatação matemática LaTeX em todos os campos textuais.
   * 
   * @param {any} item
   * @returns {any}
   */
  processarRecursivo(item) {
    if (typeof item === 'string') {
      const sanitizado = this.sanitizarTexto(item);
      return this.formatarLatexMatematico(sanitizado);
    }

    if (Array.isArray(item)) {
      return item.map((subItem) => this.processarRecursivo(subItem));
    }

    if (item !== null && typeof item === 'object') {
      const novoObjeto = {};
      for (const [chave, valor] of Object.entries(item)) {
        novoObjeto[chave] = this.processarRecursivo(valor);
      }
      return novoObjeto;
    }

    return item;
  }

  /**
   * Injeta compulsoriamente os banners éticos institucionais da autoridade docente
   * 
   * @param {Object|string} conteudo
   * @returns {Object}
   */
  injetarBannerEticoCompulsorio(conteudo) {
    let obj = conteudo;

    if (typeof obj === 'string') {
      try {
        obj = JSON.parse(obj);
      } catch (e) {
        // Se for string pura, encapsula em objeto estruturado padronizado
        obj = { texto: obj };
      }
    }

    if (typeof obj !== 'object' || obj === null) {
      obj = { resultado: obj };
    }

    // Injeção compulsória no nível raiz
    obj.notaInstitucional = NOTA_INSTITUCIONAL_VALIDACAO_DOCENTE;
    obj.alertaEticoObrigatorio = NOTA_INSTITUCIONAL_VALIDACAO_DOCENTE;
    obj.alertaEticoCompleto = ALERTA_ETICO_COMPLETO_UFJF;
    obj.validacaoDocenteRequerida = true;

    // Se houver nós aninhados típicos de geração pedagógica, reforça a nota
    if (obj.atividade && typeof obj.atividade === 'object') {
      obj.atividade.notaInstitucional = NOTA_INSTITUCIONAL_VALIDACAO_DOCENTE;
      obj.atividade.alertaEticoObrigatorio = NOTA_INSTITUCIONAL_VALIDACAO_DOCENTE;
    }

    if (obj.plano && typeof obj.plano === 'object') {
      obj.plano.notaInstitucional = NOTA_INSTITUCIONAL_VALIDACAO_DOCENTE;
      obj.plano.alertaEticoObrigatorio = NOTA_INSTITUCIONAL_VALIDACAO_DOCENTE;
    }

    return obj;
  }

  /**
   * Valida e desempacota o payload recebido da LLM (trata markdown ```json ... ```)
   * 
   * @param {any} entrada
   * @returns {Object}
   */
  desempacotarEValidarJson(entrada) {
    if (typeof entrada === 'object' && entrada !== null) {
      return entrada;
    }

    if (typeof entrada !== 'string') {
      return { conteudo: entrada };
    }

    let texto = entrada.trim();

    // 1. Remove blocos markdown ```json ... ``` ou ``` ... ```
    const matchJson = texto.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (matchJson) {
      texto = matchJson[1].trim();
    }

    // 2. Tenta parsing direto
    try {
      return JSON.parse(texto);
    } catch (e) {
      // 3. Tenta extrair primeiro e último colchete/chave JSON válido
      const inicioChave = texto.indexOf('{');
      const fimChave = texto.lastIndexOf('}');

      if (inicioChave !== -1 && fimChave > inicioChave) {
        try {
          const substringJson = texto.substring(inicioChave, fimChave + 1);
          return JSON.parse(substringJson);
        } catch (subErr) {
          // Continua para o fallback estruturado
        }
      }

      // Fallback gracioso estruturado caso o modelo tenha cuspido texto corrido
      return {
        tipo: 'texto_formatado',
        conteudoFormatado: this.formatarLatexMatematico(this.sanitizarTexto(texto)),
      };
    }
  }

  /**
   * Método Principal do Pipeline:
   * 1. Desempacota e valida formato JSON.
   * 2. Sanitiza saídas indesejadas (XSS, scripts, vazamento de system instruction).
   * 3. Padroniza notação matemática em sintaxe KaTeX/LaTeX legível.
   * 4. Injeta compulsoriamente a nota ética de autoridade docente.
   * 
   * @param {any} saidaBruta - Saída bruta do modelo (Groq ou Gemini)
   * @param {Object} [contexto] - Metadados adicionais
   * @returns {Object} Payload final limpo, formatado em LaTeX e com banner ético
   */
  processar(saidaBruta, contexto = {}) {
    // Passo 1: Desempacotar e validar JSON
    const objetoDesempacotado = this.desempacotarEValidarJson(saidaBruta);

    // Passo 2 e 3: Sanitizar e formatar LaTeX recursivamente
    const objetoProcessado = this.processarRecursivo(objetoDesempacotado);

    // Passo 4: Injetar compulsoriamente a nota institucional ética
    const objetoFinal = this.injetarBannerEticoCompulsorio(objetoProcessado);

    // Anexa metadados do pipeline de pós-processamento
    objetoFinal.posProcessado = {
      sucesso: true,
      latexFormatado: true,
      sanitizado: true,
      alertaEticoCompulsorioInjetado: true,
      timestamp: new Date().toISOString(),
    };

    return objetoFinal;
  }
}

export const aiPostProcessor = new AIPostProcessor();
export default aiPostProcessor;

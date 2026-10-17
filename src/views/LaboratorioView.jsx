import React, { useState } from 'react';
import {
  FlaskConical,
  FileText,
  Calculator,
  Copy,
  Download,
  ShieldAlert,
  ChevronRight,
  ChevronDown,
  FileCheck,
  RotateCcw,
  Check
} from 'lucide-react';
import { LAB_OPTIONS } from '../data/mockData';

export default function LaboratorioView() {
  const [areaMat, setAreaMat] = useState('Funções');
  const [nivel, setNivel] = useState('Intermediário');
  const [quantidade, setQuantidade] = useState('3 questões');
  const [cursoTec, setCursoTec] = useState('Enfermagem');
  const [metodologia, setMetodologia] = useState('Aprendizagem Baseada em Problemas (PBL)');
  
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(true);
  const [copiedFormula, setCopiedFormula] = useState(false);

  const handleCopyFormula = () => {
    navigator.clipboard.writeText('C(t) = 50 \\cdot \\left(\\frac{1}{2}\\right)^{\\frac{t}{4}}');
    setCopiedFormula(true);
    setTimeout(() => setCopiedFormula(false), 2000);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/laboratorio/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areaMatematica: areaMat,
          nivel,
          quantidade,
          cursoTecnico: cursoTec,
          metodologia,
          ferramenta: 'exercicios',
        }),
      });
      if (res.ok) {
        setHasGenerated(true);
      } else {
        // Fallback suave na interface
        setHasGenerated(true);
      }
    } catch (e) {
      console.warn('[Laboratório] Fallback visual offline:', e);
      setHasGenerated(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = `Lista de Exercícios: Funções na Enfermagem
Nível Intermediário | 3 questões | Metodologia: ${metodologia}

Questão 1: Dosagem de Medicamento em Função do Tempo
Contexto Profissional:
Um enfermeiro precisa administrar um medicamento intravenoso que diminui sua concentração no sangue do paciente ao longo do tempo. A concentração C(t) em mg/L após t horas é modelada pela função:
C(t) = 50 * (1/2)^(t/4)

Pergunta:
a) Qual é a concentração inicial do medicamento?
b) Qual será a concentração após 8 horas?
c) Após quantas horas a concentração reduzir-se-á a 12,5 mg/L?`;
    navigator.clipboard.writeText(textToCopy);
    alert('Conteúdo copiado com sucesso!');
  };

  const handleExport = () => {
    window.print();
  };

  return (
    <div className="lab-view-container">
      
      {/* ====================================================================
           1. FORMULÁRIO PARAMETRIZADO (ZERO PROMPT EM BRANCO)
           ==================================================================== */}
      <div className="lab-card-form">
        <div className="lab-form-grid">
          
          {/* Campo 1: Área matemática */}
          <div className="lab-input-group">
            <label className="lab-field-label">Área matemática *</label>
            <select
              className="lab-select-field"
              value={areaMat}
              onChange={(e) => setAreaMat(e.target.value)}
            >
              <option value="Funções">Funções</option>
              <option value="Geometria Espacial">Geometria Espacial</option>
              <option value="Estatística & Probabilidade">Estatística & Probabilidade</option>
              <option value="Matemática Financeira">Matemática Financeira</option>
              <option value="Progressões (PA/PG)">Progressões (PA/PG)</option>
              <option value="Trigonometria">Trigonometria</option>
            </select>
          </div>

          {/* Campo 2: Nível de dificuldade */}
          <div className="lab-input-group">
            <label className="lab-field-label">Nível de dificuldade *</label>
            <select
              className="lab-select-field"
              value={nivel}
              onChange={(e) => setNivel(e.target.value)}
            >
              <option value="Básico">Básico</option>
              <option value="Intermediário">Intermediário</option>
              <option value="Avançado">Avançado</option>
            </select>
          </div>

          {/* Campo 3: Quantidade */}
          <div className="lab-input-group">
            <label className="lab-field-label">Quantidade *</label>
            <select
              className="lab-select-field"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            >
              <option value="1 questão">1 questão</option>
              <option value="3 questões">3 questões</option>
              <option value="5 questões">5 questões</option>
              <option value="10 questões">10 questões</option>
            </select>
          </div>

          {/* Campo 4: Curso técnico (contexto) */}
          <div className="lab-input-group">
            <label className="lab-field-label">Curso técnico (contexto) *</label>
            <select
              className="lab-select-field"
              value={cursoTec}
              onChange={(e) => setCursoTec(e.target.value)}
            >
              <option value="Enfermagem">Enfermagem</option>
              <option value="Informática / Desenvolvimento de Sistemas">Informática / Desenvolvimento de Sistemas</option>
              <option value="Agropecuária / Agricultura">Agropecuária / Agricultura</option>
              <option value="Edificações / Construção Civil">Edificações / Construção Civil</option>
              <option value="Administração / Logística">Administração / Logística</option>
              <option value="Eletrotécnica / Automação">Eletrotécnica / Automação</option>
            </select>
          </div>

          {/* Campo 5: Metodologia Pedagógica */}
          <div className="lab-input-group">
            <label className="lab-field-label">Metodologia pedagógica *</label>
            <select
              className="lab-select-field"
              value={metodologia}
              onChange={(e) => setMetodologia(e.target.value)}
            >
              <option value="Aprendizagem Baseada em Problemas (PBL)">Aprendizagem Baseada em Problemas (PBL)</option>
              <option value="Modelagem Matemática da Realidade">Modelagem Matemática da Realidade</option>
              <option value="Sala de Aula Invertida">Sala de Aula Invertida</option>
              <option value="Aprendizagem Baseada em Projetos Integradores">Aprendizagem Baseada em Projetos Integradores</option>
              <option value="Ensino Híbrido e Gamificação">Ensino Híbrido e Gamificação</option>
              <option value="Estudo de Casos Autênticos da EPT">Estudo de Casos Autênticos da EPT</option>
            </select>
          </div>

        </div>

        {/* Botão de Geração */}
        <div className="lab-action-row">
          <button
            className="btn-lab-generate"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            <FlaskConical size={16} />
            <span>{isGenerating ? 'Gerando com IA...' : 'Gerar com IA'}</span>
          </button>
        </div>

        {/* Toggle do System Prompt Oculto */}
        <div className="lab-system-prompt-toggle">
          <button
            type="button"
            className="btn-toggle-prompt"
            onClick={() => setShowSystemPrompt(!showSystemPrompt)}
          >
            {showSystemPrompt ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>Ver prompt de bastidores (System Prompt oculto & Injeção Curricular)</span>
          </button>

          {showSystemPrompt && (
            <div className="system-prompt-box">
              <p className="prompt-meta-note">
                <strong>Motor Server-Side:</strong> Groq LLaMA 3.3 70B & Google Gemini 1.5 · Injeção Pedagógica Automática (Zero Prompt em Branco)
              </p>
              <code>
{`[SYSTEM INSTRUCTION — PLATAFORMA IAPROFEPT | PPGEM-UFJF]
# PAPEL E DIRETRIZES DE EDUCAÇÃO MATEMÁTICA CRÍTICA (OLE SKOVSMOSE, 2022)
- Atuar como Especialista em Educação Matemática na EPT.
- Desenvolver o Conhecimento Reflexivo além do cálculo técnico: questionar implicações éticas e sociais.
- Matemática em Ação: enfatizar que os modelos quantitativos condicionam tomadas de decisão reais.

# ANCORAGEM CURRICULAR BNCC & EPT
- Área: ${areaMat} | Nível: ${nivel} | Quantidade: ${quantidade}
- Curso Técnico: ${cursoTec} | Metodologia: ${metodologia}
- Habilidades BNCC Injetadas: EM13MAT401 / EM13MAT308 / EM13MAT103 (conforme matriz oficial)

# CENÁRIO DO MUNDO DO TRABALHO (CNCT 4ª EDIÇÃO)
- Inserir situação-problema autêntica do perfil profissional de ${cursoTec}.
- Utilizar variáveis técnicas, tolerâncias e dados verossímeis do setor produtivo.

# ALERTA ÉTICO OBRIGATÓRIO (ADR-002)
- "Este material foi gerado por Inteligência Artificial e deve ser revisado, validado e adaptado pela autoridade docente antes de sua aplicação em sala de aula."

# FORMATO DE SAÍDA: JSON ESTRITO
- Retornar única e exclusivamente o objeto JSON validado conforme o schema formal.`}
              </code>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
           2. SAÍDA DE CONTEÚDO GERADO
           ==================================================================== */}
      {hasGenerated && (
        <div className="lab-output-card">
          
          {/* Cabeçalho do Card de Saída */}
          <div className="lab-output-header">
            <div className="output-header-left">
              <div className="output-icon-box">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="output-card-title">Conteúdo gerado</h3>
                <p className="output-card-submeta">
                  Área: <span>{areaMat}</span> · Nível: <span>{nivel}</span> · <span>{quantidade}</span> · Contexto: <span>{cursoTec}</span> · Metodologia: <span>{metodologia}</span>
                </p>
              </div>
            </div>

            <div className="output-header-actions">
              <button className="btn-output-action" onClick={handleCopy}>
                <Copy size={15} />
                <span>Copiar</span>
              </button>
              <button className="btn-output-action" onClick={handleExport}>
                <Download size={15} />
                <span>Exportar</span>
              </button>
            </div>
          </div>

          {/* Banner de Validação Pedagógica Obrigatória */}
          <div className="lab-ethical-warning-banner">
            <div className="ethical-warning-icon">
              <ShieldAlert size={18} />
            </div>
            <div className="ethical-warning-text">
              <strong>Validação pedagógica obrigatória.</strong> Este conteúdo foi gerado por Inteligência Artificial. Cabe ao professor revisar, adaptar e validar pedagogicamente sua aplicação.
            </div>
          </div>

          {/* Corpo do Conteúdo Gerado */}
          <div className="lab-generated-body">
            <h2 className="generated-doc-title">Lista de Exercícios: Funções na Enfermagem</h2>
            <p className="generated-doc-meta">Nível Intermediário | 3 questões</p>

            <div className="generated-question-block">
              <h3 className="question-heading">Questão 1: Dosagem de Medicamento em Função do Tempo</h3>
              
              <div className="question-section-context">
                <h4 className="section-subtitle">Contexto Profissional</h4>
                <p className="section-paragraph">
                  Um enfermeiro precisa administrar um medicamento intravenoso que diminui sua concentração no sangue do paciente ao longo do tempo. A concentração C(t) em mg/L após t horas é modelada pela função:
                </p>
              </div>

              {/* Fórmula Matemática Renderizada (MathML Padrão + Fallback Tipográfico Matemático) */}
              <div className="math-formula-container">
                <div className="math-formula-card">
                  <div className="math-formula-header">
                    <span className="math-formula-badge">
                      <Calculator size={13} /> Modelagem Formal: Decaimento Exponencial
                    </span>
                    <button
                      type="button"
                      className="btn-copy-latex"
                      onClick={handleCopyFormula}
                      title="Copiar fórmula em código LaTeX"
                    >
                      {copiedFormula ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
                      <span>{copiedFormula ? 'Copiado!' : 'Copiar LaTeX'}</span>
                    </button>
                  </div>

                  {/* Exibição Visual da Fórmula Matemática */}
                  <div className="math-render-area">
                    <div className="math-equation-box">
                      <span className="math-func">C(t)</span>
                      <span className="math-symbol">=</span>
                      <span className="math-constant">50</span>
                      <span className="math-symbol">·</span>
                      <span className="math-paren-big">(</span>
                      <span className="math-fraction">
                        <span className="fraction-num">1</span>
                        <span className="fraction-bar"></span>
                        <span className="fraction-den">2</span>
                      </span>
                      <span className="math-paren-big">)</span>
                      <sup className="math-exponent-fraction">
                        <span className="exp-num">t</span>
                        <span className="exp-bar"></span>
                        <span className="exp-den">4</span>
                      </sup>
                    </div>
                  </div>
                </div>
              </div>

              <div className="question-subquestions">
                <h4 className="section-subtitle">Pergunta:</h4>
                <ol className="subquestions-list">
                  <li>a) Qual é a concentração inicial do medicamento?</li>
                  <li>b) Qual será a concentração após 8 horas?</li>
                  <li>c) Após quantas horas a concentração reduzir-se-á a 12,5 mg/L?</li>
                </ol>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Download,
  ShieldAlert,
  ChevronRight,
  ChevronDown,
  FileCheck,
  RotateCcw
} from 'lucide-react';
import { LAB_OPTIONS } from '../data/mockData';

export default function LaboratorioView() {
  const [areaMat, setAreaMat] = useState('Funções');
  const [nivel, setNivel] = useState('Intermediário');
  const [quantidade, setQuantidade] = useState('3 questões');
  const [cursoTec, setCursoTec] = useState('Enfermagem');
  
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(true);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setHasGenerated(true);
    }, 600);
  };

  const handleCopy = () => {
    const textToCopy = `Lista de Exercícios: Funções na Enfermagem
Nível Intermediário | 3 questões

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

        </div>

        {/* Botão de Geração */}
        <div className="lab-action-row">
          <button
            className="btn-lab-generate"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            <Sparkles size={16} />
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
            <span>Ver prompt de bastidores (System Prompt oculto)</span>
          </button>

          {showSystemPrompt && (
            <div className="system-prompt-box">
              <p className="prompt-meta-note">
                <strong>Motor:</strong> Groq LLaMA 3.3 70B & Google Gemini 1.5 · Injeção Pedagógica Automática
              </p>
              <code>
{`[SYSTEM INSTRUCTION - PLATAFORMA IAPROFEPT]
Você é um especialista em Educação Matemática na EPT (Educação Profissional e Tecnológica).
Gere uma atividade contextualizada baseada nos seguintes parâmetros estritos:
- Área da Matemática: ${areaMat}
- Nível de Dificuldade: ${nivel}
- Quantidade: ${quantidade}
- Contexto Profissional: Curso Técnico em ${cursoTec}

Diretrizes obrigatórias:
1. Apresentar uma situação-problema real do cotidiano profissional de ${cursoTec}.
2. Incluir modelagem matemática formal e rigor conceitual.
3. Formular perguntas progressivas que estimulem o raciocínio crítico.`}
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
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="output-card-title">Conteúdo gerado</h3>
                <p className="output-card-submeta">
                  Área: <span>{areaMat}</span> · Nível: <span>{nivel}</span> · <span>{quantidade}</span> · Contexto: <span>{cursoTec}</span>
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

              {/* Fórmula Matemática Renderizada */}
              <div className="math-formula-display">
                <span>{'$$C(t) = 50 \\cdot \\left(\\frac{1}{2}\\right)^{t/4}$$'}</span>
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

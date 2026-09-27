import React, { useState } from 'react';
import { FlaskConical, Sparkles, Printer, Save, CheckCircle2 } from 'lucide-react';
import { LAB_OPTIONS } from '../data/mockData';
import EthicalBanner from '../components/EthicalBanner';

export default function LaboratorioView() {
  const [selectedTool, setSelectedTool] = useState('exercicios');
  const [areaMat, setAreaMat] = useState(LAB_OPTIONS.areasMatematica[0]);
  const [cursoTec, setCursoTec] = useState(LAB_OPTIONS.cursosTecnicos[0]);
  const [eixo, setEixo] = useState('trabalho');
  const [metodologia, setMetodologia] = useState(LAB_OPTIONS.metodologias[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultReady, setResultReady] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setResultReady(true);
    }, 1000);
  };

  return (
    <section>
      <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.75rem 2rem', marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-green)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FlaskConical size={24} /> Laboratório de IA
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.25rem' }}>
            Motor gerador de atividades contextualizadas com injeção automática de parâmetros curriculares.
          </p>
        </div>
        <span style={{ background: 'var(--primary-soft-bg)', color: 'var(--primary-green)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 700 }}>
          Sem Caixas de Prompt Vazias
        </span>
      </div>

      {/* 4 Ferramentas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {LAB_OPTIONS.ferramentas.map((f) => (
          <div
            key={f.id}
            onClick={() => setSelectedTool(f.id)}
            style={{
              background: selectedTool === f.id ? 'var(--tint-formativo)' : 'white',
              border: `2px solid ${selectedTool === f.id ? 'var(--primary-green)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.3rem', color: selectedTool === f.id ? 'var(--primary-green)' : 'var(--text-main)' }}>
              {f.titulo}
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Formulário Parametrizado */}
      <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-green)', marginBottom: '1.25rem' }}>
          Parâmetros de Contextualização da Atividade
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>Área / Tópico de Matemática:</label>
            <select style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-page)' }} value={areaMat} onChange={(e) => setAreaMat(e.target.value)}>
              {LAB_OPTIONS.areasMatematica.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>Curso Técnico da EPT:</label>
            <select style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-page)' }} value={cursoTec} onChange={(e) => setCursoTec(e.target.value)}>
              {LAB_OPTIONS.cursosTecnicos.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>Metodologia Ativa:</label>
            <select style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-page)' }} value={metodologia} onChange={(e) => setMetodologia(e.target.value)}>
              {LAB_OPTIONS.metodologias.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Eixo Tecnológico CNCT:</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {LAB_OPTIONS.eixosCNCT.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setEixo(e.id)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: `1px solid ${eixo === e.id ? 'var(--primary-green)' : 'var(--border-color)'}`,
                  background: eixo === e.id ? 'var(--primary-green)' : 'var(--bg-page)',
                  color: eixo === e.id ? 'white' : 'var(--text-main)'
                }}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Motores: <strong>Groq (LLaMA 3.3 70B) & Google Gemini</strong>
          </span>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              background: 'var(--primary-green)',
              color: 'white',
              border: 'none',
              padding: '0.8rem 1.75rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Sparkles size={18} />
            {isGenerating ? 'Orquestrando IA Dupla...' : 'Gerar Atividade com IA Contextualizada'}
          </button>
        </div>
      </div>

      {/* Resultado Gerado */}
      {resultReady && (
        <div style={{ background: 'white', border: '1px solid var(--primary-border)', borderRadius: 'var(--radius-lg)', padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{ padding: '0.3rem 0.65rem', background: 'var(--tint-lab)', color: 'var(--color-lab)', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem', fontWeight: 700 }}>{cursoTec}</span>
              <span style={{ padding: '0.3rem 0.65rem', background: 'var(--tint-formativo)', color: 'var(--color-formativo)', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem', fontWeight: 700 }}>BNCC: EM13MAT401 / EM13MAT103</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => window.print()} style={{ padding: '0.5rem 1rem', background: 'var(--bg-page)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600 }}>
                <Printer size={15} /> Imprimir / PDF
              </button>
              <button onClick={() => alert('Salvo no Repositório com sucesso!')} style={{ padding: '0.5rem 1rem', background: 'var(--primary-green)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600 }}>
                <Save size={15} /> Salvar no Repositório
              </button>
            </div>
          </div>

          <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-green)', marginBottom: '0.75rem' }}>
            Situação-Problema: Modelagem de Funções e Otimização de Recursos no {cursoTec}
          </h3>

          <div style={{ background: 'var(--bg-page)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', lineHeight: 1.7, marginBottom: '1rem' }}>
            <p><strong>1. Contextualização no Mundo do Trabalho:</strong></p>
            <p>Em ambientes profissionais do {cursoTec}, a análise de custos, fluxos operacionais e produtividade é expressa por equações e funções matemáticas lineares e quadráticas.</p>
            <p style={{ marginTop: '0.75rem' }}><strong>2. Situação-Problema Proposta:</strong></p>
            <p>Determine a lei matemática que relaciona as variáveis do processo e calcule o ponto ótimo de operação.</p>
            <p style={{ marginTop: '0.75rem' }}><strong>3. Gabarito Comentado:</strong></p>
            <p>Resolução detalhada passo a passo com critérios de correção formativa.</p>
          </div>

          <EthicalBanner />
        </div>
      )}
    </section>
  );
}

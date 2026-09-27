import React from 'react';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  BookOpen,
  FlaskConical,
  FolderGit2,
  Scale,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

export default function HomeView({ setTab }) {
  return (
    <section className="home-view-container">
      {/* Hero Banner Verde Escuro */}
      <div className="hero-box">
        <div className="hero-content-left">
          <div className="hero-tag-text">
            <span>✳️</span> Ambiente virtual de apoio à docência
          </div>
          <h2 className="hero-heading">
            Boa noite, Maycon. Vamos experimentar a IA na sua prática?
          </h2>
          <p className="hero-paragraph">
            Apoio à prática docente de Matemática na EPT — voltado à experimentação e à reflexão crítica sobre o uso da Inteligência Artificial na educação.
          </p>
          <div className="hero-actions-group">
            <button className="btn-hero-solid" onClick={() => setTab('laboratorio')}>
              <FlaskConical size={18} />
              <span>Abrir o Laboratório de IA</span>
            </button>
            <button className="btn-hero-glass" onClick={() => setTab('formativo')}>
              <span>Continuar minha trilha</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Mini Cards de Estatísticas à Direita */}
        <div className="hero-stats-panel">
          <div className="hero-stat-pill">
            <div className="hero-stat-icon-wrapper">
              <TrendingUp size={20} />
            </div>
            <div>
              <div className="stat-value-text">2 / 4</div>
              <div className="stat-label-text">Trilhas em andamento</div>
            </div>
          </div>

          <div className="hero-stat-pill">
            <div className="hero-stat-icon-wrapper">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="stat-value-text">17</div>
              <div className="stat-label-text">Materiais gerados na IA</div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção dos 5 Ambientes */}
      <div className="section-headline-bar">
        <h2>Os 5 ambientes da plataforma</h2>
        <span className="section-subtag">Interligados</span>
      </div>

      {/* Grid de 3 Colunas */}
      <div className="environments-cards-grid">
        
        {/* 1. Formativo */}
        <div className="env-tile-card" onClick={() => setTab('formativo')}>
          <div>
            <div className="env-tile-icon-box" style={{ background: 'var(--tint-formativo)', color: 'var(--color-formativo)' }}>
              <BookOpen size={22} />
            </div>
            <h3>Ambiente Formativo</h3>
            <p>Trilhas de formação continuada, materiais orientadores e e-book de prompts.</p>
          </div>
          <span className="env-tile-link">
            Acessar <ArrowRight size={14} />
          </span>
        </div>

        {/* 2. Laboratório de IA */}
        <div className="env-tile-card" onClick={() => setTab('laboratorio')}>
          <div>
            <div className="env-tile-icon-box" style={{ background: 'var(--tint-lab)', color: 'var(--color-lab)' }}>
              <FlaskConical size={22} />
            </div>
            <h3>Laboratório de IA</h3>
            <p>O motor da plataforma: gere exercícios, planos e atividades com IA generativa contextualizada.</p>
          </div>
          <span className="env-tile-link">
            Acessar <ArrowRight size={14} />
          </span>
        </div>

        {/* 3. Repositório de Práticas */}
        <div className="env-tile-card" onClick={() => setTab('repositorio')}>
          <div>
            <div className="env-tile-icon-box" style={{ background: 'var(--tint-repo)', color: 'var(--color-repo)' }}>
              <FolderGit2 size={22} />
            </div>
            <h3>Repositório de Práticas</h3>
            <p>Curadoria colaborativa de sequências didáticas, com filtros e exportação.</p>
          </div>
          <span className="env-tile-link">
            Acessar <ArrowRight size={14} />
          </span>
        </div>

        {/* 4. Reflexão Crítica */}
        <div className="env-tile-card" onClick={() => setTab('reflexao')}>
          <div>
            <div className="env-tile-icon-box" style={{ background: 'var(--tint-reflexao)', color: 'var(--color-reflexao)' }}>
              <Scale size={22} />
            </div>
            <h3>Reflexão Crítica</h3>
            <p>Fóruns, artigos e provocações sobre ética e uso crítico da IA na docência.</p>
          </div>
          <span className="env-tile-link">
            Acessar <ArrowRight size={14} />
          </span>
        </div>

        {/* 5. Acompanhamento e Suporte */}
        <div className="env-tile-card" onClick={() => setTab('suporte')}>
          <div>
            <div className="env-tile-icon-box" style={{ background: 'var(--tint-suporte)', color: 'var(--color-suporte)' }}>
              <HelpCircle size={22} />
            </div>
            <h3>Acompanhamento e Suporte</h3>
            <p>Tutoriais, reporte de erros e seu portfólio formativo de engajamento.</p>
          </div>
          <span className="env-tile-link">
            Acessar <ArrowRight size={14} />
          </span>
        </div>

        {/* 6. Apoio a Documentos (Google NotebookLM) */}
        <div className="env-tile-card" onClick={() => window.open('https://notebooklm.google.com/', '_blank')}>
          <div>
            <div className="env-tile-icon-box" style={{ background: '#ECFDF5', color: '#065F46' }}>
              <Sparkles size={22} />
            </div>
            <h3>Apoio a Documentos</h3>
            <p>Acesse o NotebookLM para sintetizar e analisar PPCs e legislações longas com IA.</p>
          </div>
          <span className="env-tile-link">
            Abrir NotebookLM <ExternalLink size={14} />
          </span>
        </div>

      </div>
    </section>
  );
}

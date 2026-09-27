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
  Layers
} from 'lucide-react';

export default function HomeView({ setTab }) {
  return (
    <section className="home-view-container">
      {/* Hero Banner Verde Escuro com Degradê Suave */}
      <div className="hero-box-gradient">
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

      {/* Cabeçalho Centralizado da Seção dos 5 Ambientes */}
      <div className="section-center-header">
        <div className="section-micro-tag">
          <Layers size={14} /> Arquitetura da plataforma
        </div>
        <h2 className="section-main-title">Os 5 ambientes da plataforma</h2>
        <p className="section-sub-desc">
          Macro-áreas interligadas que cobrem da formação continuada à experimentação prática e à reflexão crítica.
        </p>
      </div>

      {/* Grid de 3 Colunas dos Ambientes com Numeração e Degradê Suave */}
      <div className="environments-cards-grid">
        
        {/* 01. Ambiente Formativo */}
        <div className="env-soft-card" onClick={() => setTab('formativo')}>
          <div>
            <div className="env-card-top-row">
              <div className="env-tile-icon-box" style={{ background: 'var(--tint-formativo)', color: 'var(--color-formativo)' }}>
                <BookOpen size={20} />
              </div>
              <span className="env-card-number">01</span>
            </div>
            <h3 className="env-card-title">Ambiente Formativo</h3>
            <p className="env-card-text">
              Trilhas de formação continuada, materiais orientadores e e-book de prompts.
            </p>
          </div>
        </div>

        {/* 02. Laboratório de IA */}
        <div className="env-soft-card" onClick={() => setTab('laboratorio')}>
          <div>
            <div className="env-card-top-row">
              <div className="env-tile-icon-box" style={{ background: 'var(--tint-lab)', color: 'var(--color-lab)' }}>
                <FlaskConical size={20} />
              </div>
              <span className="env-card-number">02</span>
            </div>
            <h3 className="env-card-title">Laboratório de IA</h3>
            <p className="env-card-text">
              O motor da plataforma: gere exercícios, planos e atividades com IA generativa contextualizada.
            </p>
          </div>
        </div>

        {/* 03. Repositório de Práticas */}
        <div className="env-soft-card" onClick={() => setTab('repositorio')}>
          <div>
            <div className="env-card-top-row">
              <div className="env-tile-icon-box" style={{ background: 'var(--tint-repo)', color: 'var(--color-repo)' }}>
                <FolderGit2 size={20} />
              </div>
              <span className="env-card-number">03</span>
            </div>
            <h3 className="env-card-title">Repositório de Práticas</h3>
            <p className="env-card-text">
              Curadoria colaborativa de sequências didáticas, com filtros e exportação.
            </p>
          </div>
        </div>

        {/* 04. Reflexão Crítica */}
        <div className="env-soft-card" onClick={() => setTab('reflexao')}>
          <div>
            <div className="env-card-top-row">
              <div className="env-tile-icon-box" style={{ background: 'var(--tint-reflexao)', color: 'var(--color-reflexao)' }}>
                <Scale size={20} />
              </div>
              <span className="env-card-number">04</span>
            </div>
            <h3 className="env-card-title">Reflexão Crítica</h3>
            <p className="env-card-text">
              Fóruns, artigos e provocações sobre ética e uso crítico da IA na docência.
            </p>
          </div>
        </div>

        {/* 05. Acompanhamento e Suporte */}
        <div className="env-soft-card" onClick={() => setTab('suporte')}>
          <div>
            <div className="env-card-top-row">
              <div className="env-tile-icon-box" style={{ background: 'var(--tint-suporte)', color: 'var(--color-suporte)' }}>
                <HelpCircle size={20} />
              </div>
              <span className="env-card-number">05</span>
            </div>
            <h3 className="env-card-title">Acompanhamento e Suporte</h3>
            <p className="env-card-text">
              Tutoriais, reporte de erros e seu portfólio formativo de engajamento.
            </p>
          </div>
        </div>

        {/* 06. Card Verde Escuro "Tudo em um só lugar" */}
        <div className="env-cta-green-card" onClick={() => setTab('laboratorio')}>
          <div>
            <h3 className="cta-green-title">Tudo em um só lugar.</h3>
            <p className="cta-green-desc">
              Entre na plataforma e comece a experimentar agora mesmo.
            </p>
          </div>
          <button className="btn-cta-pill">
            <span>Entrar</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>

      {/* ====================================================================
           SEÇÃO: PRINCÍPIOS DE DESIGN (PENSADA PARA O PROFESSOR)
           ==================================================================== */}
      <div className="design-principles-section">
        <div className="principles-center-header">
          <h2 className="principles-main-title">
            Pensada para o professor — não<br />para substituí-lo
          </h2>
        </div>

        {/* 3 Colunas de Princípios */}
        <div className="principles-three-grid">
          
          {/* Coluna 1 */}
          <div className="principle-column-item">
            <div className="principle-icon-wrapper">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="#064E3B" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 4h4v3h-4V4z"></path>
              </svg>
            </div>
            <h3 className="principle-item-title">Contextualização à EPT</h3>
            <p className="principle-item-desc">
              Cada conteúdo é ancorado no eixo integrador e no curso técnico — Matemática que conversa com o mundo do trabalho.
            </p>
          </div>

          {/* Coluna 2 */}
          <div className="principle-column-item">
            <div className="principle-icon-wrapper">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="#064E3B" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </div>
            <h3 className="principle-item-title">Engenharia de prompts oculta</h3>
            <p className="principle-item-desc">
              O professor nunca encara uma caixa de prompt vazia. Você escolhe os parâmetros e a plataforma monta um prompt pedagógico de alto desempenho.
            </p>
          </div>

          {/* Coluna 3 */}
          <div className="principle-column-item">
            <div className="principle-icon-wrapper">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="#064E3B" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <polyline points="9 12 11 14 15 10"></polyline>
              </svg>
            </div>
            <h3 className="principle-item-title">Validação pedagógica</h3>
            <p className="principle-item-desc">
              Toda resposta vem com a nota de validação obrigatória e alertas de viés. A decisão pedagógica permanece, sempre, com você.
            </p>
          </div>

        </div>

        {/* Banner Verde Escuro de Compromisso Ético */}
        <div className="ethical-full-green-banner">
          <div className="ethical-banner-shield-box">
            <svg viewBox="0 0 24 24" width="22" height="22" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <polyline points="9 12 11 14 15 10"></polyline>
            </svg>
          </div>
          <div className="ethical-banner-text-block">
            <div className="ethical-tag-red-dot">
              <span className="red-dot-circle"></span> COMPROMISSO ÉTICO
            </div>
            <blockquote className="ethical-banner-quote">
              “Este conteúdo foi gerado por Inteligência Artificial. Cabe ao professor revisar, adaptar e validar pedagogicamente sua aplicação.”
            </blockquote>
          </div>
        </div>

      </div>

    </section>
  );
}

import React, { useState } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  BookOpen,
  FlaskConical,
  FolderGit2,
  Scale,
  HelpCircle,
  GraduationCap,
  ShieldCheck,
  Layers,
  Bot,
  ExternalLink
} from 'lucide-react';
import AppIcon from './AppIcon';
import Badge from './Badge';

const ONBOARDING_SLIDES = [
  {
    step: 1,
    tag: 'Ambiente 01',
    iconName: 'book',
    iconColor: '#065F46',
    badgeVariant: 'formativo',
    title: 'Ambiente Formativo',
    subtitle: 'Trilhas de formação continuada, acervo de legislação e e-book de prompts para Matemática na EPT.',
    highlights: [
      {
        title: 'Trilhas Modulares Guiadas',
        desc: 'Cursos curtos cobrindo fundamentos, limites éticos e didática com ferramentas generativas.'
      },
      {
        title: 'Videoteca Pedagógica Integrada',
        desc: 'Assista a tutoriais práticos e estudos de caso gravados diretamente na plataforma.'
      },
      {
        title: 'Acervo e E-book de Prompts',
        desc: 'Biblioteca de modelos de prompts pré-validados para apoiar o planejamento das suas aulas.'
      }
    ]
  },
  {
    step: 2,
    tag: 'Ambiente 02',
    iconName: 'flask',
    iconColor: '#1E5FB0',
    badgeVariant: 'lab',
    title: 'Laboratório de IA Generativa',
    subtitle: 'Gere exercícios, planos de aula e avaliações contextualizadas sem encarar caixas de prompt vazias.',
    highlights: [
      {
        title: 'Formulários 100% Parametrizados',
        desc: 'Selecione a área matemática, nível de dificuldade, quantidade e o Curso Técnico atendido.'
      },
      {
        title: 'Injeção Curricular da BNCC/EPT',
        desc: 'O motor injeta metadados de competências do Ensino Médio Integrado e dos PPCs da Rede Federal.'
      },
      {
        title: 'Arquitetura de IA Dupla',
        desc: 'Suporte transparente aos modelos LLaMA 3.3 70B (via Groq LPU) e Google Gemini 1.5.'
      }
    ]
  },
  {
    step: 3,
    tag: 'Ambiente 03',
    iconName: 'repo',
    iconColor: '#9A5A16',
    badgeVariant: 'repo',
    title: 'Repositório de Práticas',
    subtitle: 'Hub comunitário de curadoria e compartilhamento de materiais pedagógicos validados entre pares.',
    highlights: [
      {
        title: 'Banco Filtrável de Atividades',
        desc: 'Encontre materiais por Curso Técnico, código de habilidade da BNCC e tipo de atividade.'
      },
      {
        title: 'Avaliação pelos Pares (1 a 5 estrelas)',
        desc: 'Avalie a qualidade didática dos materiais compartilhados por outros colegas da RFEPCT.'
      },
      {
        title: 'Exportação com Cabeçalho Oficial',
        desc: 'Gere arquivos prontos para impressão com identificação institucional e aviso de validação.'
      }
    ]
  },
  {
    step: 4,
    tag: 'Ambiente 04',
    iconName: 'scale',
    iconColor: '#DC2626',
    badgeVariant: 'reflexao',
    title: 'Painel de Reflexão Crítica',
    subtitle: 'Espaço de problematização ética, artigos e debate sobre o papel humanizador do professor.',
    highlights: [
      {
        title: 'Fóruns Temáticos de Ética',
        desc: 'Debata sobre vieses algorítmicos, mercantilização, privacidade e alucinações na IA.'
      },
      {
        title: 'Artigos e Provocações Críticas',
        desc: 'Textos orientadores para fomentar o pensamento crítico dos docentes e dos estudantes.'
      },
      {
        title: 'Defesa da Autonomia Docente',
        desc: 'Discussões focadas em garantir que a tecnologia permaneça subordinada ao projeto pedagógico.'
      }
    ]
  },
  {
    step: 5,
    tag: 'Ambiente 05',
    iconName: 'help',
    iconColor: '#6B51C4',
    badgeVariant: 'suporte',
    title: 'Acompanhamento & Prof. mAIcon',
    subtitle: 'Assistente pedagógico virtual embutido e canal de suporte contínuo à pesquisa.',
    highlights: [
      {
        title: 'Assistente Virtual "Prof. mAIcon"',
        desc: 'Tire dúvidas pedagógicas e de navegação a qualquer momento no botão flutuante.'
      },
      {
        title: 'Portfólio Formativo do Docente',
        desc: 'Acompanhe seu progresso de engajamento e métricas de materiais gerados na plataforma.'
      },
      {
        title: 'Canal Direto com o Pesquisador',
        desc: 'Envie feedbacks e sugestões diretamente para a equipe da tese de doutorado.'
      }
    ]
  }
];

/**
 * Modal de Boas-Vindas e Apresentação do Produto Educacional - IAprofEPT
 * Exibe tela inicial explicativa destacando:
 * 1. Propósito da pesquisa de Maycon Magalhães (PPGEM/UFJF)
 * 2. O papel da IA como copilot pedagógico
 * 3. O compromisso ético de validação docente
 * Fundo com desfoque fosco (backdrop-filter: blur).
 */
export default function OnboardingModal({ isOpen, user, onComplete }) {
  // 'welcome' = Card Inicial Explicativo do Produto | 'tour' = Tour Passo a Passo dos 5 Ambientes
  const [viewMode, setViewMode] = useState('welcome');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  if (!isOpen) return null;

  // Extrai primeiro nome amigável para saudação calorosa
  const getPrimeiroNome = () => {
    if (!user || !user.nome) return 'Docente da RFEPCT';
    const limpo = user.nome.trim();
    if (/visitante|convidado/i.test(limpo)) return 'Professor(a) Visitante';
    const semTitulo = limpo.replace(/^(prof\.|profª\.|profa\.|professor|professora|dr\.|dra\.)\s+/i, '').trim();
    return semTitulo.split(/\s+/)[0] || 'Professor(a)';
  };

  const primeiroNome = getPrimeiroNome();
  const currentSlide = ONBOARDING_SLIDES[currentSlideIndex];
  const isFirstSlide = currentSlideIndex === 0;
  const isLastSlide = currentSlideIndex === ONBOARDING_SLIDES.length - 1;

  const handleNextTour = () => {
    if (isLastSlide) {
      onComplete();
    } else {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const handlePrevTour = () => {
    if (!isFirstSlide) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  return (
    <div className="onboarding-modal-backdrop" role="dialog" aria-modal="true">
      <div className="onboarding-modal-card shadow-app">

        {/* ==============================================================
            MODO 1: TELA INICIAL EXPLICATIVA DO PRODUTO EDUCACIONAL
            ============================================================== */}
        {viewMode === 'welcome' ? (
          <div className="onboarding-welcome-view">
            
            {/* Top Bar Institucional do Card */}
            <div className="onboarding-top-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Badge variant="formativo" icon="book" label="PPGEM / UFJF" />
                <Badge variant="lab" icon="spark" label="Produto Educacional PTT4 (CAPES)" />
                <Badge variant="repo" icon="layers" label="Rede Federal (RFEPCT)" />
              </div>
              <button
                type="button"
                className="onboarding-skip-btn"
                onClick={onComplete}
                title="Fechar e ir para o Dashboard"
                aria-label="Pular apresentação"
              >
                <span>Pular para o Início</span>
                <X size={16} />
              </button>
            </div>

            {/* Corpo do Card Explicativo com Scroll Suave */}
            <div className="onboarding-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              
              {/* Header Hero de Boas-Vindas */}
              <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-green)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '0.35rem' }}>
                  👋 Boas-Vindas à Plataforma IAprofEPT
                </span>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.5rem', lineHeight: 1.25 }}>
                  Olá, {primeiroNome}! Conheça o seu novo ambiente formativo.
                </h2>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto', lineHeight: 1.55 }}>
                  Uma tecnologia educacional projetada especificamente para as demandas da docência em <strong>Matemática na Educação Profissional e Tecnológica (EPT)</strong>.
                </p>
              </div>

              {/* Grid dos 3 Pilares Centrais Explicativos */}
              <div className="onboarding-pillars-grid">
                
                {/* Pilar 1: Propósito da Pesquisa de Maycon Magalhães */}
                <div className="onboarding-pillar-card research">
                  <div className="onboarding-pillar-icon-box">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <h3 className="onboarding-pillar-title">
                      Propósito da Pesquisa (UFJF)
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: 'var(--primary-green)', fontWeight: 700, textTransform: 'uppercase', display: 'block', margin: '0.2rem 0 0.4rem' }}>
                      Tese de Maycon Magalhães
                    </span>
                    <p className="onboarding-pillar-text">
                      Desenvolvida no Programa de Pós-Graduação em Educação Matemática da UFJF, a plataforma investiga como a IA pode valorizar o trabalho docente na RFEPCT, articulando a BNCC ao mundo do trabalho.
                    </p>
                  </div>
                </div>

                {/* Pilar 2: O Papel da IA como Copilot Pedagógico */}
                <div className="onboarding-pillar-card copilot">
                  <div className="onboarding-pillar-icon-box">
                    <Bot size={24} />
                  </div>
                  <div>
                    <h3 className="onboarding-pillar-title">
                      A IA como Copilot Pedagógico
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: '#1E5FB0', fontWeight: 700, textTransform: 'uppercase', display: 'block', margin: '0.2rem 0 0.4rem' }}>
                      Zero Caixas de Prompt em Branco
                    </span>
                    <p className="onboarding-pillar-text">
                      A inteligência artificial atua exclusivamente como sua assistente e copiloto. Graças à engenharia de prompts oculta, ela gera propostas ricas e contextualizadas aos seus Cursos Técnicos sem exigir comandos complexos.
                    </p>
                  </div>
                </div>

                {/* Pilar 3: Compromisso Ético de Validação Docente */}
                <div className="onboarding-pillar-card ethical">
                  <div className="onboarding-pillar-icon-box">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="onboarding-pillar-title">
                      Compromisso Ético & Validação
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 700, textTransform: 'uppercase', display: 'block', margin: '0.2rem 0 0.4rem' }}>
                      Autoridade Docente Inegociável
                    </span>
                    <p className="onboarding-pillar-text">
                      O professor é insubstituível. Toda resposta gerada pela IA requer sua revisão, adaptação crítica e julgamento pedagógico antes de qualquer aplicação com os estudantes em sala de aula.
                    </p>
                  </div>
                </div>

              </div>

              {/* Panorama Rápido dos 5 Ambientes da Plataforma */}
              <div className="onboarding-env-quick-strip">
                <div className="onboarding-env-quick-strip-header">
                  <span className="onboarding-env-strip-title">
                    <Layers size={14} /> Os 5 Ambientes Integrados da Plataforma
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Arquitetura Epistemológica do PTT4
                  </span>
                </div>
                <div className="onboarding-env-pills-row">
                  <span className="onboarding-env-pill-item">
                    <strong style={{ color: 'var(--color-formativo)' }}>01</strong> Ambiente Formativo
                  </span>
                  <span className="onboarding-env-pill-item">
                    <strong style={{ color: 'var(--color-lab)' }}>02</strong> Laboratório de IA
                  </span>
                  <span className="onboarding-env-pill-item">
                    <strong style={{ color: 'var(--color-repo)' }}>03</strong> Repositório de Práticas
                  </span>
                  <span className="onboarding-env-pill-item">
                    <strong style={{ color: 'var(--color-reflexao)' }}>04</strong> Reflexão Crítica
                  </span>
                  <span className="onboarding-env-pill-item">
                    <strong style={{ color: 'var(--color-suporte)' }}>05</strong> Suporte & Prof. mAIcon
                  </span>
                </div>
              </div>

            </div>

            {/* Rodapé de Ações do Card de Boas-Vindas */}
            <div className="onboarding-footer" style={{ justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn-onboarding-nav prev"
                onClick={() => setViewMode('tour')}
                title="Navegar passo a passo pelos 5 Ambientes"
              >
                <Layers size={16} />
                <span>Ver Tour dos 5 Ambientes</span>
              </button>

              <button
                type="button"
                className="btn-onboarding-nav next"
                onClick={onComplete}
                title="Concluir introdução e entrar no Dashboard"
              >
                <span>Começar a Explorar a Plataforma</span>
                <ArrowRight size={18} />
              </button>
            </div>

          </div>
        ) : (
          /* ==============================================================
             MODO 2: TOUR PASSO A PASSO DOS 5 AMBIENTES
             ============================================================== */
          <div className="onboarding-tour-view">
            
            {/* Top Bar do Tour */}
            <div className="onboarding-top-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('welcome')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-green)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>Voltar à Apresentação</span>
                </button>
                <Badge
                  variant={currentSlide.badgeVariant}
                  dot
                  label={`Ambiente ${currentSlide.step} de ${ONBOARDING_SLIDES.length} · ${currentSlide.tag}`}
                />
              </div>

              <button
                type="button"
                className="onboarding-skip-btn"
                onClick={onComplete}
                aria-label="Pular apresentação dos ambientes"
              >
                <span>Pular introdução</span>
                <X size={16} />
              </button>
            </div>

            {/* Conteúdo do Slide Ativo */}
            <div className="onboarding-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              <div className="onboarding-slide-header">
                <div className="onboarding-icon-avatar" style={{ color: currentSlide.iconColor }}>
                  <AppIcon name={currentSlide.iconName} size={36} strokeWidth={2.2} />
                </div>
                <div className="onboarding-header-texts">
                  <h2 className="onboarding-slide-title">{currentSlide.title}</h2>
                  <p className="onboarding-slide-subtitle">{currentSlide.subtitle}</p>
                </div>
              </div>

              {/* 3 Destaques do Ambiente */}
              <div className="onboarding-highlights-grid">
                {currentSlide.highlights.map((item, idx) => (
                  <div key={idx} className="onboarding-highlight-card">
                    <div className="highlight-number-badge">{idx + 1}</div>
                    <div className="highlight-content">
                      <h3 className="highlight-title">{item.title}</h3>
                      <p className="highlight-desc">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rodapé do Tour */}
            <div className="onboarding-footer">
              <div className="onboarding-dots-row">
                {ONBOARDING_SLIDES.map((slide, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`onboarding-dot-btn ${currentSlideIndex === idx ? 'active' : ''} ${currentSlideIndex > idx ? 'completed' : ''}`}
                    onClick={() => setCurrentSlideIndex(idx)}
                    aria-label={`Ir para ${slide.title}`}
                  >
                    {currentSlideIndex > idx ? <Check size={10} strokeWidth={3} /> : idx + 1}
                  </button>
                ))}
              </div>

              <div className="onboarding-action-buttons">
                {!isFirstSlide && (
                  <button
                    type="button"
                    className="btn-onboarding-nav prev"
                    onClick={handlePrevTour}
                  >
                    <ArrowLeft size={16} />
                    <span>Anterior</span>
                  </button>
                )}

                <button
                  type="button"
                  className="btn-onboarding-nav next"
                  onClick={handleNextTour}
                >
                  <span>{isLastSlide ? 'Começar a Explorar' : 'Próximo Ambiente'}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

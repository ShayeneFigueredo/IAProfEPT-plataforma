import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Sparkles, BookOpen, FlaskConical, FolderGit2, Scale, HelpCircle, GraduationCap } from 'lucide-react';
import AppIcon from './AppIcon';
import Badge from './Badge';

const ONBOARDING_SLIDES = [
  {
    step: 1,
    tag: 'Boas-Vindas & Acolhimento',
    iconName: 'spark',
    iconColor: '#10B981',
    badgeVariant: 'formativo',
    title: 'Pensada para o Professor de Matemática',
    subtitle: 'Uma tecnologia desenvolvida para potencializar a docência na Rede Federal — nunca para substituí-la.',
    highlights: [
      {
        title: 'Contextualização Autêntica à EPT',
        desc: 'Conecte conceitos abstratos de Matemática às situações reais do mundo do trabalho dos Cursos Técnicos.'
      },
      {
        title: 'Engenharia de Prompts Oculta',
        desc: 'Você não precisa aprender comandos complexos. Selecione os parâmetros e o sistema cuida da injeção curricular.'
      },
      {
        title: 'Pesquisa de Doutorado UFJF',
        desc: 'Ambiente desenvolvido no âmbito da tese de Maycon Magalhães (PPGEM/UFJF), com rigor acadêmico e ético.'
      }
    ]
  },
  {
    step: 2,
    tag: 'Ambiente 01',
    iconName: 'book',
    iconColor: '#065F46',
    badgeVariant: 'formativo',
    title: 'Ambiente Formativo',
    subtitle: 'Trilhas de formação continuada, acervo de materiais e e-book de prompts para Matemática na EPT.',
    highlights: [
      {
        title: 'Trilhas Modulares Guiadas',
        desc: 'Cursos rápidos com barra de progresso, cobrindo fundamentos, ética e didática com ferramentas generativas.'
      },
      {
        title: 'Videoteca Pedagógica Integrada',
        desc: 'Assista a tutoriais e estudos de caso comentados diretamente na plataforma.'
      },
      {
        title: 'Acervo e E-book de Prompts',
        desc: 'Biblioteca de modelos de prompts pré-validados para copiar e usar na sua preparação de aulas.'
      }
    ]
  },
  {
    step: 3,
    tag: 'Ambiente 02',
    iconName: 'flask',
    iconColor: '#1E5FB0',
    badgeVariant: 'lab',
    title: 'Laboratório de IA Generativa',
    subtitle: 'Gere exercícios, planos de aula e avaliações com IA sem campos de prompt em branco.',
    highlights: [
      {
        title: 'Formulários 100% Guiados',
        desc: 'Selecione a área matemática, o nível de dificuldade, a quantidade e o Curso Técnico atendido.'
      },
      {
        title: 'Injeção Curricular da BNCC',
        desc: 'O motor injeta metadados de competências do Ensino Médio Integrado e dos PPCs da Rede Federal.'
      },
      {
        title: 'Arquitetura de IA Dupla',
        desc: 'Suporte aos modelos LLaMA 3.3 70B (via Groq LPU) e Google Gemini para o experimento comparativo.'
      }
    ]
  },
  {
    step: 4,
    tag: 'Ambiente 03',
    iconName: 'repo',
    iconColor: '#9A5A16',
    badgeVariant: 'repo',
    title: 'Repositório de Práticas',
    subtitle: 'Hub comunitário de curadoria e compartilhamento de materiais entre docentes da Rede Federal.',
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
        title: 'Exportação com Banner Ético',
        desc: 'Gere arquivos prontos para impressão com cabeçalho institucional e aviso de validação docente.'
      }
    ]
  },
  {
    step: 5,
    tag: 'Ambientes 04 & 05',
    iconName: 'scale',
    iconColor: '#DC2626',
    badgeVariant: 'reflexao',
    title: 'Reflexão Crítica & Prof. mAIcon',
    subtitle: 'Debate ético humanizador e assistente virtual embutido para apoiar a sua jornada docente.',
    highlights: [
      {
        title: 'Painel de Reflexão Crítica',
        desc: 'Espaço para problematizar vieses algorítmicos, mercantilização e a autonomia do professor.'
      },
      {
        title: 'Assistente Virtual "Prof. mAIcon"',
        desc: 'Tire dúvidas pedagógicas e navegue pela plataforma com a ajuda do assistente inteligente flutuante.'
      },
      {
        title: 'Compromisso Ético Obrigatório',
        desc: 'Toda resposta gerada por IA inclui o alerta para que sua autoridade docente revise e adapte antes do uso.'
      }
    ]
  }
];

/**
 * Modal de Onboarding dos 5 Ambientes da Plataforma IAprofEPT
 */
export default function OnboardingModal({ isOpen, user, onComplete }) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  if (!isOpen) return null;

  const currentSlide = ONBOARDING_SLIDES[currentSlideIndex];
  const isFirstSlide = currentSlideIndex === 0;
  const isLastSlide = currentSlideIndex === ONBOARDING_SLIDES.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      onComplete();
    } else {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstSlide) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  return (
    <div className="onboarding-modal-backdrop" role="dialog" aria-modal="true">
      <div className="onboarding-modal-card shadow-app">
        
        {/* Barra Superior com Badge de Etapa e Botão Pular */}
        <div className="onboarding-top-bar">
          <div className="onboarding-step-indicator">
            <Badge
              variant={currentSlide.badgeVariant}
              dot
              label={`Passo ${currentSlide.step} de ${ONBOARDING_SLIDES.length} · ${currentSlide.tag}`}
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

        {/* Conteúdo Principal do Slide Ativo */}
        <div className="onboarding-body">
          
          {/* Header do Slide */}
          <div className="onboarding-slide-header">
            <div className="onboarding-icon-avatar" style={{ color: currentSlide.iconColor }}>
              <AppIcon name={currentSlide.iconName} size={36} strokeWidth={2.2} />
            </div>

            <div className="onboarding-header-texts">
              {isFirstSlide && user && (
                <span className="onboarding-welcome-greeting">
                  Olá, <strong>{user.nome || 'Professor(a)'}</strong>! Seja bem-vindo(a).
                </span>
              )}
              <h2 className="onboarding-slide-title">{currentSlide.title}</h2>
              <p className="onboarding-slide-subtitle">{currentSlide.subtitle}</p>
            </div>
          </div>

          {/* Cards com os 3 Destaques do Ambiente */}
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

          {/* Banner de Compromisso se for o primeiro slide */}
          {isFirstSlide && (
            <div className="onboarding-ethical-notice">
              <span className="notice-icon">🛡️</span>
              <p>
                <strong>Princípio Inegociável da Tese:</strong> A plataforma é um Produto Educacional com tecnologia a serviço do protagonismo docente da Rede Federal.
              </p>
            </div>
          )}
        </div>

        {/* Rodapé com Navegação, Indicador de Bolinhas e Botões */}
        <div className="onboarding-footer">
          {/* Bolinhas de Progresso Interativas */}
          <div className="onboarding-dots-row">
            {ONBOARDING_SLIDES.map((slide, idx) => (
              <button
                key={idx}
                type="button"
                className={`onboarding-dot-btn ${currentSlideIndex === idx ? 'active' : ''} ${currentSlideIndex > idx ? 'completed' : ''}`}
                onClick={() => setCurrentSlideIndex(idx)}
                aria-label={`Ir para passo ${idx + 1}: ${slide.title}`}
              >
                {currentSlideIndex > idx ? <Check size={10} strokeWidth={3} /> : idx + 1}
              </button>
            ))}
          </div>

          {/* Botões de Ação */}
          <div className="onboarding-action-buttons">
            {!isFirstSlide && (
              <button
                type="button"
                className="btn-onboarding-nav prev"
                onClick={handlePrev}
              >
                <ArrowLeft size={16} />
                <span>Voltar</span>
              </button>
            )}

            <button
              type="button"
              className="btn-onboarding-nav next"
              onClick={handleNext}
            >
              <span>{isLastSlide ? 'Começar a Explorar a Plataforma' : 'Próximo Ambiente'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

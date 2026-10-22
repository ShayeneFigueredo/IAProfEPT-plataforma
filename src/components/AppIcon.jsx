import React from 'react';

/**
 * Catálogo Oficial de Ícones SVG do Design System - IAprofEPT
 * Ícones vetorizados com precisão:
 * - calc: Calculadora / Matemática Aplicada
 * - layers: Camadas / Trilhas / Estrutura Modular
 * - podcast: Podcast / Áudio / Transmissões
 * - doc: Documento / PPC / Plano de Aula
 * - book: Livro / Ambiente Formativo / E-book de Prompts
 * - flask: Laboratório de IA / Inferência e Experimento
 * - repo: Repositório / Práticas Docentes Compartilhadas
 * - scale: Balança / Reflexão Crítica / Ética Docente
 * - help: Ajuda / Canal de Suporte / Prof. mAIcon
 * - graph: Gráficos / Telemetria / Estatísticas do Piloto
 * - spark: Faíscas / IA Generativa / Inovação Pedagógica
 */

export const ICON_NAMES = [
  'calc',
  'layers',
  'podcast',
  'doc',
  'book',
  'flask',
  'repo',
  'scale',
  'help',
  'graph',
  'spark'
];

export const ICON_DEFINITIONS = {
  // 1. calc (Calculadora / Matemática)
  calc: {
    label: 'Calculadora de Matemática',
    render: (strokeWidth) => (
      <>
        <rect x="4" y="2" width="16" height="20" rx="3" strokeWidth={strokeWidth} />
        <line x1="8" y1="6" x2="16" y2="6" strokeWidth={strokeWidth} strokeLinecap="round" />
        <line x1="16" y1="14" x2="16" y2="18" strokeWidth={strokeWidth} strokeLinecap="round" />
        <circle cx="9" cy="10" r="1" fill="currentColor" />
        <circle cx="12" cy="10" r="1" fill="currentColor" />
        <circle cx="15" cy="10" r="1" fill="currentColor" />
        <circle cx="9" cy="14" r="1" fill="currentColor" />
        <circle cx="12" cy="14" r="1" fill="currentColor" />
        <circle cx="9" cy="18" r="1" fill="currentColor" />
        <circle cx="12" cy="18" r="1" fill="currentColor" />
      </>
    )
  },

  // 2. layers (Camadas / Trilhas Modulares)
  layers: {
    label: 'Camadas e Trilhas',
    render: (strokeWidth) => (
      <>
        <polygon points="12 2 2 7 12 12 22 7 12 2" strokeWidth={strokeWidth} strokeLinejoin="round" />
        <polyline points="2 17 12 22 22 17" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="2 12 12 17 22 12" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      </>
    )
  },

  // 3. podcast (Podcast / Áudio)
  podcast: {
    label: 'Podcast e Áudio',
    render: (strokeWidth) => (
      <>
        <circle cx="12" cy="11" r="1.5" fill="currentColor" />
        <path
          d="M11 17a1 1 0 0 1 2 0c0 .5-.34 3-.5 4.5a.5.5 0 0 1-1 0c-.16-1.5-.5-4-.5-4.5Z"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        <path
          d="M8 14a5 5 0 0 1 8 0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d="M5.5 16.5a8 8 0 0 1 13 0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d="M17 19a10 10 0 1 0-10 0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </>
    )
  },

  // 4. doc (Documento / PPC / Plano de Aula)
  doc: {
    label: 'Documento e Plano Didático',
    render: (strokeWidth) => (
      <>
        <path
          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        <polyline points="14 2 14 8 20 8" strokeWidth={strokeWidth} strokeLinejoin="round" />
        <line x1="8" y1="13" x2="16" y2="13" strokeWidth={strokeWidth} strokeLinecap="round" />
        <line x1="8" y1="17" x2="14" y2="17" strokeWidth={strokeWidth} strokeLinecap="round" />
      </>
    )
  },

  // 5. book (Livro / Ambiente Formativo)
  book: {
    label: 'Livro e Ambiente Formativo',
    render: (strokeWidth) => (
      <>
        <path
          d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        <path
          d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      </>
    )
  },

  // 6. flask (Laboratório de IA)
  flask: {
    label: 'Laboratório de IA',
    render: (strokeWidth) => (
      <>
        <path
          d="M10 2v7.31L4.69 18.5A2 2 0 0 0 6.34 21.5h11.32a2 2 0 0 0 1.65-3l-5.31-9.19V2"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        <line x1="8.5" y1="2" x2="15.5" y2="2" strokeWidth={strokeWidth} strokeLinecap="round" />
        <line x1="7" y1="16" x2="17" y2="16" strokeWidth={strokeWidth} strokeLinecap="round" />
        <circle cx="10" cy="18" r="0.75" fill="currentColor" />
        <circle cx="14" cy="18" r="0.75" fill="currentColor" />
      </>
    )
  },

  // 7. repo (Repositório / Acervo de Práticas)
  repo: {
    label: 'Repositório de Práticas',
    render: (strokeWidth) => (
      <>
        <path
          d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2Z"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        <circle cx="12" cy="13" r="2" strokeWidth={strokeWidth} />
        <path d="M12 15v3" strokeWidth={strokeWidth} strokeLinecap="round" />
      </>
    )
  },

  // 8. scale (Balança / Reflexão Crítica & Ética)
  scale: {
    label: 'Reflexão Crítica e Ética',
    render: (strokeWidth) => (
      <>
        <path
          d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        <path
          d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        <path d="M7 21h10" strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d="M12 3v18" strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" strokeWidth={strokeWidth} strokeLinecap="round" />
      </>
    )
  },

  // 9. help (Ajuda / Suporte / Prof. mAIcon)
  help: {
    label: 'Suporte e Ajuda',
    render: (strokeWidth) => (
      <>
        <circle cx="12" cy="12" r="10" strokeWidth={strokeWidth} />
        <path
          d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="17" r="0.75" fill="currentColor" />
      </>
    )
  },

  // 10. graph (Gráficos / Telemetria)
  graph: {
    label: 'Telemetria e Gráficos',
    render: (strokeWidth) => (
      <>
        <line x1="18" y1="20" x2="18" y2="10" strokeWidth={strokeWidth} strokeLinecap="round" />
        <line x1="12" y1="20" x2="12" y2="4" strokeWidth={strokeWidth} strokeLinecap="round" />
        <line x1="6" y1="20" x2="6" y2="14" strokeWidth={strokeWidth} strokeLinecap="round" />
        <line x1="2" y1="20" x2="22" y2="20" strokeWidth={strokeWidth} strokeLinecap="round" />
      </>
    )
  },

  // 11. spark (Faísca / Inteligência Artificial)
  spark: {
    label: 'Inteligência Artificial Generativa',
    render: (strokeWidth) => (
      <>
        <path
          d="m12 2-2 6.5-6.5 2 6.5 2 2 6.5 2-6.5 6.5-2-6.5-2Z"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        <path d="M5 2v3" strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d="M19 16v3" strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d="M3.5 3.5h3" strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d="M17.5 17.5h3" strokeWidth={strokeWidth} strokeLinecap="round" />
      </>
    )
  }
};

/**
 * Componente SVG Reutilizável de Ícones Institucionais
 * @param {string} name - Nome do ícone ('calc', 'layers', 'podcast', 'doc', 'book', 'flask', 'repo', 'scale', 'help', 'graph', 'spark')
 * @param {number|string} size - Tamanho em pixels (padrão: 20)
 * @param {string} color - Cor do ícone (padrão: 'currentColor')
 * @param {number} strokeWidth - Espessura do traço (padrão: 2)
 * @param {string} className - Classes CSS adicionais
 */
export default function AppIcon({
  name = 'spark',
  size = 20,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
  title,
  ...props
}) {
  const iconKey = String(name).toLowerCase().trim();
  const def = ICON_DEFINITIONS[iconKey] || ICON_DEFINITIONS.spark;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      className={`app-icon app-icon-${iconKey} ${className}`}
      role="img"
      aria-label={title || def.label}
      {...props}
    >
      {title && <title>{title}</title>}
      {def.render(strokeWidth)}
    </svg>
  );
}

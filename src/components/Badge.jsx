import React from 'react';
import AppIcon from './AppIcon';

/**
 * Componente Badge do Design System - IAprofEPT
 * Suporte a tags coloridas de status, ambientes e eixos tecnológicos da EPT com tons suaves.
 *
 * @param {string} variant - 'formativo' | 'lab' | 'repo' | 'reflexao' | 'suporte' |
 *                           'concluido' | 'em-andamento' | 'bloqueado' | 'alerta' |
 *                           'eixo-saude' | 'eixo-industria' | 'eixo-ti' | 'eixo-infra' | 'eixo-agro' | 'eixo-gestao'
 * @param {string} size - 'sm' | 'md' | 'lg' (padrão: 'md')
 * @param {string} rounded - 'sm' | 'md' | 'full' (padrão: 'full')
 * @param {boolean} dot - Exibe o ponto colorido indicador
 * @param {boolean} dotPulse - Ponto com animação suave de pulso
 * @param {string|React.ReactNode} icon - Nome do ícone AppIcon ou elemento SVG
 * @param {string} label - Texto da badge
 */
export default function Badge({
  variant = 'formativo',
  size = 'md',
  rounded = 'full',
  dot = false,
  dotPulse = false,
  icon = null,
  label,
  children,
  className = '',
  ...props
}) {
  // Normaliza o nome da variante
  const normalizedVariant = String(variant).toLowerCase().replace('_', '-');

  // Mapeamento de classes
  const variantClass = `badge-${normalizedVariant}`;
  const sizeClass = size === 'sm' ? 'badge-sm' : size === 'lg' ? 'badge-lg' : '';
  const roundedClass = rounded === 'sm' ? 'badge-rounded-sm' : rounded === 'md' ? 'badge-rounded-md' : '';

  const content = label || children;

  return (
    <span
      className={`badge ${variantClass} ${sizeClass} ${roundedClass} ${className}`.trim()}
      {...props}
    >
      {dot && (
        <span
          className={`badge-dot ${dotPulse ? 'badge-dot-pulse' : ''}`}
          aria-hidden="true"
        />
      )}

      {icon && typeof icon === 'string' && (
        <AppIcon
          name={icon}
          size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14}
          strokeWidth={2.2}
          aria-hidden="true"
        />
      )}

      {icon && typeof icon !== 'string' && icon}

      <span className="badge-text">{content}</span>
    </span>
  );
}

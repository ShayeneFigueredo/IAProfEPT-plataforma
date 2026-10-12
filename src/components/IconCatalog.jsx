import React, { useState } from 'react';
import AppIcon, { ICON_NAMES, ICON_DEFINITIONS } from './AppIcon';
import Badge from './Badge';

/**
 * Catálogo Interativo de Ícones SVG e Badges Customizados - Design System IAprofEPT
 * Demonstração dos 11 ícones vetorizados, tags coloridas de status/eixos e hierarquia tipográfica fluída.
 */
export default function IconCatalog() {
  const [selectedIcon, setSelectedIcon] = useState('spark');
  const [copiedText, setCopiedText] = useState(null);

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedText(code);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="icon-catalog-wrapper" style={{ padding: '1.5rem', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-app)', marginBottom: '2rem' }}>
      
      {/* 1. SEÇÃO DE ÍCONES SVG */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-h3)' }}>Biblioteca Oficial de Ícones SVG</h3>
            <p className="subtitle" style={{ margin: '0.25rem 0 0 0' }}>11 ícones vetorizados customizados da plataforma IAprofEPT</p>
          </div>
          <Badge variant="formativo" icon="layers" label="11 Ícones Vetoriais" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
          {ICON_NAMES.map((name) => {
            const def = ICON_DEFINITIONS[name];
            const isSelected = selectedIcon === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setSelectedIcon(name)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  padding: '1.25rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--primary-soft-bg)' : 'var(--bg-page)',
                  border: isSelected ? '2px solid var(--accent-green)' : '1px solid var(--border-color)',
                  color: isSelected ? 'var(--primary-green)' : 'var(--text-main)',
                  cursor: 'pointer',
                  transition: 'all var(--transition)'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-xs)',
                  color: isSelected ? 'var(--primary-green)' : 'var(--text-main)'
                }}>
                  <AppIcon name={name} size={22} strokeWidth={2.2} />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600 }}>
                  {name}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2 }}>
                  {def.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Snippet do Ícone Selecionado */}
        {selectedIcon && (
          <div style={{ marginTop: '1rem', padding: '0.85rem 1.25rem', background: '#0F172A', color: '#E2E8F0', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AppIcon name={selectedIcon} size={20} color="var(--accent-green)" />
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#A7F3D0' }}>
                {`<AppIcon name="${selectedIcon}" size={20} />`}
              </code>
            </div>
            <button
              type="button"
              onClick={() => copyCode(`<AppIcon name="${selectedIcon}" size={20} />`)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: 'white',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              {copiedText ? '✓ Copiado!' : 'Copiar JSX'}
            </button>
          </div>
        )}
      </div>

      {/* 2. SEÇÃO DE BADGES E TAGS COLORIDAS */}
      <div style={{ marginBottom: '2.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.75rem' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: 'var(--font-size-h3)' }}>Tags Coloridas & Badges Suaves</h3>
        <p className="subtitle" style={{ marginBottom: '1.25rem' }}>Badges temáticas com contraste WCAG AA, suporte a ícones SVG e dots indicadores</p>

        {/* Grupo A: 5 Ambientes */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>
            Ambientes Institucionais
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            <Badge variant="formativo" icon="book" label="Ambiente Formativo" />
            <Badge variant="lab" icon="flask" label="Laboratório de IA" />
            <Badge variant="repo" icon="repo" label="Repositório de Práticas" />
            <Badge variant="reflexao" icon="scale" label="Reflexão Crítica" />
            <Badge variant="suporte" icon="help" label="Suporte & mAIcon" />
          </div>
        </div>

        {/* Grupo B: Status Pedagógicos & Operacionais */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>
            Status de Trilhas & Materiais
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            <Badge variant="concluido" dot label="Concluído (100%)" />
            <Badge variant="em-andamento" dot dotPulse label="Em Andamento" />
            <Badge variant="bloqueado" label="Bloqueado" />
            <Badge variant="alerta" icon="spark" label="Validação Obrigatória" />
          </div>
        </div>

        {/* Grupo C: Eixos Tecnológicos do CNCT */}
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.5rem' }}>
            Eixos Tecnológicos da EPT (CNCT / MEC)
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            <Badge variant="eixo-saude" dot label="Ambiente e Saúde" />
            <Badge variant="eixo-industria" dot label="Controle e Processos Industriais" />
            <Badge variant="eixo-ti" icon="spark" label="Informação e Comunicação" />
            <Badge variant="eixo-infra" dot label="Infraestrutura" />
            <Badge variant="eixo-agro" dot label="Recursos Naturais" />
            <Badge variant="eixo-gestao" dot label="Gestão e Negócios" />
          </div>
        </div>
      </div>

      {/* 3. SEÇÃO DE HIERARQUIA TIPOGRÁFICA FLUIDA */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.75rem' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: 'var(--font-size-h3)' }}>Hierarquia Tipográfica Fluída com clamp()</h3>
        <p className="subtitle" style={{ marginBottom: '1.25rem' }}>Fontes Outfit (Títulos) e Plus Jakarta Sans (Corpo/Subtítulos) auto-dimensionáveis</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-page)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>display-title: clamp(2rem, 1.5rem + 2.5vw, 3.25rem)</span>
            <div className="display-title" style={{ color: 'var(--primary-green)' }}>IAprofEPT: Inteligência Docente</div>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>h1: clamp(1.75rem, 1.35rem + 1.8vw, 2.5rem)</span>
            <h1>Título H1 com Outfit Bold</h1>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>h2: clamp(1.35rem, 1.15rem + 1.1vw, 1.875rem)</span>
            <h2>Título H2 com Outfit Bold</h2>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>h3: clamp(1.15rem, 1.05rem + 0.6vw, 1.45rem)</span>
            <h3>Título H3 com Outfit Bold</h3>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>subtitle-lg com Plus Jakarta Sans</span>
            <p className="subtitle-lg" style={{ margin: 0 }}>
              Subtítulo de apoio com proporção de leitura confortável e contraste aprovado.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

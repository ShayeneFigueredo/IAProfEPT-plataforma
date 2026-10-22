import React from 'react';
import { Search, Bell, Menu, BookOpen } from 'lucide-react';

const TITULOS_MAP = {
  inicio: 'Início',
  formativo: 'Ambiente Formativo',
  laboratorio: 'Laboratório de IA',
  repositorio: 'Repositório de Práticas',
  reflexao: 'Reflexão Crítica',
  suporte: 'Acompanhamento e Suporte',
  studio: 'Studio IAprofEPT (Gestão de Materiais)'
};

export default function TopHeader({
  currentTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  currentUser,
  onOpenOnboarding
}) {
  return (
    <header className="app-topbar">
      <div className="topbar-left-cluster">
        <button
          type="button"
          className="topbar-mobile-menu-btn"
          onClick={() => setMobileMenuOpen && setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Abrir menu de navegação"
          aria-expanded={mobileMenuOpen}
        >
          <Menu size={22} />
        </button>

        <div className="topbar-breadcrumb">
          <span className="breadcrumb-path">IAprofEPT /</span>
          <span className="breadcrumb-active-title">{TITULOS_MAP[currentTab] || 'Início'}</span>
        </div>
      </div>

      <div className="topbar-controls">
        {onOpenOnboarding && (
          <button
            type="button"
            className="topbar-onboarding-btn"
            onClick={onOpenOnboarding}
            title="Conhecer ou rever os 5 Ambientes da Plataforma"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.75rem',
              background: 'var(--primary-soft-bg)',
              border: '1px solid var(--primary-border)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--primary-green)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <BookOpen size={14} color="var(--primary-green)" />
            <span>Guia dos 5 Ambientes</span>
          </button>
        )}

        <div className="topbar-search-wrapper">
          <Search size={16} />
          <input
            type="text"
            className="topbar-search-input"
            placeholder="Buscar..."
            aria-label="Buscar na plataforma"
          />
        </div>
        <button className="topbar-notif-btn" title="Notificações" aria-label="Notificações">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}


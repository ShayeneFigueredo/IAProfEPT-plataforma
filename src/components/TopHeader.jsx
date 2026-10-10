import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';

const TITULOS_MAP = {
  inicio: 'Início',
  formativo: 'Ambiente Formativo',
  laboratorio: 'Laboratório de IA',
  repositorio: 'Repositório de Práticas',
  reflexao: 'Reflexão Crítica',
  suporte: 'Acompanhamento e Suporte'
};

export default function TopHeader({ currentTab, mobileMenuOpen, setMobileMenuOpen }) {
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


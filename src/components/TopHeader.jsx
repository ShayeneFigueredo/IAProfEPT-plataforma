import React from 'react';
import { Search, Bell } from 'lucide-react';

const TITULOS_MAP = {
  inicio: 'Início',
  formativo: 'Ambiente Formativo',
  laboratorio: 'Laboratório de IA',
  repositorio: 'Repositório de Práticas',
  reflexao: 'Reflexão Crítica',
  suporte: 'Acompanhamento e Suporte'
};

export default function TopHeader({ currentTab }) {
  return (
    <header className="app-topbar">
      <div className="topbar-breadcrumb">
        <span className="breadcrumb-path">IAprofEPT /</span>
        <span className="breadcrumb-active-title">{TITULOS_MAP[currentTab] || 'Início'}</span>
      </div>

      <div className="topbar-controls">
        <div className="topbar-search-wrapper">
          <Search size={16} />
          <input type="text" className="topbar-search-input" placeholder="Buscar na plataforma..." />
        </div>
        <button className="topbar-notif-btn" title="Notificações">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}

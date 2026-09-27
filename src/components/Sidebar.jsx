import React from 'react';
import { Home, BookOpen, FlaskConical, FolderGit2, Scale, HelpCircle, LogOut } from 'lucide-react';
import { USER_DATA } from '../data/mockData';

const iconMap = {
  Home,
  BookOpen,
  FlaskConical,
  FolderGit2,
  Scale,
  HelpCircle
};

export default function Sidebar({ currentTab, setTab }) {
  return (
    <aside className="app-sidebar">
      <div>
        {/* Logotipo */}
        <div className="sidebar-brand" onClick={() => setTab('inicio')}>
          <svg className="brand-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
            <polyline points="16 7 22 7 22 13"></polyline>
          </svg>
          <div className="sidebar-brand-text">
            <h1>IAprofEPT</h1>
            <span>IA na Educação Matemática</span>
          </div>
        </div>

        {/* Menu Principal */}
        <nav className="sidebar-menu-list">
          <button
            className={`sidebar-nav-item ${currentTab === 'inicio' ? 'active' : ''}`}
            onClick={() => setTab('inicio')}
          >
            <div className="sidebar-nav-left">
              <Home size={18} />
              <span>Início</span>
            </div>
          </button>

          <div className="sidebar-cat-label">Ambientes</div>

          <button
            className={`sidebar-nav-item ${currentTab === 'formativo' ? 'active' : ''}`}
            onClick={() => setTab('formativo')}
          >
            <div className="sidebar-nav-left">
              <BookOpen size={18} />
              <span>Ambiente Formativo</span>
            </div>
            <span className="sidebar-nav-badge">4</span>
          </button>

          <button
            className={`sidebar-nav-item ${currentTab === 'laboratorio' ? 'active' : ''}`}
            onClick={() => setTab('laboratorio')}
          >
            <div className="sidebar-nav-left">
              <FlaskConical size={18} />
              <span>Laboratório de IA</span>
            </div>
          </button>

          <button
            className={`sidebar-nav-item ${currentTab === 'repositorio' ? 'active' : ''}`}
            onClick={() => setTab('repositorio')}
          >
            <div className="sidebar-nav-left">
              <FolderGit2 size={18} />
              <span>Repositório</span>
            </div>
          </button>

          <button
            className={`sidebar-nav-item ${currentTab === 'reflexao' ? 'active' : ''}`}
            onClick={() => setTab('reflexao')}
          >
            <div className="sidebar-nav-left">
              <Scale size={18} />
              <span>Reflexão Crítica</span>
            </div>
          </button>

          <button
            className={`sidebar-nav-item ${currentTab === 'suporte' ? 'active' : ''}`}
            onClick={() => setTab('suporte')}
          >
            <div className="sidebar-nav-left">
              <HelpCircle size={18} />
              <span>Suporte</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Card do Usuário */}
      <div className="sidebar-user-footer">
        <div className="user-footer-row">
          <div className="user-avatar-pill">{USER_DATA.iniciais}</div>
          <div className="user-footer-details">
            <strong>{USER_DATA.nome}</strong>
            <span>{USER_DATA.cargo}</span>
          </div>
        </div>
        <button className="btn-sidebar-logout" onClick={() => alert('Sessão encerrada com segurança.')}>
          <LogOut size={14} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}

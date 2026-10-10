import React from 'react';
import { Home, BookOpen, FlaskConical, FolderGit2, Scale, HelpCircle, LogOut, X } from 'lucide-react';
import { USER_DATA } from '../data/mockData';

export default function Sidebar({ currentTab, setTab, mobileMenuOpen, setMobileMenuOpen }) {
  const handleNavClick = (tabId) => {
    setTab(tabId);
    if (setMobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    if (setMobileMenuOpen) {
      setMobileMenuOpen(false);
    }
    alert('Sessão encerrada com segurança.');
  };

  return (
    <>
      {/* Backdrop escuro para fechar gaveta no mobile ao tocar fora */}
      <div
        className={`mobile-sidebar-backdrop ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <aside className={`app-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`} aria-label="Menu Principal">
        {/* Botão de Fechar Exclusivo para Telas Mobile */}
        <button
          type="button"
          className="mobile-close-btn"
          onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
          aria-label="Fechar menu de navegação"
        >
          <X size={20} />
        </button>

        <div>
          {/* Logotipo */}
          <div className="sidebar-brand" onClick={() => handleNavClick('inicio')} role="button" tabIndex={0}>
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
            onClick={() => handleNavClick('inicio')}
          >
            <div className="sidebar-nav-left">
              <Home size={18} />
              <span>Início</span>
            </div>
          </button>

          <div className="sidebar-cat-label">Ambientes</div>

          <button
            className={`sidebar-nav-item ${currentTab === 'formativo' ? 'active' : ''}`}
            onClick={() => handleNavClick('formativo')}
          >
            <div className="sidebar-nav-left">
              <BookOpen size={18} />
              <span>Ambiente Formativo</span>
            </div>
            <span className="sidebar-nav-badge">4</span>
          </button>

          <button
            className={`sidebar-nav-item ${currentTab === 'laboratorio' ? 'active' : ''}`}
            onClick={() => handleNavClick('laboratorio')}
          >
            <div className="sidebar-nav-left">
              <FlaskConical size={18} />
              <span>Laboratório de IA</span>
            </div>
          </button>

          <button
            className={`sidebar-nav-item ${currentTab === 'repositorio' ? 'active' : ''}`}
            onClick={() => handleNavClick('repositorio')}
          >
            <div className="sidebar-nav-left">
              <FolderGit2 size={18} />
              <span>Repositório</span>
            </div>
          </button>

          <button
            className={`sidebar-nav-item ${currentTab === 'reflexao' ? 'active' : ''}`}
            onClick={() => handleNavClick('reflexao')}
          >
            <div className="sidebar-nav-left">
              <Scale size={18} />
              <span>Reflexão Crítica</span>
            </div>
          </button>

          <button
            className={`sidebar-nav-item ${currentTab === 'suporte' ? 'active' : ''}`}
            onClick={() => handleNavClick('suporte')}
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
          <div className="user-avatar-pill">
            {USER_DATA.foto ? (
              <img
                src={USER_DATA.foto}
                alt={USER_DATA.nome}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.innerText = USER_DATA.iniciais;
                  }
                }}
              />
            ) : (
              <span>{USER_DATA.iniciais}</span>
            )}
          </div>
          <div className="user-footer-details">
            <strong title={USER_DATA.nome}>{USER_DATA.nome}</strong>
            <span title={USER_DATA.cargo}>{USER_DATA.cargo}</span>
          </div>
        </div>
        <button className="btn-sidebar-logout" onClick={handleLogout} title="Encerrar sessão na plataforma">
          <LogOut size={14} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  </>
  );
}

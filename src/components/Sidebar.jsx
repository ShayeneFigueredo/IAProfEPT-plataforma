import React from 'react';
import { Home, BookOpen, FlaskConical, FolderGit2, Scale, HelpCircle, LogOut, X, Settings } from 'lucide-react';
import { USER_DATA } from '../data/mockData';

export default function Sidebar({
  currentTab,
  setTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  currentUser,
  onLogout,
  onOpenOnboarding
}) {
  const user = currentUser || USER_DATA;

  const handleNavClick = (tabId) => {
    setTab(tabId);
    if (setMobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  const handleLogoutClick = () => {
    if (setMobileMenuOpen) {
      setMobileMenuOpen(false);
    }
    if (onLogout) {
      onLogout();
    } else {
      alert('Sessão encerrada com segurança.');
    }
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

      {/* Card do Usuário Autenticado */}
      <div className="sidebar-user-footer">
        {onOpenOnboarding && (
          <button
            type="button"
            className="sidebar-onboarding-link-btn"
            onClick={onOpenOnboarding}
            title="Apresentação dos 5 Ambientes da Plataforma"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.45rem',
              marginBottom: '0.65rem',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-green)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <span>Guia dos 5 Ambientes</span>
          </button>
        )}

        <div className="user-footer-row">
          <div className="user-avatar-pill">
            {user.foto ? (
              <img
                src={user.foto}
                alt={user.nome}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.innerText = user.iniciais || 'P';
                  }
                }}
              />
            ) : (
              <span>{user.iniciais || 'P'}</span>
            )}
          </div>
          <div className="user-footer-details">
            <strong title={user.nome}>{user.nome}</strong>
            <span title={user.cargo || user.instituicao}>{user.cargo || user.instituicao}</span>
          </div>
        </div>
        <button className="btn-sidebar-logout" onClick={handleLogoutClick} title="Encerrar sessão na plataforma">
          <LogOut size={14} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  </>
  );
}



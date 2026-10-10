import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import MaiconDrawer from './components/MaiconDrawer';

import HomeView from './views/HomeView';
import FormativoView from './views/FormativoView';
import LaboratorioView from './views/LaboratorioView';
import RepositorioView from './views/RepositorioView';
import ReflexaoView from './views/ReflexaoView';
import SuporteView from './views/SuporteView';

export default function App() {
  const [currentTab, setCurrentTab] = useState('inicio');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fecha o menu móvel ao redimensionar para tela desktop ou ao pressionar Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth > 860 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [mobileMenuOpen]);

  // Bloqueia rolagem do fundo quando a gaveta mobile estiver aberta
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <div className="app-container">
      {/* Sidebar Lateral (Desktop fixa / Mobile gaveta retrátil com backdrop) */}
      <Sidebar
        currentTab={currentTab}
        setTab={setCurrentTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Conteúdo Principal à Direita */}
      <main className="app-main">
        <TopHeader
          currentTab={currentTab}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        <div className="app-content-body">
          {/* Renderização Condicional da View Ativa */}
          {currentTab === 'inicio' && <HomeView setTab={setCurrentTab} />}
          {currentTab === 'formativo' && <FormativoView />}
          {currentTab === 'laboratorio' && <LaboratorioView />}
          {currentTab === 'repositorio' && <RepositorioView />}
          {currentTab === 'reflexao' && <ReflexaoView />}
          {currentTab === 'suporte' && <SuporteView />}
        </div>
      </main>

      {/* Widget Flutuante do Prof. mAIcon com foto real */}
      <MaiconDrawer />
    </div>
  );
}

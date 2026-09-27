import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import EthicalBanner from './components/EthicalBanner';
import MaiconDrawer from './components/MaiconDrawer';

import HomeView from './views/HomeView';
import FormativoView from './views/FormativoView';
import LaboratorioView from './views/LaboratorioView';
import RepositorioView from './views/RepositorioView';
import ReflexaoView from './views/ReflexaoView';
import SuporteView from './views/SuporteView';

export default function App() {
  const [currentTab, setCurrentTab] = useState('inicio');

  return (
    <div className="app-container">
      {/* Sidebar Lateral Esquerda */}
      <Sidebar currentTab={currentTab} setTab={setCurrentTab} />

      {/* Conteúdo Principal à Direita */}
      <main className="app-main">
        <TopHeader currentTab={currentTab} />

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

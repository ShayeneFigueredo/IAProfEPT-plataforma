import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import MaiconDrawer from './components/MaiconDrawer';
import RegisterModal from './components/RegisterModal';
import OnboardingModal from './components/OnboardingModal';
import LoginView from './views/LoginView';

import HomeView from './views/HomeView';
import FormativoView from './views/FormativoView';
import LaboratorioView from './views/LaboratorioView';
import RepositorioView from './views/RepositorioView';
import ReflexaoView from './views/ReflexaoView';
import SuporteView from './views/SuporteView';
import { USER_DATA } from './data/mockData';

export default function App() {
  const [currentTab, setCurrentTab] = useState('inicio');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Estado de Autenticação com persistência em localStorage
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('iaprofept_user');
      return savedUser ? JSON.parse(savedUser) : USER_DATA;
    } catch (e) {
      return USER_DATA;
    }
  });

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Fecha o menu móvel ao redimensionar para tela desktop ou ao pressionar Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (mobileMenuOpen) setMobileMenuOpen(false);
        if (isRegisterOpen) setIsRegisterOpen(false);
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
  }, [mobileMenuOpen, isRegisterOpen]);

  // Bloqueia rolagem do fundo quando gaveta ou modais estiverem abertos
  useEffect(() => {
    if (mobileMenuOpen || isRegisterOpen || isOnboardingOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen, isRegisterOpen, isOnboardingOpen]);

  // Ações de Autenticação e Sessão
  const handleLogin = (user, triggerOnboarding = false) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('iaprofept_user', JSON.stringify(user));
    } catch (e) {}

    const onboardingCompleted = localStorage.getItem('iaprofept_onboarding_completed');
    if (triggerOnboarding || !onboardingCompleted) {
      setIsOnboardingOpen(true);
    }
  };

  const handleRegisterSuccess = (newUser) => {
    setCurrentUser(newUser);
    try {
      localStorage.setItem('iaprofept_user', JSON.stringify(newUser));
    } catch (e) {}
    setIsRegisterOpen(false);
    setIsOnboardingOpen(true);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('iaprofept_user');
    } catch (e) {}
    setCurrentUser(null);
    setCurrentTab('inicio');
  };

  const handleCompleteOnboarding = () => {
    try {
      localStorage.setItem('iaprofept_onboarding_completed', 'true');
    } catch (e) {}
    setIsOnboardingOpen(false);
  };

  const handleOpenOnboarding = () => {
    setIsOnboardingOpen(true);
  };

  // Se não houver usuário logado, exibe a tela de login
  if (!currentUser) {
    return (
      <>
        <LoginView
          onLogin={handleLogin}
          onOpenRegister={() => setIsRegisterOpen(true)}
        />
        <RegisterModal
          isOpen={isRegisterOpen}
          onClose={() => setIsRegisterOpen(false)}
          onRegisterSuccess={handleRegisterSuccess}
        />
      </>
    );
  }

  // Dashboard autenticado
  return (
    <div className="app-container">
      {/* Link de Acessibilidade: Pular para o Conteúdo Principal (WCAG AA 2.4.1) */}
      <a href="#main-content" className="skip-to-content">
        Pular para o conteúdo principal
      </a>

      {/* Sidebar Lateral (Desktop fixa / Mobile gaveta retrátil com backdrop) */}
      <Sidebar
        currentTab={currentTab}
        setTab={setCurrentTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenOnboarding={handleOpenOnboarding}
      />

      {/* Conteúdo Principal à Direita */}
      <main className="app-main" id="main-content" tabIndex="-1">
        <TopHeader
          currentTab={currentTab}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          currentUser={currentUser}
          onOpenOnboarding={handleOpenOnboarding}
        />

        <div className="app-content-body">
          {/* Renderização Condicional da View Ativa */}
          {currentTab === 'inicio' && <HomeView setTab={setCurrentTab} currentUser={currentUser} />}
          {currentTab === 'formativo' && <FormativoView />}
          {currentTab === 'laboratorio' && <LaboratorioView />}
          {currentTab === 'repositorio' && <RepositorioView />}
          {currentTab === 'reflexao' && <ReflexaoView />}
          {currentTab === 'suporte' && <SuporteView />}
        </div>
      </main>

      {/* Widget Flutuante do Prof. mAIcon com foto real */}
      <MaiconDrawer />

      {/* Modais Globais de Onboarding e Cadastro */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        user={currentUser}
        onComplete={handleCompleteOnboarding}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegisterSuccess={handleRegisterSuccess}
      />
    </div>
  );
}

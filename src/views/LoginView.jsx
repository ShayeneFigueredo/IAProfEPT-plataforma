import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ArrowRight, Sparkles, GraduationCap, Building2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import AppIcon from '../components/AppIcon';
import Badge from '../components/Badge';
import { USER_DATA } from '../data/mockData';

/**
 * Tela de Login Oficial - Plataforma IAprofEPT (UFJF / PPGEM)
 * Acolhimento de Docentes da Rede Federal (RFEPCT).
 */
export default function LoginView({ onLogin, onOpenRegister }) {
  const [email, setEmail] = useState('maycon.magalhaes@ifnmg.edu.br');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Por favor, informe seu e-mail institucional e senha.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      setLoading(false);

      // 1. Verifica se existe conta previamente cadastrada no localStorage
      let cadastrado = null;
      try {
        const contas = JSON.parse(localStorage.getItem('iaprofept_registered_accounts') || '[]');
        cadastrado = contas.find(c => c.email.toLowerCase() === email.trim().toLowerCase());
      } catch (e) {}

      if (cadastrado) {
        onLogin(cadastrado);
        return;
      }

      // 2. Se for o login demonstrativo do Prof. Maycon
      if (email.toLowerCase().includes('maycon')) {
        onLogin(USER_DATA);
        return;
      }

      // 3. Se for login com indicador de visitante ou convidado
      if (email.toLowerCase().includes('visitante') || email.toLowerCase().includes('convidado')) {
        const guestUser = {
          nome: 'Visitante da RFEPCT',
          email: email.trim(),
          instituicao: 'Rede Federal de EPCT',
          campus: 'Campus Visitante',
          cargo: 'Docente Visitante · RFEPCT',
          iniciais: 'VI',
          areaMatematica: 'Matemática na EPT',
          cursosAtendidos: ['Informática', 'Eletrotécnica']
        };
        onLogin(guestUser, true);
        return;
      }

      // 4. Nova conta inferida a partir do e-mail institucional informado
      const parteLocal = email.split('@')[0] || 'docente';
      const partes = parteLocal.split(/[\._\-]/).filter(Boolean);
      const nomeFormatado = partes
        .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(' ');
      const iniciais = partes.length > 1
        ? (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
        : partes[0] ? partes[0].slice(0, 2).toUpperCase() : 'DC';

      const user = {
        nome: nomeFormatado || 'Docente RFEPCT',
        email: email.trim(),
        instituicao: 'Rede Federal de EPCT',
        campus: 'Campus Local',
        cargo: 'Docente de Matemática · RFEPCT',
        iniciais: iniciais,
        areaMatematica: 'Matemática na EPT',
        cursosAtendidos: ['Informática', 'Agropecuária']
      };
      onLogin(user);
    }, 400);
  };

  const handleQuickLoginMaycon = () => {
    setEmail('maycon.magalhaes@ifnmg.edu.br');
    setPassword('123456');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin(USER_DATA);
    }, 300);
  };

  const handleQuickLoginGuest = () => {
    const guestUser = {
      nome: 'Prof. Visitante da RFEPCT',
      email: 'professor.visitante@ifs.edu.br',
      instituicao: 'Instituto Federal de Educação, Ciência e Tecnologia',
      campus: 'Campus Central',
      cargo: 'Docente de Matemática na EPT',
      iniciais: 'PV',
      areaMatematica: 'Matemática Aplicada na EPT',
      cursosAtendidos: ['Informática', 'Eletrotécnica', 'Edificações'],
      foto: null
    };
    onLogin(guestUser, true); // true para disparar onboarding
  };

  return (
    <div className="auth-page-container">
      {/* Coluna Esquerda: Apresentação Institucional UFJF / PPGEM */}
      <div className="auth-hero-banner">
        <div className="auth-hero-content">
          <div className="auth-hero-top-badges">
            <Badge variant="formativo" icon="book" label="PPGEM / UFJF" />
            <Badge variant="lab" icon="spark" label="Produto Educacional PTT4" />
          </div>

          <div className="auth-brand-lockup">
            <div className="auth-brand-logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                <polyline points="16 7 22 7 22 13"></polyline>
              </svg>
            </div>
            <div>
              <h1 className="auth-brand-title">IAprofEPT</h1>
              <span className="auth-brand-sub">Inteligência Artificial na Docência em Matemática</span>
            </div>
          </div>

          <p className="auth-hero-description">
            Ambiente pedagógico e científico dedicado aos professores de Matemática da Rede Federal de Educação Profissional, Científica e Tecnológica (RFEPCT).
          </p>

          <div className="auth-hero-features-list">
            <div className="auth-hero-feature-item">
              <CheckCircle2 size={18} className="auth-feature-check-icon" />
              <div>
                <strong>Engenharia de Prompts Guiada</strong>
                <span>Zero caixas em branco: prompts ancorados à BNCC e aos Catálogos de Cursos Técnicos.</span>
              </div>
            </div>

            <div className="auth-hero-feature-item">
              <CheckCircle2 size={18} className="auth-feature-check-icon" />
              <div>
                <strong>Insubstituibilidade da Autoridade Docente</strong>
                <span>A IA atua como assistente auxiliar, preservando seu julgamento crítico e pedagógico.</span>
              </div>
            </div>

            <div className="auth-hero-feature-item">
              <CheckCircle2 size={18} className="auth-feature-check-icon" />
              <div>
                <strong>Pesquisa de Doutorado com Rigor Científico</strong>
                <span>Projeto vinculado ao Programa de Pós-Graduação em Educação Matemática da UFJF.</span>
              </div>
            </div>
          </div>

          <div className="auth-hero-footer-credit">
            <span>Doutorando: <strong>Maycon Luiz Amaral Magalhães</strong> (IFNMG / PPGEM-UFJF)</span>
            <span>Orientação: Prof. Dr. Eduardo Barrére · Coorientação: Prof. Dr. Manuel Cabral</span>
          </div>
        </div>
      </div>

      {/* Coluna Direita: Formulário de Autenticação */}
      <div className="auth-form-column">
        <div className="auth-card-wrapper shadow-app">
          
          {/* Avatar Institucional e Boas-Vindas */}
          <div className="auth-header-block">
            <div className="auth-avatar-circle">
              <GraduationCap size={28} />
            </div>
            <h2 className="auth-title">Acesso Docente</h2>
            <p className="auth-subtitle">
              Entre com suas credenciais institucionais para acessar os 5 ambientes da plataforma.
            </p>
          </div>

          {errorMsg && (
            <div className="auth-error-banner" role="alert">
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Formulário de Login */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field-group">
              <label htmlFor="auth-email" className="auth-label">
                E-mail Institucional
              </label>
              <div className="auth-input-wrapper">
                <Mail size={18} className="auth-input-icon" />
                <input
                  id="auth-email"
                  type="email"
                  className="auth-input"
                  placeholder="exemplo@instituto.edu.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="auth-field-group">
              <div className="auth-label-row">
                <label htmlFor="auth-password" className="auth-label">
                  Senha
                </label>
                <button
                  type="button"
                  className="auth-forgot-link"
                  onClick={() => alert('Para redefinição em ambiente piloto, utilize a senha padrão 123456 ou acesse com um clique nos atalhos abaixo.')}
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-input-icon" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="auth-checkbox-row">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Lembrar meu acesso neste computador</span>
              </label>
            </div>

            <button
              type="submit"
              className="btn-auth-submit"
              disabled={loading}
            >
              {loading ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  <span>Entrar na Plataforma</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Divisor Visual */}
          <div className="auth-divider">
            <span>ou acesso rápido para avaliação</span>
          </div>

          {/* Acessos Rápidos de Demonstração / Piloto */}
          <div className="auth-quick-actions">
            <button
              type="button"
              className="btn-auth-quick primary"
              onClick={handleQuickLoginMaycon}
              title="Acessar com a conta do pesquisador Maycon Magalhães"
            >
              <div className="quick-btn-left">
                <div className="quick-avatar-mini">MM</div>
                <div className="quick-btn-text">
                  <strong>Entrar como Prof. Maycon Magalhães</strong>
                  <small>Docente IFNMG · Pesquisador PPGEM</small>
                </div>
              </div>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              className="btn-auth-quick secondary"
              onClick={handleQuickLoginGuest}
              title="Acessar como novo docente e ver o Onboarding"
            >
              <div className="quick-btn-left">
                <div className="quick-avatar-mini guest">RF</div>
                <div className="quick-btn-text">
                  <strong>Entrar como Docente Convidado da RFEPCT</strong>
                  <small>Experimentar onboarding dos 5 Ambientes</small>
                </div>
              </div>
              <Sparkles size={16} color="var(--accent-green)" />
            </button>
          </div>

          {/* Rodapé do Formulário: Link para Cadastro */}
          <div className="auth-card-footer">
            <span>É docente da Rede Federal e não possui acesso?</span>
            <button
              type="button"
              className="btn-auth-register-link"
              onClick={onOpenRegister}
            >
              Cadastre-se como Docente da EPT
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

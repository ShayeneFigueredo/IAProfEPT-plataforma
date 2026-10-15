import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ArrowRight, GraduationCap, Building2, ShieldCheck, CheckCircle2, UserCheck, MapPin } from 'lucide-react';
import AppIcon from '../components/AppIcon';
import Badge from '../components/Badge';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { USER_DATA } from '../data/mockData';
import { UFS_LISTA } from '../data/instituicoesData';

/**
 * Tela de Login Oficial - Plataforma IAprofEPT (UFJF / PPGEM)
 * Acolhimento de Docentes da Rede Federal (RFEPCT).
 */
export default function LoginView({ onLogin, onOpenRegister }) {
  const [email, setEmail] = useState('maycon.magalhaes@ifnmg.edu.br');
  const [password, setPassword] = useState('123456');
  const [uf, setUf] = useState('MG');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Por favor, informe seu e-mail institucional ou matrícula e a senha.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      setLoading(false);
      const idLimpo = email.trim().toLowerCase();

      // 1. Verifica se existe conta previamente cadastrada no localStorage por e-mail ou matrícula
      let cadastrado = null;
      try {
        const contas = JSON.parse(localStorage.getItem('iaprofept_registered_accounts') || '[]');
        cadastrado = contas.find(c => 
          (c.email && c.email.toLowerCase() === idLimpo) ||
          (c.matricula && c.matricula.toLowerCase() === idLimpo)
        );
      } catch (e) {}

      if (cadastrado) {
        onLogin({ ...cadastrado, uf: cadastrado.uf || uf });
        return;
      }

      // 2. Se for o login demonstrativo do Prof. Maycon
      if (idLimpo.includes('maycon') || idLimpo === '123456') {
        onLogin({ ...USER_DATA, uf: 'MG' });
        return;
      }

      // 3. Se for login com indicador de visitante ou convidado
      if (idLimpo.includes('visitante') || idLimpo.includes('convidado')) {
        const guestUser = {
          nome: 'Visitante da RFEPCT',
          email: idLimpo.includes('@') ? idLimpo : 'visitante@rfepct.edu.br',
          matricula: !idLimpo.includes('@') ? email.trim() : 'VISITANTE',
          uf: uf,
          instituicao: 'Rede Federal de EPCT',
          campus: `Campus Visitante (${uf})`,
          cargo: `Docente Visitante · RFEPCT (${uf})`,
          iniciais: 'VI',
          areaMatematica: 'Matemática na EPT',
          cursosAtendidos: ['Informática', 'Eletrotécnica']
        };
        onLogin(guestUser, true);
        return;
      }

      // 4. Nova conta inferida a partir do e-mail ou matrícula informada
      let nomeFormatado = 'Docente RFEPCT';
      let iniciais = 'PF';

      if (idLimpo.includes('@')) {
        const parteLocal = idLimpo.split('@')[0] || 'docente';
        const partes = parteLocal.split(/[\._\-]/).filter(Boolean);
        nomeFormatado = partes
          .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
          .join(' ');
        iniciais = partes.length > 1
          ? (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
          : partes[0] ? partes[0].slice(0, 2).toUpperCase() : 'DC';
      } else {
        nomeFormatado = `Docente (SIAPE ${email.trim()})`;
        iniciais = 'SI';
      }

      const user = {
        nome: nomeFormatado || 'Docente RFEPCT',
        email: idLimpo.includes('@') ? idLimpo : `${idLimpo}@instituto.edu.br`,
        matricula: !idLimpo.includes('@') ? email.trim() : '',
        uf: uf,
        instituicao: 'Rede Federal de EPCT',
        campus: `Campus Local (${uf})`,
        cargo: `Docente de Matemática · RFEPCT (${uf})`,
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
    setUf('MG');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin({ ...USER_DATA, uf: 'MG' });
    }, 300);
  };

  const handleQuickLoginGuest = () => {
    setUf('SP');
    const guestUser = {
      nome: 'Prof. Visitante da RFEPCT',
      email: 'professor.visitante@ifs.edu.br',
      uf: 'SP',
      instituicao: 'Instituto Federal de São Paulo (IFSP)',
      campus: 'Campus São Paulo',
      cargo: 'Docente de Matemática na EPT · IFSP (SP)',
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
            <div className="auth-avatar-circle" title="Identidade Visual Oficial UFJF / PPGEM">
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
            <div className="auth-grid-2col">
              <div className="auth-field-group">
                <label htmlFor="auth-uf" className="auth-label">
                  UF (Estado) *
                </label>
                <div className="auth-input-wrapper">
                  <MapPin size={18} className="auth-input-icon" />
                  <select
                    id="auth-uf"
                    className="auth-input"
                    value={uf}
                    onChange={(e) => setUf(e.target.value)}
                  >
                    {UFS_LISTA.map((item) => (
                      <option key={item.sigla} value={item.sigla}>
                        {item.sigla} — {item.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="auth-field-group">
                <label htmlFor="auth-email" className="auth-label">
                  E-mail ou Matrícula *
                </label>
                <div className="auth-input-wrapper">
                  <Mail size={18} className="auth-input-icon" />
                  <input
                    id="auth-email"
                    type="text"
                    className="auth-input"
                    placeholder="E-mail ou SIAPE"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
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
                  onClick={() => setIsForgotOpen(true)}
                  title="Recuperar acesso com e-mail institucional ou matrícula"
                >
                  Esqueci minha senha
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <strong>Entrar como Prof. Maycon Magalhães</strong>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'var(--primary-soft-bg)', color: 'var(--primary-green)', border: '1px solid var(--primary-border)' }}>MG</span>
                  </div>
                  <small>Docente IFNMG (MG) · Pesquisador PPGEM-UFJF</small>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <strong>Entrar como Docente Convidado da RFEPCT</strong>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '4px', background: '#EAF3FF', color: '#1E5FB0', border: '1px solid #BFDBFE' }}>SP</span>
                  </div>
                  <small>Docente IFSP (SP) · Experimentar acolhimento</small>
                </div>
              </div>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Rodapé do Formulário: Link para Criação de Conta */}
          <div className="auth-card-footer">
            <span>Ainda não possui acesso institucional?</span>
            <button
              type="button"
              className="btn-auth-register-link"
              onClick={onOpenRegister}
              title="Criar nova conta de docente na RFEPCT"
            >
              Criar nova conta de docente na RFEPCT
            </button>
          </div>

        </div>
      </div>

      {/* Modal de Recuperação de Senha */}
      <ForgotPasswordModal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        initialEmail={email}
      />
    </div>
  );
}

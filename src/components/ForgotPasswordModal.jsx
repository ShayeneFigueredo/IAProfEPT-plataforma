import React, { useState } from 'react';
import { X, KeyRound, Mail, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';

/**
 * Modal de Recuperação de Senha Institucional - IAprofEPT
 * Atende aos docentes da Rede Federal (RFEPCT).
 */
export default function ForgotPasswordModal({ isOpen, onClose, initialEmail = '' }) {
  const [identificador, setIdentificador] = useState(initialEmail);
  const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'success'
  const [erro, setErro] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!identificador.trim()) {
      setErro('Por favor, informe seu e-mail institucional ou matrícula SIAPE.');
      return;
    }

    setErro('');
    setStatus('sending');

    setTimeout(() => {
      setStatus('success');
    }, 600);
  };

  const handleReset = () => {
    setStatus('idle');
    setErro('');
    onClose();
  };

  return (
    <div className="auth-modal-backdrop" onClick={handleReset} role="dialog" aria-modal="true">
      <div className="auth-modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Cabeçalho do Modal */}
        <div className="auth-modal-header">
          <div className="auth-modal-header-left">
            <div className="auth-modal-icon-box">
              <KeyRound size={22} color="var(--primary-green)" />
            </div>
            <div>
              <h2 className="auth-modal-title">Esqueci minha senha</h2>
              <span className="auth-modal-sub">Recuperação de acesso institucional RFEPCT</span>
            </div>
          </div>
          <button
            type="button"
            className="auth-modal-close-btn"
            onClick={handleReset}
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="auth-modal-body" style={{ padding: '1.75rem 2rem' }}>
          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'var(--primary-soft-bg)',
                  border: '2px solid var(--primary-border)',
                  color: 'var(--accent-green-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem'
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Instruções Enviadas!
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                Se o e-mail ou matrícula <strong>{identificador}</strong> estiver cadastrado na plataforma, você receberá um link seguro para redefinição da sua senha em instantes.
              </p>

              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.9rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  marginBottom: '1.5rem',
                  textAlign: 'left'
                }}
              >
                💡 <strong>Dica do Piloto:</strong> Em ambiente de homologação, você também pode efetuar login direto utilizando a senha padrão <code>123456</code> ou os botões de acesso rápido.
              </div>

              <button
                type="button"
                className="btn-auth-submit"
                onClick={handleReset}
                style={{ width: '100%' }}
              >
                <span>Voltar para o Login</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                Informe seu <strong>e-mail institucional</strong> ou sua <strong>matrícula SIAPE</strong> vinculada ao seu Instituto Federal / CEFET para receber o link de recuperação.
              </p>

              {erro && (
                <div className="auth-error-banner" role="alert" style={{ margin: 0 }}>
                  <span>{erro}</span>
                </div>
              )}

              <div className="auth-field-group">
                <label htmlFor="recovery-id" className="auth-label">
                  E-mail institucional ou Matrícula
                </label>
                <div className="auth-input-wrapper">
                  <Mail size={18} className="auth-input-icon" />
                  <input
                    id="recovery-id"
                    type="text"
                    className="auth-input"
                    placeholder="professor@if.edu.br ou SIAPE"
                    value={identificador}
                    onChange={(e) => setIdentificador(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div
                style={{
                  background: 'var(--primary-soft-bg)',
                  border: '1px solid var(--primary-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem'
                }}
              >
                <ShieldAlert size={18} color="var(--primary-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--color-formativo)', lineHeight: '1.45' }}>
                  Apenas e-mails institucionais pertencentes à Rede Federal (RFEPCT) ou participantes homologados na tese de doutorado (PPGEM/UFJF) são autenticados pelo sistema.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-auth-cancel"
                  onClick={handleReset}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-auth-submit"
                  disabled={status === 'sending'}
                  style={{ flex: 1.4, margin: 0 }}
                >
                  {status === 'sending' ? (
                    <span>Enviando...</span>
                  ) : (
                    <>
                      <span>Enviar Instruções</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

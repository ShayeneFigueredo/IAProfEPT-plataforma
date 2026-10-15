import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

/**
 * Modal de Redefinição Segura de Senha
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Atende aos requisitos:
 * - Validação de token de uso único (expiração de 2 horas)
 * - Nova senha forte (mínimo 8 caracteres, maiúscula, minúscula, número e símbolo)
 * - Chamada ao endpoint POST /api/auth/reset-password
 */
export default function ResetPasswordModal({ isOpen, token, onClose, onSuccess }) {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
  const [mensagemErro, setMensagemErro] = useState('');

  if (!isOpen) return null;

  // Validações locais da senha
  const temMin8 = novaSenha.length >= 8;
  const temMaiuscula = /[A-Z]/.test(novaSenha);
  const temMinuscula = /[a-z]/.test(novaSenha);
  const temNumero = /[0-9]/.test(novaSenha);
  const temSimbolo = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(novaSenha);
  const senhasConferem = novaSenha.length > 0 && novaSenha === confirmacaoSenha;
  const senhaValida = temMin8 && temMaiuscula && temMinuscula && temNumero && temSimbolo && senhasConferem;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!senhaValida) {
      if (!senhasConferem) {
        setMensagemErro('A confirmação não confere com a nova senha digitada.');
      } else {
        setMensagemErro('Por favor, atenda a todos os requisitos de segurança da senha.');
      }
      return;
    }

    setMensagemErro('');
    setStatus('submitting');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          novaSenha,
          confirmacaoSenha,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setStatus('success');
      } else {
        const erroMsg = data.detail || data.mensagem || 'Não foi possível redefinir sua senha. O token pode ser inválido ou ter expirado.';
        setMensagemErro(erroMsg);
        setStatus('error');
      }
    } catch (err) {
      // Caso ocorra falha de rede/conexão
      setMensagemErro('Erro de conexão com o servidor. Verifique se o backend está em execução.');
      setStatus('error');
    }
  };

  const handleFinish = () => {
    setStatus('idle');
    setNovaSenha('');
    setConfirmacaoSenha('');
    setMensagemErro('');
    if (onSuccess) {
      onSuccess();
    } else {
      onClose();
    }
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-modal-card" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Cabeçalho do Modal */}
        <div className="auth-modal-header">
          <div className="auth-modal-header-left">
            <div className="auth-modal-icon-box">
              <Lock size={22} color="var(--primary-green)" />
            </div>
            <div>
              <h2 className="auth-modal-title">Redefinir Senha</h2>
              <span className="auth-modal-sub">Credencial Segura Docente RFEPCT</span>
            </div>
          </div>
          <button
            type="button"
            className="auth-modal-close-btn"
            onClick={onClose}
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
                Senha Redefinida com Sucesso!
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                Suas novas credenciais foram criptografadas com segurança e salvas no sistema. Todas as sessões anteriores foram encerradas por proteção.
              </p>

              <button
                type="button"
                className="btn-auth-submit"
                onClick={handleFinish}
                style={{ width: '100%', margin: 0 }}
              >
                <span>Acessar a Plataforma</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                Crie uma nova senha segura para o seu perfil docente na plataforma IAprofEPT.
              </p>

              {mensagemErro && (
                <div className="auth-error-banner" role="alert" style={{ margin: 0 }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{mensagemErro}</span>
                </div>
              )}

              {/* Campo Nova Senha */}
              <div className="auth-field-group">
                <label htmlFor="reset-nova-senha" className="auth-label">
                  Nova Senha
                </label>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="reset-nova-senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Mínimo 8 caracteres com símbolos"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    className="auth-input-action-btn"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    tabIndex="-1"
                    aria-label={mostrarSenha ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Campo Confirmação de Senha */}
              <div className="auth-field-group">
                <label htmlFor="reset-conf-senha" className="auth-label">
                  Confirmação da Nova Senha
                </label>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="reset-conf-senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Repita a nova senha exatamente"
                    value={confirmacaoSenha}
                    onChange={(e) => setConfirmacaoSenha(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Requisitos de Segurança */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)'
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  Requisitos de Segurança da Senha:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                  <span style={{ color: temMin8 ? 'var(--accent-green-dark)' : 'var(--text-muted)' }}>
                    {temMin8 ? '✓' : '○'} Mínimo 8 caracteres
                  </span>
                  <span style={{ color: temMaiuscula ? 'var(--accent-green-dark)' : 'var(--text-muted)' }}>
                    {temMaiuscula ? '✓' : '○'} Letra maiúscula
                  </span>
                  <span style={{ color: temMinuscula ? 'var(--accent-green-dark)' : 'var(--text-muted)' }}>
                    {temMinuscula ? '✓' : '○'} Letra minúscula
                  </span>
                  <span style={{ color: temNumero ? 'var(--accent-green-dark)' : 'var(--text-muted)' }}>
                    {temNumero ? '✓' : '○'} Número (0-9)
                  </span>
                  <span style={{ color: temSimbolo ? 'var(--accent-green-dark)' : 'var(--text-muted)' }}>
                    {temSimbolo ? '✓' : '○'} Caractere especial (!@#$)
                  </span>
                  <span style={{ color: senhasConferem ? 'var(--accent-green-dark)' : 'var(--text-muted)' }}>
                    {senhasConferem ? '✓' : '○'} Senhas coincidem
                  </span>
                </div>
              </div>

              {/* Ações */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-auth-cancel"
                  onClick={onClose}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-auth-submit"
                  disabled={status === 'submitting' || !senhaValida}
                  style={{ flex: 1.4, margin: 0 }}
                >
                  {status === 'submitting' ? (
                    <span>Atualizando...</span>
                  ) : (
                    <>
                      <span>Salvar Nova Senha</span>
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

import React, { useState } from 'react';
import { Upload, FileText, Video, Save, Lock, AlertCircle, FileCheck, CheckCircle } from 'lucide-react';
import CertificateGenerator from '../components/CertificateGenerator';

export default function StudioView() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('videos');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'Adm1n42') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Credenciais inválidas. Somente administradores têm acesso ao Studio.');
    }
  };

  const handleUpload = (e) => {
    e.preventDefault();
    setSuccessMsg('Material salvo com sucesso no ambiente formativo!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  if (!isAuthenticated) {
    return (
      <div className="view-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ maxWidth: '400px', width: '100%', background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--accent-green)' }}>
            <Lock size={28} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Acesso Restrito</h2>
          </div>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            O Studio IAprofEPT é reservado para envio de materiais ao Ambiente Formativo. Insira suas credenciais.
          </p>

          {error && (
            <div style={{ background: 'rgba(220, 38, 38, 0.1)', color: 'var(--accent-red)', padding: '0.75rem', borderRadius: '4px', display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem', fontSize: '0.9rem' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label>Usuário</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} />
            </div>
            <div className="form-group">
              <label>Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} />
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
              Acessar Studio
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="view-container fade-in">
      <header className="view-header">
        <div>
          <h2>Studio IAprofEPT</h2>
          <p>Gerencie os conteúdos e certificados do Ambiente Formativo</p>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveTab('videos')}
          style={{ flex: 1, padding: '1rem', background: activeTab === 'videos' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)', border: \1px solid \\, borderRadius: 'var(--radius-md)', color: activeTab === 'videos' ? 'var(--accent-green)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
          <Video size={20} />
          Upload de Vídeos
        </button>
        <button 
          onClick={() => setActiveTab('documentos')}
          style={{ flex: 1, padding: '1rem', background: activeTab === 'documentos' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)', border: \1px solid \\, borderRadius: 'var(--radius-md)', color: activeTab === 'documentos' ? 'var(--accent-green)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
          <FileText size={20} />
          Upload de Documentos
        </button>
        <button 
          onClick={() => setActiveTab('certificados')}
          style={{ flex: 1, padding: '1rem', background: activeTab === 'certificados' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)', border: \1px solid \\, borderRadius: 'var(--radius-md)', color: activeTab === 'certificados' ? 'var(--accent-green)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
          <FileCheck size={20} />
          Certificados
        </button>
      </div>

      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-green)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem', fontWeight: 500 }}>
          <CheckCircle size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {activeTab === 'videos' && (
        <div className="card-glass" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Video size={20} className="text-accent" /> Novo Vídeo/Palestra</h3>
          <form onSubmit={handleUpload} style={{ display: 'grid', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Título do Vídeo</label>
              <input type="text" required placeholder="Ex: Impactos da IA na Educação Matemática" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} />
            </div>
            <div className="form-group">
              <label>ID do YouTube</label>
              <input type="text" required placeholder="Ex: C9S7Ycx546c" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} />
            </div>
            <div className="form-group">
              <label>Descrição Curta</label>
              <textarea rows={3} required placeholder="Resumo dos temas abordados..." style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', resize: 'vertical' }}></textarea>
            </div>
            <div className="form-group">
              <label>Objetivo Pedagógico</label>
              <input type="text" required placeholder="O que se espera alcançar..." style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" style={{ gap: '0.5rem' }}>
                <Save size={18} /> Salvar Vídeo
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'documentos' && (
        <div className="card-glass" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={20} className="text-accent" /> Novo Documento PDF</h3>
          <form onSubmit={handleUpload} style={{ display: 'grid', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Título do Documento</label>
              <input type="text" required placeholder="Ex: Lei 14.533 (PNED)" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} />
            </div>
            <div className="form-group">
              <label>Órgão Emissor / Autor</label>
              <input type="text" required placeholder="Ex: MEC / Governo Federal" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} />
            </div>
            <div className="form-group">
              <label>Categoria (Tag)</label>
              <select required style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}>
                <option value="">Selecione...</option>
                <option value="Legislacao EPT">Legislação EPT</option>
                <option value="Relatorios UNESCO">Relatórios UNESCO</option>
                <option value="Plano Brasileiro de IA">Plano Brasileiro de IA</option>
                <option value="Diretriz MEC">Diretriz MEC</option>
                <option value="Fundamentacao Teorica">Fundamentação Teórica</option>
              </select>
            </div>
            <div className="form-group">
              <label>Arquivo PDF</label>
              <div style={{ border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: '2rem', textAlign: 'center', background: 'rgba(0,0,0,0.2)', cursor: 'pointer' }}>
                <Upload size={32} style={{ margin: '0 auto 1rem', color: 'var(--text-secondary)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Arraste o arquivo PDF aqui ou clique para selecionar</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary" style={{ gap: '0.5rem' }}>
                <Save size={18} /> Salvar Documento
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'certificados' && (
        <CertificateGenerator />
      )}
    </div>
  );
}

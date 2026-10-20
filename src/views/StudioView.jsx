import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  Video,
  Save,
  Lock,
  AlertCircle,
  FileCheck,
  CheckCircle,
  ArrowLeft,
  Trash2,
  Edit,
  ExternalLink,
  PlusCircle,
  X,
  Play,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import CertificateGenerator from '../components/CertificateGenerator';
import { useToast } from '../components/ToastProvider';

export default function StudioView({ currentUser, setTab }) {
  const toast = useToast();
  const fileInputRef = useRef(null);

  const isPrivileged =
    currentUser?.role === 'administrador_ufjf' ||
    currentUser?.role === 'pesquisador_doutorado' ||
    currentUser?.role === 'admin' ||
    currentUser?.email?.includes('maycon') ||
    currentUser?.nome?.includes('Maycon');

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (sessionStorage.getItem('iaprofept_studio_auth') === 'true') return true;
    if (isPrivileged) return true;
    return false;
  });

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Aba ativa com suporte a URL search params
  const getInitialTab = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['videos', 'documentos', 'certificados'].includes(tabParam)) {
        return tabParam;
      }
    } catch (e) {}
    return 'documentos';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  // Estados de Documentos
  const [documentos, setDocumentos] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [savingDoc, setSavingDoc] = useState(false);
  const [docFile, setDocFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [docForm, setDocForm] = useState({
    id: null,
    titulo: '',
    orgaoEmissor: '',
    tagPrincipal: 'Legislação EPT',
    anoPublicacao: new Date().getFullYear(),
    descricao: '',
    url: '',
  });

  // Estados de Vídeos
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [savingVideo, setSavingVideo] = useState(false);
  const [videoForm, setVideoForm] = useState({
    id: null,
    titulo: '',
    youtubeId: '',
    duracao: '15 min',
    autor: 'Prof. Maycon Magalhães',
    categoria: 'Fundamentos',
    descricao: '',
    objetivoPedagogico: '',
  });

  // Carrega acervo inicial ao logar
  useEffect(() => {
    if (isAuthenticated) {
      carregarDocumentos();
      carregarVideos();
    }
  }, [isAuthenticated]);

  const handleTabChange = (newSubTab) => {
    setActiveTab(newSubTab);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', newSubTab);
      window.history.replaceState({}, '', url.pathname + url.search);
    } catch (e) {}
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && (password === 'Adm1n42' || password === 'admin' || isPrivileged)) {
      sessionStorage.setItem('iaprofept_studio_auth', 'true');
      setIsAuthenticated(true);
      setLoginError('');
      toast.success('Acesso ao Studio autorizado com sucesso!', 'Studio IAprofEPT');
    } else {
      setLoginError('Credenciais inválidas. Somente administradores e pesquisadores têm acesso ao Studio.');
      toast.error('Credenciais inválidas.', 'Acesso Negado');
    }
  };

  /* ========================================================================
     DOCUMENTOS: CARREGAR, SALVAR, EDITAR, EXCLUIR
     ======================================================================== */

  const carregarDocumentos = async () => {
    try {
      setLoadingDocs(true);
      const res = await fetch('/api/formativo/documentos');
      if (res.ok) {
        const data = await res.json();
        if (data.documentos) {
          setDocumentos(data.documentos);
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar documentos no Studio:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setDocFile(file);
      toast.info(`Arquivo selecionado: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocFile(file);
      toast.info(`Arquivo selecionado: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
    }
  };

  const handleSalvarDocumento = async (e) => {
    e.preventDefault();
    if (!docForm.titulo.trim()) {
      toast.warning('O título do documento é obrigatório.');
      return;
    }

    setSavingDoc(true);

    try {
      const formData = new FormData();
      formData.append('titulo', docForm.titulo.trim());
      formData.append('orgaoEmissor', docForm.orgaoEmissor.trim() || 'UFJF / IAprofEPT');
      formData.append('tagPrincipal', docForm.tagPrincipal);
      formData.append('anoPublicacao', String(docForm.anoPublicacao));
      formData.append('descricao', docForm.descricao.trim());
      if (docForm.url) {
        formData.append('url', docForm.url.trim());
      }
      if (docFile) {
        formData.append('arquivo', docFile);
      }

      const isEditing = !!docForm.id;
      const url = isEditing
        ? `/api/formativo/documentos/${docForm.id}`
        : '/api/formativo/documentos';

      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: formData,
      });

      if (!res.ok) {
        const erroMsg = await res.text();
        throw new Error(erroMsg || 'Erro ao processar documento.');
      }

      const data = await res.json();
      toast.success(
        isEditing ? 'Documento atualizado com sucesso!' : 'Documento e arquivo PDF salvos no acervo!',
        'Acervo Atualizado'
      );

      // Limpa formulário
      setDocForm({
        id: null,
        titulo: '',
        orgaoEmissor: '',
        tagPrincipal: 'Legislação EPT',
        anoPublicacao: new Date().getFullYear(),
        descricao: '',
        url: '',
      });
      setDocFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Atualiza listagem
      carregarDocumentos();
    } catch (err) {
      console.error('Erro ao salvar documento:', err);
      toast.error(err.message || 'Erro ao salvar documento.', 'Falha na Operação');
    } finally {
      setSavingDoc(false);
    }
  };

  const handleEditarDocumento = (doc) => {
    setDocForm({
      id: doc.id,
      titulo: doc.titulo || '',
      orgaoEmissor: doc.orgaoEmissor || '',
      tagPrincipal: doc.tagPrincipal || (doc.tags && doc.tags[0]) || 'Legislação EPT',
      anoPublicacao: doc.anoPublicacao || new Date().getFullYear(),
      descricao: doc.descricao || '',
      url: doc.url || '',
    });
    setDocFile(null);
    toast.info(`Editando documento: "${doc.titulo}"`, 'Modo Edição');
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  const handleCancelarEdicaoDoc = () => {
    setDocForm({
      id: null,
      titulo: '',
      orgaoEmissor: '',
      tagPrincipal: 'Legislação EPT',
      anoPublicacao: new Date().getFullYear(),
      descricao: '',
      url: '',
    });
    setDocFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.info('Edição cancelada.');
  };

  const handleExcluirDocumento = async (doc) => {
    if (!window.confirm(`Deseja realmente remover o documento "${doc.titulo}" do acervo?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/formativo/documentos/${doc.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Falha ao remover documento.');
      }

      toast.success(`Documento "${doc.titulo}" removido com sucesso.`, 'Excluído');
      carregarDocumentos();
    } catch (err) {
      console.error('Erro ao excluir documento:', err);
      toast.error('Não foi possível remover o documento.', 'Erro');
    }
  };

  /* ========================================================================
     VÍDEOS: CARREGAR, SALVAR, EDITAR, EXCLUIR
     ======================================================================== */

  const carregarVideos = async () => {
    try {
      setLoadingVideos(true);
      const res = await fetch('/api/formativo/videos');
      if (res.ok) {
        const data = await res.json();
        if (data.videos) {
          setVideos(data.videos);
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar vídeos no Studio:', err);
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleSalvarVideo = async (e) => {
    e.preventDefault();
    if (!videoForm.titulo.trim() || !videoForm.youtubeId.trim()) {
      toast.warning('Título e ID ou URL do YouTube são obrigatórios.');
      return;
    }

    setSavingVideo(true);

    try {
      const isEditing = !!videoForm.id;
      const url = isEditing
        ? `/api/formativo/videos/${videoForm.id}`
        : '/api/formativo/videos';

      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videoForm),
      });

      if (!res.ok) {
        const erroMsg = await res.text();
        throw new Error(erroMsg || 'Erro ao processar vídeo.');
      }

      toast.success(
        isEditing ? 'Vídeo atualizado com sucesso!' : 'Novo vídeo cadastrado no Ambiente Formativo!',
        'Vídeos Atualizados'
      );

      // Limpa formulário
      setVideoForm({
        id: null,
        titulo: '',
        youtubeId: '',
        duracao: '15 min',
        autor: 'Prof. Maycon Magalhães',
        categoria: 'Fundamentos',
        descricao: '',
        objetivoPedagogico: '',
      });

      carregarVideos();
    } catch (err) {
      console.error('Erro ao salvar vídeo:', err);
      toast.error(err.message || 'Erro ao salvar vídeo.', 'Falha na Operação');
    } finally {
      setSavingVideo(false);
    }
  };

  const handleEditarVideo = (v) => {
    setVideoForm({
      id: v.id,
      titulo: v.titulo || '',
      youtubeId: v.youtubeId || '',
      duracao: v.duracao || '15 min',
      autor: v.autor || 'Prof. Maycon Magalhães',
      categoria: v.categoria || 'Fundamentos',
      descricao: v.descricao || '',
      objetivoPedagogico: v.objetivoPedagogico || '',
    });
    toast.info(`Editando vídeo: "${v.titulo}"`, 'Modo Edição');
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  const handleCancelarEdicaoVideo = () => {
    setVideoForm({
      id: null,
      titulo: '',
      youtubeId: '',
      duracao: '15 min',
      autor: 'Prof. Maycon Magalhães',
      categoria: 'Fundamentos',
      descricao: '',
      objetivoPedagogico: '',
    });
    toast.info('Edição cancelada.');
  };

  const handleExcluirVideo = async (v) => {
    if (!window.confirm(`Deseja realmente remover o vídeo "${v.titulo}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/formativo/videos/${v.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Falha ao remover vídeo.');
      }

      toast.success(`Vídeo "${v.titulo}" removido com sucesso.`, 'Excluído');
      carregarVideos();
    } catch (err) {
      console.error('Erro ao excluir vídeo:', err);
      toast.error('Não foi possível remover o vídeo.', 'Erro');
    }
  };

  // Helper para extrair YouTube ID para preview
  const extrairIdYoutubeParaPreview = (input) => {
    if (!input) return null;
    const match = input.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match) return match[1];
    if (input.trim().length === 11 && !input.includes('/')) return input.trim();
    return null;
  };

  const previewYoutubeId = extrairIdYoutubeParaPreview(videoForm.youtubeId);

  /* ========================================================================
     TELA DE LOGIN DO STUDIO
     ======================================================================== */
  if (!isAuthenticated) {
    return (
      <div className="view-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ maxWidth: '440px', width: '100%', background: '#FFFFFF', padding: '2.5rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '1.25rem', color: '#064E3B' }}>
            <Lock size={26} color="#064E3B" />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#064E3B' }}>Studio IAprofEPT</h2>
          </div>
          <p style={{ textAlign: 'center', color: '#64748B', marginBottom: '1.5rem', fontSize: '0.88rem', lineHeight: '1.5' }}>
            Área restrita de gestão de acervo, documentos oficiais, palestras e certificados do Ambiente Formativo.
          </p>

          {loginError && (
            <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '0.75rem 1rem', borderRadius: '8px', display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.25rem', fontSize: '0.85rem', border: '1px solid #FECACA' }}>
              <AlertCircle size={16} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem', display: 'block' }}>Usuário</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
              />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem', display: 'block' }}>Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Senha de administrador"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
              />
              <small style={{ color: '#64748B', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>
                Credenciais de homologação: <strong>admin</strong> / <strong>Adm1n42</strong>
              </small>
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', width: '100%' }}>
              <Lock size={16} />
              Acessar Studio
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ========================================================================
     PAINEL PRINCIPAL DO STUDIO
     ======================================================================== */
  return (
    <div className="view-container fade-in">
      <header className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ color: '#064E3B', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={24} color="#064E3B" />
            Studio de Gestão & Autoria IAprofEPT
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.9rem' }}>
            Gerencie os conteúdos, envie novos documentos PDF, adicione vídeos e emita certificados com persistência em tempo real.
          </p>
        </div>

        {setTab && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setTab('formativo')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ArrowLeft size={16} />
            <span>Voltar ao Ambiente Formativo</span>
          </button>
        )}
      </header>

      {/* Navegação entre Abas do Studio */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => handleTabChange('documentos')}
          className={activeTab === 'documentos' ? 'btn-primary' : 'btn-secondary'}
          style={{ flex: 1, minWidth: '200px', padding: '0.9rem' }}
        >
          <FileText size={18} />
          <span>Upload de Documentos ({documentos.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('videos')}
          className={activeTab === 'videos' ? 'btn-primary' : 'btn-secondary'}
          style={{ flex: 1, minWidth: '200px', padding: '0.9rem' }}
        >
          <Video size={18} />
          <span>Gestão de Vídeos ({videos.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('certificados')}
          className={activeTab === 'certificados' ? 'btn-primary' : 'btn-secondary'}
          style={{ flex: 1, minWidth: '200px', padding: '0.9rem' }}
        >
          <FileCheck size={18} />
          <span>Emissão de Certificados</span>
        </button>
      </div>

      {/* ====================================================================
           1. ABA: UPLOAD E GESTÃO DE DOCUMENTOS
           ==================================================================== */}
      {activeTab === 'documentos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Formulário de Envio / Edição */}
          <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#064E3B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} color="#064E3B" />
                {docForm.id ? 'Editar Documento do Acervo' : 'Adicionar Novo Documento ao Acervo'}
              </h3>
              {docForm.id && (
                <button
                  type="button"
                  onClick={handleCancelarEdicaoDoc}
                  className="btn-secondary btn-sm"
                  style={{ gap: '0.3rem' }}
                >
                  <X size={14} /> Cancelar Edição
                </button>
              )}
            </div>

            <form onSubmit={handleSalvarDocumento} style={{ display: 'grid', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: '0.35rem', display: 'block' }}>
                    Título do Documento *
                  </label>
                  <input
                    type="text"
                    required
                    value={docForm.titulo}
                    onChange={(e) => setDocForm({ ...docForm, titulo: e.target.value })}
                    placeholder="Ex: Diretrizes Curriculares da EPT (MEC/SETEC)"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: '0.35rem', display: 'block' }}>
                    Órgão Emissor / Autor
                  </label>
                  <input
                    type="text"
                    value={docForm.orgaoEmissor}
                    onChange={(e) => setDocForm({ ...docForm, orgaoEmissor: e.target.value })}
                    placeholder="Ex: MEC / UNESCO / Governo Federal"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: '0.35rem', display: 'block' }}>
                    Categoria / Tag Canônica
                  </label>
                  <select
                    value={docForm.tagPrincipal}
                    onChange={(e) => setDocForm({ ...docForm, tagPrincipal: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem', background: '#FFFFFF' }}
                  >
                    <option value="Legislação EPT">Legislação EPT</option>
                    <option value="Relatórios UNESCO">Relatórios UNESCO</option>
                    <option value="Plano Brasileiro de IA">Plano Brasileiro de IA</option>
                    <option value="Diretriz MEC">Diretriz MEC</option>
                    <option value="Fundamentação Teórica">Fundamentação Teórica</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: '0.35rem', display: 'block' }}>
                    Ano de Publicação
                  </label>
                  <input
                    type="number"
                    value={docForm.anoPublicacao}
                    onChange={(e) => setDocForm({ ...docForm, anoPublicacao: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: '0.35rem', display: 'block' }}>
                  Descrição e Síntese Pedagógica
                </label>
                <textarea
                  rows={2}
                  value={docForm.descricao}
                  onChange={(e) => setDocForm({ ...docForm, descricao: e.target.value })}
                  placeholder="Resumo dos objetivos, relevância para a matemática na EPT e artigos centrais..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>

              {/* Área de Upload de Arquivo com Drag & Drop */}
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: '0.35rem', display: 'block' }}>
                  Arquivo PDF Oficial
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  style={{
                    border: `2px dashed ${isDragging ? '#10B981' : docFile ? '#064E3B' : '#CBD5E1'}`,
                    borderRadius: '8px',
                    padding: '2rem 1.5rem',
                    textAlign: 'center',
                    background: isDragging ? '#ECFDF5' : docFile ? '#F0FDF4' : '#F8FAFC',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".pdf,application/pdf"
                    style={{ display: 'none' }}
                  />

                  {docFile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle size={32} color="#10B981" />
                      <span style={{ fontWeight: 700, color: '#064E3B', fontSize: '0.95rem' }}>
                        {docFile.name}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                        Tamanho: {(docFile.size / (1024 * 1024)).toFixed(2)} MB · Clique para alterar
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                      <Upload size={32} color="#64748B" />
                      <p style={{ fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>
                        Arraste o arquivo PDF aqui ou clique para selecionar do computador
                      </p>
                      <p style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                        Tamanho máximo recomendado: 15 MB por arquivo oficial
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Botões de Ação do Formulário */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                {docForm.id && (
                  <button type="button" onClick={handleCancelarEdicaoDoc} className="btn-secondary">
                    Cancelar
                  </button>
                )}
                <button type="submit" className="btn-primary" disabled={savingDoc} style={{ minWidth: '180px' }}>
                  <Save size={18} />
                  <span>{savingDoc ? 'Salvando...' : docForm.id ? 'Salvar Alterações' : 'Salvar Documento'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Listagem de Documentos no Acervo com Ações */}
          <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                Documentos Ativos no Acervo Oficial ({documentos.length})
              </h3>
              <button type="button" onClick={carregarDocumentos} className="btn-secondary btn-sm" style={{ gap: '0.35rem' }}>
                <RotateCcw size={14} /> Atualizar
              </button>
            </div>

            {loadingDocs ? (
              <p style={{ color: '#64748B', textAlign: 'center', padding: '2rem' }}>Carregando acervo...</p>
            ) : documentos.length === 0 ? (
              <p style={{ color: '#64748B', textAlign: 'center', padding: '2rem' }}>Nenhum documento cadastrado.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {documentos.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      flexWrap: 'wrap',
                      background: '#FAFAFA',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                        <span style={{ background: '#ECFDF5', color: '#064E3B', fontWeight: 700, fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid #A7F3D0' }}>
                          {doc.tagPrincipal || (doc.tags && doc.tags[0]) || 'Oficial'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Ano {doc.anoPublicacao}</span>
                        {doc.url && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#10B981', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}
                          >
                            <ExternalLink size={12} /> Abrir PDF
                          </a>
                        )}
                      </div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: '0 0 0.25rem' }}>{doc.titulo}</h4>
                      <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>{doc.orgaoEmissor}</p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleEditarDocumento(doc)}
                        className="btn-secondary btn-sm"
                        style={{ gap: '0.35rem' }}
                      >
                        <Edit size={14} /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluirDocumento(doc)}
                        className="btn-danger btn-sm"
                        style={{ gap: '0.35rem' }}
                      >
                        <Trash2 size={14} /> Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
           2. ABA: GESTÃO DE VÍDEOS
           ==================================================================== */}
      {activeTab === 'videos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Formulário de Novo Vídeo / Edição */}
          <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#064E3B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Video size={20} color="#064E3B" />
                {videoForm.id ? 'Editar Vídeo do Ambiente Formativo' : 'Adicionar Novo Vídeo / Palestra'}
              </h3>
              {videoForm.id && (
                <button
                  type="button"
                  onClick={handleCancelarEdicaoVideo}
                  className="btn-secondary btn-sm"
                  style={{ gap: '0.3rem' }}
                >
                  <X size={14} /> Cancelar Edição
                </button>
              )}
            </div>

            <form onSubmit={handleSalvarVideo} style={{ display: 'grid', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: '0.35rem', display: 'block' }}>
                    Título do Vídeo *
                  </label>
                  <input
                    type="text"
                    required
                    value={videoForm.titulo}
                    onChange={(e) => setVideoForm({ ...videoForm, titulo: e.target.value })}
                    placeholder="Ex: Impactos da IA na Educação Matemática"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: '0.35rem', display: 'block' }}>
                    Link ou ID do YouTube *
                  </label>
                  <input
                    type="text"
                    required
                    value={videoForm.youtubeId}
                    onChange={(e) => setVideoForm({ ...videoForm, youtubeId: e.target.value })}
                    placeholder="Ex: C9S7Ycx546c ou https://www.youtube.com/watch?v=..."
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: '0.35rem', display: 'block' }}>
                    Autor / Palestrante
                  </label>
                  <input
                    type="text"
                    value={videoForm.autor}
                    onChange={(e) => setVideoForm({ ...videoForm, autor: e.target.value })}
                    placeholder="Ex: Prof. Maycon Magalhães"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: '0.35rem', display: 'block' }}>
                    Categoria
                  </label>
                  <select
                    value={videoForm.categoria}
                    onChange={(e) => setVideoForm({ ...videoForm, categoria: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem', background: '#FFFFFF' }}
                  >
                    <option value="Fundamentos">Fundamentos</option>
                    <option value="Ética e Pensamento Crítico">Ética e Pensamento Crítico</option>
                    <option value="Metodologia e Práticas">Metodologia e Práticas</option>
                    <option value="Laboratório Prático">Laboratório Prático</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: '0.35rem', display: 'block' }}>
                    Duração Estimada
                  </label>
                  <input
                    type="text"
                    value={videoForm.duracao}
                    onChange={(e) => setVideoForm({ ...videoForm, duracao: e.target.value })}
                    placeholder="Ex: 15 min"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: '0.35rem', display: 'block' }}>
                  Descrição Resumida
                </label>
                <textarea
                  rows={2}
                  value={videoForm.descricao}
                  onChange={(e) => setVideoForm({ ...videoForm, descricao: e.target.value })}
                  placeholder="Resumo dos tópicos abordados no vídeo..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: '0.35rem', display: 'block' }}>
                  Objetivo Pedagógico
                </label>
                <input
                  type="text"
                  value={videoForm.objetivoPedagogico}
                  onChange={(e) => setVideoForm({ ...videoForm, objetivoPedagogico: e.target.value })}
                  placeholder="Ex: Promover a compreensão de vieses e limites da IA na resolução de problemas."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                />
              </div>

              {/* Pré-visualização do YouTube se houver ID válido */}
              {previewYoutubeId && (
                <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <h4 style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.75rem', fontWeight: 600 }}>
                    Pré-visualização do Player YouTube (ID: {previewYoutubeId}):
                  </h4>
                  <div style={{ maxWidth: '420px', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden' }}>
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${previewYoutubeId}`}
                      title="Preview"
                      frameBorder="0"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                {videoForm.id && (
                  <button type="button" onClick={handleCancelarEdicaoVideo} className="btn-secondary">
                    Cancelar
                  </button>
                )}
                <button type="submit" className="btn-primary" disabled={savingVideo} style={{ minWidth: '160px' }}>
                  <Save size={18} />
                  <span>{savingVideo ? 'Salvando...' : videoForm.id ? 'Salvar Alterações' : 'Salvar Vídeo'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Listagem de Vídeos Cadastrados */}
          <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                Vídeos Cadastrados no Ambiente ({videos.length})
              </h3>
              <button type="button" onClick={carregarVideos} className="btn-secondary btn-sm" style={{ gap: '0.35rem' }}>
                <RotateCcw size={14} /> Atualizar
              </button>
            </div>

            {loadingVideos ? (
              <p style={{ color: '#64748B', textAlign: 'center', padding: '2rem' }}>Carregando vídeos...</p>
            ) : videos.length === 0 ? (
              <p style={{ color: '#64748B', textAlign: 'center', padding: '2rem' }}>Nenhum vídeo cadastrado.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                {videos.map((v) => (
                  <div
                    key={v.id}
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: '#FAFAFA',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ aspectRatio: '16/9', background: '#000000', position: 'relative' }}>
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${v.youtubeId}`}
                        title={v.titulo}
                        frameBorder="0"
                        allowFullScreen
                      />
                    </div>
                    <div style={{ padding: '1rem', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.72rem', background: '#ECFDF5', color: '#064E3B', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                          {v.categoria}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{v.duracao}</span>
                      </div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.3rem' }}>{v.titulo}</h4>
                      <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>{v.autor}</p>
                    </div>
                    <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', background: '#FFFFFF' }}>
                      <button
                        type="button"
                        onClick={() => handleEditarVideo(v)}
                        className="btn-secondary btn-sm"
                        style={{ gap: '0.3rem' }}
                      >
                        <Edit size={14} /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluirVideo(v)}
                        className="btn-danger btn-sm"
                        style={{ gap: '0.3rem' }}
                      >
                        <Trash2 size={14} /> Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
           3. ABA: EMISSÃO DE CERTIFICADOS OFICIAIS EM PDF
           ==================================================================== */}
      {activeTab === 'certificados' && (
        <CertificateGenerator />
      )}
    </div>
  );
}

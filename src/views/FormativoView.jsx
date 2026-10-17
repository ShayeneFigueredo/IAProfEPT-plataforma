import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Check,
  PlayCircle,
  Lock,
  Clock,
  BookMarked,
  FileText,
  Copy,
  ExternalLink,
  Youtube,
  Video,
  List,
  Upload,
  Play,
  X,
  CheckCircle2,
  Circle,
  Sparkles,
  Info,
  Search,
  Filter,
  Tag
} from 'lucide-react';
import { TRILHAS_DATA, DOCUMENTOS_DATA, PROMPTS_EBOOK_DATA, VIDEOS_DATA } from '../data/mockData';

export default function FormativoView() {
  const [activeSubTab, setActiveSubTab] = useState('trilhas');
  const [selectedVideo, setSelectedVideo] = useState(VIDEOS_DATA[0]);

  // Estado das Trilhas e Progresso Conectado à API
  const [trilhas, setTrilhas] = useState([]);
  const [loadingTrilhas, setLoadingTrilhas] = useState(true);
  const [trilhaAberta, setTrilhaAberta] = useState(null);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);
  const [atualizandoAulaId, setAtualizandoAulaId] = useState(null);

  // Estados do Acervo de Documentos Oficiais (GET /api/formativo/documentos)
  const [documentos, setDocumentos] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [tagDocSelecionada, setTagDocSelecionada] = useState('');
  const [buscaDoc, setBuscaDoc] = useState('');

  // Estados do E-book de Prompts Estruturados (GET /api/formativo/ebook-prompts)
  const [promptsEbook, setPromptsEbook] = useState([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [categoriaPromptSelecionada, setCategoriaPromptSelecionada] = useState('');
  const [buscaPrompt, setBuscaPrompt] = useState('');
  const [promptCopiadoId, setPromptCopiadoId] = useState(null);

  // Carrega trilhas ao montar o componente
  useEffect(() => {
    carregarTrilhas();
  }, []);

  // Carrega documentos quando a aba de materiais for aberta ou filtros mudarem
  useEffect(() => {
    if (activeSubTab === 'materiais') {
      carregarDocumentos();
    }
  }, [activeSubTab, tagDocSelecionada, buscaDoc]);

  // Carrega prompts do e-book quando a aba de prompts for aberta ou filtros mudarem
  useEffect(() => {
    if (activeSubTab === 'ebook') {
      carregarPromptsEbook();
    }
  }, [activeSubTab, categoriaPromptSelecionada, buscaPrompt]);

  const carregarDocumentos = async () => {
    try {
      setLoadingDocs(true);
      const params = new URLSearchParams();
      if (tagDocSelecionada) params.append('tag', tagDocSelecionada);
      if (buscaDoc) params.append('busca', buscaDoc);

      const url = `/api/formativo/documentos${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.documentos) {
          setDocumentos(data.documentos);
          return;
        }
      }
      // Fallback gracioso
      setDocumentos(DOCUMENTOS_DATA.map((d) => ({
        id: d.id,
        titulo: d.titulo,
        tagPrincipal: d.tag,
        tags: [d.tag],
        anoPublicacao: parseInt(d.ano, 10),
        descricao: 'Documento oficial referencial para a Educação Profissional e Tecnológica.',
        orgaoEmissor: 'MEC / UNESCO / Governança Federal',
        formato: 'PDF Oficial',
        url: 'https://www.gov.br/mec/pt-br',
      })));
    } catch (e) {
      console.warn('Erro ao carregar documentos oficiais:', e);
      setDocumentos(DOCUMENTOS_DATA.map((d) => ({
        id: d.id,
        titulo: d.titulo,
        tagPrincipal: d.tag,
        tags: [d.tag],
        anoPublicacao: parseInt(d.ano, 10),
        descricao: 'Documento oficial referencial para a Educação Profissional e Tecnológica.',
        orgaoEmissor: 'MEC / UNESCO / Governança Federal',
        formato: 'PDF Oficial',
        url: 'https://www.gov.br/mec/pt-br',
      })));
    } finally {
      setLoadingDocs(false);
    }
  };

  const carregarPromptsEbook = async () => {
    try {
      setLoadingPrompts(true);
      const params = new URLSearchParams();
      if (categoriaPromptSelecionada) params.append('categoria', categoriaPromptSelecionada);
      if (buscaPrompt) params.append('busca', buscaPrompt);

      const url = `/api/formativo/ebook-prompts${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.prompts) {
          setPromptsEbook(data.prompts);
          return;
        }
      }
      // Fallback gracioso
      setPromptsEbook(PROMPTS_EBOOK_DATA);
    } catch (e) {
      console.warn('Erro ao carregar prompts do e-book:', e);
      setPromptsEbook(PROMPTS_EBOOK_DATA);
    } finally {
      setLoadingPrompts(false);
    }
  };

  const handleCopyPrompt = async (texto, promptId) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(texto);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = texto;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setPromptCopiadoId(promptId);
      setTimeout(() => setPromptCopiadoId(null), 2500);
    } catch (err) {
      console.error('Falha ao copiar prompt:', err);
    }
  };

  const carregarTrilhas = async () => {
    try {
      setLoadingTrilhas(true);
      const token = localStorage.getItem('iaprofept_access_token') || localStorage.getItem('token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/formativo/trilhas', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.trilhas && data.trilhas.length > 0) {
          setTrilhas(data.trilhas);
          return;
        }
      }
      // Fallback para mockData se backend estiver offline
      setTrilhas(TRILHAS_DATA.map((t, idx) => ({
        id: String(t.id),
        codigo: `trilha-${idx + 1}`,
        moduloNumero: idx + 1,
        titulo: t.titulo,
        descricao: t.desc,
        cargaHoraria: 40,
        duracaoEstimada: t.duracao,
        totalAulas: t.aulas,
        totalAulasConcluidas: t.progresso === 100 ? t.aulas : (t.progresso > 0 ? 3 : 0),
        percentualConclusao: t.progresso,
        status: t.status === 'concluido' ? 'concluido' : (t.status === 'em-andamento' ? 'em_andamento' : (idx === 0 ? 'disponivel' : 'bloqueado')),
      })));
    } catch (e) {
      console.warn('[Ambiente Formativo] Usando dados estáticos de fallback:', e);
      setTrilhas(TRILHAS_DATA.map((t, idx) => ({
        id: String(t.id),
        codigo: `trilha-${idx + 1}`,
        moduloNumero: idx + 1,
        titulo: t.titulo,
        descricao: t.desc,
        cargaHoraria: 40,
        duracaoEstimada: t.duracao,
        totalAulas: t.aulas,
        totalAulasConcluidas: t.progresso === 100 ? t.aulas : 0,
        percentualConclusao: t.progresso,
        status: t.status === 'concluido' ? 'concluido' : (idx === 0 ? 'disponivel' : 'bloqueado'),
      })));
    } finally {
      setLoadingTrilhas(false);
    }
  };

  const handleAbrirTrilha = async (trilha) => {
    if (trilha.status === 'bloqueado') return;
    try {
      setLoadingDetalhes(true);
      const token = localStorage.getItem('iaprofept_access_token') || localStorage.getItem('token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/formativo/trilhas/${trilha.codigo || trilha.id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setTrilhaAberta(data.trilha);
      } else {
        setTrilhaAberta(trilha);
      }
    } catch (e) {
      console.warn('Erro ao carregar detalhes da trilha:', e);
      setTrilhaAberta(trilha);
    } finally {
      setLoadingDetalhes(false);
    }
  };

  const handleToggleAula = async (trilhaIdOuCodigo, aulaId, atualConcluida) => {
    const novaConcluida = !atualConcluida;
    setAtualizandoAulaId(aulaId);

    try {
      const token = localStorage.getItem('iaprofept_access_token') || localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/formativo/progresso', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          trilhaId: trilhaIdOuCodigo,
          aulaId,
          concluido: novaConcluida,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const prog = data.progresso;

        // Atualiza estado local da trilha aberta
        if (trilhaAberta) {
          setTrilhaAberta((prev) => ({
            ...prev,
            percentualConclusao: prog.percentualConclusao,
            totalAulasConcluidas: prog.totalAulasConcluidas,
            status: prog.status,
            aulas: (prev.aulas || []).map((a) =>
              a.id === aulaId ? { ...a, concluida: novaConcluida } : a
            ),
          }));
        }

        // Atualiza na listagem principal
        setTrilhas((prev) =>
          prev.map((t) => {
            if (t.id === prog.trilhaId || t.codigo === prog.trilhaCodigo) {
              return {
                ...t,
                percentualConclusao: prog.percentualConclusao,
                totalAulasConcluidas: prog.totalAulasConcluidas,
                status: prog.status,
              };
            }
            return t;
          })
        );
      } else {
        // Fallback otimista se offline ou sem auth
        if (trilhaAberta) {
          setTrilhaAberta((prev) => {
            const novasAulas = (prev.aulas || []).map((a) =>
              a.id === aulaId ? { ...a, concluida: novaConcluida } : a
            );
            const totalC = novasAulas.filter((a) => a.concluida).length;
            const novoP = Math.min(100, Math.round((totalC / Math.max(1, novasAulas.length)) * 100));
            return {
              ...prev,
              totalAulasConcluidas: totalC,
              percentualConclusao: novoP,
              status: novoP >= 100 ? 'concluido' : 'em_andamento',
              aulas: novasAulas,
            };
          });
        }
      }
    } catch (e) {
      console.warn('Erro ao atualizar progresso da aula:', e);
    } finally {
      setAtualizandoAulaId(null);
    }
  };

  return (
    <section className="formativo-view-container">
      {/* Cabeçalho do Ambiente Formativo */}
      <div className="formativo-page-header">
        <div className="formativo-micro-pill">
          <BookOpen size={14} /> FORMAÇÃO CONTINUADA
        </div>
        <h1 className="formativo-main-heading">Ambiente Formativo</h1>
        <p className="formativo-main-subtitle">
          Trilhas de aprendizagem, materiais orientadores e um e-book de prompts para a sua prática docente em Matemática.
        </p>
      </div>

      {/* Pílulas de Sub-Navegação */}
      <div className="subnav-scroll-wrapper">
        <div className="subnav-pill-container" role="tablist" aria-label="Seções do Ambiente Formativo">
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'trilhas'}
            className={`subnav-pill-btn ${activeSubTab === 'trilhas' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('trilhas')}
          >
            <BookOpen size={14} />
            <span>Trilhas</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'videos'}
            className={`subnav-pill-btn ${activeSubTab === 'videos' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('videos')}
          >
            <Video size={14} />
            <span>Vídeos</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'materiais'}
            className={`subnav-pill-btn ${activeSubTab === 'materiais' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('materiais')}
          >
            <FileText size={14} />
            <span>Materiais & Legislação</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'ebook'}
            className={`subnav-pill-btn ${activeSubTab === 'ebook' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('ebook')}
          >
            <BookMarked size={14} />
            <span>E-book de Prompts</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
           1. ABA: TRILHAS DE APRENDIZAGEM DINÂMICAS COM PERSISTÊNCIA NO POSTGRESQL
           ==================================================================== */}
      {activeSubTab === 'trilhas' && (
        <div className="trilhas-vertical-list">
          {trilhas.map((trilha, index) => {
            const isDone = trilha.status === 'concluido' || trilha.percentualConclusao >= 100;
            const isInProgress = trilha.status === 'em_andamento' || (trilha.percentualConclusao > 0 && !isDone);
            const isLocked = trilha.status === 'bloqueado';
            const moduloNum = trilha.moduloNumero || index + 1;

            return (
              <div
                key={trilha.id || index}
                className={`trilha-row-card ${isLocked ? 'locked-card' : ''}`}
                style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
                onClick={() => !isLocked && handleAbrirTrilha(trilha)}
              >
                <div className="trilha-card-left">
                  {/* Caixa de Status / Número */}
                  <div
                    className={`status-box ${
                      isDone ? 'done' : isInProgress ? 'in-progress' : isLocked ? 'locked' : 'available'
                    }`}
                    style={
                      !isDone && !isInProgress && !isLocked
                        ? { background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1' }
                        : {}
                    }
                  >
                    {isDone ? (
                      <Check size={22} strokeWidth={3} />
                    ) : (
                      <span>{moduloNum}</span>
                    )}
                  </div>

                  {/* Informações da Trilha */}
                  <div className="trilha-info-block">
                    <div className="trilha-title-line">
                      <h3 className={isLocked ? 'locked-text' : ''}>
                        Módulo {moduloNum} · {trilha.titulo}
                      </h3>

                      {isDone && (
                        <span className="badge-status-pill done">✓ Concluído</span>
                      )}
                      {isInProgress && (
                        <span className="badge-status-pill in-progress">
                          Em andamento ({trilha.percentualConclusao}%)
                        </span>
                      )}
                      {!isDone && !isInProgress && !isLocked && (
                        <span
                          className="badge-status-pill"
                          style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1' }}
                        >
                          Disponível
                        </span>
                      )}
                      {isLocked && (
                        <span
                          className="badge-status-pill"
                          style={{ background: '#F8FAFC', color: '#94A3B8', border: '1px solid #E2E8F0' }}
                        >
                          Bloqueado
                        </span>
                      )}
                    </div>

                    <p className={`trilha-desc-text ${isLocked ? 'locked-text' : ''}`}>
                      {trilha.descricao}
                    </p>

                    <div className={`trilha-meta-line ${isLocked ? 'locked-text' : ''}`}>
                      <span>
                        <Clock size={14} /> {trilha.totalAulas} aulas
                      </span>
                      <span>
                        <Clock size={14} /> {trilha.duracaoEstimada || `${trilha.cargaHoraria}h`}
                      </span>

                      {!isLocked && (
                        <div
                          className="mini-progress-track"
                          title={`${trilha.totalAulasConcluidas || 0} de ${trilha.totalAulas} aulas concluídas (${trilha.percentualConclusao || 0}%)`}
                        >
                          <div
                            className="mini-progress-fill"
                            style={{
                              width: `${Math.min(100, trilha.percentualConclusao || 0)}%`,
                              background: isDone ? '#064E3B' : '#10B981',
                            }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botão de Ação */}
                {isLocked ? (
                  <button className="btn-trilha-action disabled" disabled>
                    <Lock size={15} />
                    <span>Bloqueado</span>
                  </button>
                ) : (
                  <button
                    className="btn-trilha-action primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAbrirTrilha(trilha);
                    }}
                  >
                    <PlayCircle size={16} />
                    <span>{isDone ? 'Revisar' : isInProgress ? 'Continuar' : 'Iniciar'}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ====================================================================
           MODAL DE DETALHES DA TRILHA E CHECKLIST DE AULAS (POST /api/formativo/progresso)
           ==================================================================== */}
      {trilhaAberta && (
        <div className="auth-modal-backdrop" onClick={() => setTrilhaAberta(null)}>
          <div
            className="auth-modal-card"
            style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal */}
            <div className="auth-modal-header">
              <div className="auth-modal-header-left">
                <div className="auth-modal-icon-box" style={{ background: '#ECFDF5', color: '#065F46' }}>
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="auth-modal-title">
                    Módulo {trilhaAberta.moduloNumero || trilhaAberta.ordem} · {trilhaAberta.titulo}
                  </h3>
                  <p className="auth-modal-sub">
                    {trilhaAberta.totalAulasConcluidas || 0} de {trilhaAberta.totalAulas || (trilhaAberta.aulas?.length || 0)} aulas concluídas ({trilhaAberta.percentualConclusao || 0}%)
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="auth-modal-close-btn"
                onClick={() => setTrilhaAberta(null)}
                aria-label="Fechar modal de trilha"
              >
                <X size={18} />
              </button>
            </div>

            {/* Barra de Progresso em Destaque */}
            <div style={{ padding: '0 1.5rem', marginTop: '1rem' }}>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  background: '#E2E8F0',
                  borderRadius: '999px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, trilhaAberta.percentualConclusao || 0)}%`,
                    background: trilhaAberta.percentualConclusao >= 100 ? '#064E3B' : '#10B981',
                    transition: 'width 0.3s ease',
                  }}
                ></div>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.75rem', lineHeight: '1.5' }}>
                {trilhaAberta.descricao}
              </p>
            </div>

            {/* Lista das Aulas */}
            <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.25rem' }}>
                Aulas e Conteúdos do Módulo
              </h4>

              {loadingDetalhes ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                  Carregando aulas e vídeos do módulo...
                </div>
              ) : (trilhaAberta.aulas || []).map((aula, i) => {
                const isConcluida = !!aula.concluida;
                const isUpdating = atualizandoAulaId === aula.id;

                return (
                  <div
                    key={aula.id || i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      padding: '1rem',
                      background: isConcluida ? '#F0FDF4' : '#F8FAFC',
                      border: `1px solid ${isConcluida ? '#BBF7D0' : '#E2E8F0'}`,
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.85rem', flex: 1 }}>
                      <button
                        type="button"
                        onClick={() => handleToggleAula(trilhaAberta.codigo || trilhaAberta.id, aula.id, isConcluida)}
                        disabled={isUpdating}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.2rem',
                          color: isConcluida ? '#16A34A' : '#94A3B8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title={isConcluida ? 'Marcar como não concluída' : 'Marcar como concluída'}
                      >
                        {isConcluida ? (
                          <CheckCircle2 size={22} fill="#DCFCE7" />
                        ) : (
                          <Circle size={22} />
                        )}
                      </button>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#065F46', background: '#ECFDF5', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                            Aula {aula.ordem || i + 1}
                          </span>
                          <h5 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                            {aula.titulo}
                          </h5>
                        </div>

                        <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0.4rem 0 0.5rem 0', lineHeight: '1.45' }}>
                          {aula.descricao || aula.objetivoPedagogico}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: '#94A3B8', flexWrap: 'wrap' }}>
                          <span><Clock size={13} /> {aula.duracaoMinutos ? `${aula.duracaoMinutos} min` : '10 min'}</span>
                          {aula.youtubeId && (
                            <a
                              href={`https://www.youtube.com/watch?v=${aula.youtubeId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#DC2626', textDecoration: 'none', fontWeight: '600' }}
                            >
                              <Youtube size={14} /> Vídeo no YouTube <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleAula(trilhaAberta.codigo || trilhaAberta.id, aula.id, isConcluida)}
                      disabled={isUpdating}
                      style={{
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        border: isConcluida ? '1px solid #86EFAC' : '1px solid #CBD5E1',
                        background: isConcluida ? '#DCFCE7' : 'white',
                        color: isConcluida ? '#166534' : '#475569',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isUpdating ? 'Salvando...' : isConcluida ? '✓ Concluída' : 'Concluir'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Alerta Ético Obrigatório no Rodapé do Modal */}
            <div style={{ padding: '1rem 1.5rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', fontSize: '0.78rem', color: '#065F46' }}>
                <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Aviso Ético:</strong> Este material e seus vídeos integram a pesquisa de Doutorado em Educação Matemática (PPGEM/UFJF). Seu progresso é persistido no PostgreSQL para possibilitar a retomada contínua entre sessões.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
           2. ABA: VÍDEOS
           ==================================================================== */}
      {activeSubTab === 'videos' && (
        <div className="videos-tab-container">
          <div className="videos-section-header">
            <div className="videos-header-left">
              <Video size={20} className="icon-video-green" />
              <h2>Vídeos do ambiente formativo</h2>
              <span className="videos-count-badge">1 vídeo</span>
            </div>
            <button className="btn-add-video" onClick={() => alert('Abrir modal para adicionar vídeo')}>
              <Upload size={16} />
              <span>Adicionar vídeo</span>
            </button>
          </div>

          <div className="videos-main-grid">
            <div className="video-player-card">
              <div className="video-iframe-container">
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=0&rel=0&enablejsapi=1`}
                  title={selectedVideo.titulo}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
              <div className="video-details-footer">
                <div className="video-meta-tags-line">
                  <span className="badge-video-cat">{selectedVideo.categoria}</span>
                  <span className="video-author-text">{selectedVideo.autor}</span>
                </div>
                <h3 className="video-current-title">{selectedVideo.titulo}</h3>
                <p className="video-current-desc">{selectedVideo.descricao}</p>
                <div className="video-player-actions">
                  <a
                    href={`https://www.youtube.com/watch?v=${selectedVideo.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-open-youtube"
                  >
                    <Youtube size={16} color="#DC2626" />
                    <span>Assistir no YouTube</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>

            <div className="video-playlist-card">
              <div className="playlist-header">
                <List size={16} />
                <span>Lista de reprodução</span>
              </div>
              <div className="playlist-items-list">
                {VIDEOS_DATA.map((v) => {
                  const isPlaying = selectedVideo.id === v.id;
                  return (
                    <div
                      key={v.id}
                      className={`playlist-item-row ${isPlaying ? 'active' : ''}`}
                      onClick={() => setSelectedVideo(v)}
                    >
                      <div className="playlist-item-thumb">
                        <div className="thumb-placeholder-overlay">
                          <Play size={14} fill="currentColor" />
                        </div>
                      </div>
                      <div className="playlist-item-info">
                        <h4>{v.titulo}</h4>
                        <div className="playlist-item-submeta">
                          <span>{v.autor}</span>
                          {isPlaying && (
                            <span className="playing-indicator">
                              <span className="dot-live"></span> tocando
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
           3. ABA: MATERIAIS & LEGISLAÇÃO (GET /api/formativo/documentos)
           ==================================================================== */}
      {activeSubTab === 'materiais' && (
        <div className="formativo-tab-content">
          {/* Barra de Filtros e Busca de Documentos */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={20} color="#064E3B" />
                  Acervo de Documentos Oficiais & Legislação da EPT
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.2rem' }}>
                  Marcos regulatórios, diretrizes curriculares do MEC/SETEC, relatórios globais da UNESCO e políticas de IA.
                </p>
              </div>

              {/* Campo de Busca Rápida */}
              <div style={{ position: 'relative', minWidth: '260px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Buscar no acervo..."
                  value={buscaDoc}
                  onChange={(e) => setBuscaDoc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.85rem 0.45rem 2.1rem',
                    fontSize: '0.85rem',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    outline: 'none',
                    background: '#FFFFFF',
                  }}
                />
              </div>
            </div>

            {/* Pílulas de Filtro por Tags Canônicas */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Filter size={13} /> Filtrar por:
              </span>
              {[
                { label: 'Todos os Documentos', val: '' },
                { label: 'Legislação EPT', val: 'Legislacao EPT' },
                { label: 'Relatórios UNESCO', val: 'Relatorios UNESCO' },
                { label: 'Plano Brasileiro de IA', val: 'Plano Brasileiro de IA' },
              ].map((f) => {
                const ativo = tagDocSelecionada === f.val;
                return (
                  <button
                    key={f.val}
                    type="button"
                    onClick={() => setTagDocSelecionada(f.val)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.8rem',
                      fontWeight: ativo ? '700' : '500',
                      borderRadius: '999px',
                      cursor: 'pointer',
                      border: ativo ? '1px solid #064E3B' : '1px solid #E2E8F0',
                      background: ativo ? '#064E3B' : '#F8FAFC',
                      color: ativo ? '#FFFFFF' : '#475569',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Listagem de Documentos */}
          {loadingDocs ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
              Carregando documentos oficiais do acervo...
            </div>
          ) : documentos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
              <FileText size={32} color="#94A3B8" style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ color: '#475569', fontWeight: '600' }}>Nenhum documento encontrado com os filtros aplicados.</p>
              <button
                type="button"
                onClick={() => {
                  setTagDocSelecionada('');
                  setBuscaDoc('');
                }}
                style={{
                  marginTop: '0.75rem',
                  padding: '0.4rem 0.9rem',
                  fontSize: '0.8rem',
                  background: '#064E3B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="docs-vertical-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {documentos.map((d) => (
                <div
                  key={d.id}
                  className="doc-row-card"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    transition: 'box-shadow 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', flex: 1 }}>
                      <div
                        className="doc-icon-box"
                        style={{
                          background: '#ECFDF5',
                          color: '#065F46',
                          padding: '0.75rem',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <FileText size={22} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                          <span
                            style={{
                              background: '#F1F5F9',
                              color: '#065F46',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              border: '1px solid #CBD5E1',
                            }}
                          >
                            {d.tagPrincipal || (d.tags && d.tags[0]) || 'Oficial EPT'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                            Ano {d.anoPublicacao}
                          </span>
                          {d.formato && (
                            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                              • {d.formato} {d.paginas ? `(${d.paginas} págs)` : ''}
                            </span>
                          )}
                        </div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0F172A', margin: '0 0 0.35rem' }}>
                          {d.titulo}
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.5', margin: '0 0 0.5rem' }}>
                          {d.descricao}
                        </p>
                        {d.orgaoEmissor && (
                          <span style={{ fontSize: '0.75rem', color: '#64748B', fontStyle: 'italic' }}>
                            Órgão Emissor: {d.orgaoEmissor}
                          </span>
                        )}
                      </div>
                    </div>

                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-doc-access"
                      style={{
                        padding: '0.55rem 1rem',
                        fontSize: '0.82rem',
                        fontWeight: '600',
                        background: '#064E3B',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        textDecoration: 'none',
                        alignSelf: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span>Acessar Documento</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Alerta Ético Obrigatório PPGEM / UFJF */}
          <div style={{ marginTop: '2rem', padding: '1rem 1.25rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', fontSize: '0.8rem', color: '#064E3B' }}>
              <Info size={16} style={{ flexShrink: 0 }} />
              <span>
                <strong>Aviso de Governança Docente:</strong> Os documentos oficiais reunidos no acervo da Plataforma IAprofEPT subsidiam o planejamento pedagógico crítico e a contextualização curricular na Educação Profissional e Tecnológica.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
           4. ABA: IAS & E-BOOK DE PROMPTS (GET /api/formativo/ebook-prompts)
           ==================================================================== */}
      {activeSubTab === 'ebook' && (
        <div className="formativo-tab-content">
          {/* Cabeçalho e Filtros do E-book de Prompts */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BookMarked size={20} color="#064E3B" />
                  E-book de Modelos Estruturados de Prompts para Educação Matemática
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.2rem' }}>
                  Templates parametrizados para planejamento de aulas, metodologias ativas, contextualização BNCC x CNCT e avaliação formativa.
                </p>
              </div>

              {/* Campo de Busca de Prompts */}
              <div style={{ position: 'relative', minWidth: '260px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Buscar modelo de prompt..."
                  value={buscaPrompt}
                  onChange={(e) => setBuscaPrompt(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.85rem 0.45rem 2.1rem',
                    fontSize: '0.85rem',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    outline: 'none',
                    background: '#FFFFFF',
                  }}
                />
              </div>
            </div>

            {/* Pílulas de Categorias de Prompts */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Tag size={13} /> Categoria:
              </span>
              {[
                { label: 'Todos os Modelos', val: '' },
                { label: 'Diagnóstico', val: 'Diagnóstico' },
                { label: 'Contextualização', val: 'Contextualização' },
                { label: 'Metodologia Ativa', val: 'Metodologia Ativa' },
                { label: 'Feedback', val: 'Feedback' },
                { label: 'Sequência Didática', val: 'Sequência Didática' },
                { label: 'Modelagem APL', val: 'Modelagem Matemática' },
                { label: 'Avaliação Formativa', val: 'Avaliação Formativa' },
              ].map((c) => {
                const ativo = categoriaPromptSelecionada === c.val;
                return (
                  <button
                    key={c.val}
                    type="button"
                    onClick={() => setCategoriaPromptSelecionada(c.val)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.8rem',
                      fontWeight: ativo ? '700' : '500',
                      borderRadius: '999px',
                      cursor: 'pointer',
                      border: ativo ? '1px solid #064E3B' : '1px solid #E2E8F0',
                      background: ativo ? '#064E3B' : '#F8FAFC',
                      color: ativo ? '#FFFFFF' : '#475569',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid de Modelos Estruturados */}
          {loadingPrompts ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>
              Carregando modelos estruturados de prompts...
            </div>
          ) : promptsEbook.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
              <BookMarked size={32} color="#94A3B8" style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ color: '#475569', fontWeight: '600' }}>Nenhum modelo de prompt encontrado com os critérios.</p>
              <button
                type="button"
                onClick={() => {
                  setCategoriaPromptSelecionada('');
                  setBuscaPrompt('');
                }}
                style={{
                  marginTop: '0.75rem',
                  padding: '0.4rem 0.9rem',
                  fontSize: '0.8rem',
                  background: '#064E3B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="prompts-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
              {promptsEbook.map((p) => {
                const foiCopiado = promptCopiadoId === p.id;
                return (
                  <div
                    key={p.id}
                    className="prompt-ebook-card"
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div>
                      {/* Topo do Card: Categoria e Botão de Copiar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <span
                            className="prompt-category-badge"
                            style={{
                              background: '#ECFDF5',
                              color: '#065F46',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '4px',
                              border: '1px solid #A7F3D0',
                            }}
                          >
                            {p.categoria}
                          </span>
                          {p.codigo && (
                            <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: '600' }}>
                              #{p.codigo}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          className="btn-copy-prompt"
                          onClick={() => handleCopyPrompt(p.template, p.id)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            border: foiCopiado ? '1px solid #86EFAC' : '1px solid #CBD5E1',
                            background: foiCopiado ? '#DCFCE7' : '#FFFFFF',
                            color: foiCopiado ? '#166534' : '#475569',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {foiCopiado ? (
                            <>
                              <Check size={13} color="#166534" />
                              <span>Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span>Copiar Modelo</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Título e Descrição */}
                      <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A', margin: '0 0 0.5rem' }}>
                        {p.titulo}
                      </h4>
                      <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: '1.45', margin: '0 0 0.85rem' }}>
                        {p.descricao}
                      </p>

                      {/* Snippet do Template Monoespaçado */}
                      <div
                        className="prompt-code-snippet"
                        style={{
                          background: '#0F172A',
                          color: '#F8FAFC',
                          padding: '0.85rem',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontFamily: 'Consolas, Monaco, monospace',
                          lineHeight: '1.5',
                          whiteSpace: 'pre-wrap',
                          maxHeight: '140px',
                          overflowY: 'auto',
                          marginBottom: '0.85rem',
                          border: '1px solid #334155',
                        }}
                      >
                        {p.template}
                      </div>

                      {/* Dica Docente */}
                      {p.dicaDocente && (
                        <div
                          style={{
                            background: '#F0FDF4',
                            borderLeft: '3px solid #10B981',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            color: '#065F46',
                            marginBottom: '0.75rem',
                            lineHeight: '1.4',
                          }}
                        >
                          <strong>Dica Docente:</strong> {p.dicaDocente}
                        </div>
                      )}
                    </div>

                    {/* Rodapé com Eixos Recomendados */}
                    {p.eixosRecomendados && p.eixosRecomendados.length > 0 && (
                      <div style={{ paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9', display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Eixos:</span>
                        {p.eixosRecomendados.map((eixo, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '0.68rem',
                              color: '#64748B',
                              background: '#F8FAFC',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              border: '1px solid #E2E8F0',
                            }}
                          >
                            {eixo}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Alerta Ético Obrigatório PPGEM / UFJF */}
          <div style={{ marginTop: '2rem', padding: '1rem 1.25rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', fontSize: '0.8rem', color: '#064E3B' }}>
              <Info size={16} style={{ flexShrink: 0 }} />
              <span>
                <strong>Aviso Ético Obrigatório:</strong> Este material foi gerado por Inteligência Artificial e deve ser revisado, validado e adaptado pela autoridade docente antes de sua aplicação em sala de aula.
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

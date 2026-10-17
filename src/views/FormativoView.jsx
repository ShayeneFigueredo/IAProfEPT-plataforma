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
  Info
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

  // Carrega trilhas ao montar o componente
  useEffect(() => {
    carregarTrilhas();
  }, []);

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

  const handleCopyPrompt = (template) => {
    navigator.clipboard.writeText(template);
    alert('Prompt copiado para a área de transferência!');
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
           3. ABA: MATERIAIS & LEGISLAÇÃO
           ==================================================================== */}
      {activeSubTab === 'materiais' && (
        <div className="formativo-tab-content">
          <div className="docs-vertical-list">
            {DOCUMENTOS_DATA.map((d) => (
              <div key={d.id} className="doc-row-card">
                <div className="doc-row-left">
                  <div className="doc-icon-box">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4>{d.titulo}</h4>
                    <span className="doc-tag-meta">{d.tag} • Ano {d.ano}</span>
                  </div>
                </div>
                <button className="btn-doc-access" onClick={() => alert(`Acessando documento: ${d.titulo}`)}>
                  <span>Acessar</span>
                  <ExternalLink size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
           4. ABA: IAS & E-BOOK DE PROMPTS
           ==================================================================== */}
      {activeSubTab === 'ebook' && (
        <div className="formativo-tab-content">
          <div className="prompts-cards-grid">
            {PROMPTS_EBOOK_DATA.map((p) => (
              <div key={p.id} className="prompt-ebook-card">
                <div className="prompt-card-header">
                  <span className="prompt-category-badge">{p.categoria}</span>
                  <button className="btn-copy-prompt" onClick={() => handleCopyPrompt(p.template)}>
                    <Copy size={13} /> Copiar
                  </button>
                </div>
                <h4>{p.titulo}</h4>
                <div className="prompt-code-snippet">{p.template}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

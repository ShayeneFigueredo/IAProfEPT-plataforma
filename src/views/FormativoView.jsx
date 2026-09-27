import React, { useState } from 'react';
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
  Sparkles,
  Youtube,
  Video,
  List,
  Upload,
  Play
} from 'lucide-react';
import { TRILHAS_DATA, DOCUMENTOS_DATA, PROMPTS_EBOOK_DATA, VIDEOS_DATA } from '../data/mockData';

export default function FormativoView() {
  const [activeSubTab, setActiveSubTab] = useState('trilhas');
  const [selectedVideo, setSelectedVideo] = useState(VIDEOS_DATA[0]);

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

      {/* Pílulas de Sub-Navegação (Sub-tabs) */}
      <div className="subnav-pill-container">
        <button
          className={`subnav-pill-btn ${activeSubTab === 'trilhas' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('trilhas')}
        >
          Trilhas
        </button>
        <button
          className={`subnav-pill-btn ${activeSubTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('videos')}
        >
          Vídeos
        </button>
        <button
          className={`subnav-pill-btn ${activeSubTab === 'materiais' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('materiais')}
        >
          Materiais & legislação
        </button>
        <button
          className={`subnav-pill-btn ${activeSubTab === 'ebook' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('ebook')}
        >
          IAs & E-book de prompts
        </button>
      </div>

      {/* ====================================================================
           1. ABA: TRILHAS DE APRENDIZAGEM (IDÊNTICA À IMAGEM)
           ==================================================================== */}
      {activeSubTab === 'trilhas' && (
        <div className="trilhas-vertical-list">
          
          {/* Módulo 1 */}
          <div className="trilha-row-card">
            <div className="trilha-card-left">
              <div className="status-box done">
                <Check size={22} strokeWidth={3} />
              </div>
              <div className="trilha-info-block">
                <div className="trilha-title-line">
                  <h3>Módulo 1 · Fundamentos da Inteligência Artificial</h3>
                  <span className="badge-status-pill done">✓ Concluído</span>
                </div>
                <p className="trilha-desc-text">
                  O que é IA, machine learning e IA generativa — conceitos essenciais para o docente.
                </p>
                <div className="trilha-meta-line">
                  <span><Clock size={14} /> 6 aulas</span>
                  <span><Clock size={14} /> 48 min</span>
                  <div className="mini-progress-track">
                    <div className="mini-progress-fill" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            <button className="btn-trilha-action primary" onClick={() => alert('Abrindo revisão do Módulo 1...')}>
              <PlayCircle size={16} />
              <span>Revisar</span>
            </button>
          </div>

          {/* Módulo 2 */}
          <div className="trilha-row-card">
            <div className="trilha-card-left">
              <div className="status-box in-progress">
                <span>2</span>
              </div>
              <div className="trilha-info-block">
                <div className="trilha-title-line">
                  <h3>Módulo 2 · Ética no Uso de IA na Educação</h3>
                  <span className="badge-status-pill in-progress">Em andamento</span>
                </div>
                <p className="trilha-desc-text">
                  Vieses, privacidade, autoria e os limites éticos do uso de IA em sala de aula.
                </p>
                <div className="trilha-meta-line">
                  <span><Clock size={14} /> 5 aulas</span>
                  <span><Clock size={14} /> 52 min</span>
                  <div className="mini-progress-track">
                    <div className="mini-progress-fill" style={{ width: '50%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            <button className="btn-trilha-action primary" onClick={() => alert('Continuando Módulo 2...')}>
              <PlayCircle size={16} />
              <span>Continuar</span>
            </button>
          </div>

          {/* Módulo 3 */}
          <div className="trilha-row-card locked-card">
            <div className="trilha-card-left">
              <div className="status-box locked">
                <span>3</span>
              </div>
              <div className="trilha-info-block">
                <div className="trilha-title-line">
                  <h3 className="locked-text">Módulo 3 · Possibilidades Didáticas com Ferramentas Generativas</h3>
                </div>
                <p className="trilha-desc-text locked-text">
                  Estratégias práticas de uso de IA Gen no ensino de Matemática na EPT.
                </p>
                <div className="trilha-meta-line locked-text">
                  <span><Clock size={14} /> 7 aulas</span>
                  <span><Clock size={14} /> 64 min</span>
                </div>
              </div>
            </div>
            <button className="btn-trilha-action disabled" disabled>
              <Lock size={15} />
              <span>Bloqueado</span>
            </button>
          </div>

          {/* Módulo 4 */}
          <div className="trilha-row-card locked-card">
            <div className="trilha-card-left">
              <div className="status-box locked">
                <span>4</span>
              </div>
              <div className="trilha-info-block">
                <div className="trilha-title-line">
                  <h3 className="locked-text">Módulo 4 · Estudos de Caso sobre o Uso de IA na EPT</h3>
                </div>
                <p className="trilha-desc-text locked-text">
                  Casos reais comentados de integração entre Matemática, IA e cursos técnicos.
                </p>
                <div className="trilha-meta-line locked-text">
                  <span><Clock size={14} /> 4 aulas</span>
                  <span><Clock size={14} /> 40 min</span>
                </div>
              </div>
            </div>
            <button className="btn-trilha-action disabled" disabled>
              <Lock size={15} />
              <span>Bloqueado</span>
            </button>
          </div>

        </div>
      )}

      {/* ====================================================================
           2. ABA: VÍDEOS (IDÊNTICA À FIGURA 10)
           ==================================================================== */}
      {activeSubTab === 'videos' && (
        <div className="videos-tab-container">
          {/* Barra Superior da Seção de Vídeos */}
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

          {/* Grid Principal: Player na esquerda e Playlist na direita */}
          <div className="videos-main-grid">
            {/* Coluna Esquerda: Player e Detalhes */}
            <div className="video-player-card">
              <div className="video-iframe-container">
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=0&rel=0`}
                  title={selectedVideo.titulo}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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
              </div>
            </div>

            {/* Coluna Direita: Lista de Reprodução */}
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
                <div className="prompt-code-snippet">
                  {p.template}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </section>
  );
}

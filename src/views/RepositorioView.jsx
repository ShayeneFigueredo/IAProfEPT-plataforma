import React, { useState } from 'react';
import { FolderGit2, Filter, Heart, Eye, Printer, Upload } from 'lucide-react';
import { PRATICAS_DATA } from '../data/mockData';

export default function RepositorioView() {
  const [filtroCurso, setFiltroCurso] = useState('Todos');
  const cursos = ['Todos', 'Informática', 'Agropecuária', 'Enfermagem', 'Administração'];

  const filtradas = filtroCurso === 'Todos'
    ? PRATICAS_DATA
    : PRATICAS_DATA.filter(p => p.curso.toLowerCase().includes(filtroCurso.toLowerCase()));

  return (
    <section className="repo-view-container">
      {/* Cabeçalho do Repositório */}
      <div className="repo-header-card">
        <div className="repo-header-left">
          <h2 className="repo-title">
            <FolderGit2 size={24} /> Repositório de Práticas Docentes
          </h2>
          <p className="repo-subtitle">
            Curadoria colaborativa de sequências didáticas e atividades validadas por professores da Rede Federal.
          </p>
        </div>
        <button
          type="button"
          className="btn-repo-share"
          onClick={() => alert('Em breve: submissão de práticas pelos docentes.')}
        >
          <Upload size={16} />
          <span>Compartilhar Minha Prática</span>
        </button>
      </div>

      {/* Barra de Filtros com Scroll Horizontal Suave */}
      <div className="repo-filters-wrapper">
        <span className="repo-filters-label">
          <Filter size={14} /> Cursos:
        </span>
        <div className="repo-filters-chips-row">
          {cursos.map(c => (
            <button
              key={c}
              type="button"
              className={`repo-filter-chip ${filtroCurso === c ? 'active' : ''}`}
              onClick={() => setFiltroCurso(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Cards de Práticas */}
      <div className="repo-cards-grid">
        {filtradas.map(p => (
          <div key={p.id} className="repo-practice-card">
            <div>
              <div className="repo-card-top-tags">
                <span className="repo-badge-course">{p.curso}</span>
                <span className="repo-badge-bncc">{p.habilidadeBNCC}</span>
              </div>
              <h3 className="repo-card-item-title">{p.titulo}</h3>
              <p className="repo-card-item-desc">{p.resumo}</p>
            </div>

            <div className="repo-card-footer">
              <div className="repo-card-meta-row">
                <span className="repo-card-author">{p.autor}</span>
                <span className="repo-card-likes">
                  <Heart size={13} fill="#DC2626" /> {p.likes}
                </span>
              </div>
              <div className="repo-card-actions-row">
                <button
                  type="button"
                  className="btn-repo-details"
                  onClick={() => alert(`Visualizando prática: ${p.titulo}`)}
                >
                  <Eye size={14} />
                  <span>Detalhes</span>
                </button>
                <button
                  type="button"
                  className="btn-repo-print"
                  onClick={() => window.print()}
                  title="Imprimir prática"
                  aria-label="Imprimir prática"
                >
                  <Printer size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

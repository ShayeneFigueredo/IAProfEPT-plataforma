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
    <section>
      <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.75rem 2rem', marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-green)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FolderGit2 size={24} /> Repositório de Práticas Docentes
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.25rem' }}>
            Curadoria colaborativa de sequências didáticas e atividades validadas por professores da Rede Federal.
          </p>
        </div>
        <button onClick={() => alert('Em breve: submissão de práticas pelos docentes.')} style={{ background: 'var(--primary-green)', color: 'white', border: 'none', padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-sm)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Upload size={16} /> Compartilhar Minha Prática
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Filter size={14} /> Cursos:
        </span>
        {cursos.map(c => (
          <button
            key={c}
            onClick={() => setFiltroCurso(c)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${filtroCurso === c ? 'var(--primary-green)' : 'var(--border-color)'}`,
              background: filtroCurso === c ? 'var(--primary-green)' : 'white',
              color: filtroCurso === c ? 'white' : 'var(--text-main)'
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {filtradas.map(p => (
          <div key={p.id} style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ padding: '0.25rem 0.55rem', background: 'var(--tint-lab)', color: 'var(--color-lab)', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem', fontWeight: 700 }}>{p.curso}</span>
                <span style={{ padding: '0.25rem 0.55rem', background: 'var(--tint-formativo)', color: 'var(--color-formativo)', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem', fontWeight: 700 }}>{p.habilidadeBNCC}</span>
              </div>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--primary-green)', marginBottom: '0.5rem' }}>{p.titulo}</h3>
              <p style={{ fontSize: '0.835rem', color: 'var(--text-muted)' }}>{p.resumo}</p>
            </div>

            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '0.75rem' }}>
                <span>{p.autor}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#DC2626' }}>
                  <Heart size={13} fill="#DC2626" /> {p.likes}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => alert(`Visualizando prática: ${p.titulo}`)} style={{ flex: 1, padding: '0.45rem', background: 'var(--bg-page)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600 }}>
                  <Eye size={14} /> Detalhes
                </button>
                <button onClick={() => window.print()} style={{ padding: '0.45rem 0.85rem', background: 'var(--primary-green)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                  <Printer size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

import React from 'react';
import { BookOpen, GraduationCap, CheckCircle2, Lock, Loader2, Copy, FileText, ExternalLink, Youtube } from 'lucide-react';
import { TRILHAS_DATA, DOCUMENTOS_DATA, PROMPTS_EBOOK_DATA } from '../data/mockData';

export default function FormativoView() {
  const handleCopyPrompt = (template) => {
    navigator.clipboard.writeText(template);
    alert('Prompt copiado para a área de transferência!');
  };

  return (
    <section>
      <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.75rem 2rem', marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-green)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <BookOpen size={24} /> Ambiente Formativo
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.25rem' }}>
          Trilhas de autoformação continuada, acervo de legislação e e-book de prompts para Educação Matemática na EPT.
        </p>
      </div>

      <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary-green)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <GraduationCap size={20} /> Trilhas de Aprendizagem Docente
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {TRILHAS_DATA.map((trilha) => (
          <div key={trilha.id} style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)', background: trilha.status === 'concluido' ? 'var(--tint-formativo)' : (trilha.status === 'em-andamento' ? 'var(--tint-lab)' : 'var(--bg-card-alt)'), color: trilha.status === 'concluido' ? 'var(--color-formativo)' : (trilha.status === 'em-andamento' ? 'var(--color-lab)' : 'var(--text-light)'), marginBottom: '0.75rem' }}>
                {trilha.status === 'concluido' && <><CheckCircle2 size={12} /> Concluído</>}
                {trilha.status === 'em-andamento' && <><Loader2 size={12} className="spin" /> Em Andamento</>}
                {trilha.status === 'bloqueado' && <><Lock size={12} /> Bloqueado</>}
              </span>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{trilha.titulo}</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{trilha.desc}</p>
            </div>

            <div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-card-alt)', borderRadius: 'var(--radius-full)', margin: '1rem 0 0.5rem 0', overflow: 'hidden' }}>
                <div style={{ width: `${trilha.progresso}%`, height: '100%', background: 'linear-gradient(90deg, #10B981, #064E3B)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-light)' }}>
                <span>{trilha.aulas} aulas • {trilha.duracao}</span>
                <strong>{trilha.progresso}%</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Player */}
      <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-green)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Youtube size={22} color="#DC2626" /> Vídeo & Palestra de Abertura
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Live inaugural sobre o uso ético e intencional da IA na Educação Profissional e Tecnológica com o Prof. Maycon Magalhães.
        </p>
        <div style={{ position: 'relative', paddingBottom: '45%', height: 0, overflow: 'hidden', borderRadius: 'var(--radius-md)' }}>
          <iframe style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }} src="https://www.youtube.com/embed/Q_2bAN04KF0" title="Live IAprofEPT" allowFullScreen />
        </div>
      </div>

      {/* Acervo e Prompts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-green)', marginBottom: '1rem' }}>Acervo de Documentos Oficiais</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {DOCUMENTOS_DATA.map((d) => (
              <div key={d.id} style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FileText size={20} color="var(--primary-green)" />
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>{d.titulo}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{d.tag} • Ano: {d.ano}</div>
                  </div>
                </div>
                <button style={{ background: 'var(--bg-page)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem' }} onClick={() => alert('Documento disponível para consulta.')}>
                  <ExternalLink size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-green)', marginBottom: '1rem' }}>E-book de Prompts Curados</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {PROMPTS_EBOOK_DATA.map((p) => (
              <div key={p.id} style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', background: 'var(--tint-suporte)', color: 'var(--color-suporte)', borderRadius: 'var(--radius-xs)' }}>{p.categoria}</span>
                  <button onClick={() => handleCopyPrompt(p.template)} style={{ background: 'transparent', border: 'none', color: 'var(--primary-green)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', fontWeight: 600 }}>
                    <Copy size={14} /> Copiar
                  </button>
                </div>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.35rem' }}>{p.titulo}</h4>
                <div style={{ background: 'var(--bg-page)', border: '1px dashed var(--border-highlight)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                  {p.template}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

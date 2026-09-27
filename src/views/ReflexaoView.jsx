import React from 'react';
import { Scale, MessageSquare, Quote, Clock, User } from 'lucide-react';
import { FORUNS_DATA } from '../data/mockData';

export default function ReflexaoView() {
  return (
    <section>
      <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.75rem 2rem', marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-green)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Scale size={24} /> Painel de Reflexão Crítica
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.25rem' }}>
          Espaço formativo para problematização ética, combate ao uso acrítico e valorização da autoridade docente.
        </p>
      </div>

      {/* Provocação em Destaque */}
      <div style={{ background: 'linear-gradient(135deg, #064E3B 0%, #043c2d 100%)', color: 'white', borderRadius: 'var(--radius-lg)', padding: '2rem 2.5rem', marginBottom: '2rem', textAlign: 'center' }}>
        <Quote size={28} style={{ opacity: 0.6, marginBottom: '0.5rem' }} />
        <p style={{ fontSize: '1.2rem', fontStyle: 'italic', lineHeight: 1.6, marginBottom: '0.5rem' }}>
          "Se a Inteligência Artificial pode gerar dezenas de exercícios em segundos, qual passa a ser o papel insubstituível e humanizador do professor de Matemática na EPT?"
        </p>
        <span style={{ fontSize: '0.82rem', opacity: 0.85 }}>— Reflexão Coletiva · PPGEM / UFJF</span>
      </div>

      <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-green)', marginBottom: '1rem' }}>Fóruns Temáticos Ativos</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {FORUNS_DATA.map(f => (
          <div key={f.id} style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ padding: '0.2rem 0.5rem', background: 'var(--tint-suporte)', color: 'var(--color-suporte)', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem', fontWeight: 700 }}>{f.tag}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock size={12} /> {f.data}
                </span>
              </div>
              <h4 style={{ fontSize: '0.98rem', marginBottom: '0.25rem' }}>{f.titulo}</h4>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <User size={13} /> {f.autor}
              </span>
            </div>
            <button onClick={() => alert('Fórum aberto para participação.')} style={{ padding: '0.5rem 1rem', background: 'var(--bg-page)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600 }}>
              <MessageSquare size={14} /> {f.respostas} Respostas
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

import React from 'react';
import { HelpCircle, PlayCircle, Send, GraduationCap, Sparkles, FolderGit2, MessageSquare } from 'lucide-react';
import { INDICADORES_DATA } from '../data/mockData';

const iconMap = {
  'ind-1': GraduationCap,
  'ind-2': Sparkles,
  'ind-3': FolderGit2,
  'ind-4': MessageSquare
};

export default function SuporteView() {
  return (
    <section>
      <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.75rem 2rem', marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-green)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <HelpCircle size={24} /> Acompanhamento & Suporte
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.25rem' }}>
          Seus indicadores de engajamento na pesquisa de doutorado e canal de suporte técnico-pedagógico.
        </p>
      </div>

      <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-green)', marginBottom: '1rem' }}>Portfólio de Participação Docente</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {INDICADORES_DATA.map(ind => {
          const IconComponent = iconMap[ind.id] || Sparkles;
          return (
            <div key={ind.id} style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', background: ind.bg, color: ind.cor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconComponent size={22} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>{ind.valor}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ind.rotulo}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-green)', marginBottom: '1rem' }}>Tutoriais Rápidos em Vídeo</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {['Primeiros passos na Plataforma IAprofEPT (3 min)', 'Como parametrizar o Laboratório de IA (5 min)', 'Compartilhando práticas no Repositório (4 min)', 'Uso ético do assistente Prof. mAIcon (2 min)'].map((t, idx) => (
              <div key={idx} style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <PlayCircle size={22} color="var(--primary-green)" />
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-green)', marginBottom: '0.5rem' }}>Enviar Dúvida ou Sugestão</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Mensagens enviadas diretamente para o pesquisador Maycon Magalhães e equipe técnica (Shayene & Samuel).
          </p>
          <textarea rows={3} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '0.75rem', resize: 'vertical' }} placeholder="Descreva sua observação ou sugestão..." />
          <button onClick={() => alert('Mensagem enviada com sucesso!')} style={{ background: 'var(--primary-green)', color: 'white', border: 'none', padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-sm)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Send size={15} /> Enviar Mensagem
          </button>
        </div>
      </div>
    </section>
  );
}

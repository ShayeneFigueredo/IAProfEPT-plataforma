import React from 'react';
import { HelpCircle, PlayCircle, Send, GraduationCap, FlaskConical, FolderGit2, MessageSquare } from 'lucide-react';
import { INDICADORES_DATA } from '../data/mockData';

const iconMap = {
  'ind-1': GraduationCap,
  'ind-2': FlaskConical,
  'ind-3': FolderGit2,
  'ind-4': MessageSquare
};

export default function SuporteView() {

  return (
    <section className="suporte-view-container">
      {/* Cabeçalho */}
      <div className="suporte-header-card">
        <h2 className="suporte-header-title">
          <HelpCircle size={24} /> Acompanhamento & Suporte
        </h2>
        <p className="suporte-header-subtitle">
          Seus indicadores de engajamento na pesquisa de doutorado e canal de suporte técnico-pedagógico.
        </p>
      </div>

      {/* Portfólio de Participação Docente */}
      <h3 className="suporte-section-title">Portfólio de Participação Docente</h3>
      <div className="suporte-stats-grid">
        {INDICADORES_DATA.map(ind => {
          const IconComponent = iconMap[ind.id] || HelpCircle;
          return (
            <div key={ind.id} className="suporte-stat-item">
              <div
                className="suporte-stat-icon-wrapper"
                style={{ background: ind.bg, color: ind.cor }}
              >
                <IconComponent size={22} />
              </div>
              <div>
                <div className="suporte-stat-value">{ind.valor}</div>
                <div className="suporte-stat-label">{ind.rotulo}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid Duplo: Tutoriais e Envio de Dúvida */}
      <div className="suporte-dual-grid">
        <div>
          <h3 className="suporte-section-title">Tutoriais Rápidos em Vídeo</h3>
          <div className="suporte-tutorials-list">
            {[
              'Primeiros passos na Plataforma IAprofEPT (3 min)',
              'Como parametrizar o Laboratório de IA (5 min)',
              'Compartilhando práticas no Repositório (4 min)',
              'Uso ético do assistente Prof. mAIcon (2 min)'
            ].map((t, idx) => (
              <div key={idx} className="suporte-tutorial-item">
                <PlayCircle size={22} className="icon-tutorial-play" />
                <span className="suporte-tutorial-text">{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="suporte-feedback-card">
          <h3 className="suporte-feedback-title">Enviar Dúvida ou Sugestão</h3>
          <p className="suporte-feedback-desc">
            Mensagens enviadas diretamente para o pesquisador Maycon Magalhães e equipe técnica (Shayene & Samuel).
          </p>
          <textarea
            rows={3}
            className="suporte-textarea"
            placeholder="Descreva sua observação ou sugestão..."
            aria-label="Descreva sua observação ou sugestão"
          />
          <button
            type="button"
            className="btn-suporte-send"
            onClick={() => alert('Mensagem enviada com sucesso!')}
          >
            <Send size={15} />
            <span>Enviar Mensagem</span>
          </button>
        </div>
      </div>
    </section>
  );
}

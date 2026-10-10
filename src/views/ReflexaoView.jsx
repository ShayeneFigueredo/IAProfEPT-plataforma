import React from 'react';
import { Scale, MessageSquare, Quote, Clock, User, AlertTriangle, CheckCircle2, GraduationCap } from 'lucide-react';
import { FORUNS_DATA } from '../data/mockData';

const MATRIZ_CRITICA_DATA = [
  {
    id: 'm1',
    dimensao: 'Contextualização Profissional',
    risco: 'Geração de cenários fictícios genéricos sem correspondência com a prática real do curso técnico.',
    critico: 'Ancoragem em situações-problema reais do mundo do trabalho e do Eixo Tecnológico CNCT.',
    papel: 'Validar a autenticidade técnica antes de aplicar.'
  },
  {
    id: 'm2',
    dimensao: 'Rigor Conceitual Matemático',
    risco: 'Aceitação cega de fórmulas e resoluções geradas por IA sem verificação prévia de alucinações.',
    critico: 'Auditoria conceitual das soluções, explorando a metodologia do erro produtivo em sala.',
    papel: 'Verificar formalismos, premissas e unidades de medida.'
  },
  {
    id: 'm3',
    dimensao: 'Ética & Vieses Algorítmicos',
    risco: 'Desconsideração das assimetrias de gênero, raça e classe presentes na base de dados dos LLMs.',
    critico: 'Discussão reflexiva com os estudantes sobre os vieses e limites sociotécnicos dos modelos.',
    papel: 'Problematizar com a turma a neutralidade aparente da IA.'
  },
  {
    id: 'm4',
    dimensao: 'Avaliação da Aprendizagem',
    risco: 'Foco em tarefas mecânicas que a IA resolve instantaneamente sem esforço cognitivo.',
    critico: 'Valorização de justificativas, argumentação oral, modelagem em grupo e resolução de problemas abertos.',
    papel: 'Resgatar o processo investigativo do estudante.'
  }
];

export default function ReflexaoView() {
  return (
    <section className="reflexao-view-container">
      {/* Cabeçalho da Seção */}
      <div className="reflexao-header-card">
        <h2 className="reflexao-header-title">
          <Scale size={24} /> Painel de Reflexão Crítica
        </h2>
        <p className="reflexao-header-subtitle">
          Espaço formativo para problematização ética, combate ao uso acrítico e valorização da autoridade docente.
        </p>
      </div>

      {/* Provocação em Destaque */}
      <div className="reflexao-quote-box">
        <Quote size={28} className="reflexao-quote-icon" />
        <blockquote className="reflexao-quote-text">
          "Se a Inteligência Artificial pode gerar dezenas de exercícios em segundos, qual passa a ser o papel insubstituível e humanizador do professor de Matemática na EPT?"
        </blockquote>
        <span className="reflexao-quote-author">— Reflexão Coletiva · PPGEM / UFJF</span>
      </div>

      {/* Matriz Comparativa Crítica: Tabela para Desktop + Cards Comparativos para Mobile */}
      <div className="reflexao-section-card">
        <div className="reflexao-section-header">
          <div>
            <h3 className="reflexao-card-title">Matriz de Mediação Crítica na EPT</h3>
            <p className="reflexao-card-subtitle">
              Comparativo metodológico entre o uso acrítico/instrumental e a abordagem crítica-emancipatória.
            </p>
          </div>
        </div>

        {/* 1. Visão Tabela (Exibida em Telas Médias e Desktop) */}
        <div className="reflexao-desktop-table-wrapper">
          <table className="reflexao-compare-table">
            <thead>
              <tr>
                <th>Dimensão Formativa</th>
                <th>Uso Acrítico / Instrumental (Risco)</th>
                <th>Mediação Crítica na EPT (Recomendado)</th>
                <th>Papel da Autoridade Docente</th>
              </tr>
            </thead>
            <tbody>
              {MATRIZ_CRITICA_DATA.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.dimensao}</strong></td>
                  <td>{item.risco}</td>
                  <td>{item.critico}</td>
                  <td>{item.papel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 2. Visão Cards (Exibida em Smartphones para Evitar Tabela Espremida) */}
        <div className="reflexao-mobile-dimension-cards">
          {MATRIZ_CRITICA_DATA.map((item) => (
            <div key={item.id} className="dimension-mobile-card">
              <div className="dimension-mobile-badge">
                <span>{item.dimensao}</span>
              </div>

              {/* Risco / Acrítico */}
              <div className="dimension-subcard risco">
                <div className="subcard-header">
                  <AlertTriangle size={15} />
                  <strong>Uso Acrítico / Instrumental (Risco)</strong>
                </div>
                <p>{item.risco}</p>
              </div>

              {/* Mediação Crítica */}
              <div className="dimension-subcard critico">
                <div className="subcard-header">
                  <CheckCircle2 size={15} />
                  <strong>Mediação Crítica na EPT (Recomendado)</strong>
                </div>
                <p>{item.critico}</p>
              </div>

              {/* Autoridade Docente */}
              <div className="dimension-subcard docente">
                <div className="subcard-header">
                  <GraduationCap size={15} />
                  <strong>Papel da Autoridade Docente</strong>
                </div>
                <p>{item.papel}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fóruns Temáticos */}
      <div className="reflexao-section-card">
        <h3 className="reflexao-card-title" style={{ marginBottom: '1rem' }}>Fóruns Temáticos Ativos</h3>
        <div className="reflexao-forums-list">
          {FORUNS_DATA.map(f => (
            <div key={f.id} className="reflexao-forum-card">
              <div className="forum-card-left">
                <div className="forum-card-meta">
                  <span className="forum-tag-badge">{f.tag}</span>
                  <span className="forum-date">
                    <Clock size={12} /> {f.data}
                  </span>
                </div>
                <h4 className="forum-card-title">{f.titulo}</h4>
                <span className="forum-card-author">
                  <User size={13} /> {f.autor}
                </span>
              </div>
              <button
                type="button"
                className="btn-forum-action"
                onClick={() => alert(`Fórum "${f.titulo}" aberto para participação.`)}
              >
                <MessageSquare size={14} />
                <span>{f.respostas} Respostas</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { MAICON_KNOWLEDGE } from '../data/mockData';

export default function MaiconDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: MAICON_KNOWLEDGE.saudacao }
  ]);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = (text) => {
    if (!text.trim()) return;

    const newMsgs = [...messages, { sender: 'user', text }];
    setMessages(newMsgs);
    setInputText('');

    setTimeout(() => {
      let reply = MAICON_KNOWLEDGE.respostas.padrao;
      const lower = text.toLowerCase();

      if (lower.includes('laboratório') || lower.includes('parametrizar') || lower.includes('gerar')) {
        reply = MAICON_KNOWLEDGE.respostas.laboratorio;
      } else if (lower.includes('ética') || lower.includes('banner') || lower.includes('validar')) {
        reply = MAICON_KNOWLEDGE.respostas.etica;
      } else if (lower.includes('bncc') || lower.includes('habilidade')) {
        reply = MAICON_KNOWLEDGE.respostas.bncc;
      } else if (lower.includes('exportar') || lower.includes('pdf') || lower.includes('imprimir')) {
        reply = MAICON_KNOWLEDGE.respostas.exportar;
      }

      setMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
    }, 500);
  };

  return (
    <>
      {/* Botão Flutuante Tipo Pílula com Foto Real */}
      <button
        className="floating-maicon-capsule"
        onClick={() => setIsOpen(!isOpen)}
        title="Conversar com o Prof. mAIcon"
      >
        <div className="maicon-photo-avatar">
          <img src="/assets/maicon.png" alt="Prof. mAIcon" />
        </div>
        <div className="maicon-capsule-text">
          <strong>Prof. mAIcon</strong>
          <span>Tire suas dúvidas</span>
        </div>
      </button>

      {/* Gaveta de Chat */}
      <div className={`maicon-drawer-panel ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="maicon-photo-avatar" style={{ width: '32px', height: '32px', borderColor: 'white' }}>
              <img src="/assets/maicon.png" alt="Prof. mAIcon" />
            </div>
            <div>
              <strong style={{ fontSize: '0.95rem', display: 'block' }}>Prof. mAIcon</strong>
              <span style={{ fontSize: '0.7rem', opacity: 0.9 }}>Assistente Pedagógico IAprofEPT</span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="drawer-chat-area">
          {messages.map((m, idx) => (
            <div key={idx} className={`chat-bubble ${m.sender}`}>
              {m.text}
            </div>
          ))}
        </div>

        <div className="drawer-suggestions-bar">
          {MAICON_KNOWLEDGE.sugestoes.map((s, idx) => (
            <button key={idx} className="suggestion-pill-btn" onClick={() => handleSendMessage(s)}>
              {s}
            </button>
          ))}
        </div>

        <form
          className="drawer-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
        >
          <input
            type="text"
            className="drawer-input-field"
            placeholder="Pergunte ao Prof. mAIcon..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button type="submit" className="drawer-send-btn">
            <Send size={16} />
          </button>
        </form>
      </div>
    </>
  );
}

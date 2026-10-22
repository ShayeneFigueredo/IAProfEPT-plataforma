import React, { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { MAICON_KNOWLEDGE } from '../data/mockData';

export default function MaiconDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: MAICON_KNOWLEDGE.saudacao }
  ]);
  const [inputText, setInputText] = useState('');
  const [showBubble, setShowBubble] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const chatEndRef = useRef(null);

  // Animação periódica do texto "Tire suas dúvidas"
  useEffect(() => {
    if (isOpen) {
      setShowBubble(false);
      return;
    }

    let hideTimeout;
    let showInterval;

    // Disparo inicial 2.5s após montar o componente
    const initialTimeout = setTimeout(() => {
      setShowBubble(true);
      hideTimeout = setTimeout(() => {
        setShowBubble(false);
      }, 4500);
    }, 2500);

    // Ciclo periódico a cada 14 segundos (4.5s visível + 9.5s recolhido)
    showInterval = setInterval(() => {
      setShowBubble(true);
      hideTimeout = setTimeout(() => {
        setShowBubble(false);
      }, 4500);
    }, 14000);

    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(hideTimeout);
      clearInterval(showInterval);
    };
  }, [isOpen]);

  // Rola o chat para o fim automaticamente ao receber/enviar mensagem
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

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
      {/* Backdrop sutil no mobile para fechar o chat ao clicar fora */}
      {isOpen && (
        <div
          className="maicon-drawer-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Container Flutuante do Assistente Prof. mAIcon */}
      <div className="floating-maicon-wrapper">
        {/* Balão de Fala Animado "Tire suas dúvidas" */}
        <div
          className={`maicon-speech-bubble ${!isOpen && (showBubble || isHovered) ? 'visible' : ''}`}
          onClick={() => {
            setIsOpen(true);
            setShowBubble(false);
          }}
          role="status"
          aria-live="polite"
          title="Clique para conversar com o Prof. mAIcon"
        >
          <span className="bubble-text">Tire suas dúvidas!</span>
          <span className="bubble-sparkle" aria-hidden="true">💬</span>
          <div className="bubble-tail" aria-hidden="true" />
        </div>

        {/* Botão Circular Flutuante com Apenas a Foto de Perfil */}
        <button
          type="button"
          className={`floating-maicon-avatar-btn ${showBubble ? 'animating' : ''}`}
          onClick={() => {
            setIsOpen(!isOpen);
            setShowBubble(false);
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          title="Prof. mAIcon · Tire suas dúvidas"
          aria-label="Abrir assistente pedagógico Prof. mAIcon"
          aria-expanded={isOpen}
        >
          <div className="maicon-circle-avatar">
            <img src="/assets/maicon.png" alt="Prof. mAIcon" />
          </div>
          {/* Indicador de Status Online com Pulso Verde */}
          <span className="maicon-online-badge" aria-hidden="true">
            <span className="badge-ping" />
            <span className="badge-dot" />
          </span>
        </button>
      </div>

      {/* Gaveta de Chat */}
      <div
        className={`maicon-drawer-panel ${isOpen ? 'open' : ''}`}
        role="dialog"
        aria-label="Chat com Prof. mAIcon"
      >
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="maicon-photo-avatar" style={{ width: '34px', height: '34px', borderColor: 'white', flexShrink: 0 }}>
              <img src="/assets/maicon.png" alt="Prof. mAIcon" />
            </div>
            <div>
              <strong style={{ fontSize: '0.95rem', display: 'block', color: 'white' }}>Prof. mAIcon</strong>
              <span style={{ fontSize: '0.72rem', opacity: 0.9, color: '#A7F3D0' }}>Assistente Pedagógico IAprofEPT</span>
            </div>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Fechar janela do Prof. mAIcon"
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
          <div ref={chatEndRef} />
        </div>

        <div className="drawer-suggestions-bar">
          {MAICON_KNOWLEDGE.sugestoes.map((s, idx) => (
            <button key={idx} type="button" className="suggestion-pill-btn" onClick={() => handleSendMessage(s)}>
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
            aria-label="Mensagem para o assistente"
          />
          <button type="submit" className="drawer-send-btn" aria-label="Enviar mensagem">
            <Send size={16} />
          </button>
        </form>
      </div>
    </>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, MessageSquare, Trash2, Menu } from 'lucide-react';
import { parseMarkdown } from '../utils/markdownParser';

export default function ChatView({ currentUser }) {
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem('iaprofept_chats');
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, title: 'Nova Conversa', messages: [{ role: 'system', content: 'Olá! Sou o assistente de IA da plataforma IAProfEPT. Como posso ajudar você hoje?' }] }
    ];
  });
  const [activeChatId, setActiveChatId] = useState(chats[0]?.id || 1);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

  useEffect(() => {
    localStorage.setItem('iaprofept_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: 'Nova Conversa',
      messages: [{ role: 'system', content: 'Olá! Sou o assistente de IA da plataforma IAProfEPT. Como posso ajudar você hoje?' }]
    };
    setChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
  };

  const deleteChat = (id) => {
    const updatedChats = chats.filter(c => c.id !== id);
    if (updatedChats.length === 0) {
      const newChat = { id: Date.now(), title: 'Nova Conversa', messages: [] };
      setChats([newChat]);
      setActiveChatId(newChat.id);
    } else {
      setChats(updatedChats);
      if (activeChatId === id) setActiveChatId(updatedChats[0].id);
    }
  };

  const updateChatTitle = async (chatId, messages) => {
    // Generate a title based on the first user message
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length === 1) {
      const firstMsg = userMessages[0].content;
      const title = firstMsg.length > 30 ? firstMsg.substring(0, 30) + '...' : firstMsg;
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, title } : c));
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessage = { role: 'user', content: input };
    const updatedMessages = [...activeChat.messages, newMessage];
    
    setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: updatedMessages } : c));
    setInput('');
    setIsLoading(true);

    updateChatTitle(activeChatId, updatedMessages);

    try {
      // Mock call to backend API for AI Chat
      const response = await fetch('http://localhost:3001/api/ia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          context: `Usuário: ${currentUser?.nome}, Curso: ${currentUser?.curso}`
        })
      });

      if (!response.ok) {
        throw new Error('Falha na comunicação com a IA');
      }

      const data = await response.json();
      
      setChats(prev => prev.map(c => c.id === activeChatId ? {
        ...c,
        messages: [...c.messages, { role: 'system', content: data.resposta }]
      } : c));

    } catch (error) {
      console.error(error);
      setChats(prev => prev.map(c => c.id === activeChatId ? {
        ...c,
        messages: [...c.messages, { role: 'system', content: 'Desculpe, ocorreu um erro ao conectar com o servidor da IA.' }]
      } : c));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', gap: '1rem' }}>
      {/* Sidebar de Histórico */}
      <div style={{ width: '280px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '1rem', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)' }}>
        <button 
          onClick={createNewChat}
          style={{ width: '100%', padding: '0.75rem', background: 'var(--accent-green)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold', cursor: 'pointer', marginBottom: '1rem' }}
        >
          <Plus size={18} />
          Nova Conversa
        </button>

        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {chats.map(chat => (
            <div 
              key={chat.id} 
              style={{ padding: '0.75rem', background: activeChatId === chat.id ? 'rgba(16, 185, 129, 0.1)' : 'transparent', border: activeChatId === chat.id ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: activeChatId === chat.id ? 'var(--accent-green)' : 'var(--text-secondary)', transition: 'all 0.2s' }}
              onClick={() => setActiveChatId(chat.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                <MessageSquare size={16} style={{ flexShrink: 0 }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.875rem' }}>
                  {chat.title}
                </span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.7, padding: '0.25rem' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Área Principal de Chat */}
      <div style={{ flex: 1, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        
        {/* Header do Chat */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{activeChat?.title}</h2>
        </div>

        {/* Mensagens */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {activeChat?.messages.map((msg, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ 
                maxWidth: '80%', 
                padding: '1rem 1.25rem', 
                borderRadius: '1rem',
                borderBottomRightRadius: msg.role === 'user' ? 0 : '1rem',
                borderBottomLeftRadius: msg.role === 'system' ? 0 : '1rem',
                background: msg.role === 'user' ? 'var(--accent-green)' : 'var(--bg-main)',
                color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                boxShadow: 'var(--shadow-sm)',
                lineHeight: 1.5
              }}>
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <div dangerouslySetContent={{ __html: parseMarkdown(msg.content) }} />
                )}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.5rem', marginLight: '0.5rem', marginRight: '0.5rem' }}>
                {msg.role === 'user' ? 'Você' : 'Assistente IA'}
              </span>
            </div>
          ))}
          {isLoading && (
            <div style={{ alignSelf: 'flex-start', color: 'var(--text-secondary)', padding: '1rem', fontSize: '0.875rem' }}>
              A IA está digitando...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-main)' }}>
          <div style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Digite sua mensagem para a IA..."
              style={{ flex: 1, padding: '1rem 3rem 1rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', resize: 'none', height: '60px', fontFamily: 'inherit' }}
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'var(--accent-green)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: (isLoading || !input.trim()) ? 0.5 : 1 }}
            >
              <Send size={18} />
            </button>
          </div>
          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.75rem' }}>
            Lembre-se: Este material foi gerado por Inteligência Artificial e deve ser revisado, validado e adaptado pela autoridade docente antes de sua aplicação.
          </div>
        </div>
      </div>
    </div>
  );
}


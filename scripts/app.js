/* ==========================================================================
   Aplicação Principal SPA - IAprofEPT (Fase 1 MVP Navegável)
   Lógica de Navegação e Interações Fiel ao Protótipo Original
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Estado Global da Aplicação
  const state = {
    currentTab: 'inicio',
    selectedLabTool: 'exercicios',
    selectedEixo: 'trabalho',
    filtroRepositorio: 'Todos',
    chatOpen: false,
    chatMessages: [
      { sender: 'bot', text: APP_DATA.respostasMaicon.saudacao }
    ],
    usuario: APP_DATA.usuario
  };

  // Inicialização
  initNavigation();
  initFormativo();
  initLaboratorio();
  initRepositorio();
  initReflexao();
  initSuporte();
  initChatMaicon();

  // ========================================================================
  // NAVEGAÇÃO ENTRE OS 5 AMBIENTES (SPA)
  // ========================================================================
  function initNavigation() {
    // Links da Sidebar
    document.querySelectorAll('.sidebar-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTab = link.getAttribute('data-tab');
        if (targetTab) switchTab(targetTab);
      });
    });

    // Botão Sair
    const btnLogout = document.getElementById('btn-logout-trigger');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        showNotification('Sessão encerrada com segurança.');
      });
    }
  }

  window.switchTab = function(tabId) {
    state.currentTab = tabId;

    // Atualizar links ativos na sidebar
    document.querySelectorAll('.sidebar-link').forEach(link => {
      if (link.getAttribute('data-tab') === tabId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Atualizar Breadcrumb no Header
    const breadcrumbTitle = document.getElementById('header-breadcrumb-title');
    if (breadcrumbTitle) {
      const titulos = {
        'inicio': 'Início',
        'formativo': 'Ambiente Formativo',
        'laboratorio': 'Laboratório de IA',
        'repositorio': 'Repositório de Práticas',
        'reflexao': 'Reflexão Crítica',
        'suporte': 'Acompanhamento e Suporte'
      };
      breadcrumbTitle.innerText = titulos[tabId] || 'Início';
    }

    // Atualizar visualização das seções
    document.querySelectorAll('.view-section').forEach(section => {
      if (section.id === `view-${tabId}`) {
        section.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        section.style.display = 'none';
      }
    });
  };

  // ========================================================================
  // 1. AMBIENTE FORMATIVO
  // ========================================================================
  function initFormativo() {
    const trilhasContainer = document.getElementById('trilhas-container');
    if (trilhasContainer) {
      trilhasContainer.innerHTML = APP_DATA.trilhas.map(trilha => `
        <div class="trilha-card">
          <div>
            <span class="trilha-badge ${trilha.status}">
              ${trilha.status === 'concluido' ? '<i class="fa-solid fa-check"></i> Concluído' : (trilha.status === 'em-andamento' ? '<i class="fa-solid fa-spinner fa-spin"></i> Em Andamento' : '<i class="fa-solid fa-lock"></i> Bloqueado')}
            </span>
            <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--text-main);">${trilha.titulo}</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted);">${trilha.desc}</p>
          </div>
          <div>
            <div class="trilha-progress-bar">
              <div class="trilha-progress-fill" style="width: ${trilha.progresso}%;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-light);">
              <span>${trilha.aulas} aulas • ${trilha.duracao}</span>
              <strong>${trilha.progresso}%</strong>
            </div>
            <button class="btn btn-secondary" style="width: 100%; margin-top: 1rem; font-size: 0.8rem;" ${trilha.status === 'bloqueado' ? 'disabled' : ''}>
              ${trilha.status === 'concluido' ? 'Revisar Aulas' : (trilha.status === 'em-andamento' ? 'Continuar Trilha' : 'Aguardando Liberação')}
            </button>
          </div>
        </div>
      `).join('');
    }

    const docsContainer = document.getElementById('docs-container');
    if (docsContainer) {
      docsContainer.innerHTML = APP_DATA.documentos.map(doc => `
        <div class="doc-item">
          <div style="display: flex; align-items: center; gap: 0.85rem;">
            <div style="width: 36px; height: 36px; border-radius: var(--radius-xs); background: var(--tint-formativo); color: var(--color-formativo); display: flex; align-items: center; justify-content: center;">
              <i class="fa-solid fa-file-lines"></i>
            </div>
            <div>
              <strong style="font-size: 0.9rem; color: var(--text-main);">${doc.titulo}</strong>
              <div style="font-size: 0.75rem; color: var(--text-light); margin-top: 2px;">
                <span class="badge-tag">${doc.tag}</span> • Ano: ${doc.ano}
              </div>
            </div>
          </div>
          <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="showNotification('Documento disponível para consulta acadêmica.')">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Acessar
          </button>
        </div>
      `).join('');
    }

    const promptsContainer = document.getElementById('prompts-container');
    if (promptsContainer) {
      promptsContainer.innerHTML = APP_DATA.promptsEbook.map(p => `
        <div class="prompt-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span class="badge-tag" style="background: var(--tint-suporte); color: var(--color-suporte);">${p.categoria}</span>
            <button class="btn btn-secondary copy-prompt-btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" data-prompt="${encodeURIComponent(p.template)}">
              <i class="fa-regular fa-copy"></i> Copiar
            </button>
          </div>
          <h4 style="font-size: 0.95rem; margin-bottom: 0.35rem;">${p.titulo}</h4>
          <div class="prompt-template-box">${p.template}</div>
        </div>
      `).join('');

      document.querySelectorAll('.copy-prompt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const text = decodeURIComponent(btn.getAttribute('data-prompt'));
          navigator.clipboard.writeText(text);
          showNotification('Prompt copiado para a área de transferência!');
        });
      });
    }
  }

  // ========================================================================
  // 2. LABORATÓRIO DE IA (GERADOR PARAMETRIZADO)
  // ========================================================================
  function initLaboratorio() {
    const toolsContainer = document.getElementById('lab-tools-container');
    if (toolsContainer) {
      toolsContainer.innerHTML = APP_DATA.laboratorio.ferramentas.map(tool => `
        <div class="lab-tool-card ${tool.id === state.selectedLabTool ? 'active' : ''}" data-tool="${tool.id}">
          <div style="width: 40px; height: 40px; border-radius: var(--radius-sm); background: var(--tint-formativo); color: ${tool.cor}; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0;">
            <i class="${tool.icone}"></i>
          </div>
          <div>
            <h4 style="font-size: 0.95rem; margin-bottom: 0.2rem;">${tool.titulo}</h4>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0;">${tool.desc}</p>
          </div>
        </div>
      `).join('');

      document.querySelectorAll('.lab-tool-card').forEach(card => {
        card.addEventListener('click', () => {
          document.querySelectorAll('.lab-tool-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          state.selectedLabTool = card.getAttribute('data-tool');
        });
      });
    }

    const selectArea = document.getElementById('select-area-mat');
    if (selectArea) {
      selectArea.innerHTML = APP_DATA.laboratorio.areasMatematica.map(a => `<option value="${a}">${a}</option>`).join('');
    }

    const selectCurso = document.getElementById('select-curso-tec');
    if (selectCurso) {
      selectCurso.innerHTML = APP_DATA.laboratorio.cursosTecnicos.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    const selectMetodologia = document.getElementById('select-metodologia');
    if (selectMetodologia) {
      selectMetodologia.innerHTML = APP_DATA.laboratorio.metodologias.map(m => `<option value="${m}">${m}</option>`).join('');
    }

    const eixosContainer = document.getElementById('eixos-chips-container');
    if (eixosContainer) {
      eixosContainer.innerHTML = APP_DATA.laboratorio.eixosCNCT.map(eixo => `
        <button type="button" class="chip-btn ${eixo.id === state.selectedEixo ? 'active' : ''}" data-eixo="${eixo.id}">
          <i class="${eixo.icone}"></i> ${eixo.label}
        </button>
      `).join('');

      document.querySelectorAll('#eixos-chips-container .chip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('#eixos-chips-container .chip-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.selectedEixo = btn.getAttribute('data-eixo');
        });
      });
    }

    const btnGerar = document.getElementById('btn-gerar-ia');
    const resultBox = document.getElementById('lab-result-box');

    if (btnGerar && resultBox) {
      btnGerar.addEventListener('click', () => {
        btnGerar.disabled = true;
        btnGerar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Orquestrando Groq (LLaMA 3.3) & Gemini...';

        setTimeout(() => {
          btnGerar.disabled = false;
          btnGerar.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Gerar Atividade com IA Contextualizada';
          resultBox.style.display = 'block';
          resultBox.scrollIntoView({ behavior: 'smooth' });
          showNotification('Atividade gerada com rigor pedagógico e códigos da BNCC!');
        }, 1200);
      });
    }
  }

  // ========================================================================
  // 3. REPOSITÓRIO DE PRÁTICAS
  // ========================================================================
  function initRepositorio() {
    renderPraticas();

    document.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.filtroRepositorio = btn.getAttribute('data-curso');
        renderPraticas();
      });
    });
  }

  function renderPraticas() {
    const container = document.getElementById('praticas-container');
    if (!container) return;

    const filtradas = state.filtroRepositorio === 'Todos'
      ? APP_DATA.praticas
      : APP_DATA.praticas.filter(p => p.curso.toLowerCase().includes(state.filtroRepositorio.toLowerCase()));

    container.innerHTML = filtradas.map(p => `
      <div class="pratica-card">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem;">
            <span class="badge-tag curso"><i class="fa-solid fa-graduation-cap"></i> ${p.curso}</span>
            <span class="badge-tag bncc">${p.habilidadeBNCC}</span>
          </div>
          <h3 style="font-size: 1.05rem; color: var(--primary-green); margin-bottom: 0.5rem;">${p.titulo}</h3>
          <p style="font-size: 0.835rem; color: var(--text-muted);">${p.resumo}</p>
        </div>
        <div>
          <div class="pratica-meta">
            <span><i class="fa-regular fa-user"></i> ${p.autor}</span>
            <span><i class="fa-solid fa-heart" style="color: #DC2626;"></i> ${p.likes}</span>
          </div>
          <div style="display: flex; gap: 0.5rem; margin-top: 0.85rem;">
            <button class="btn btn-secondary" style="flex: 1; font-size: 0.8rem;" onclick="showNotification('Sequência didática pronta para consulta.')">
              <i class="fa-regular fa-eye"></i> Detalhes
            </button>
            <button class="btn btn-primary" style="font-size: 0.8rem;" onclick="window.print();">
              <i class="fa-solid fa-print"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // ========================================================================
  // 4. PAINEL DE REFLEXÃO CRÍTICA
  // ========================================================================
  function initReflexao() {
    const forunsContainer = document.getElementById('foruns-container');
    if (forunsContainer) {
      forunsContainer.innerHTML = APP_DATA.foruns.map(f => `
        <div class="forum-item">
          <div>
            <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.35rem;">
              <span class="badge-tag" style="background: var(--tint-suporte); color: var(--color-suporte);">${f.tag}</span>
              <span style="font-size: 0.75rem; color: var(--text-light);"><i class="fa-regular fa-clock"></i> ${f.data}</span>
            </div>
            <h4 style="font-size: 0.98rem; color: var(--text-main); margin-bottom: 0.25rem;">${f.titulo}</h4>
            <span style="font-size: 0.8rem; color: var(--text-muted);"><i class="fa-regular fa-user"></i> Iniciado por ${f.autor}</span>
          </div>
          <button class="btn btn-secondary" style="font-size: 0.8rem; white-space: nowrap;" onclick="showNotification('Fórum aberto para debate docente.')">
            <i class="fa-regular fa-comments"></i> ${f.respostas} Respostas
          </button>
        </div>
      `).join('');
    }
  }

  // ========================================================================
  // 5. SUPORTE & INDICADORES
  // ========================================================================
  function initSuporte() {
    const indicadoresContainer = document.getElementById('indicadores-container');
    if (indicadoresContainer) {
      indicadoresContainer.innerHTML = APP_DATA.indicadores.map(ind => `
        <div class="indicador-card">
          <div class="indicador-icon" style="background: ${ind.bg}; color: ${ind.cor};">
            <i class="${ind.icone}"></i>
          </div>
          <div>
            <div class="indicador-val">${ind.valor}</div>
            <div class="indicador-label">${ind.rotulo}</div>
          </div>
        </div>
      `).join('');
    }

    const tutoriaisContainer = document.getElementById('tutoriais-container');
    if (tutoriaisContainer) {
      tutoriaisContainer.innerHTML = APP_DATA.tutoriais.map(t => `
        <div class="doc-item">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <i class="fa-solid fa-circle-play" style="color: var(--primary-green); font-size: 1.25rem;"></i>
            <span style="font-size: 0.88rem; font-weight: 600;">${t.titulo}</span>
          </div>
          <span style="font-size: 0.78rem; color: var(--text-light);">${t.duracao}</span>
        </div>
      `).join('');
    }
  }

  // ========================================================================
  // CHATBOT PROF. MAICON
  // ========================================================================
  function initChatMaicon() {
    const triggerBtn = document.getElementById('maicon-trigger-btn');
    const chatDrawer = document.getElementById('maicon-chat-drawer');
    const closeBtn = document.getElementById('chat-close-btn');
    const chatMessagesBox = document.getElementById('chat-messages-box');
    const chatForm = document.getElementById('chat-input-form');
    const chatInput = document.getElementById('chat-input-text');
    const suggestionsContainer = document.getElementById('chat-suggestions-container');

    if (!triggerBtn || !chatDrawer) return;

    triggerBtn.addEventListener('click', () => {
      state.chatOpen = !state.chatOpen;
      chatDrawer.classList.toggle('active', state.chatOpen);
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        state.chatOpen = false;
        chatDrawer.classList.remove('active');
      });
    }

    if (suggestionsContainer) {
      suggestionsContainer.innerHTML = APP_DATA.respostasMaicon.sugestoes.map(s => `
        <button type="button" class="chat-suggestion-chip">${s}</button>
      `).join('');

      document.querySelectorAll('.chat-suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const text = chip.innerText;
          sendUserMessage(text);
        });
      });
    }

    if (chatForm && chatInput) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (text) {
          sendUserMessage(text);
          chatInput.value = '';
        }
      });
    }

    function sendUserMessage(text) {
      state.chatMessages.push({ sender: 'user', text });
      renderChatMessages();

      setTimeout(() => {
        let reply = APP_DATA.respostasMaicon.perguntasFrequentes.padrao;
        const lower = text.toLowerCase();

        if (lower.includes('laboratório') || lower.includes('parametrizar') || lower.includes('gerar')) {
          reply = APP_DATA.respostasMaicon.perguntasFrequentes.laboratorio;
        } else if (lower.includes('ética') || lower.includes('banner') || lower.includes('validar')) {
          reply = APP_DATA.respostasMaicon.perguntasFrequentes.etica;
        } else if (lower.includes('bncc') || lower.includes('habilidade')) {
          reply = APP_DATA.respostasMaicon.perguntasFrequentes.bncc;
        } else if (lower.includes('exportar') || lower.includes('pdf') || lower.includes('imprimir')) {
          reply = APP_DATA.respostasMaicon.perguntasFrequentes.exportar;
        }

        state.chatMessages.push({ sender: 'bot', text: reply });
        renderChatMessages();
      }, 600);
    }

    function renderChatMessages() {
      if (!chatMessagesBox) return;
      chatMessagesBox.innerHTML = state.chatMessages.map(m => `
        <div class="msg-bubble ${m.sender}">${m.text}</div>
      `).join('');
      chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
    }
  }

  // Toast
  window.showNotification = function(msg) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: #0F172A;
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 9999px;
        font-size: 0.85rem;
        font-weight: 600;
        z-index: 2000;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 0.5rem;
      `;
      document.body.appendChild(toast);
    }

    toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #10B981;"></i> ${msg}`;
    toast.style.display = 'flex';

    setTimeout(() => {
      toast.style.display = 'none';
    }, 3500);
  };
});

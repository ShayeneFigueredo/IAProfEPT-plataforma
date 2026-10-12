# 📖 Diário de Bordo Técnico do Produto Educacional (PTT4)
## Fase 1 — Alinhamento, Arquitetura & MVP Front-end Navegável dos 5 Ambientes

> **Registro Histórico e de Engenharia de Software Pedagógica**  
> **Período:** 22/09/2026 a 05/10/2026  
> **Doutorando:** Maycon Luiz Amaral Magalhães  
> **Equipe de Engenharia:** Shayene Figueredo & Samuel Amorim  
> **Programa:** PPGEM / UFJF  

---

## 📅 Entregas Realizadas na Fase 1

### 1. Migração Tecnológica & Design System
- **Stack Tecnológico:** Migração e consolidação em **React 18 + Vite** para máxima performance, leveza de bundle e hot reload instantâneo.
- **Identidade Visual Oficial UFJF:**
  - Paleta Oficial: Verde Floresta Institucional (`#064E3B`), Verde Acento (`#10B981`), Alerta Vermelho (`#DC2626`) e Superfícies Neutras (`#F8FAFC`, `#0F172A`).
  - Tipografia Institucional (ADR-004 / [IAPROF-2.1]): Outfit (Títulos), Plus Jakarta Sans (Corpo), Space Grotesk / Fira Code (Dados técnicos/prompts/código).
  - Sombras & Layout: Camada de sombras suaves (`--shadow-app`), bordas arredondadas e sistema de grid responsivo fluído.
  - Acessibilidade: Contraste WCAG AA/AAA comprovado, foco por teclado `:focus-visible`, link skip-to-content e adaptação para movimento reduzido.

### 2. Implementação dos 5 Ambientes Navegáveis (1:1 com Protótipo)
1. **Início (HomeView):**
   - Hero banner com degradê verde institucional, indicadores de trilhas e materiais gerados;
   - Grid dos 5 ambientes com numeração padronizada (`01` a `05`) e card CTA;
   - Seção centralizada *"Pensada para o professor — não para substituí-lo"* (3 pilares: Contextualização à EPT, Engenharia de prompts oculta, Validação pedagógica);
   - Banner verde sólido de Compromisso Ético.
2. **Ambiente Formativo (FormativoView):**
   - Sub-tabs em pílula (`Trilhas`, `Vídeos`, `Materiais & legislação`, `IAs & E-book de prompts`);
   - Lista de 4 módulos com caixas de status (`✓ Concluído`, `2 Em andamento`, `3 Bloqueado`, `4 Bloqueado`), barras de progresso e botões de ação;
   - Reprodutor de vídeos (Figura 10) integrado com playlist interativa e indicador de status `• tocando`.
3. **Laboratório de IA (LaboratorioView):**
   - Formulário estritamente parametrizado com 4 campos obrigatórios (Área matemática, Nível de dificuldade, Quantidade, Curso técnico);
   - Zero caixas de prompt em branco expostas ao docente;
   - Accordion de visualização do *System Prompt* oculto;
   - Saída gerada formatada com banner de validação pedagógica obrigatória, contexto profissional autêntico e equações matemáticas formatadas.
4. **Repositório de Práticas (RepositorioView):**
   - Catálogo filtrável por curso técnico com cards de práticas validadas, dados de BNCC e ações de visualização/impressão.
5. **Painel de Reflexão Crítica (ReflexaoView):**
   - Fóruns temáticos de ética e provocação crítica sobre o papel humanizador do professor frente à IA.
6. **Acompanhamento & Suporte (SuporteView):**
   - Portfólio de indicadores de participação docente, tutoriais em vídeo e canal de envio direto de dúvidas.

### 3. Assistente Pedagógico Virtual (Prof. mAIcon)
- Widget pill flutuante com a fotografia oficial do Prof. Maycon Magalhães no canto inferior direito;
- Painel retrátil (drawer) com respostas contextuais parametrizadas para tirar dúvidas sobre a plataforma, banner ético e BNCC.

### 4. Fluxo de Autenticação, Cadastro Docente RFEPCT & Onboarding dos 5 Ambientes
- **Tela de Login Institucional (`LoginView.jsx`):** Brasão oficial da UFJF/PPGEM, credenciais com alternância de visibilidade de senha e acessos rápidos de demonstração (*Prof. Maycon Magalhães*, *Profª. Shayene Figueredo*, *Convidado RFEPCT*).
- **Modal de Cadastro Docente (`RegisterModal.jsx`):** Formulário guiado com vínculo institucional da RFEPCT (IFs/CEFETs), Campus de lotação, área de atuação em Matemática e seleção dinâmica de cursos técnicos atendidos.
- **Onboarding e Boas-Vindas (`OnboardingModal.jsx`):** Apresentação pedagógica passo a passo dos 5 Ambientes com indicadores de etapas (*step dots*), atalhos no cabeçalho (*"Guia dos 5 Ambientes"*) e persistência em `localStorage`.
- **Card Inicial Dinâmico (`HomeView.jsx`):** Saudação personalizada de acordo com o turno e primeiro nome do usuário autenticado (ou *"Visitante"*), integrando calor humano e rigor acadêmico.

### 5. Governança e Rastreabilidade
- Estruturação de ADRs (Architectural Decision Records — ADR-001 a ADR-005);
- Emissão de templates de pull request e diretrizes de IA;
- Backlog de tarefas do Jira Cloud importadas e mapeadas para o cronograma oficial.


# 🏛️ Documento de Decisão Arquitetural (ADR-005)
## Fluxo de Autenticação, Cadastro Institucional da RFEPCT e Onboarding Pedagógico dos 5 Ambientes

- **Status:** Aprovado / Implementado
- **Data da Decisão:** Outubro / 2026
- **Contexto da Pesquisa:** Tese de Doutorado em Educação Matemática (PPGEM / UFJF)
- **Autor / Doutorando:** Maycon Luiz Amaral Magalhães
- **Engenharia de Software:** Shayene Figueredo & Samuel Amorim
- **Orientadores:** Prof. Dr. Eduardo Barrére | Prof. Dr. Manuel José Cabral dos Santos Reis
- **Classificação CAPES:** Produto Técnico-Tecnológico (PTT4 - Software/Plataforma Educacional)
- **Referência Jira:** `[IAPROF-3.6]` / `[Auth & Onboarding]`

---

## 🎯 1. Contexto & Justificativa Científico-Pedagógica

A pesquisa de doutorado tem como público-alvo central os **professores de Matemática da Rede Federal de Educação Profissional, Científica e Tecnológica (RFEPCT)** — englobando Institutos Federais (IFs), Centros Federais de Educação Tecnológica (CEFETs) e o Colégio Pedro II.

Para garantir rigor metodológico na coleta empírica da tese, acolhimento ético dos participantes e personalização curricular dos materiais gerados pela IA, a plataforma necessita de:
1. **Identificação Institucional Precisa:** Coleta do Instituto Federal de origem, Campus de lotação, área de atuação matemática e cursos técnicos atendidos (ex.: Informática, Mecânica, Agropecuária).
2. **Apresentação Clara do Modelo Epistemológico:** O docente precisa compreender imediatamente a divisão dos **5 Ambientes da Plataforma** antes de iniciar as experimentações práticas.
3. **Persistência e Acesso Rápido de Demonstração:** Permitir navegação fluida tanto para os pesquisadores (Prof. Dr. Maycon Magalhães e equipe) quanto para docentes convidados e participantes recém-cadastrados sem barreiras de infraestrutura durante a Fase 1.
4. **Tratamento Humanizado e Personalizado:** O card inicial (*hero card*) da plataforma deve saudar dinamicamente o professor pelo seu primeiro nome ou como *"Visitante"*, evitando saudações genéricas ou estáticas.

---

## 🏗️ 2. Arquitetura da Solução Implementada

### A. Tela de Login Institucional (`LoginView.jsx`)
- **Identidade Visual:** Alinhada ao Design System institucional da UFJF/PPGEM (Verde Floresta `#064E3B`, Verde Acento `#10B981` e tipografia *Outfit* / *Plus Jakarta Sans*).
- **Campos de Credenciais:** Entrada de e-mail institucional e senha com alternância de visibilidade.
- **Acessos Rápidos de Demonstração (*Quick Login*):**
  - **Prof. Dr. Maycon Magalhães:** Perfil principal do pesquisador (IFNMG / Doutorando PPGEM-UFJF).
  - **Profª. Shayene Figueredo:** Perfil de desenvolvimento e engenharia de software (IF Sudeste MG).
  - **Docente Convidado RFEPCT:** Acesso imediato como visitante para exploração instantânea.
- **Transição para Cadastro:** Botão acessível que abre o modal de novos docentes.

### B. Modal de Cadastro Docente da RFEPCT (`RegisterModal.jsx`)
- **Vínculo Institucional:** Seletor com as principais instituições da Rede Federal (IFNMG, IFMG, IFSULDEMINAS, IFTM, CEFET-MG, IFRJ, CEFET-RJ, IFSP, IFBA, IFCE, IFPE, IFPR, IFRS e opção para outras unidades).
- **Lotação:** Campo textual para especificação do Campus.
- **Área de Atuação Matemática:** Seletores de áreas pedagógicas (Ensino Médio Integrado, Matemática Aplicada, Estatística e Probabilidade, Cálculo em Tecnológicos, Educação Matemática Crítica).
- **Cursos Técnicos Atendidos:** Tags interativas com seleção múltipla (Informática, Mecânica, Eletrotécnica, Agropecuária, Edificações, Administração, Meio Ambiente, etc.).
- **Persistência Local Multiconta:** Os dados cadastrados são armazenados em `localStorage` sob a chave `iaprofept_registered_accounts`, permitindo logins futuros com os dados persistidos.

### C. Modal de Onboarding & Boas-Vindas (`OnboardingModal.jsx`)
- **Trilha Guiada em 5 Passos:**
  1. *Ambiente Formativo:* Trilhas modulares, acervo de legislação e e-books.
  2. *Laboratório de IA:* Geração parametrizada com IA dupla sem caixas de prompt em branco.
  3. *Repositório de Práticas:* Curadoria e compartilhamento de materiais pedagógicos validados.
  4. *Painel de Reflexão Crítica:* Debate ético, artigos e fóruns sobre IA na educação.
  5. *Acompanhamento & Prof. mAIcon:* Assistente pedagógico contextual e suporte.
- **Acessibilidade & Navegação:** Indicadores visuais de etapas (*step dots*), botões *"Anterior"*, *"Próximo"*, *"Pular"* e botão final *"Começar a Explorar"*.
- **Controle de Exibição:** Salva o término em `iaprofept_onboarding_completed` e disponibiliza atalho permanente no cabeçalho (*"Guia dos 5 Ambientes"*) e na barra lateral.

### D. Personalização Dinâmica do Card Inicial (`HomeView.jsx`)
- **Saudação por Turno:** Calcula dinamicamente *Bom dia*, *Boa tarde* ou *Boa noite* com base no horário do sistema.
- **Extração do Primeiro Nome:**
  - Docente Maycon Magalhães $\rightarrow$ *"Boa noite, Maycon."*
  - Docente recém-cadastrado (ex: Carlos Alberto) $\rightarrow$ *"Boa noite, Carlos."*
  - Docente com titulação (ex: Profª. Shayene Figueredo) $\rightarrow$ *"Boa noite, Shayene."*
  - Convidado ou visitante anônimo $\rightarrow$ *"Boa noite, Visitante."*

---

## 🔒 3. Governança dos Dados & Persistência Local

| Chave em `localStorage` | Tipo de Dado | Finalidade |
|---|---|---|
| `iaprofept_user` | `JSON Object` | Sessão ativa do professor (nome, cargo, instituição, campus, cursos). |
| `iaprofept_onboarding_completed` | `string ('true'/'false')` | Sinalizador de conclusão do tour de acolhimento docente. |
| `iaprofept_registered_accounts` | `JSON Array` | Lista de contas criadas localmente no navegador para login persistente. |

---

## 🛡️ 4. Conformidade Ética e com as Diretrizes da Tese

1. **Compromisso com o Não-Rastreamento Abusivo:** Os dados são mantidos no ambiente do cliente (`localStorage`) na Fase 1, sem transmissão a servidores de terceiros.
2. **Acolhimento Formativo:** O onboarding reforça explicitamente o papel central do professor e o princípio inegociável da autoridade docente (ADR-002).
3. **Ausência de Prompt Livre:** O onboarding e o login preparam o professor para o uso parametrizado do Laboratório de IA (ADR-001).

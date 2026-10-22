# Relatório de Desenvolvimento e Engenharia: Plataforma IAProfEPT
> **Produto Educacional (PTT4)** — Programa de Pós-Graduação em Educação Matemática (PPGEM / UFJF)
> **Autor / Doutorando:** Maycon Luiz Amaral Magalhães
> **Engenharia de Software:** Shayene Figueredo & Samuel Amorim

Este documento consolida o passo a passo da construção da plataforma **IAProfEPT**, detalhando as fases de desenvolvimento, as decisões arquiteturais adotadas e o rigor técnico-científico empregado para validar o uso de Inteligência Artificial na Educação Profissional e Tecnológica (EPT).

---

## 1. Princípios e Diretrizes Fundamentais (Os Inegociáveis)
Desde o início da arquitetura, o projeto foi guiado por princípios inegociáveis que garantem o rigor da tese de doutorado e a aplicabilidade pedagógica real:

1. **Autonomia e Validação Docente:** A IA atua como assistente e provocadora, jamais como substituta. Todo conteúdo gerado carrega um banner obrigatório exigindo a validação ética e pedagógica do professor.
2. **Proibição da "Caixa em Branco":** Professores de Matemática não precisam ser engenheiros de prompt. As interações com a IA ocorrem exclusivamente através de formulários estruturados (Componente Curricular, Nível da BNCC, Curso Técnico, Metodologia).
3. **Teste A/B Empírico e IA Dupla:** A infraestrutura foi desenhada para chavear de forma transparente entre **Groq (LLaMA 3.3 70B)** e **Google Gemini 1.5**, permitindo coleta de métricas de performance e qualidade para a pesquisa.
4. **Identidade UFJF e Acessibilidade:** Design system construído sobre a paleta da UFJF (Verdes institucionais), cumprindo diretrizes rígidas de contraste (WCAG AA) e usabilidade.

---

## 2. Fase 1: Arquitetura, Design System e MVP Navegável
Na primeira fase, focamos em entregar o esqueleto front-end navegável (1:1 com o protótipo Figma), garantindo a estabilidade estrutural da plataforma.

* **Stack Tecnológico Inicial:** Optou-se por **React 18 + Vite** para máxima performance, leveza e hot-reload, dispensando complexidades desnecessárias de Server-Side Rendering (SSR) nesse primeiro momento.
* **Design System & UI:** Implementação das tipografias institucionais (Outfit, Plus Jakarta Sans, Space Grotesk para código), modais responsivos e componentes fluidos de alta acessibilidade.
* **Os 5 Ambientes Materializados:**
  1. **Ambiente Formativo:** Trilhas, vídeos de capacitação e acervo de legislações.
  2. **Laboratório de IA:** Formulário restrito para geração de planos de aula e exercícios contextualizados à BNCC e aos eixos da EPT.
  3. **Repositório de Práticas:** Hub comunitário de curadoria, permitindo compartilhamento e exportação.
  4. **Painel de Reflexão:** Fóruns temáticos e espaços de problematização sobre a IA na sociedade.
  5. **Suporte & Assistente mAIcon:** Widget flutuante que contextualiza as dúvidas e fornece guias diretos ao docente.
* **Autenticação e Onboarding:** Construção da tela de login institucional, formulário de cadastro validando o vínculo com a Rede Federal (RFEPCT) e um modal interativo de boas-vindas apresentando os 5 ambientes.

---

## 3. Fase 2: Engenharia de Prompts Ocultos e Motor Backend
Com o front-end estável, a segunda fase avançou para a construção do cérebro tecnológico e dos bastidores (backend).

* **Modelagem de Dados (PostgreSQL):** Criação de esquemas normalizados utilizando Prisma ORM. Foram modeladas entidades cruciais: `Usuarios`, `InteracoesIA`, `MateriaisFormativos`, `PraticasRepositório` e métricas de uso.
* **Motor de Roteamento Inteligente (Circuit Breaker):** Implementação de um middleware avançado capaz de dividir o tráfego 50/50 entre a API do Groq e a do Gemini. Em caso de lentidão ou falha de um provedor, o sistema realiza um *fallback automático* para o outro, garantindo que o professor nunca fique sem resposta.
* **Injeção de Prompts (Server-Side):** A engenharia de prompt não ocorre no navegador. O backend recebe as variáveis (ex: Curso de Eletrotécnica, Função Afim) e injeta em templates complexos que garantem restrições de formatação e alinhamento pedagógico, antes de despachar para o LLM.
* **Gestão do Studio (Ambiente Formativo):** Criação de uma área administrativa protegida para upload de novos materiais, videoaulas e E-books sem a necessidade de reescrever o código da aplicação.

---

## 4. Fase 3 e 4: Preparação DevOps, Testes e Produção
Para garantir que a plataforma sustente o Piloto A/B com dezenas de professores da RFEPCT acessando simultaneamente, aplicamos rigorosas práticas de Engenharia de Confiabilidade (SRE) e Qualidade.

* **Cobertura de Testes de Software:** Desenvolvimento de uma robusta suíte de testes (Vitest / Pytest) cobrindo rotas críticas, validação do schema do banco e simulação de mocks das APIs do Groq e Gemini.
* **Testes de Carga e Concorrência:** Simulação estresse usando ferramentas como *k6/Artillery*, provando que a API de IA aguenta filas e requisições massivas sem consumir memória excessiva ou derrubar o banco de dados.
* **Políticas de Backup (Disaster Recovery):** Automação de `pg_dump` via CRON para backup diário do banco de dados, com compressão, retenção de 30 dias e scripts de restauração em menos de 15 minutos, protegendo os dados empíricos da tese.
* **Deploy e Infraestrutura (Servidores UFJF):** Configuração em ambiente Linux de produção com PM2 gerenciando o ciclo de vida do Node.js, banco PostgreSQL endurecido com políticas restritas de acesso e um proxy reverso **Nginx** orquestrando certificados SSL (HTTPS) sob o subdomínio oficial da UFJF.

---

## 5. Resumo das Decisões Arquiteturais (ADRs) Documentadas

Ao longo do desenvolvimento, registramos **25 Architectural Decision Records (ADRs)** para rastreabilidade acadêmica. Entre as mais críticas:

- **ADR 001:** Proibição de prompts em branco para foco total na avaliação e não na operação técnica.
- **ADR 002:** Obrigatoriedade do banner ético validando o papel insubstituível do professor.
- **ADR 003, 013 e 014:** Desenho do Teste A/B de 30 dias e da infraestrutura de Fallback Groq ↔ Gemini.
- **ADR 005 e 008:** Controle rigoroso de cadastro para docentes da RFEPCT e aceite do Termo de Consentimento (TCLE) aprovado pelo CEP/UFJF.
- **ADR 016 e 025:** Estruturação dos dados gerados visando a posterior exportação estatística para a tese e análise qualitativa.

---

> **Status Atual:** A plataforma transicionou com sucesso do MVP navegável (Fase 1) para a maturidade de integração de IAs e infraestrutura backend (Fase 2). A aplicação encontra-se empacotada, testada em carga, resguardada por políticas de backup de dados e devidamente provisionada para rodar em alta disponibilidade nos servidores da UFJF, pronta para o Teste A/B empírico na Rede Federal.
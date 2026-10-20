# ADR 025: API de Métricas do Portfólio Formativo e Canal de Ajuda

## 1. Contexto & Justificativa
O Ambiente 5, além do Prof. mAIcon, abriga o sistema de Suporte do docente e a consolidação do seu Portfólio Formativo. Para fortalecer o engajamento e evidenciar o impacto da Plataforma na formação do professor da EPT, foi solicitada uma API que consolide métricas de uso e também ofereça um canal de comunicação direta com a equipe da pesquisa.

### Relação com os Princípios do Projeto
- **Feedback Constante e Acompanhamento:** Ao unificar as métricas, o professor consegue ver concretamente sua produção.
- **Rastreabilidade e Melhoria Contínua:** Tickets de suporte (dúvidas, bugs e sugestões) servem como dados qualitativos cruciais para a Tese de Doutorado.

## 2. Decisão Arquitetural
- **Criação da Migration `20261019194001_create_tickets_suporte.js`:** Adiciona a tabela `tickets_suporte` contendo `assunto`, `mensagem`, `tipo` ('duvida', 'bug', 'sugestao') e controle de status. Há chave estrangeira com a tabela `usuarios`.
- **`GET /api/suporte/metricas-docente`**: Executa contagens separadas e otimizadas em tabelas-chave vinculadas ao usuário logado:
  - `progresso_trilhas` onde `status` é igual a 'concluida'.
  - `requisicoes_ia` representando as gerações feitas no Laboratório de IA.
  - `praticas_repositorio` registrando as práticas autorais enviadas ao hub.
  - `topicos_forum` + `respostas_forum` sinalizando a taxa de participação e diálogo na comunidade (Painel de Reflexão).
- **`POST /api/suporte/ticket`**: Insere o feedback ou a dúvida que será acompanhada pela equipe de pesquisa.

## 3. Impacto no Produto Educacional
Esses endpoints instrumentalizam os dashboards do painel inicial de cada docente logado, permitindo táticas de gamificação e autoavaliação (ex: "Você já contribuiu com 5 práticas!"). A captura de tickets facilita os relatórios pós-teste A/B para relatar atritos técnicos identificados pelos usuários.

## 4. Verificação de Acessibilidade & UX
O endpoint retorna os dados planos e já tipados como inteiros (`trilhasConcluidas`, `materiaisGerados`, `praticasCompartilhadas`, `participacaoForuns`), poupando os clientes frontend de precisarem somar strings retornadas do `COUNT()` do PostgreSQL, agilizando a renderização e reduzindo bugs de tipagem no lado do cliente.


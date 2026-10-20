# ADR 022: API de Fóruns Moderados e Respostas em Árvore Recursiva

## 1. Contexto & Justificativa
A Plataforma IAprofEPT conta com o **Painel de Reflexão**, um espaço dedicado à problematização ética e ao debate crítico sobre o uso de IA na Educação Profissional e Tecnológica (EPT).
Foi requisitada a criação de uma API capaz de suportar tópicos de discussão e uma estrutura hierárquica (em árvore) para os comentários/respostas dos docentes.

### Relação com os Princípios do Projeto
- **Rigor Científico & Rastreabilidade:** A persistência deve garantir integridade transacional, contabilização exata de respostas e controle de cascata.
- **Painel de Reflexão (Ambiente 4):** Promove o letramento crítico e a interação entre os professores da RFEPCT.

## 2. Decisão Arquitetural
A modelagem adotada para resolver a hierarquia de comentários no PostgreSQL utiliza **CTE (Common Table Expressions) Recursivas** (cláusula `WITH RECURSIVE`).

### Estrutura de Tabelas:
As tabelas `topicos_forum` e `respostas_forum` já haviam sido provisionadas pela _Migration_ de fórum e auditoria (`20261013100006_create_forum_and_auditoria.js`).
1. **`topicos_forum`:** Armazena os debates, possuindo um contador desnormalizado `total_respostas` para rápida listagem e paginação sem custo excessivo de agregação.
2. **`respostas_forum`:** Armazena as postagens, usando `resposta_pai_id` auto-referenciado com `ON DELETE CASCADE` para viabilizar as árvores de discussão.

### Endpoints Implementados (`/api/reflexao`):
- `GET /api/reflexao/topicos`: Retorna os tópicos disponíveis ordenados por data de atualização e status de fixação.
- `POST /api/reflexao/topicos`: Abre um novo fórum.
- `GET /api/reflexao/topicos/:id/respostas`: Executa a CTE recursiva no banco para construir toda a árvore de debate numa única query, com junção (LEFT JOIN) em memória de O(N) linear para serializar os dados no formato de _nested arrays_ para consumo do Front-end.
- `POST /api/reflexao/topicos/:id/respostas`: Inclui transação para inserir uma resposta e, simultaneamente de forma atômica, atualizar o contador `total_respostas` e o `updated_at` do tópico original.

## 3. Impacto no Produto Educacional
- **Ambiente Afetado:** Painel de Reflexão.
- A árvore recursiva permite que a interface gráfica identifique claramente quem respondeu a quem, enriquecendo os fóruns comunitários. 

## 4. Verificação de Acessibilidade & UX
A devolução no formato em árvore (`[{ id, conteudo, respostas: [...] }]`) facilita a construção de componentes recursivos e alinhados em níveis de indentação no frontend. A CTE ordena previamente as respostas cronologicamente pelo caminho gerado (`caminho_ordenacao`), preservando o fio lógico da conversa.


# ADR 023: API de Gestão de Artigos Críticos e Provocações Pedagógicas

## 1. Contexto & Justificativa
O "Painel de Reflexão" (Ambiente 4) é central para garantir que a plataforma promova um uso ético e crítico da IA. Para complementar os fóruns de debate, era necessário fornecer insumos teóricos qualificados por meio de **Artigos Críticos** e **Provocações Pedagógicas** curadas.

### Relação com os Princípios do Projeto
- **Compromisso Ético e Rastreabilidade:** Todos os recursos consumidos pelos docentes sobre a temática de IA, Algoritmos e Educação Matemática Crítica são mantidos sob versionamento estruturado.
- Os endpoints garantem que o docente possa monitorar o que já leu e o que deseja ler posteriormente, fomentando a aprendizagem continuada.

## 2. Decisão Arquitetural
Foi estruturado um fluxo de dados baseado em 3 tabelas criadas na Migration `20261019153001_create_artigos_provocacoes_reflexao.js`:
- **`artigos_reflexao`:** Textos mais densos, com resumo e referências bibliográficas.
- **`provocacoes_reflexao`:** Textos curtos (tempo estimado de leitura 1-2 min) visando engajamento rápido.
- **`interacoes_reflexao`:** Tabela associativa polimórfica que rastreia os estados `lido` e `favorito` de cada recurso individualmente para cada `usuario_id`.

### Endpoints
- `GET /api/reflexao/artigos`: Lista paginada dos artigos.
- `GET /api/reflexao/artigos/:id`: Detalhes do artigo.
- `GET /api/reflexao/provocacoes`: Lista paginada de provocações.
- `GET /api/reflexao/provocacoes/:id`: Detalhe da provocação.
- `POST /api/reflexao/interacoes`: Comando *Upsert* (ON CONFLICT DO UPDATE) atômico que marca um item como lido e/ou favorito, mantendo integridade mesmo em concorrência. 

## 3. Impacto no Produto Educacional
A leitura e o registro de progresso nos artigos fortalecem o perfil formador do sistema. O teste automatizado assegurou que o JOIN com as interações funciona de maneira imperceptível, entregando via API o exato estado daquele recurso para o usuário logado (`req.user`), enquanto ainda permite visualização deslogada (estado `false`).

## 4. Verificação de Acessibilidade & UX
O atributo `tempo_leitura_minutos` está sendo trafegado para o frontend, propiciando à interface a habilidade de exibir *badges* do tipo "Leitura Rápida: 2 min", melhorando drasticamente o engajamento e a UX da listagem dos artigos.


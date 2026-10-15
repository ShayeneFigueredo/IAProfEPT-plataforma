# 🏛️ Documento de Decisão Arquitetural (ADR-009)
## Middleware de Autorização e Controle de Acesso Baseado em Papéis (RBAC)

- **Status:** Aprovado / Implementado
- **Data da Decisão:** Outubro / 2026
- **Contexto da Pesquisa:** Tese de Doutorado em Educação Matemática (PPGEM / UFJF)
- **Autor / Doutorando:** Maycon Luiz Amaral Magalhães
- **Engenharia de Software:** Shayene Figueredo & Samuel Amorim
- **Orientadores:** Prof. Dr. Eduardo Barrére | Prof. Dr. Manuel José Cabral dos Santos Reis
- **Classificação CAPES:** Produto Técnico-Tecnológico (PTT4 - Software/Plataforma Educacional)
- **Referência Jira:** `[Auth Backend]` / `[RBAC Middleware]` | **Fase:** 2

---

## 🎯 1. Contexto & Justificativa Científico-Pedagógica

No ecossistema da **Plataforma IAprofEPT**, três perfis distintos de atores interagem com a solução tecnológica e com o banco de dados institucional:
1. **`docente_rfepct` (Perfil Base):** Professores de Matemática pertencentes a Institutos Federais, CEFETs e Colégios Técnicos Vinculados da Rede Federal. Têm acesso aos recursos pedagógicos (5 Ambientes: Formativo, Laboratório de IA, Repositório de Práticas, Painel de Reflexão e Suporte mAIcon), mas **não podem** visualizar dados administrativos brutos, logs de auditoria de outros servidores ou consolidadores estatísticos restritos à pesquisa.
2. **`pesquisador_doutorado` (Perfil Científico):** Doutorando Maycon Luiz Amaral Magalhães e equipe de orientação (Prof. Dr. Eduardo Barrére e Prof. Dr. Manuel Cabral dos Santos Reis). Têm acesso a todos os recursos docentes mais os **dados empíricos da tese de doutorado**: consolidação estatística do Teste A/B (Groq LLaMA 3.3 vs Google Gemini 1.5), taxas de latência, dispersão de tokens, distribuição de avaliações qualitativas e relatórios de conformidade ética do TCLE (CEP/UFJF).
3. **`administrador_ufjf` (Perfil Governança & Infraestrutura):** Equipe técnica de servidores da Universidade Federal de Juiz de Fora (UFJF). Acesso pleno a logs de auditoria (`logs_auditoria`), gestão de status de contas de usuários (ativação, suspensão), métricas de saúde da infraestrutura e segurança da informação.

Para garantir segurança, privacidade (LGPD), conformidade ética (Resolução CNS 510/2016) e isolamento dos dados da pesquisa, era mandatório estabelecer um middleware de autorização RBAC rigoroso no backend.

---

## 🏗️ 2. Arquitetura da Solução Implementada

### A. Definição Centralizada de Papéis (`roles.js`)
Criado o módulo [`backend/src/config/roles.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/config/roles.js) definindo os papéis oficiais:
- `ROLES.DOCENTE_RFEPCT = 'docente_rfepct'`
- `ROLES.PESQUISADOR_DOUTORADO = 'pesquisador_doutorado'`
- `ROLES.ADMINISTRADOR_UFJF = 'administrador_ufjf'`

### B. Middleware RBAC Reutilizável (`rbacMiddleware.js`)
Localizado em [`backend/src/middlewares/rbacMiddleware.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/middlewares/rbacMiddleware.js) e exportado também em `authMiddleware.js`:
- Função principal: `authorizeRoles(...roles)` aceita argumentos individuais ou arrays de papéis autorizados.
- **Fluxo de Validação:**
  1. Se a requisição não contém token ou usuário autenticado (`req.user`), intercepta imediatamente com **`401 Unauthorized`** padronizado pelo RFC 7807 Problem Details.
  2. Se a requisição possui token válido, mas o perfil (`req.user.role`) não pertence à lista de papéis permitidos para aquele recurso, intercepta compulsoriamente com **`403 Forbidden`**.
  3. Se a requisição possui token válido e o papel corresponde aos autorizados, executa `next()` e encaminha a requisição ao controlador correspondente.
- Predefinições ergonômicas exportadas:
  - `requireAdmin`: Atalho para `[ROLES.ADMINISTRADOR_UFJF]`
  - `requirePesquisador`: Atalho para `[ROLES.PESQUISADOR_DOUTORADO, ROLES.ADMINISTRADOR_UFJF]`
  - `requireDocente`: Atalho para todos os usuários autenticados.

### C. Endpoints Protegidos Implementados

#### 1. Métricas da Tese & Telemetria A/B (`/api/metricas`)
- **Acesso Autorizado:** `pesquisador_doutorado` e `administrador_ufjf`
- **`GET /api/metricas/tese`:** Retorna metadados da tese, estatísticas de inferência comparada (Groq vs Gemini), distribuição geográfica de docentes por UF na RFEPCT, volume de requisições por modalidade no Laboratório de IA e auditoria de 100% de consentimentos TCLE.
- **`GET /api/metricas/telemetria-ab`:** Retorna registros brutos anonimizados de inferência da tabela `telemetria_ab` para inclusão e análise matemática no texto da tese de Maycon Magalhães.

#### 2. Governança e Gestão Administrativa (`/api/admin`)
- **Acesso Autorizado:** `administrador_ufjf`
- **`GET /api/admin/usuarios`:** Listagem paginada de docentes e pesquisadores (com filtros por papel, status e termo textual), preservando o segredo criptográfico (sem expor `senha_hash`).
- **`PATCH /api/admin/usuarios/:id/status`:** Alteração segura de status da conta de usuário (`ativo`, `pendente`, `suspenso`, `inativo`) com registro do evento em `logs_auditoria`.
- **`GET /api/admin/auditoria`:** Consulta aos registros de auditoria do sistema para verificação de conformidade e segurança da informação.
- **`GET /api/admin/estatisticas`:** Visão consolidada de contadores do sistema e saúde da infraestrutura.

---

## 🧪 3. Matriz de Testes & Critérios de Aceite Verificados

A suíte automatizada em [`backend/src/test-rbac.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/test-rbac.js) executa testes unitários e testes ponta a ponta (E2E) via protocolo HTTP:

| Cenário de Teste | Rota Alvo | Credencial / Papel | Resultado Esperado | Status |
|---|---|---|---|---|
| **Sem Token** | `/api/admin/usuarios` | Ausente | `401 Unauthorized` | ✅ Aprovado |
| **Sem Token** | `/api/metricas/tese` | Ausente | `401 Unauthorized` | ✅ Aprovado |
| **Token Adulterado** | `/api/admin/usuarios` | Assinatura inválida | `401 Unauthorized` | ✅ Aprovado |
| **Papel Insuficiente** | `/api/admin/usuarios` | `docente_rfepct` | `403 Forbidden` | ✅ Aprovado |
| **Papel Insuficiente** | `/api/metricas/tese` | `docente_rfepct` | `403 Forbidden` | ✅ Aprovado |
| **Papel Insuficiente** | `/api/admin/usuarios` | `pesquisador_doutorado` | `403 Forbidden` | ✅ Aprovado |
| **Papel Autorizado** | `/api/metricas/tese` | `pesquisador_doutorado` | `200 OK` | ✅ Aprovado |
| **Papel Autorizado** | `/api/metricas/tese` | `administrador_ufjf` | `200 OK` | ✅ Aprovado |
| **Papel Autorizado** | `/api/admin/usuarios` | `administrador_ufjf` | `200 OK` | ✅ Aprovado |
| **Papel Autorizado** | `/api/admin/auditoria` | `administrador_ufjf` | `200 OK` | ✅ Aprovado |
| **Papel Autorizado** | `/api/admin/estatisticas` | `administrador_ufjf` | `200 OK` | ✅ Aprovado |

---

## 🛡️ 4. Conformidade Ética e com as Diretrizes da Tese

1. **Rastreabilidade Científica:** O perfil `pesquisador_doutorado` permite que Maycon Magalhães consulte e exporte estatísticas agregadas em tempo real durante o período empírico do teste A/B sem comprometer dados pessoais sensíveis dos professores.
2. **Preservação do Princípio da Autoridade Docente:** Professores da Rede Federal têm seu espaço de atuação focado no desenvolvimento pedagógico, preservados de complexidades operacionais do backend.
3. **Banner Ético Obrigatório:** Todas as saídas de métricas científicas contêm o lembrete explícito da validação e autoridade docente.

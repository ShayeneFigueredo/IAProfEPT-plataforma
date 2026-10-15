# 🏛️ ADR-007: Fluxo Seguro de Recuperação e Redefinição de Senha com Tokens de Uso Único
> **Documento de Registro de Decisão Arquitetural (ADR)**  
> **Projeto de Tese de Doutorado** — Programa de Pós-Graduação em Educação Matemática (PPGEM / UFJF)  
> **Doutorando:** Maycon Luiz Amaral Magalhães  
> **Engenharia de Software:** Shayene Figueredo & Samuel Amorim  
> **Orientação:** Prof. Dr. Eduardo Barrére | Prof. Dr. Manuel José Cabral dos Santos Reis  
> **Referência Jira:** `[IAPROF-3.7]` / `[Auth Backend]`  

---

## 📌 1. Status
**APROVADO / IMPLEMENTADO** (Outubro / 2026 — Fase 2)

---

## 🎯 2. Contexto & Justificativa Científica e Pedagógica
A plataforma **IAprofEPT** atua como Produto Educacional Técnico-Tecnológico (PTT4 / CAPES) para docentes de Matemática da Rede Federal de Educação Profissional, Científica e Tecnológica (RFEPCT).

No contexto de experimentação pedagógica e coleta de dados para a pesquisa de doutorado:
1. **Proteção à Identidade e Privacidade Docente (LGPD & Resolução CNS 510/2016):** Docentes participantes não podem ter seus e-mails institucionais expostos a ataques de enumeração ou varredura de contas ativas.
2. **Mitigação de Riscos de Engenharia Social:** O mecanismo de recuperação de credenciais deve garantir que apenas o legítimo detentor da conta institucional consiga redefinir seu acesso.
3. **Resiliência e Continuidade em Ambientes Piloto:** Em fases de teste e homologação na UFJF e nos Institutos Federais participantes, o fluxo deve disponibilizar logs estruturados e simulação segura de envio de e-mail (mock seguro), sem dependência prematura de provedores SMTP externos em redes institucionais restritivas.

---

## 💡 3. Decisão Arquitetural

Implementa-se o fluxo de recuperação e redefinição segura de senha em dois endpoints RESTful protegidos por taxa de requisições (`authRateLimiter`), persistência transacional no PostgreSQL 16+ e arquitetura multicamada (*Controller $\rightarrow$ Service $\rightarrow$ Repository*).

### A. Endpoint de Solicitação: `POST /api/auth/forgot-password`
1. **Entrada Aceita:** E-mail institucional (`@*.edu.br` ou domínios homologados) ou matrícula SIAPE via validador Zod `forgotPasswordSchema`.
2. **Proteção contra Enumeração de Contas:** Caso o e-mail não exista na base de dados, a API responde com o mesmo status HTTP 200 e mensagem genérica:
   > *"Se o e-mail institucional informado estiver cadastrado na plataforma, as instruções de redefinição foram enviadas."*
3. **Geração de Token Criptográfico de Alta Entropia:** Geração de token aleatório de 320 bits (40 bytes hexadecimais via `crypto.randomBytes`).
4. **Proteção em Repouso via Hash SHA-256:** O token bruto nunca é salvo em texto plano no banco; apenas o seu hash SHA-256 (`token_hash`) é persistido na tabela `tokens_recuperacao_senha`.
5. **Janela de Validade Estrita de 2 Horas:** O campo `expira_em` é gravado com `NOW() + INTERVAL '2 hours'`.
6. **Invalidação de Tokens Prévios:** Quaisquer tokens de recuperação pendentes gerados anteriormente para o mesmo docente são revogados compulsoriamente antes da gravação do novo token.
7. **Mock Seguro de Envio em Piloto:** Em desenvolvimento e homologação piloto, o link de recuperação é emitido em console formatado com dados de auditoria (`expiraEm`, `destinatário` e `resetUrl`).

### B. Endpoint de Redefinição: `POST /api/auth/reset-password`
1. **Entrada Validada:** `{ token, novaSenha, confirmacaoSenha }` submetidos ao validador Zod `resetPasswordSchema`.
2. **Requisitos Estritos de Senha Forte:**
   - Mínimo de 8 caracteres;
   - Ao menos uma letra maiúscula e uma minúscula;
   - Ao menos um dígito numérico (0-9);
   - Ao menos um caractere especial (`!@#$%^&*...`).
3. **Validação de Uso Único (Single-Use Token):**
   - Caso `usado = TRUE`, a API rejeita compulsoriamente com HTTP 400 Bad Request: *"Este token de recuperação já foi utilizado anteriormente."*
4. **Validação Estrita de Expiração:**
   - Caso `expira_em < NOW()`, a API rejeita compulsoriamente com HTTP 400 Bad Request: *"Este token de recuperação de senha expirou (validade máxima de 2 horas)."*
5. **Atualização Criptográfica da Credencial:**
   - Senha codificada com `bcrypt` salt factor 12;
   - Zera contadores de falhas de login (`tentativas_login_falhas = 0`) e remove eventuais bloqueios temporários (`bloqueado_ate = NULL`).
6. **Revogação Compulsória de Sessões Anteriores:**
   - Todos os Refresh Tokens ativos do docente são revogados na tabela `refresh_tokens`, impedindo que sessões abertas anteriormente permaneçam ativas.
7. **Consumo Atômico do Token:**
   - O token é marcado com `usado = TRUE`, `usado_em = NOW()` e registro do IP do cliente requisitante.
8. **Rastreabilidade e Auditoria:**
   - Registro de evento `auth.senha_redefinida_sucesso` na tabela `logs_auditoria`.

---

## 🗄️ 4. Estrutura da Tabela no PostgreSQL (`tokens_recuperacao_senha`)

```sql
CREATE TABLE tokens_recuperacao_senha (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expira_em TIMESTAMPTZ NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    usado_em TIMESTAMPTZ,
    ip_solicitacao VARCHAR(64),
    user_agent_solicitacao TEXT,
    ip_uso VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reset_tokens_usuario ON tokens_recuperacao_senha(usuario_id);
CREATE INDEX idx_reset_tokens_hash ON tokens_recuperacao_senha(token_hash);
CREATE INDEX idx_reset_tokens_status ON tokens_recuperacao_senha(expira_em, usado);
```

---

## 🧪 5. Critérios de Aceite & Suíte de Testes Automatizados

A funcionalidade é integralmente coberta pelo script `backend/src/test-recovery.js` (`npm run auth:recovery:test`):

| Teste | Descrição da Verificação | Resultado |
|---|---|---|
| **Teste 1** | POST `/api/auth/forgot-password` com e-mail institucional | **200 OK / Token Gerado** |
| **Teste 2** | Auditoria de persistência no PostgreSQL com validade de 2h | **120 minutos exatos / Usado = false** |
| **Teste 3** | Proteção contra enumeração (e-mail inexistente) | **200 OK / Resposta idêntica sem vazamento** |
| **Teste 4** | POST `/api/auth/reset-password` com nova senha e confirmação | **200 OK / Senha atualizada** |
| **Teste 5** | Auditoria do novo hash bcrypt salt 12 no banco de dados | **Sucesso / Senha antiga invalidada** |
| **Teste 6** | Critério de Aceite: Rejeição de reuso do mesmo token | **400 Bad Request ("já foi utilizado")** |
| **Teste 7** | Critério de Aceite: Rejeição de token expirado (> 2h) | **400 Bad Request ("expirou")** |
| **Teste 8** | Rejeição de nova senha fraca (validação Zod) | **422 Unprocessable Entity** |
| **Teste 9** | Autenticação bem-sucedida com a nova senha redefinida | **200 OK / Access Token emitido** |

---

## 🛡️ 6. Conformidade Ética e com os Princípios do Projeto
- **Zero Vazamento de Senhas:** Nenhuma credencial ou token bruto é mantido em repouso sem hashing criptográfico unidirecional.
- **Autoridade Docente Respeitada:** O fluxo garante autonomia total ao professor para recuperar seu acesso à plataforma sem intermediários ou atrasos burocráticos.
- **Rigor Científico da Tese:** A rastreabilidade das ações de auditoria é integralmente preservada para fundamentar o relatório metodológico do Produto Educacional (PTT4).

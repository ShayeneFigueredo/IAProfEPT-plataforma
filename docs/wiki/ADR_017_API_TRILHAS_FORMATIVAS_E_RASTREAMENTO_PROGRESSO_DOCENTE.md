# ADR 017: API de Trilhas, Módulos e Rastreamento de Progresso Docente no Ambiente Formativo

> **Documento de Governança Arquitetural & Rastreabilidade Científica**  
> **Projeto de Tese de Doutorado** — Programa de Pós-Graduação em Educação Matemática (PPGEM / UFJF)  
> **Doutorando:** Maycon Luiz Amaral Magalhães  
> **Engenharia de Software:** Shayene Figueredo & Samuel Amorim  
> **Orientador:** Prof. Dr. Eduardo Barrére | **Coorientador:** Prof. Dr. Manuel José Cabral dos Santos Reis  
> **Data de Registro:** 17/10/2026  
> **Fase do Projeto:** Fase 2 (Backend IA Dupla & Ambientes) / Ambiente Formativo  

---

## 📌 1. Status
**Aprovado e Implementado**. Endpoints REST do Ambiente Formativo (`GET /api/formativo/trilhas`, `GET /api/formativo/trilhas/:id` e `POST /api/formativo/progresso`) plenamente operacionais, conectados à tabela relacional `progresso_trilhas` no PostgreSQL com garantia de persistência e retomada contínua de sessões formativas pelos docentes da RFEPCT.

---

## 🎯 2. Contexto Científico & Requisitos Pedagógicos da EPT

O **Ambiente Formativo** (Ambiente 1 dos 5 Ambientes da Plataforma IAprofEPT) constitui o alicerce pedagógico do Produto Educacional (PTT4/CAPES). Seu propósito é fornecer formação continuada em Inteligência Artificial para professores de Matemática da Rede Federal de Educação Profissional, Científica e Tecnológica (RFEPCT).

### As 4 Trilhas Formativas Oficiais:
1. **Fundamentos da Inteligência Artificial (`trilha-fundamentos`):** 6 aulas, 40 horas.
   - Da lógica simbólica aos modelos conexionistas, arquitetura Transformer, embeddings, tensores e alucinações.
2. **Ética e Pensamento Crítico no Uso de IA (`trilha-etica`):** 5 aulas, 40 horas.
   - Vieses algorítmicos em problemas matemáticos, privacidade (LGPD), termos de consentimento (CEP/UFJF) e o princípio inegociável da autoridade docente.
3. **Possibilidades Didáticas com Ferramentas Generativas (`trilha-didatica`):** 7 aulas, 45 horas.
   - Engenharia de prompts parametrizada (anti-prompt em branco), articulação BNCC x CNCT, sequências didáticas e metodologia do erro produtivo.
4. **Estudos de Caso e Práticas Docentes na EPT (`trilha-casos`):** 6 aulas, 45 horas.
   - Experiências reais nos eixos de Infraestrutura, Gestão e Negócios, Informação e Comunicação e Controle Industrial.

### Critérios de Aceite Críticos:
- **`GET /api/formativo/trilhas`:** Lista completa das 4 trilhas com contadores de aulas, carga horária e percentual individual de conclusão de cada professor.
- **`GET /api/formativo/trilhas/:id`:** Detalhamento curricular dos módulos, aulas, URLs de streaming de vídeo (YouTube) e materiais de apoio.
- **`POST /api/formativo/progresso`:** Gravação atômica da conclusão de cada aula no PostgreSQL, recalculando a porcentagem da trilha.
- **Critério de Aceite Inegociável:** Persistência do progresso permitindo que o docente feche o navegador, reinicie a sessão e retome exatamente de onde parou.

---

## 🏛️ 3. Decisão Arquitetural e Modelagem de Dados

### A. Tabela PostgreSQL: `progresso_trilhas`
Atrelada à constraint de integridade referencial `CASCADE` com `usuarios` e `trilhas_formativas`:

```sql
CREATE TABLE progresso_trilhas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    trilha_id UUID NOT NULL REFERENCES trilhas_formativas(id) ON DELETE CASCADE,
    percentual_conclusao NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    aulas_concluidas JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(30) NOT NULL DEFAULT 'em_andamento',
    ultima_atividade_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_progresso_usuario_trilha UNIQUE (usuario_id, trilha_id)
);
```

### B. Cálculo Matemático de Conclusão e Status
$$\text{percentual\_conclusao} = \min\left(100.00, \text{round}\left(\frac{\text{length}(aulas\_concluidas)}{\text{total\_aulas}} \times 100, 2\right)\right)$$

- Se `percentual_conclusao >= 100.00`: `status = 'concluido'`.
- Se `0 < percentual_conclusao < 100.00`: `status = 'em_andamento'`.
- Se `percentual_conclusao == 0.00`: `status = 'disponivel'` (se Módulo 1 ou trilha anterior concluída) ou `status = 'bloqueado'`.

### C. Desbloqueio Sequencial Curricular
A plataforma incentiva o percurso pedagógico lógico:
- O Módulo 1 (`trilha-fundamentos`) sempre se inicia desbloqueado (`disponivel`).
- O Módulo $N+1$ se torna `disponivel` assim que o Módulo $N$ atinge 100% de conclusão.
- Professores podem desmarcar aulas caso queiram revisar o percurso, momento em que o percentual é decrementado consistentemente.

---

## 📊 4. Endpoints Disponibilizados

| Método | Rota | Autenticação | Finalidade Pedagógica / Operacional |
|---|---|---|---|
| `GET` | `/api/formativo/trilhas` | Opcional (`optionalAuthenticateToken`) | Lista as 4 trilhas com contadores de aulas e status de progresso do docente. |
| `GET` | `/api/formativo/trilhas/:id` | Opcional (`optionalAuthenticateToken`) | Entrega módulos, aulas, vídeos (YouTube) e materiais de apoio da trilha. |
| `POST` | `/api/formativo/progresso` | Obrigatória (`authenticateToken`) | Registra a conclusão/desmarcação de aula no PostgreSQL e recalcula o percentual. |

---

## 🛡️ 5. Evidências de Teste e Validação

Suite automatizada desenvolvida em [`backend/src/test-formativo-trilhas.js`](file:///c:/apps/IAProfEPT/PLATAFORMA/backend/src/test-formativo-trilhas.js):

- **54 / 54 testes passaram com 100% de sucesso**:
  1. Listagem das 4 trilhas para visitantes anônimos com contadores (6, 5, 7, 6 aulas).
  2. Identificação de docente autenticado com percentual inicial 0%.
  3. Consulta por código (`trilha-fundamentos`), ordem numérica (`2`) e UUID.
  4. Resposta 404 padronizada RFC 7807 Problem Details (`Recurso Não Encontrado`).
  5. Bloqueio 401 Unauthorized para atualização sem credencial JWT.
  6. Validação estrita de parâmetros (422 Unprocessable Entity).
  7. **Persistência e Retomada:** Gravação das aulas 1, 2 e 3 (50%) com conferência em nova requisição.
  8. Conclusão integral (100%) e desbloqueio dinâmico da Trilha 2.
  9. Desmarcação de aula com recálculo consistente para 83.33%.

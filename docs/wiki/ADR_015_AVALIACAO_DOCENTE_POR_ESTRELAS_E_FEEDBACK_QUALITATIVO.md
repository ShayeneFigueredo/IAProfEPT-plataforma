# ADR 015: Instrumentação de Avaliação Docente por Estrelas (1 a 5) e Feedback Qualitativo da Telemetria A/B

> **Documento de Governança Arquitetural & Rastreabilidade Científica**  
> **Projeto de Tese de Doutorado** — Programa de Pós-Graduação em Educação Matemática (PPGEM / UFJF)  
> **Doutorando:** Maycon Luiz Amaral Magalhães  
> **Engenharia de Software:** Shayene Figueredo & Samuel Amorim  
> **Orientador:** Prof. Dr. Eduardo Barrére | **Coorientador:** Prof. Dr. Manuel José Cabral dos Santos Reis  
> **Data de Registro:** 16/10/2026  
> **Fase do Projeto:** Fase 2 (Backend IA Dupla & Telemetria) / Preparação Fase 3 (Teste A/B de 30 Dias)  

---

## 📌 1. Status
**Aprovado e Implementado**. Endpoint `POST /api/telemetria/avaliacao` operacional com validação estrita (1 a 5 estrelas), normalização de tags pedagógicas canônicas, sanitização de comentários críticos e garantia relacional de impedimento de duplicidade no PostgreSQL via constraint única `(requisicao_ia_id, usuario_id_hash)` e resposta HTTP 409 Conflict.

---

## 🎯 2. Contexto Científico & Requisitos da Tese

O experimento empírico comparativo de 30 dias (20/10 a 20/11/2026) preconiza a triangulação entre:
1. **Métricas Computacionais de Inferência (Quantitativas):** Latência de resposta (ms), tokens de prompt, tokens de completion e taxa de fallback registradas na tabela `telemetria_ab`.
2. **Avaliação da Percepção Docente (Mista: Quantitativa + Qualitativa):**
   - **Escala de Likert (1 a 5 estrelas):** Mede a satisfação global do professor de Matemática da RFEPCT com o material gerado.
   - **4 Dimensões Qualitativas da Educação Matemática na EPT:**
     - *Rigor Matemático:* Precisão de conceitos, fórmulas e raciocínio lógico formal.
     - *Contextualização EPT:* Articulação real com os eixos tecnológicos do CNCT e situações do mundo do trabalho.
     - *Clareza do Gabarito:* Explicitação passo a passo da resolução para mediação pedagógica.
     - *Adequação à BNCC:* Correspondência às competências e habilidades curriculares do Ensino Médio/EPT.
   - **Comentário Crítico Docente (Opcional):** Espaço para apontamentos pedagógicos qualitativos que enriquecerão a análise de conteúdo da tese.

### Critérios de Aceite Críticos:
- Endpoint oficial: `POST /api/telemetria/avaliacao`.
- Registro vinculado atomicamente à geração correspondente (`requisicoes_ia`) e ao registro de telemetria A/B (`telemetria_ab`).
- **Impedimento Inegociável de Avaliações Duplicadas:** O mesmo professor não pode votar mais de uma vez na mesma geração (prevenção de enviesamento estatístico da amostra da tese). Retorno obrigatório: HTTP 409 Conflict.
- Preservação da conformidade ética e anonimização do docente via hash SHA-256 (Resolução CNS 510/2016 e CEP/UFJF).

---

## 🏛️ 3. Decisão Arquitetural e Modelagem de Dados

### A. Tabela PostgreSQL: `avaliacoes_telemetria_ab`
Criada pela migration `20261016161501_create_avaliacoes_telemetria_ab.js`:

```sql
CREATE TABLE avaliacoes_telemetria_ab (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requisicao_ia_id UUID NOT NULL REFERENCES requisicoes_ia(id) ON DELETE CASCADE,
  telemetria_ab_id UUID NULL REFERENCES telemetria_ab(id) ON DELETE SET NULL,
  usuario_id UUID NULL REFERENCES usuarios(id) ON DELETE SET NULL,
  usuario_id_hash VARCHAR(64) NOT NULL,
  nota_estrelas SMALLINT NOT NULL CHECK (nota_estrelas BETWEEN 1 AND 5),
  tags_qualitativas JSONB NOT NULL DEFAULT '[]',
  comentario_critico TEXT NULL,
  motor_ia VARCHAR(20) NULL,           -- Desnormalizado para relatórios rápidos da tese
  modelo_especifico VARCHAR(100) NULL,  -- Desnormalizado (llama-3.3-70b vs gemini-1.5)
  grupo_experimental VARCHAR(10) NULL, -- 'A' | 'B'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_avaliacao_telemetria_docente UNIQUE(requisicao_ia_id, usuario_id_hash)
);
```

### B. Proteção contra Duplicidade em Duas Camadas
1. **Camada de Aplicação:** Pré-verificação no repositório `AvaliacaoTelemetriaRepository` lançando `ConflictError` amigável (RFC 7807 problem details).
2. **Camada de Banco de Dados:** Constraint física `UNIQUE(requisicao_ia_id, usuario_id_hash)` com tratamento de código SQL `23505` para garantir atomicidade sob concorrência.

### C. Anonimização e Ética da Pesquisa
O docente é identificado primariamente pelo `usuario_id_hash` (digest SHA-256 da sessão/matrícula). O `usuario_id` relacional é mantido apenas se o professor estiver logado formalmente com consentimento TCLE ativo.

---

## 📊 4. Endpoints Disponibilizados

| Método | Rota | Finalidade Acadêmica / Operacional |
|---|---|---|
| `POST` | `/api/telemetria/avaliacao` | Registro da nota (1 a 5), tags e comentário pelo professor. |
| `GET` | `/api/telemetria/avaliacao/estatisticas` | Consolidação para os gráficos da tese (média por motor, distribuição de estrelas e frequência de tags). |
| `GET` | `/api/telemetria/status` | Diagnóstico de integridade e sobrecarga zero da fila assíncrona. |

---

## 🧪 5. Evidência de Homologação (32/32 Testes Aprovados)

O script `backend/src/test-avaliacao-telemetria.js` (`npm run test:avaliacao`) validou integralmente:
- Rejeição de payloads malformados ou notas fora do intervalo [1, 5] com HTTP 422.
- Rejeição de geração inexistente com HTTP 404.
- Registro com sucesso com HTTP 201 Created.
- Desnormalização instantânea do grupo experimental (`A` vs `B`) e motor correspondente.
- Bloqueio estrito de duplicidade com HTTP 409 Conflict.
- Coexistência de avaliações de professores distintos para o mesmo material didático.

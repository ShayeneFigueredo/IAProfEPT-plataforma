# 🏛️ ADR-008: Registro de Consentimento Livre e Esclarecido (TCLE) e Governança Ética CEP/UFJF
> **Documento de Registro de Decisão Arquitetural (ADR)**  
> **Projeto de Tese de Doutorado** — Programa de Pós-Graduação em Educação Matemática (PPGEM / UFJF)  
> **Doutorando:** Maycon Luiz Amaral Magalhães  
> **Engenharia de Software:** Shayene Figueredo & Samuel Amorim  
> **Orientação:** Prof. Dr. Eduardo Barrére | Prof. Dr. Manuel José Cabral dos Santos Reis  
> **Referência Jira:** `[IAPROF-3.8]` / `[Auth Backend]`  

---

## 📌 1. Status
**APROVADO / IMPLEMENTADO** (Outubro / 2026 — Fase 2)

---

## 🎯 2. Contexto & Justificativa Científica e Ético-Regulatória

O software **IAprofEPT** constitui o **Produto Técnico-Tecnológico (PTT4 / CAPES)** da tese de doutorado de Maycon Luiz Amaral Magalhães, aplicada no âmbito da **Rede Federal de Educação Profissional, Científica e Tecnológica (RFEPCT)**.

Por envolver a participação voluntária de professores de Matemática na geração, avaliação e curadoria de materiais didáticos auxiliados por IA:
1. **Conformidade com a Resolução CNS nº 510/2016:** O sistema deve assegurar que todo participante formalize seu consentimento antes de interagir com o ambiente de pesquisa, garantindo esclarecimento sobre os objetivos, voluntariedade e ausência de prejuízos decorrentes de recusa ou desistência.
2. **Submissão ao Comitê de Ética em Pesquisa da UFJF (CEP/UFJF):** A pesquisa de doutorado requer auditoria transparente da cadeia de custódia dos dados e dos consentimentos coletados.
3. **Privacidade e Proteção de Dados (LGPD - Lei nº 13.709/2018):** O registro do consentimento não pode violar a privacidade do professor; por isso, o endereço IP de conexão deve ser estritamente anonimizado (mascaramento do último octeto `/24` para IPv4 e dos últimos 80 bits `/48` para IPv6).
4. **Critério de Aceite Inegociável:** Nenhum usuário pode ser criado ou persistido no banco de dados sem o registro válido de consentimento livre e esclarecido.

---

## 💡 3. Decisão Arquitetural

Implementa-se uma camada tripartite de governança ética relacional:

### A. Tabela Relacional `consentimentos_tcle` no PostgreSQL
- **Chave Primária:** UUID gerado via `gen_random_uuid()`.
- **Chave Estrangeira:** `usuario_id` com deleção em cascata (`CASCADE`).
- **Versão do Termo:** `versao_termo VARCHAR(20) NOT NULL DEFAULT '1.0'`.
- **Status do Consentimento:** `aceito BOOLEAN NOT NULL DEFAULT TRUE`.
- **Anonimização de Rede:** `ip_anonimizado VARCHAR(64) NOT NULL` (mascarado por `cryptoService.anonymizeIp`).
- **Auditoria Temporal:** `created_at` e `updated_at` com timezone (`TIMESTAMPTZ`) em padrão ISO 8601.

### B. Garantia em Nível de Motor de Banco de Dados (Constraint Trigger)
Para além das validações em nível de aplicação (Zod e Service), adota-se um **Constraint Trigger DEFERRABLE INITIALLY DEFERRED** no PostgreSQL que valida no momento do `COMMIT` se o usuário recém-inserido possui registro correspondente em `consentimentos_tcle`:

```sql
CREATE OR REPLACE FUNCTION check_usuario_consentimento_tcle()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM consentimentos_tcle WHERE usuario_id = NEW.id AND aceito = TRUE
  ) THEN
    RAISE EXCEPTION 'Violacao de Conformidade Etica (CEP/UFJF - CNS 510/2016): Nenhum usuario pode ser persistido no banco sem o devido registro de consentimento livre e esclarecido (TCLE).'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_garantir_consentimento_tcle
AFTER INSERT ON usuarios
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION check_usuario_consentimento_tcle();
```

Essa salvaguarda impede física e matematicamente que qualquer script, migração ou comando manual crie contas de usuário no PostgreSQL sem o consentimento ético.

### C. Endpoint de Auditoria: `GET /api/auth/termo-etico`
- **Acesso Público / Anônimo:** Retorna as diretrizes éticas oficiais, versão vigente do TCLE (`1.0`), respaldo legal (Resolução CNS 510/2016, Resolução CNS 466/2012 e LGPD), contatos do Comitê de Ética da UFJF (`cep.propesq@ufjf.br`) e métricas gerais de conformidade da base de dados.
- **Acesso Autenticado (`Bearer Token`):** Retorna adicionalmente o bloco `consentimentoDocente` com o ID do consentimento, timestamp ISO do aceite, versão homologada e o IP anonimizado registrado no momento do cadastro.

---

## 🧪 4. Critérios de Aceite Verificados por Testes Automatizados

Coberto de forma exaustiva pela suíte `backend/src/test-tcle.js` (`npm run auth:tcle:test`):

| Teste | Descrição do Critério | Resultado |
|---|---|:---:|
| **Teste 1** | POST `/api/auth/register` gravando perfil e metadados de consentimento | ✅ **201 Created** |
| **Teste 2** | Auditoria na tabela `consentimentos_tcle`: IP anonimizado (`/24`) e timestamp ISO | ✅ **Conforme** |
| **Teste 3** | Registro do evento `auth.aceite_tcle_cadastro` na tabela `logs_auditoria` | ✅ **Auditado** |
| **Teste 4** | Endpoint público `GET /api/auth/termo-etico` com cláusulas e dados do CEP/UFJF | ✅ **200 OK** |
| **Teste 5** | Endpoint autenticado `GET /api/auth/termo-etico` com dados do aceite docente | ✅ **200 OK** |
| **Teste 6** | Rejeição estrita de cadastro com `termoEticoAceito: false` (Zero criação de usuário) | ✅ **422 Rejeitado** |
| **Teste 7** | Inserção direta no PostgreSQL bloqueada por **Constraint Trigger** | ✅ **check_violation** |
| **Teste 8** | Auditoria global comprovando 0 usuários sem consentimento na base | ✅ **100.0% Conforme** |

---

## 🛡️ 5. Consequências & Benefícios para a Tese de Doutorado
- **Rigor Metodológico Impecável:** A tese de Maycon Magalhães dispõe de evidência computacional formal de que 100% dos dados coletados provêm de participantes que consentiram expressamente com a pesquisa.
- **Proteção Total contra Desvios Éticos:** O Constraint Trigger fecha qualquer brecha técnica para manipulação indevida de dados.
- **Harmonia entre Legislação e Tecnologia:** Conexão explícita entre os requisitos da CAPES, normas do CNS e código executável de software livre.

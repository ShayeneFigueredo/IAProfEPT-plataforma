# 🏛️ Documento de Decisão Arquitetural (ADR-001)
## Proibição de Caixas de Prompt em Branco e Adoção da Engenharia de Prompts Oculta Parametrizada

- **Status:** Aprovado / Implementado
- **Data da Decisão:** Setembro / 2026
- **Contexto da Pesquisa:** Tese de Doutorado em Educação Matemática (PPGEM / UFJF)
- **Autor / Doutorando:** Maycon Luiz Amaral Magalhães
- **Engenharia de Software:** Shayene Figueredo & Samuel Amorim
- **Orientadores:** Prof. Dr. Eduardo Barrére | Prof. Dr. Manuel José Cabral dos Santos Reis
- **Classificação CAPES:** Produto Técnico-Tecnológico (PTT4 - Software/Plataforma Educacional)

---

## 🎯 1. Contexto do Problema & Justificativa Científica

### A. O Dilema dos Prompts Abertos na Educação Matemática da EPT
A literatura recente sobre Inteligência Artificial Generativa na Educação (UNESCO, 2021; MEC, 2024; SKOVSMOSE, 2022) adverte sobre os riscos da utilização ingênua de Large Language Models (LLMs) via caixas de texto abertas (*chatbots* genéricos). No contexto dos docentes de Matemática da Educação Profissional e Tecnológica (EPT), a exposição de um campo de texto em branco acarreta:
1. **Sobrecarga Cognitiva e "Bloqueio do Prompt":** Professores de Matemática não possuem formação em engenharia de prompt e muitas vezes não sabem quais metadados fornecer para obter respostas pedagogicamente sólidas.
2. **Geração Descontextualizada e Alucinações:** Prompts vagos geram listas de exercícios genéricos, descolados da realidade do mundo do trabalho e dos perfis profissionais dos Cursos Técnicos da Rede Federal (RFEPCT).
3. **Ausência de Rigor Curricular:** Impossibilidade de garantir conformidade direta com as habilidades da **Base Nacional Comum Curricular (BNCC)** e do **Catálogo Nacional de Cursos Técnicos (CNCT)**.

---

## 💡 2. Decisão Arquitetural & Teórico-Pedagógica

Fica formalmente estabelecido como **regra inviolável de design** da Plataforma IAprofEPT:

> **"O sistema NÃO disponibilizará caixas de prompt vazias ou abertas para inserção livre de comandos pelo professor no Laboratório de IA."**

Toda e qualquer interação gerativa no **Laboratório de IA** dar-se-á através de uma **Interface Estruturada de Seletores Paramétricos**:

```
[Área da Matemática] ──┐
[Nível Dificuldade]  ──┼──► [Motor Oculto de Prompt Pedagógico] ──► [Groq LLaMA 3.3 / Gemini] ──► [Saída Estruturada]
[Quantidade]         ──┤    (Injeção de Metadados Curriculares)
[Curso Técnico EPT]  ──┘
```

### Componentes Injetados Ocultamente:
1. **Papel Pedagógico Especializado:** Injeção da persona de especialista em Educação Matemática Crítica e EPT.
2. **Ancoragem Curricular:** Vinculação automática com habilidades BNCC do Ensino Médio/EPT (ex: `EM13MAT401`, `EM13MAT308`).
3. **Contexto Autêntico da EPT:** Injeção de situações-problema reais do mundo do trabalho de acordo com o Curso Técnico selecionado (ex: dosagem farmacológica em Enfermagem, volume de silos em Agropecuária).
4. **Metodologia Formativa:** Estruturação de perguntas progressivas e gabarito reflexivo passo a passo.

---

## ⚖️ 3. Consequências & Benefícios para a Tese

| Dimensão | Impacto Positivo |
|---|---|
| **Para o Docente** | Elimina a barreira de entrada técnica; gera atividades contextualizadas e prontas para uso em segundos. |
| **Para o Rigor da Tese** | Garante consistência metodológica nas respostas geradas durante o experimento com os professores da RFEPCT. |
| **Para a Avaliação CAPES** | Demonstra maturidade de Engenharia de Software Pedagógica (PTT4), comprovando que o software não é um mero wrapper de API, mas um sistema especialista instrucional. |

---

## 🔍 4. Rastreabilidade no Código-Fonte
- Componente do Formulário: `src/views/LaboratorioView.jsx`
- Base de Parâmetros Curriculares: `src/data/mockData.js` (`LAB_OPTIONS`)
- Motor de Extração e Injeção: `src/services/aiOrchestrator.js`
- Design Tokens: `src/styles/index.css` (`.lab-card-form`, `.lab-select-field`, `.system-prompt-box`)

# 🏛️ Documento de Decisão Arquitetural (ADR-002)
## Princípio da Autoridade Docente Insubstituível e Banner Obrigatório de Validação Ético-Pedagógica

- **Status:** Aprovado / Implementado
- **Data da Decisão:** Setembro / 2026
- **Contexto da Pesquisa:** Tese de Doutorado em Educação Matemática (PPGEM / UFJF)
- **Autor / Doutorando:** Maycon Luiz Amaral Magalhães
- **Engenharia de Software:** Shayene Figueredo & Samuel Amorim
- **Orientadores:** Prof. Dr. Eduardo Barrére | Prof. Dr. Manuel José Cabral dos Santos Reis
- **Classificação CAPES:** Produto Técnico-Tecnológico (PTT4 - Software/Plataforma Educacional)

---

## 🎯 1. Fundamentação Teórico-Filosófica

A introdução de sistemas de Inteligência Artificial Generativa na docência suscita profundos debates éticos quanto à desumanização do processo educativo e ao risco de alienação do trabalho docente (SKOVSMOSE, 2022; SELWYN, 2019; UNESCO, 2021). 

Nesta tese de doutorado, adota-se como premissa ontológica fundamental que:
> **A IA é uma ferramenta de ampliação e coautoria pedagógica, jamais um substituto da autoridade epistemológica, ética e humana do professor de Matemática.**

---

## 💡 2. Decisão de Design e Governança de Software

1. **Seção Conceitual Permanente no Início:**
   - A página inicial da plataforma apresenta com destaque a seção:
     > *"Pensada para o professor — não para substituí-lo"*
   - Essa seção articula três pilares inegociáveis:
     - **Contextualização à EPT:** ancoragem no mundo do trabalho;
     - **Engenharia de prompts oculta:** facilitação guiada;
     - **Validação pedagógica:** a decisão final é sempre do professor.

2. **Banner Obrigatório em Toda e Qualquer Saída de IA:**
   - Nenhuma saída de conteúdo gerado por IA pode ser renderizada ou exportada sem o seguinte alerta institucional em destaque:
     ```
     🛡️ Validação pedagógica obrigatória. Este conteúdo foi gerado por Inteligência Artificial. Cabe ao professor revisar, adaptar e validar pedagogicamente sua aplicação.
     ```
   - O mesmo banner deve constar nos cabeçalhos de exportação (PDF / Impressão).

---

## ⚖️ 3. Impacto na Avaliação da Tese e Produto Educacional
- Atende 100% às diretrizes da **UNESCO** e do **MEC (2024)** para o uso de IA na Educação Básica e Tecnológica.
- Garante que a plataforma seja classificada como ferramenta de **Educação Crítica e Emancipatória**, elemento chave para aprovação na banca de Doutorado do PPGEM/UFJF.

---

## 🔍 4. Rastreabilidade no Código-Fonte
- Seção de Princípios & Banner Home: `src/views/HomeView.jsx` (`.design-principles-section`, `.ethical-full-green-banner`)
- Banner de Validação no Laboratório: `src/views/LaboratorioView.jsx` (`.lab-ethical-warning-banner`)
- Componente Global Reutilizável: `src/components/EthicalBanner.jsx`

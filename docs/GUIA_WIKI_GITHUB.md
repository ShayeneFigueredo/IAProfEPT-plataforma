# 📖 Guia de Estruturação da Wiki do GitHub
> **Repositório:** [https://github.com/ShayeneFigueredo/IAProfEPT-plataforma](https://github.com/ShayeneFigueredo/IAProfEPT-plataforma)  
> **Tese de Doutorado:** Programa de Pós-Graduação em Educação Matemática (PPGEM / UFJF)  

A Wiki do GitHub servirá como a **central de transparência pública e acadêmica** do Produto Educacional IAprofEPT. Abaixo está a estrutura de páginas pronta para ser criada na aba **Wiki** do seu repositório GitHub.

---

## 🗺️ Mapa de Páginas da Wiki

```
1. Home (Página Principal)
2. Visão-Geral-e-Fundamentação-Pedagógica
3. Arquitetura-de-Software-e-Stack-Técnica
4. Os-5-Ambientes-da-Plataforma
5. Engenharia-de-Prompts-e-IA-Dupla
6. Protocolo-Experimental-do-Teste-AB-30-Dias
7. Cronograma-Executivo-e-Marcos
8. Guia-de-Instalação-e-Deploy-UFJF
9. Governança-e-Contribuição
```

---

## 📄 Conteúdo Pronto para Cada Página da Wiki

### Página 1: `Home.md`
```markdown
# 🎓 Bem-vindo à Wiki Oficial da Plataforma IAprofEPT

O **IAprofEPT** é um Ambiente Virtual de Apoio à Docência em Matemática na Educação Profissional e Tecnológica (EPT), potencializado por Inteligência Artificial Generativa com Roteamento Duplo e Parametrização Pedagógica.

O projeto constitui o **Produto Educacional (PTT4)** vinculado à pesquisa de Doutorado de **Maycon Luiz Amaral Magalhães** no **PPGEM / UFJF**.

---

### 📌 Informações Institucionais
- **Autor / Doutorando:** Maycon Luiz Amaral Magalhães
- **Desenvolvimento de Software:** Shayene Figueredo & Samuel Amorim
- **Orientação:** Prof. Dr. Eduardo Barrére (UFJF)
- **Coorientação:** Prof. Dr. Manuel José Cabral dos Santos Reis (UTAD / Portugal)
- **Infraestrutura & Hospedagem:** Servidores Institucionais e Domínio Oficial fornecidos pela Universidade Federal de Juiz de Fora (UFJF)
- **Período de Desenvolvimento:** 22/09/2026 a 15/12/2026

---

### 🚀 Navegação Rápida
- [Visão Geral & Fundamentação Pedagógica](Visao-Geral-e-Fundamentacao-Pedagogica)
- [Arquitetura de Software & Stack Técnica](Arquitetura-de-Software-e-Stack-Tecnica)
- [Os 5 Ambientes da Plataforma](Os-5-Ambientes-da-Plataforma)
- [Engenharia de Prompts & IA Dupla (Groq + Gemini)](Engenharia-de-Prompts-e-IA-Dupla)
- [Protocolo do Teste A/B (30 Dias)](Protocolo-Experimental-do-Teste-AB-30-Dias)
- [Cronograma Executivo de Entregas](Cronograma-Executivo-e-Marcos)
- [Guia de Deploy nos Servidores da UFJF](Guia-de-Instalacao-e-Deploy-UFJF)
```

---

### Página 2: `Visao-Geral-e-Fundamentacao-Pedagogica.md`
```markdown
# 🎯 Visão Geral & Fundamentação Pedagógica

## O Problema de Pesquisa
Como apoiar professores de Matemática da EPT no planejamento, contextualização e produção de materiais didáticos alinhados à BNCC e aos PPCs dos cursos técnicos, utilizando IA Generativa de forma crítica, ética e sem sobrecarga cognitiva?

## Princípios Fundamentais
1. **Sem "Prompt em Branco":** Eliminação da síndrome da tela vazia através de seletores curriculares orientados.
2. **Autoridade e Autonomia Docente:** A IA atua como copiloto estruturador; a decisão pedagógica final é sempre do professor.
3. **Validação Ética Obrigatória:** Cada saída gerada inclui advertência explícita para revisão humana antes da aplicação escolar.
4. **Contextualização com o Mundo do Trabalho:** Atividades e exercícios vinculados diretamente aos perfis profissionais dos Cursos Técnicos (CNCT).
```

---

### Página 3: `Arquitetura-de-Software-e-Stack-Tecnica.md`
```markdown
# 🏗️ Arquitetura de Software & Stack Técnica

## Visão Geral da Arquitetura
A plataforma adota uma arquitetura desacoplada e responsiva, projetada para alta performance, baixa latência e total segurança de dados.

## Componentes Técnicos
- **Frontend / Interface do Usuário:** Interface moderna com componentes modulares, HTML5 semântico, Vanilla CSS com variáveis de design system institucional e JavaScript interativo.
- **Backend de IA & Orquestração:** Motor Python com roteador dinâmico de requisições LLM.
- **Provedores de IA:**
  - **Groq API:** LLaMA 3.3 70B rodando em hardware LPU (inferência ultra-rápida < 1s).
  - **Google Gemini API:** Gemini 1.5 com janela de contexto estendida e sinergia pedagógica.
- **Sistema de Fallback & Contingência:** Mecanismo automático de redundância para garantir 100% de disponibilidade.
- **Servidores e Hospedagem:** Infraestrutura institucional e domínio oficial fornecidos pela UFJF.
```

---

### Página 4: `Os-5-Ambientes-da-Plataforma.md`
```markdown
# 🏛️ Os 5 Ambientes da Plataforma IAprofEPT

### 1. Ambiente Formativo
Trilhas de formação continuada para docentes, acervo de legislação da EPT, vídeos curados do YouTube e o E-book de Prompts para Matemática.

### 2. Laboratório de IA
Motor prático de geração automatizada e contextualizada. O docente seleciona o curso técnico, tópico de matemática, habilidade BNCC e tipo de recurso (lista de exercícios, plano de aula, estudo de caso técnico ou avaliação formativa).

### 3. Repositório de Práticas
Comunidade de compartilhamento e curadoria entre pares. Permite salvar materiais gerados, avaliar de 1 a 5 estrelas e exportar em PDF/DOCX.

### 4. Painel de Reflexão Crítica
Espaço de debate ético sobre o uso da IA na educação, combate ao viés algorítmico, preservação da autoria docente e fóruns moderados.

### 5. Canal de Acompanhamento / Prof. mAIcon
Assistente virtual contextualizado que orienta o docente sobre navegação, parametrização e uso ético, com integração ao ecossistema Google NotebookLM.
```

---

### Página 5: `Protocolo-Experimental-do-Teste-AB-30-Dias.md`
```markdown
# 🧪 Protocolo Experimental do Teste A/B (30 Dias)

## Período: 20/10/2026 a 20/11/2026
## Participantes: Professores de Matemática da Rede Federal (RFEPCT)

### Dinâmica do Experimento Cego
1. Ao solicitar uma geração didática no Laboratório, o backend faz o sorteio randômico do motor (50% Groq / 50% Gemini) de forma transparente ao docente.
2. O sistema registra telemetria técnica: tempo de resposta, quantidade de tokens e eventuais falhas.
3. O professor utiliza o material gerado em sala de aula real durante o hiato pedagógico.
4. O professor avalia no Repositório a qualidade, aderência ao PPC e precisão matemática.
5. Os dados consolidados são exportados para a análise quanti-qualitativa da Tese de Doutorado.
```

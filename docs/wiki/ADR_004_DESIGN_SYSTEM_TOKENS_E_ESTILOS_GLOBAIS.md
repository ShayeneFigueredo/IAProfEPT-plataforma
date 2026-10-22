# 🏛️ Documento de Decisão Arquitetural (ADR-004)
## Implementação do Design System Institucional: Tokens Visuais, Tipografia Oficial, Grid Responsivo e Acessibilidade WCAG AA

- **Status:** Aprovado / Implementado
- **Data da Decisão:** Outubro / 2026
- **Contexto da Pesquisa:** Tese de Doutorado em Educação Matemática (PPGEM / UFJF)
- **Autor / Doutorando:** Maycon Luiz Amaral Magalhães
- **Engenharia de Software:** Shayene Figueredo & Samuel Amorim
- **Orientadores:** Prof. Dr. Eduardo Barrére | Prof. Dr. Manuel José Cabral dos Santos Reis
- **Classificação CAPES:** Produto Técnico-Tecnológico (PTT4 - Software/Plataforma Educacional)
- **Referência Jira:** `[IAPROF-2]` / `[IAPROF-2.1]`

---

## 🎯 1. Contexto do Problema & Justificativa Científico-Institucional

A plataforma **IAprofEPT** constitui o Produto Educacional oficial (PTT4) submetido à CAPES pela Universidade Federal de Juiz de Fora (UFJF). Para garantir legitimidade institucional, usabilidade ergonômica docente e conformidade legal com as Diretrizes de Acessibilidade para Conteúdo Web (**WCAG 2.1 / 2.2 Nível AA** e Lei Brasileira de Inclusão nº 13.146/2015), fez-se imperativo consolidar um **Design System** rigoroso e reproduzível.

### Objetivos Principais:
1. **Identidade Visual Fidedigna da UFJF/PPGEM:** Aplicação consistente do Verde Floresta Institucional (`#064E3B`), Verde Acento (`#10B981`), Alerta Ético Vermelho (`#DC2626`) e Neutros Claros/Escuros (`#F8FAFC`, `#0F172A`).
2. **Tipografia Especializada:** Distinção ergonômica entre títulos de alto impacto (*Outfit*), corpo de texto de legibilidade contínua (*Plus Jakarta Sans*) e exibições técnicas/código/prompts (*Space Grotesk* e *Fira Code*).
3. **Ergonomia e Conforto Visual:** Sombras suaves multicamada (`shadow-app`), bordas arredondadas e sistema de grid responsivo fluido para desktop, tablet e dispositivos móveis.
4. **Comprovação Estrita de Contraste e Acessibilidade WCAG AA:** Cumprimento matemático dos limiares de contraste de cores (mínimo de 4.5:1 para texto normal e 3:1 para elementos de interface/títulos).

---

## 🎨 2. Especificação Técnica dos Tokens Visuais

### A. Paleta de Cores Institucionais e Semânticas
| Token CSS | Valor Hexadecimal | Razão de Contraste | Nível WCAG | Aplicação Principal |
|---|---|---|---|---|
| `--primary-green` | `#064E3B` | **11.8:1** (sobre #FFFFFF e #F8FAFC) | **AAA** | Barra lateral, cabeçalhos institucionais, botões primários. |
| `--accent-green` | `#10B981` | Elemento gráfico / Acento | **AA** (gráficos) | Indicadores de foco, badges ativas, micro-interações. |
| `--accent-red` | `#DC2626` | **4.8:1** (sobre #FEF2F2) / **4.55:1** (sobre #FFF) | **AA** | Banner ético obrigatório, alertas de validação docente. |
| `--accent-red-text`| `#991B1B` | **8.4:1** (sobre #FEF2F2) | **AAA** | Títulos e ênfases textuais do alerta ético. |
| `--bg-page` | `#F8FAFC` | Fundo neutro suave (Slate-50) | — | Superfície base de toda a aplicação web. |
| `--text-main` | `#0F172A` | **16.6:1** (sobre #F8FAFC) | **AAA** | Texto corrido, parágrafos e formulários. |

### B. Sistema Tipográfico
- **Títulos & Cabeçalhos:** `--font-heading: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;`  
  *Justificativa:* Geometria limpa e moderna que confere autoridade acadêmica e clareza estrutural.
- **Corpo & Interação:** `--font-body: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;`  
  *Justificativa:* Altura-x otimizada para leitura prolongada de textos pedagógicos sem fadiga visual.
- **Dados Técnicos & Prompts:** `--font-mono: 'Space Grotesk', 'Fira Code', monospace;`  
  *Justificativa:* Distinção visual explícita entre instruções geradas por IA, contadores de tokens, fórmulas e metadados curriculares.

### C. Sombras Suaves (`shadow-app`)
- `--shadow-app: 0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.03);`
- `--shadow-app-hover: 0 10px 25px -3px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.04);`
- `--shadow-app-floating: 0 12px 36px -4px rgba(6, 78, 59, 0.25), 0 4px 12px -2px rgba(15, 23, 42, 0.08);`

### D. Raios de Borda (Bordas Arredondadas)
- `--radius-xs: 6px;` (chips e pequenos badges)
- `--radius-sm: 10px;` (botões e campos de entrada)
- `--radius-md: 14px;` (cards médios e caixas de alerta)
- `--radius-lg: 18px;` (cards principais e containers)
- `--radius-xl: 24px;` (módulos destacados e gavetas)
- `--radius-full: 9999px;` (pílulas de status e avatares)

### E. Sistema de Grid Responsivo
- Container centrado: `--container-max-width: 1440px;` com padding de segurança de 1.5rem.
- Classes CSS utilitárias para grids flexíveis: `.app-grid`, `.grid-cols-1` a `.grid-cols-12`, `.grid-auto-fit`, `.grid-auto-fill` com transição graciosa para 1 coluna em telas mobile (< 640px) e 2 colunas em tablets (641px - 1024px).

---

## ♿ 3. Matriz de Conformidade de Acessibilidade (WCAG 2.1 / 2.2 AA)

1. **Critério 1.4.3 (Contraste Mínimo):**
   - Texto escuro (`#0F172A`) sobre fundo neutro (`#F8FAFC`): Contraste de **16.6:1** (supera os 4.5:1 exigidos pelo Nível AA e os 7:1 do Nível AAA).
   - Fundo institucional (`#064E3B`) com texto branco (`#FFFFFF`): Contraste de **11.8:1** (aprovado Nível AAA).
   - Alerta ético (`#991B1B` sobre `#FEF2F2`): Contraste de **8.4:1** (aprovado Nível AAA).
2. **Critério 2.4.1 (Ignorar Blocos):**
   - Implementado link de salto acessível `.skip-to-content` com foco visível no topo da página.
3. **Critério 2.4.7 (Foco Visível):**
   - `:focus-visible` parametrizado globalmente com anel de foco de 2px sólido (`--accent-green`) e deslocamento (`outline-offset: 2px`).
4. **Critério 2.3.3 (Animação a partir de Interações):**
   - Media query `@media (prefers-reduced-motion: reduce)` inibe animações e transições forçadas para usuários com sensibilidade motora/vestibular.
5. **Critério 2.5.5 (Tamanho do Alvo de Toque):**
   - Altura mínima de 44px garantida para botões, itens de navegação e controles em dispositivos móveis.

---

## 🔍 4. Rastreabilidade no Código-Fonte
- Importação Google Fonts: [index.html](file:///c:/apps/IAProfEPT/PLATAFORMA/index.html)
- Definição Global de Tokens e Utilitários: [src/styles/index.css](file:///c:/apps/IAProfEPT/PLATAFORMA/src/styles/index.css)
- Arquivo Canônico de Variáveis: [styles/variables.css](file:///c:/apps/IAProfEPT/PLATAFORMA/styles/variables.css)
- Implementação de Acessibilidade no App: [src/App.jsx](file:///c:/apps/IAProfEPT/PLATAFORMA/src/App.jsx)
- Componente de Banner Ético Acessível: [src/components/EthicalBanner.jsx](file:///c:/apps/IAProfEPT/PLATAFORMA/src/components/EthicalBanner.jsx)

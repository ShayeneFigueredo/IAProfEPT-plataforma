# ADR 021: Serviço de Exportação Server-side (PDF/DOCX) com Banner Ético

## 1. Contexto & Justificativa
A Plataforma IAprofEPT permite que os professores gerem atividades, sequências didáticas e práticas no **Laboratório de IA** ou visualizem materiais já consolidados no **Repositório de Práticas**. Para garantir a utilidade desses materiais na rotina docente presencial (para impressão ou edição), foi solicitada a criação de um serviço de exportação server-side que converta HTML em PDF (layout A4) ou DOCX. 

### Relação com os Princípios do Projeto
- **Rigor Científico:** A exportação padronizada fortalece o produto educacional da tese.
- **Compromisso Ético & Alerta Obrigatório:** Todos os documentos gerados injetam o banner de alerta ético no rodapé.
- **Identidade Visual:** Os arquivos gerados mantêm o cabeçalho oficial da UFJF/PPGEM.

## 2. Decisão Arquitetural
Foi desenvolvida uma rota (`/api/export`) responsável por processar requisições contendo `titulo`, `conteudo` e `cursoTecnico`, e retornar arquivos PDF ou DOCX utilizando Puppeteer e html-to-docx.

### Estrutura do Módulo:
- **`backend/src/routes/exportRoutes.js`**: Roteador Express para os endpoints de exportação.
- **`backend/src/controllers/exportController.js`**: Validação de parâmetros e configuração de headers para download.
- **`backend/src/services/exportService.js`**: Geração do HTML injetando o cabeçalho (UFJF/PPGEM), dados da atividade, o `BANNER_ETICO` (rodapé de todas as páginas em PDF, e banner no DOCX), bem como o polyfill do MathJax para renderização server-side (Puppeteer) das equações matemáticas.

## 3. Impacto no Produto Educacional
- **Ambiente Afetado:** Repositório de Práticas e Laboratório de IA.
- **Autonomia Docente:** O professor não apenas visualiza o material no navegador, mas pode levá-lo para a sala de aula impresso (PDF) ou para ajustes finais e edição rica (DOCX), expandindo a utilidade do sistema e cumprindo o papel de assistente educacional da IA.

## 4. Verificação de Acessibilidade & UX
- O layout gerado em PDF utiliza contraste adequado para impressão em preto e branco.
- O aviso ético é fixado no rodapé com fundo destacado (Vermelho `#DC2626` e texto branco `#F8FAFC`).
- As tags matemáticas (LaTeX/MathJax) são convertidas via avaliação no Puppeteer para exibição correta sem dependência de processamento no frontend.


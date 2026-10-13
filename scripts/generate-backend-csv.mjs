import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const tasks = [
  // ==========================================
  // ÉPICO: BANCO DE DADOS POSTGRESQL & MODELAGEM
  // ==========================================
  {
    summary: "[Database] Modelagem e Configuracao do Banco de Dados PostgreSQL",
    description: "Configurar instancia do PostgreSQL 16+ para a plataforma IAprofEPT. Modelar o esquema relacional cobrindo entidades: usuarios, instituicoes_rfepct, perfis_docentes, trilhas_formativas, progresso_trilhas, requisicoes_ia, telemetria_ab, praticas_repositorio, avaliacoes_praticas, topicos_forum, respostas_forum e logs_auditoria. Criterio de Aceite: conexao estavel via pool com SSL habilitado e charset UTF-8."
  },
  {
    summary: "[Database] Implementacao de Migrations e Relacionamentos das Tabelas",
    description: "Criar suite de migracoes estruturais com controle de versao (Prisma / Drizzle / Knex) definindo chaves primarias (UUIDv4), chaves estrangeiras com regras de delecao integras (CASCADE/RESTRICT), constraints de unicidade (e-mail, matricula) e campos de auditoria (created_at, updated_at). Criterio de Aceite: migracoes executadas com sucesso sem erros de integridade referencial."
  },
  {
    summary: "[Database] Otimizacao de Indices e Busca Textual (pg_trgm / Full-Text Search)",
    description: "Criar indices B-Tree nas chaves de busca frequente (usuario_id, instituicao_id, curso_tecnico, created_at) e indices GiST/GIN com extensao pg_trgm para busca textual veloz e tolerante a erros de digitacao no Repositorio de Praticas e Foruns. Criterio de Aceite: queries de busca textual executando em menos de 50ms em volume de teste."
  },
  {
    summary: "[Database] Scripts de Seed com Matriz Curricular BNCC, Eixos CNCT e Instituicoes",
    description: "Desenvolver script de populacao inicial (seeds) contendo: 1) Catalogo oficial com as 27 UFs e todas as instituicoes da RFEPCT (IFs, CEFETs e Colegios Tecnicos); 2) Matriz de Habilidades de Matematica da BNCC (Ensino Medio); 3) Eixos Tecnologicos e Cursos Tecnicos do CNCT; 4) Modulos das 4 Trilhas Formativas. Criterio de Aceite: execucao idempotente preenchendo as tabelas auxiliares perfeitamente."
  },
  {
    summary: "[DevOps] Containerizacao do Ambiente com Docker e Docker Compose",
    description: "Construir docker-compose.yml para orquestrar ambiente de desenvolvimento e homologacao contendo servico PostgreSQL com volumes persistentes, healthcheck configurado, servico de aplicacao backend e rede isolada. Criterio de Aceite: comando docker compose up iniciando todo o ecossistema pronto para conexao."
  },

  // ==========================================
  // ÉPICO: ARQUITETURA DE API & AUTENTICAÇÃO
  // ==========================================
  {
    summary: "[Backend] Estruturacao da API RESTful, Middlewares e Tratamento de Erros",
    description: "Configurar arquitetura em camadas (Routes, Controllers, Services, Repositories). Implementar middlewares globais essenciais: CORS restrito a origens institucionais, Helmet para headers de seguranca, rate limiting contra abusos de requisicao, parser JSON e handler centralizado de erros retornando respostas RFC 7807 padronizadas. Criterio de Aceite: API respondendo a healthcheck /api/health e tratando excecoes sem expor stack traces."
  },
  {
    summary: "[Auth Backend] Servico de Autenticacao com JWT, Refresh Tokens e Criptografia",
    description: "Desenvolver servico de seguranca para hash de senhas utilizando Argon2id (ou bcrypt com salt factor 12). Implementar geracao e validacao de tokens de acesso JWT de curta duracao (15min) e refresh tokens seguros armazenados em cookies HttpOnly com SameSite=Strict e persistidos no PostgreSQL para revogacao. Criterio de Aceite: tokens assinados com chave assimetrica/segura e ciclo de renovacao automatico funcional."
  },
  {
    summary: "[Auth Backend] Endpoints de Registro e Validacao de Docentes da RFEPCT",
    description: "Criar endpoint POST /api/auth/register com validacao estrita de esquema (Zod/Pydantic) para: Nome Completo, E-mail institucional (@*.edu.br ou homologado), Senha forte, UF (27 estados), Instituicao de Origem (IF/CEFET/Colegio Tecnico), Campus, Cursos Tecnicos atendidos e Matricula SIAPE opcional. Criterio de Aceite: registro persistido no PostgreSQL e retorno do perfil criado sem exposicao de hash de senha."
  },
  {
    summary: "[Auth Backend] Endpoints de Login com E-mail/Matricula e Sessao Ativa",
    description: "Implementar endpoint POST /api/auth/login suportando autenticacao por e-mail institucional ou matricula SIAPE vinculada a UF de atuacao. Validar credenciais, registrar log de login no PostgreSQL e retornar perfil do usuario autenticado com JWT. Incluir endpoint GET /api/auth/me para revalidacao de sessao ativa. Criterio de Aceite: autenticacao funcional com rejeicao de credenciais incorretas e bloqueio temporario apos 5 tentativas falhas."
  },
  {
    summary: "[Auth Backend] Endpoints de Recuperacao de Senha e Redefinicao Segura",
    description: "Desenvolver fluxo seguro de recuperacao de senha: POST /api/auth/forgot-password gerando token de redefinicao criptografado de uso unico com validade de 2 horas persistido no PostgreSQL, e POST /api/auth/reset-password para atualizacao da nova credencial. Em ambiente piloto/teste, prover integracao com logs ou mock de envio seguro. Criterio de Aceite: token invalidado apos uso ou expiracao."
  },
  {
    summary: "[Auth Backend] Registro de Consentimento e Aceite do Termo Etico (TCLE)",
    description: "Implementar tabela de controle de consentimento livre e esclarecido (TCLE) gravando usuario_id, versao_termo, timestamp ISO e IP anonimizado no momento do cadastro. Prover endpoint GET /api/auth/termo-etico para auditoria de conformidade com o Comite de Etica em Pesquisa (CEP/UFJF) e resolucao CNS 510/2016. Criterio de Aceite: nenhum usuario criado no banco sem o consentimento registrado."
  },
  {
    summary: "[Auth Backend] Middleware de Autorizacao e Controle de Acesso por Papeis (RBAC)",
    description: "Implementar middleware de autorizacao validando permissoes conforme o papel do usuario (docente_rfepct, pesquisador_doutorado, administrador_ufjf). Restringir endpoints administrativos e metricas da tese a usuarios autorizados. Criterio de Aceite: requisicoes sem token retornando 401 Unauthorized e requisicoes com papel insuficiente retornando 403 Forbidden."
  },

  // ==========================================
  // ÉPICO: MOTOR DE IA DUPLA & ENGENHARIA DE PROMPTS
  // ==========================================
  {
    summary: "[IA Engine] Servico de Injeção de Prompts Ocultos e Parametrizacao Curricular",
    description: "Desenvolver motor server-side de montagem de System Prompts para que o professor nunca manipule texto cru. O servico recebe: Area Matematica, Nivel, Quantidade, Curso Tecnico e Metodologia; e concatena diretrizes de Educacao Matematica Critica, competencias BNCC (Ensino Medio/EPT) e situacoes reais do mundo do trabalho. Criterio de Aceite: prompt montado em estrutura JSON estrita pronta para envio as LLMs."
  },
  {
    summary: "[IA Engine] Integracao com Groq API (LLaMA 3.3 70B via LPU)",
    description: "Desenvolver cliente de integracao com a API da Groq para inferencia do modelo llama-3.3-70b-versatile. Parametrizar temperatura baixa (0.2 a 0.4) para calculo matematico preciso, max_tokens e formato de saida estruturado com gabarito passo a passo. Criterio de Aceite: chamada concluida com tempo de resposta inferior a 2 segundos e tratamento de rate limits 429."
  },
  {
    summary: "[IA Engine] Integracao com Google Gemini API (Gemini 1.5 Flash / Pro)",
    description: "Desenvolver cliente de integracao com a API do Google Gemini SDK (gemini-1.5-flash / gemini-1.5-pro). Configurar parametros de seguranca de conteudo (safety settings), temperatura e esquemas de geracao JSON estruturado para atividades interdisciplinares e planos de aula. Criterio de Aceite: requisicao bem-sucedida retornando dados no formato padronizado da plataforma."
  },
  {
    summary: "[IA Engine] Roteador Inteligente e Mecanismo de Fallback Automatico entre Motores",
    description: "Implementar orquestrador de resiliencia com padrao Circuit Breaker: caso o motor primario (Groq ou Gemini) sofra instabilidade, timeout (> 10s) ou erro de cota, o sistema chaveia automaticamente para o motor secundario sem interromper a experiencia do professor. Gravar evento de contingencia no banco. Criterio de Aceite: zero travamentos para o docente em cenarios de queda de uma das APIs."
  },
  {
    summary: "[IA Engine] Sanitizacao, Formatacao de Notacao Matematica (LaTeX) e Banner Etico",
    description: "Criar pipeline de pos-processamento que valida o formato da resposta, sanitiza saidas indesejadas, padroniza equacoes matematicas em sintaxe LaTeX/KaTeX legivel e injeta compulsoriamente a nota institucional: Este material foi gerado por Inteligencia Artificial e deve ser validado pela autoridade docente. Criterio de Aceite: nenhuma saida entregue sem o texto de validacao e formulas compativeis com o front-end."
  },

  // ==========================================
  // ÉPICO: PROTOCOLO EXPERIMENTAL A/B & TELEMETRIA
  // ==========================================
  {
    summary: "[Telemetria A/B] Motor de Roteamento Balanceado para o Experimento de 30 Dias",
    description: "Implementar algoritmo de distribuicao balanceada A/B deterministico e pseudo-aleatorio para alocar 50% das geracoes ao Motor A (Groq LLaMA 3.3) e 50% ao Motor B (Google Gemini) durante o periodo do experimento piloto (20/10 a 20/11/2026). Garantir persistencia da chave de teste por requisicao. Criterio de Aceite: taxa de distribuicao mantida em proporcao 1:1 estatisticamente comprovada."
  },
  {
    summary: "[Telemetria A/B] Coleta e Persistencia de Metricas de Inferencia no PostgreSQL",
    description: "Desenvolver servico assincrono que grava na tabela telemetria_ab: id_requisicao, usuario_id (anonimizado por hash), motor_utilizado (groq|gemini), modelo_especifico, tempo_latencia_ms, tokens_prompt, tokens_completion, parametros_curriculares, status_execucao e data_hora. Criterio de Aceite: metricas persistidas sem adicionar sobrecarga na resposta ao usuario."
  },
  {
    summary: "[Telemetria A/B] Endpoint de Avaliacao Docente por Estrelas (1 a 5) e Feedback",
    description: "Criar endpoint POST /api/telemetria/avaliacao para que o professor avalie o material gerado com nota de 1 a 5 estrelas e tags qualitativas (Rigor Matematico, Contextualizacao EPT, Clareza do Gabarito, Adequacao a BNCC) e campo opcional de comentario critico. Vincular a avaliacao a geracao correspondente no PostgreSQL. Criterio de Aceite: feedback registrado com sucesso e impedimento de avaliacoes duplicadas."
  },
  {
    summary: "[Telemetria A/B] API de Consolidacao Estatistica e Exportacao para a Tese de Doutorado",
    description: "Desenvolver endpoint analitico GET /api/telemetria/relatorio-tese restrito ao pesquisador Maycon Magalhaes e orientadores. O servico calcula medias ponderadas de latencia, distribuicao de notas, desvio padrao, taxa de aceitacao comparada (Groq vs Gemini) e exporta os dados anonimizados em CSV e JSON para inclusao direta no texto da tese. Criterio de Aceite: dados estatisticos agregados com total consistencia matematica."
  },

  // ==========================================
  // ÉPICO: BACKEND DOS 5 AMBIENTES DA PLATAFORMA
  // ==========================================
  {
    summary: "[Formativo Backend] API de Trilhas, Modulos e Rastreamento de Progresso Docente",
    description: "Criar endpoints REST para o Ambiente Formativo: GET /api/formativo/trilhas (lista das 4 trilhas com contadores de aulas e status), GET /api/formativo/trilhas/:id (conteudo das aulas e videos) e POST /api/formativo/progresso (atualiza porcentagem de conclusao por docente no PostgreSQL). Criterio de Aceite: persistencia do progresso permitindo retomar trilhas entre sessoes."
  },
  {
    summary: "[Formativo Backend] API de Gestao do Acervo de Documentos Oficiais e E-book",
    description: "Implementar endpoints GET /api/formativo/documentos com filtragem por tags (Legislacao EPT, Relatorios UNESCO, Plano Brasileiro de IA) e endpoint GET /api/formativo/ebook-prompts entregando os modelos estruturados de prompts para Educacao Matematica. Criterio de Aceite: retorno rapido com metadados completos de publicacao e links funcionais."
  },
  {
    summary: "[Laboratorio Backend] Endpoint Unificado de Geracao Parametrizada (/api/laboratorio/gerar)",
    description: "Construir endpoint POST /api/laboratorio/gerar gerenciando as 4 modalidades: 1) Exercicios e Avaliacoes; 2) Atividades Interdisciplinares EPT; 3) Roteiros para Podcasts Educacionais; 4) Planos de Aula Automaticos. O endpoint orquestra a montagem do prompt, aciona a IA correspondente pelo teste A/B, persiste o resultado no PostgreSQL e retorna a saida formatada. Criterio de Aceite: resposta estruturada completa com gabarito, BNCC e banner etico."
  },
  {
    summary: "[Laboratorio Backend] Validacao Server-side contra a Matriz BNCC x EPT (Anti-Prompt Livre)",
    description: "Desenvolver middleware de validacao que intercepta requisicoes ao Laboratorio de IA e rejeita sumariamente qualquer tentativa de envio de comandos de texto livre ou campos nao cadastrados na Matriz Curricular (impedindo jailbreaks ou uso descontextualizado). Criterio de Aceite: erro 422 Unprocessable Entity retornado para parametros fora dos catalogos permitidos."
  },
  {
    summary: "[Repositorio Backend] CRUD Completo de Praticas Docentes e Sequencias Didaticas",
    description: "Construir rotas RESTful para o Repositorio de Praticas: POST /api/repositorio/praticas (compartilhar material gerado ou autoral), GET /api/repositorio/praticas (listagem paginada com metadados), GET /api/repositorio/praticas/:id (detalhes completos com gabarito), PUT /api/repositorio/praticas/:id (edicao pelo autor) e DELETE /api/repositorio/praticas/:id. Criterio de Aceite: operacoes transacionais consistentes no PostgreSQL com soft delete."
  },
  {
    summary: "[Repositorio Backend] Servico de Upload e Armazenamento Seguro de Anexos (PDFs/Docs)",
    description: "Implementar servico de upload multipart/form-data com validacao de MIME types (apenas PDF, DOCX, imagens), escaneamento de seguranca de arquivos, limite maximo de 15MB e armazenamento persistente em disco institucional ou bucket S3/MinIO integrado ao PostgreSQL. Criterio de Aceite: upload concluido com geracao de URL protegida e hash SHA-256 de integridade."
  },
  {
    summary: "[Repositorio Backend] Motor de Busca Avancada com Filtros por Curso Tecnico e BNCC",
    description: "Criar endpoint GET /api/repositorio/buscar com filtros combinados: curso_tecnico, eixo_cnct, habilidade_bncc, tema_matematico e termo textual (utilizando os indices trigram do PostgreSQL). Suportar ordenacao por mais curtidos, mais recentes e melhor avaliados. Criterio de Aceite: resultados paginados com metadados completos em menos de 100ms."
  },
  {
    summary: "[Repositorio Backend] Sistema de Curtidas, Favoritos e Avaliacao Comunitaria",
    description: "Implementar endpoints POST /api/repositorio/praticas/:id/curtir (toggle de like com contador atomico no PostgreSQL), POST /api/repositorio/praticas/:id/favoritar e POST /api/repositorio/praticas/:id/comentarios para comentarios e relatos de experiencia de aplicacao em sala de aula. Criterio de Aceite: contadores atualizados atomicamente sem condicoes de corrida."
  },
  {
    summary: "[Repositorio Backend] Servico de Exportacao Server-side para PDF e DOCX com Banner Etico",
    description: "Desenvolver servico no backend (Puppeteer / PDFKit / docx) que converte qualquer atividade gerada ou pratica do repositorio em arquivo PDF ou DOCX diagramado para impressao, contendo cabecalho oficial da UFJF/PPGEM, dados do curso tecnico, equacoes renderizadas e o Banner de Alerta Etico Obrigatorio. Criterio de Aceite: download funcional com layout A4 institucional impecavel."
  },
  {
    summary: "[Reflexao Backend] API de Foruns Moderados, Topicos e Respostas em Arvore",
    description: "Construir endpoints para o Painel de Reflexao Critica: GET /api/reflexao/topicos (lista de foruns com contadores de respostas), POST /api/reflexao/topicos (criar novo debate), GET /api/reflexao/topicos/:id/respostas e POST /api/reflexao/topicos/:id/respostas (adicionar comentario com suporte a hierarquia de respostas). Criterio de Aceite: estrutura de dados recursiva em arvore persistida com integridade no PostgreSQL."
  },
  {
    summary: "[Reflexao Backend] API de Gestao de Artigos Criticos e Provocacoes Pedagogicas",
    description: "Implementar rotas GET /api/reflexao/artigos e GET /api/reflexao/provocacoes retornando textos curados sobre Educacao Matematica Critica, etica algoritmica e humanizacao da tecnologia. Suportar marcacao de lido/favorito pelo docente. Criterio de Aceite: entrega paginada com tempo de leitura estimado e referencias bibliograficas completas."
  },
  {
    summary: "[mAIcon Backend] Endpoint de Chatbot com Streaming SSE para o Assistente Virtual",
    description: "Desenvolver endpoint POST /api/maicon/chat com suporte a streaming de respostas via Server-Sent Events (SSE). O assistente responde duvidas em tempo real sobre navegacao na plataforma, explicacao dos 5 ambientes e orientacoes de uso etico de IA na Educacao Matematica. Criterio de Aceite: stream fluindo token a token com latencia inicial < 400ms."
  },
  {
    summary: "[mAIcon Backend] System Prompt Especializado de Suporte e Integracao NotebookLM",
    description: "Configurar o System Prompt institucional do Prof. mAIcon com a persona pedagogica do pesquisador Maycon Magalhães. Incluir orientacoes para direcionamento inteligente ao Google NotebookLM (com a mensagem fixa regulamentar) quando a duvida envolver sintese de documentos longos. Criterio de Aceite: respostas alinhadas estritamente com o escopo pedagogico da plataforma."
  },
  {
    summary: "[Suporte Backend] API de Metricas do Portfolio Formativo e Canal de Ajuda",
    description: "Desenvolver endpoint GET /api/suporte/metricas-docente que agrega dinamicamente no PostgreSQL os indicadores do professor: trilhas concluidas, materiais gerados no laboratorio, praticas compartilhadas e participacao em foruns. Incluir endpoint POST /api/suporte/ticket para envio de duvidas ou reporte de bugs diretamente a equipe da tese. Criterio de Aceite: metricas consolidadas em tempo real e gravacao do ticket com notificacao."
  },

  // ==========================================
  // ÉPICO: TESTES, DEVOPS E DEPLOY INSTITUCIONAL UFJF
  // ==========================================
  {
    summary: "[Testes Backend] Suite de Testes Unitarios e de Integracao das Rotas e IA",
    description: "Desenvolver testes automatizados (Jest / Vitest / Pytest) cobrindo autenticacao, validacao de esquemas de entrada, rotas de geracao de IA com mocks dos provedores Groq e Gemini, operacoes no PostgreSQL e geracao de PDFs. Criterio de Aceite: cobertura de testes superior a 80% nos servicos criticos de negocio."
  },
  {
    summary: "[Testes Carga] Testes de Carga e Concorrencia para o Piloto RFEPCT (k6 / Artillery)",
    description: "Executar testes de carga automatizados simulando requisicoes concorrentes de dezenas de professores durante o teste A/B. Avaliar capacidade de conexao com o PostgreSQL, tempo de fila das APIs de IA e consumo de memoria do servidor. Criterio de Aceite: sistema sustentando taxa de sucesso de 99.5% sob carga esperada sem vazamentos de memoria."
  },
  {
    summary: "[DevOps] Politica de Backups Automaticos e Recuperacao de Desastres no PostgreSQL",
    description: "Criar script automatizado via cron/systemd para realizacao de backups diarios (pg_dump) com compactacao, retencao de 30 dias e envio para diretorio seguro da infraestrutura da UFJF. Testar procedimento de restauracao do banco a partir do backup. Criterio de Aceite: rotina de backup comprovada e documentada com tempo de recuperacao inferior a 15 minutos."
  },
  {
    summary: "[DevOps] Deploy de Producao nos Servidores Institucionais e Dominio da UFJF",
    description: "Configurar ambiente de producao no servidor cedido pela UFJF: Nginx atuando como proxy reverso com SSL/TLS (HTTPS) certificado, PM2/Systemd gerenciando o servico backend com reinicio automatico, banco PostgreSQL endurecido e configuracao do subdominio oficial. Criterio de Aceite: plataforma acessivel sob HTTPS com politicas estritas de seguranca e monitoramento ativo."
  }
];

const csvRows = ['Summary,Description'];

tasks.forEach(task => {
  const cleanSummary = `"${task.summary.replace(/"/g, '""')}"`;
  const cleanDesc = `"${task.description.replace(/"/g, '""')}"`;
  csvRows.push(`${cleanSummary},${cleanDesc}`);
});

const outputPath = path.resolve(rootDir, 'docs', 'jira_backend_postgresql_full_tasks.csv');
fs.writeFileSync(outputPath, csvRows.join('\n'), 'utf-8');

console.log(`✅ CSV gerado com sucesso em: ${outputPath}`);
console.log(`📊 Total de tarefas geradas: ${tasks.length}`);

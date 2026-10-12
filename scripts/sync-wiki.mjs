import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const WIKI_REMOTE_URL = 'https://github.com/ShayeneFigueredo/IAProfEPT-plataforma.wiki.git';
const DOCS_WIKI_DIR = path.resolve(rootDir, 'docs', 'wiki');
const TEMP_WIKI_DIR = path.resolve(rootDir, '.temp_wiki');

console.log('🔄 Iniciando sincronização da Wiki do GitHub...');

// 1. Limpa diretório temporário se existir
if (fs.existsSync(TEMP_WIKI_DIR)) {
  fs.rmSync(TEMP_WIKI_DIR, { recursive: true, force: true });
}

// 2. Tenta clonar a Wiki do GitHub
try {
  console.log(`📡 Clonando ${WIKI_REMOTE_URL}...`);
  execSync(`git clone ${WIKI_REMOTE_URL} "${TEMP_WIKI_DIR}"`, { stdio: 'inherit' });
} catch (error) {
  console.error('\n❌ Erro ao clonar o repositório da Wiki do GitHub.');
  console.error('👉 O GitHub exige que a primeira página seja criada via interface web.');
  console.error('👉 Clique no botão verde "Create the first page" no GitHub e depois em "Save page".');
  console.error('👉 Depois de salvar, execute este script novamente para subir todos os arquivos.');
  process.exit(1);
}

// 3. Copia todos os arquivos da pasta docs/wiki para o repositório clonado
console.log('📋 Copiando arquivos de documentação para a Wiki...');
const files = fs.readdirSync(DOCS_WIKI_DIR);

for (const file of files) {
  if (file.endsWith('.md')) {
    const srcPath = path.join(DOCS_WIKI_DIR, file);
    const destPath = path.join(TEMP_WIKI_DIR, file);
    let content = fs.readFileSync(srcPath, 'utf-8');

    // Ajusta links relativos para sintaxe nativa do GitHub Wiki
    // Transforma ./ADR_001_...md em ADR_001_...
    content = content.replace(/\(\.\/([a-zA-Z0-9_\-]+)\.md\)/g, '($1)');
    content = content.replace(/\(\.\.\/([a-zA-Z0-9_\-]+)\.md\)/g, '($1)');

    fs.writeFileSync(destPath, content, 'utf-8');
    console.log(`  ✓ ${file}`);
  }
}

// 4. Cria o _Sidebar.md nativo do GitHub Wiki
console.log('📑 Gerando _Sidebar.md para navegação lateral...');
const sidebarContent = `### 🧠 Navegação da Wiki

- **[Início (Home)](Home)**

#### 🏛️ Decisões Arquiteturais (ADRs)
- [ADR-001: Engenharia de Prompts Oculta](ADR_001_ENGENHARIA_PROMPT_OCULTA_SEM_PROMPT_EM_BRANCO)
- [ADR-002: Autoridade Docente & Ética](ADR_002_PRINCIPIO_AUTORIDADE_DOCENTE_E_VALIDACAO_ETICA)
- [ADR-003: Arquitetura de IA Dupla & Teste A/B](ADR_003_ARQUITETURA_IA_DUPLA_E_PROTOCOLO_TESTE_AB)
- [ADR-004: Design System & Tokens](ADR_004_DESIGN_SYSTEM_TOKENS_E_ESTILOS_GLOBAIS)
- [ADR-005: Autenticação & Onboarding](ADR_005_AUTENTICACAO_ONBOARDING_ACOLHIMENTO_DOCENTE_RFEPCT)

#### 📖 Documentos Pedagógicos
- [Diário de Bordo — Fase 1 (MVP)](DIARIO_DE_BORDO_FASE1_MVP)
- [Matriz Curricular BNCC / CNCT](MATRIZ_CURRICULAR_BNCC_CNCT_EPT)

---
*IAprofEPT — PPGEM / UFJF*
`;

fs.writeFileSync(path.join(TEMP_WIKI_DIR, '_Sidebar.md'), sidebarContent, 'utf-8');
console.log('  ✓ _Sidebar.md');

// 5. Commit e Push
console.log('🚀 Enviando commits para a Wiki do GitHub...');
try {
  execSync('git add .', { cwd: TEMP_WIKI_DIR, stdio: 'inherit' });
  execSync('git commit -m "docs(wiki): sincronizar documentação oficial, ADRs e Diário de Bordo da Fase 1"', {
    cwd: TEMP_WIKI_DIR,
    stdio: 'inherit'
  });
  execSync('git push origin master', { cwd: TEMP_WIKI_DIR, stdio: 'inherit' });
  console.log('\n🎉 Sincronização concluída com sucesso! Atualize a página da Wiki no navegador.');
} catch (commitError) {
  // Se já estiver tudo commitado
  try {
    execSync('git push origin master', { cwd: TEMP_WIKI_DIR, stdio: 'inherit' });
    console.log('\n🎉 Sincronização concluída com sucesso! Atualize a página da Wiki no navegador.');
  } catch (pushErr) {
    console.error('❌ Erro no commit/push:', pushErr.message);
  }
}

// 6. Limpeza
if (fs.existsSync(TEMP_WIKI_DIR)) {
  fs.rmSync(TEMP_WIKI_DIR, { recursive: true, force: true });
}

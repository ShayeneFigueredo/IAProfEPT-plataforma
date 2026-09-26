# 🐙 Guia de Configuração e Fluxo de Trabalho no Git
> **Repositório Oficial:** `https://github.com/ShayeneFigueredo/IAProfEPT-plataforma`  
> **Organização do Repositório & Controle de Versão para o Doutorado**  

Este guia detalha o passo a passo exato para você (e a equipe) inicializar, organizar e manter o repositório Git com rastreabilidade científica.

---

## 🚀 1. Passo a Passo Inicial: Conectando ao Repositório do GitHub

Se você deseja que este diretório seja a base do repositório `IAProfEPT-plataforma`:

### No terminal (PowerShell dentro da pasta `c:\apps\IAProfEPT\PLATAFORMA`):

1. **Verificar o status atual do Git:**
   ```powershell
   git status
   ```

2. **Se for um novo repositório ou caso queira ajustar a URL do remote:**
   ```powershell
   # Configura o remote principal para o novo repositório da plataforma
   git remote set-url origin https://github.com/ShayeneFigueredo/IAProfEPT-plataforma.git
   
   # Ou se ainda não houver remote configurado:
   git remote add origin https://github.com/ShayeneFigueredo/IAProfEPT-plataforma.git
   ```

3. **Criar e apontar para a branch principal `main`:**
   ```powershell
   git branch -M main
   ```

4. **Adicionar os arquivos de governança, docs e templates:**
   ```powershell
   git add AGENTS.md docs/ .github/ .gitignore
   git commit -m "chore(governance): add AI guidelines, Jira backlog, Wiki structure and Git setup"
   ```

5. **Enviar para o GitHub:**
   ```powershell
   git push -u origin main
   ```

---

## 🌳 2. Estratégia de Branches (Git Flow Acadêmico)

Para manter o código seguro e estável ao longo das 5 Fases do Cronograma:

- `main` ➔ **Produção & Versão Homologada:** Apenas código estável, testado e validado.
- `develop` ➔ **Desenvolvimento Ativo:** Onde as funcionalidades das sprints se integram.
- `feature/<ID_JIRA>-<nome-da-tarefa>` ➔ **Branches de Funcionalidades:**
  - Ex: `feature/IAPROF-2-design-system`
  - Ex: `feature/IAPROF-5-groq-api`
  - Ex: `feature/IAPROF-7-prof-maicon`
- `release/vX.X` ➔ **Branches de Marco/Release:**
  - `release/v0.1-mvp` (Marco 1 - 05/10/2026)
  - `release/v0.2-ai-core` (Marco 2 - 19/10/2026)
  - `release/v0.3-piloto-30d` (Marco 3 - 20/11/2026)
  - `release/v1.0-final` (Marco Final - 15/12/2026)

---

## 🏷️ 3. Tags de Marcos Acadêmicos (Milestones)

Ao concluir cada Fase do Cronograma, crie uma Git Tag com mensagem anotada para comprovação científica na tese:

```powershell
# Marco 1 (05/10/2026) - MVP Front-end dos 5 Ambientes
git tag -a v0.1.0-mvp -m "Marco 1: MVP navegável dos 5 ambientes da Plataforma IAprofEPT"
git push origin v0.1.0-mvp

# Marco 2 (19/10/2026) - Backend de IA Dupla
git tag -a v0.2.0-ai-core -m "Marco 2: Integração Groq LLaMA 3.3 + Gemini e Prof. mAIcon"
git push origin v0.2.0-ai-core

# Marco 3 (20/11/2026) - Encerramento do Teste A/B de 30 Dias
git tag -a v0.3.0-piloto -m "Marco 3: Conclusão do teste empírico de 30 dias na RFEPCT"
git push origin v0.3.0-piloto

# Marco Final (15/12/2026) - Versão Definitiva para Banca e CAPES
git tag -a v1.0.0-final -m "Marco Final: Homologação e Deploy definitivo nos servidores UFJF"
git push origin v1.0.0-final
```

---

## 🛡️ 4. Arquivos Protegidos no `.gitignore`
Garanta que seu `.gitignore` contenha:
```gitignore
# Arquivos de Ambiente e Chaves de API (NUNCA COMMITAR)
.env
.env.local
*.env

# Dependências
node_modules/
__pycache__/
*.pyc

# Builds e Temporários
dist/
build/
.cache/
.DS_Store
Thumbs.db
```

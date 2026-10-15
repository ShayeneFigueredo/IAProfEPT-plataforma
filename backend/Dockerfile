# ==============================================================================
# Dockerfile — Backend API Plataforma IAprofEPT
# Tese de Doutorado PPGEM / UFJF — Maycon Luiz Amaral Magalhães
# ==============================================================================

FROM node:20-alpine AS base

# Dependências nativas básicas para compilação caso necessário
RUN apk add --no-cache libc6-compat wget curl

WORKDIR /app

# Copia manifestos de pacotes
COPY package.json package-lock.json ./

# Instala dependências
RUN npm ci --omit=dev && npm cache clean --force

# Copia código do backend e configurações
COPY knexfile.js ./
COPY backend/ ./backend/

# Variáveis de ambiente padrão
ENV NODE_ENV=production \
    PORT=3001

# Cria usuário não-root por segurança (princípio de menor privilégio)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 backenduser && \
    chown -R backenduser:nodejs /app

USER backenduser

# Expõe porta da API
EXPOSE 3001

# Healthcheck do container backend
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Comando de inicialização
CMD ["node", "backend/src/server.js"]

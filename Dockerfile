# ── Estágio 1: Build do Frontend React ──
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --silent
COPY frontend/ .
RUN npm run build

# ── Estágio 2: Produção ──
FROM node:20-alpine

# Chromium para WhatsApp Web (opcional - servidor funciona sem)
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN apk add --no-cache chromium chromium-chromedriver

WORKDIR /app

# Backend deps (production apenas)
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production --silent

# Copia o build do frontend
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Copia backend e public
COPY backend/ ./backend/
COPY public/ ./public/

# Cria pasta de dados persistente
RUN mkdir -p /app/data && chmod 777 /app/data

# Variáveis de ambiente para o Chromium
ENV CHROMIUM_PATH=/usr/bin/chromium-browser
ENV NODE_ENV=production

# Railway usa PORT dinâmica
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-5000}/api/health || exit 1

CMD ["node", "backend/src/server.js"]

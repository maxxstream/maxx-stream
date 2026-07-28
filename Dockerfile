FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

FROM node:18-alpine
RUN apk add --no-cache chromium chromium-chromedriver
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
COPY backend/ ./backend/
COPY public/ ./public/
RUN mkdir -p /app/data && chmod 777 /app/data
ENV CHROMIUM_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
EXPOSE 5000
CMD ["node", "backend/src/server.js"]

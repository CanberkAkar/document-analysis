# ============================================
# Frontend Dockerfile — Next.js Multi-stage
# ============================================

# --- Stage 1: Install dependencies ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Stage 2: Build ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env — backend API URL (Accessible from client browser)
ENV NEXT_PUBLIC_API_URL=http://localhost:3000
ARG NEXT_PUBLIC_COMMUNICATION_SECRET
ENV NEXT_PUBLIC_COMMUNICATION_SECRET=${NEXT_PUBLIC_COMMUNICATION_SECRET:-super_secret_comm_key_123!}

RUN npm run build

# --- Stage 3: Production ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Güvenlik: root olmayan kullanıcı
RUN addgroup --system --gid 1001 nextjs && \
    adduser --system --uid 1001 nextjs

# Next.js standalone output dosyaları
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

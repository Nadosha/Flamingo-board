FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

# ─── Stage 1: dependencies ────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ─── Stage 2: build ───────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ─── Stage 3: runtime ─────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nestjs

COPY --from=builder /app/dist ./dist
COPY --from=deps    /app/node_modules ./node_modules
COPY package.json ./

USER nestjs

EXPOSE 4000
ENV PORT=4000

CMD ["node", "dist/main"]

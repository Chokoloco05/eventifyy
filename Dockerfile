# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS base

ENV CI=false
ENV EXPO_NO_TELEMETRY=1
ENV DATABASE_URL=postgresql://postgres:password@postgres:5432/eventifyy

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

FROM base AS app

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/native/package.json ./apps/native/package.json
COPY packages/api/package.json ./packages/api/package.json
COPY packages/auth/package.json ./packages/auth/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/env/package.json ./packages/env/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/db/prisma.config.ts ./packages/db/prisma.config.ts
COPY packages/db/prisma ./packages/db/prisma
RUN npm ci
COPY . .

FROM app AS web

ENV NODE_ENV=development

EXPOSE 3001
CMD ["sh", "-c", "node packages/db/scripts/clear-sessions.mjs && npm --workspace web run dev -- --hostname 0.0.0.0"]

FROM app AS web-prod

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm --workspace web run build

EXPOSE 3001
CMD ["sh", "-c", "DATABASE_URL=postgresql://postgres:password@postgres:5432/eventifyy npm --workspace @eventifyy/db run db:push && node packages/db/scripts/clear-sessions.mjs && npm --workspace web run start -- -H 0.0.0.0 -p 3001"]

FROM app AS mobile

ENV NODE_ENV=development

EXPOSE 8081
CMD ["npm", "--workspace", "native", "run", "dev"]

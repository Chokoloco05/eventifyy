# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS base

ENV CI=false
ENV NODE_ENV=development
ENV EXPO_NO_TELEMETRY=1

WORKDIR /app

FROM base AS app

COPY . .
RUN npm ci

FROM app AS web

EXPOSE 3001
CMD ["npm", "--workspace", "web", "run", "dev", "--", "--hostname", "0.0.0.0"]

FROM app AS mobile

EXPOSE 8081
CMD ["npm", "--workspace", "native", "run", "dev"]

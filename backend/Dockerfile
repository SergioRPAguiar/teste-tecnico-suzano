FROM node:22-bookworm-slim@sha256:c3de60bf2f9dd0ac6370e6117950ff62d6e339527e7472301c9c78a017978392 AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS build
COPY backend/package.json backend/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm,sharing=locked npm ci --fetch-timeout=60000 --fetch-retries=2
COPY backend/ ./
RUN npm run db:generate && npm run build

FROM base AS runtime
ENV NODE_ENV=production
COPY backend/package.json backend/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm,sharing=locked npm ci --omit=dev --fetch-timeout=60000 --fetch-retries=2
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3001
CMD ["npm", "run", "start:prod"]

# Build context: repository root.
#   docker build -f apps/api/Dockerfile -t manv-triage-simulator-api .

# ── Build ──
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/triage/package.json packages/triage/
RUN npm ci
COPY tsconfig.base.json ./
COPY packages/triage packages/triage
COPY apps/api apps/api
RUN npm run build -w @manv/api

# ── Production dependencies (api workspace only) ──
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/triage/package.json packages/triage/
RUN npm ci --omit=dev --omit=peer --workspace @manv/api --include-workspace-root=false

# ── Runtime ──
FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app/apps/api
COPY --from=deps /app/node_modules /app/node_modules
COPY apps/api/package.json ./
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/drizzle ./drizzle
USER node
EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3001/api/health || exit 1
CMD ["node", "dist/server.js"]

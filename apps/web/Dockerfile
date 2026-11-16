# Build context: repository root.
#   docker build -f apps/web/Dockerfile -t manv-triage-simulator-web .

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
COPY apps/web apps/web
RUN npm run build -w @manv/web

# ── Serve ──
FROM nginx:alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80

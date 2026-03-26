# ── Build ──
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx vite build --base=/

# ── Serve ──
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx-frontend.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
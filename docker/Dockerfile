# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json package-lock.json ./
COPY packages/core/package.json ./packages/core/
COPY apps/dashboard/package.json ./apps/dashboard/

RUN npm ci

# Copy source
COPY . .

RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

COPY --from=builder /app/apps/dashboard/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

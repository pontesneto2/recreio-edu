# syntax=docker/dockerfile:1
# Imagem do portal. Build a partir da raiz do repositório:
#   docker build -f apps/web/Dockerfile -t recreio-web .

FROM node:24-alpine AS build
WORKDIR /app
ENV HUSKY=0 \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false
# O npm ci confere o package-lock.json contra o package.json de todos os workspaces.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/contracts/package.json packages/contracts/
COPY packages/design-system/package.json packages/design-system/
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts
COPY tsconfig.base.json tsconfig.node.json ./
COPY packages packages
COPY apps/web apps/web
RUN npm run build -w @recreio/web

# Roda como usuário nginx (uid 101) e escuta na porta 8080.
FROM nginxinc/nginx-unprivileged:1.31-alpine AS runtime
ENV API_UPSTREAM=http://api:3333
COPY apps/web/nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY apps/web/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD ["wget", "-q", "-O", "/dev/null", "http://127.0.0.1:8080/healthz"]

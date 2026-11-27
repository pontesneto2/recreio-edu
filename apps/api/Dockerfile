# syntax=docker/dockerfile:1
# Imagem da API. Build a partir da raiz do repositório:
#   docker build -f apps/api/Dockerfile -t recreio-api .

FROM node:24-alpine AS base
WORKDIR /app
ENV HUSKY=0 \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false

# O npm ci confere o package-lock.json contra o package.json de todos os workspaces.
FROM base AS manifests
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/contracts/package.json packages/contracts/
COPY packages/design-system/package.json packages/design-system/

FROM manifests AS build
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts
COPY tsconfig.base.json tsconfig.node.json ./
COPY packages/contracts packages/contracts
COPY apps/api apps/api
# A pasta drizzle/ guarda as migrações. Ela é criada vazia quando ainda não existe,
# para o COPY do estágio final funcionar nos dois casos.
RUN npm run build -w @recreio/api && mkdir -p apps/api/drizzle

# Só as dependências de produção da API e dos workspaces que ela usa.
FROM manifests AS prod-deps
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --ignore-scripts -w @recreio/api

FROM node:24-alpine AS runtime
ENV NODE_ENV=production \
    PORT=3333
WORKDIR /app
# Os arquivos ficam com dono root. O processo roda como node e não altera o código.
COPY --from=prod-deps /app ./
# @recreio/contracts exporta o .ts de src/. O link em node_modules aponta para
# /app/packages/contracts, fora de node_modules, então o Node remove os tipos e executa.
COPY packages/contracts/src packages/contracts/src
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/drizzle apps/api/drizzle

USER node
WORKDIR /app/apps/api
EXPOSE 3333
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || 3333) + '/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
# O OpenTelemetry carrega antes do app. O worker usa a mesma imagem com `dist/worker.js` (compose.app.yml).
CMD ["node", "--import", "./dist/instrumentation.js", "dist/main.js"]

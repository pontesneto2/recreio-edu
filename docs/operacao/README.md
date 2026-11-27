# Operação

Como a API e o portal são empacotados, configurados e liberados. A hospedagem ainda não foi escolhida (ADR 0011 pendente). Este documento cobre o que vale para qualquer provedor.

- [ci-cd.md](ci-cd.md): workflows do GitHub Actions e proteção da `main`.
- [runbook-local.md](runbook-local.md): serviços locais com Docker Compose.

## Ambientes

| Ambiente        | Onde roda                                      | Como chega lá                         | Dados                          |
| --------------- | ---------------------------------------------- | ------------------------------------- | ------------------------------ |
| Desenvolvimento | Máquina de cada pessoa                         | `npm run dev` e `docker compose up`   | Seed do protótipo              |
| Staging         | Hospedagem do ADR 0011                         | Deploy automático a cada merge `main` | Dados de teste, nunca reais    |
| Produção        | Hospedagem do ADR 0011, mesma forma do staging | Tag de versão `vX.Y.Z`                | Dados reais das escolas (LGPD) |

Staging e produção usam as mesmas imagens. Só as variáveis de ambiente mudam. Segredos ficam no gerenciador de segredos da hospedagem, nunca no repositório nem na imagem.

## Imagens

| Imagem | Dockerfile            | Base                                      | Porta | Usuário       | Healthcheck               |
| ------ | --------------------- | ----------------------------------------- | ----- | ------------- | ------------------------- |
| API    | `apps/api/Dockerfile` | `node:24-alpine`                          | 3333  | `node` (1000) | `GET /api/health`         |
| Portal | `apps/web/Dockerfile` | `nginxinc/nginx-unprivileged:1.30-alpine` | 8080  | `nginx` (101) | `GET /healthz` (no nginx) |

O build das 2 imagens parte da raiz do repositório, porque elas usam os workspaces de `packages/`:

```bash
docker build -f apps/api/Dockerfile -t recreio-api .
docker build -f apps/web/Dockerfile -t recreio-web .
```

O `.dockerignore` da raiz tira do contexto `node_modules`, `dist`, `.env`, `docs`, `prototipo` e `.git`.

### API

- O estágio `build` roda `npm ci` e `npm run build -w @recreio/api` (tsc para `dist/`).
- O estágio `prod-deps` roda `npm ci --omit=dev -w @recreio/api`. Entram só as dependências de produção da API e de `@recreio/contracts`.
- A imagem final tem `NODE_ENV=production`, roda `node dist/main.js` e os arquivos ficam com dono root, então o processo não altera o próprio código.
- `@recreio/contracts` exporta os arquivos `.ts` de `src/`. O Node 24 remove os tipos de arquivos cujo caminho real fica fora de `node_modules`. O link `node_modules/@recreio/contracts` aponta para `/app/packages/contracts`, então o pacote roda sem compilação. O teste de fumaça confirmou com `GET /api/alunos/xyz`, que valida o id com o schema do pacote.
- A pasta `apps/api/drizzle` (migrações) entra na imagem. O build cria a pasta vazia quando ela ainda não existe.
- O `pino-http` registra cada chamada do healthcheck (a cada 15 s). Filtrar `/api/health` do log é uma mudança em `apps/api/src/app.ts`.

### Portal

- O estágio `build` roda `npm ci` e `npm run build -w @recreio/web` (tsc e Vite).
- O nginx serve `dist/` com fallback de SPA: rota desconhecida devolve `index.html`. Arquivo ausente em `/assets/` devolve 404.
- `/assets/*` sai com `Cache-Control: public, max-age=31536000, immutable`, porque o Vite põe hash no nome.
- `index.html`, `sw.js`, `registerSW.js` e `manifest.webmanifest` saem com `Cache-Control: no-cache`.
- gzip para HTML, CSS, JS, JSON, SVG e manifesto.
- `/api/` é repassado para `API_UPSTREAM` (padrão `http://api:3333`). O valor leva esquema, host e porta, sem caminho. O nginx resolve o nome ao subir, então a API precisa existir na rede antes do portal.
- Cabeçalhos em `apps/web/nginx/security-headers.conf`: CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` e `Cross-Origin-Opener-Policy`.
- A CSP libera scripts só da própria origem, estilos inline (os componentes usam a prop `style`), imagens `data:` e o Google Fonts importado em `recreio.css`. Uma origem nova (Sentry, gateway de pagamento) entra em `connect-src` ou `script-src` nesse arquivo.
- `Permissions-Policy` bloqueia câmera, microfone e geolocalização. Uma tela web que usar câmera precisa liberar `camera=(self)`.
- HSTS fica no proxy com TLS da hospedagem. O nginx da imagem recebe HTTP.

### Rodar as imagens localmente

`compose.app.yml` sobe a API e o portal com as imagens de produção, ligados aos serviços de `docker-compose.yml`:

```bash
docker compose -f compose.app.yml up --build
```

O portal fica em http://localhost:8080 (mude com `WEB_PORT`). A API fica só na rede interna do Compose.

## Variáveis de ambiente da API

A API valida as variáveis com Zod em `apps/api/src/config/env.ts` ao subir. Variável inválida derruba o processo com a mensagem do Zod. Hoje o schema lê 4 variáveis. As demais estão em `apps/api/.env.example` e entram no schema junto com o módulo que as usa (banco, filas, e-mail, arquivos).

| Variável                 | Padrão                  | No schema hoje | Uso                                                                          |
| ------------------------ | ----------------------- | -------------- | ---------------------------------------------------------------------------- |
| `NODE_ENV`               | `development`           | Sim            | `development`, `test` ou `production`. A imagem define `production`.         |
| `PORT`                   | `3333`                  | Sim            | Porta HTTP da API.                                                           |
| `CORS_ORIGIN`            | `http://localhost:5173` | Sim            | Origem do portal liberada no CORS. Precisa ser URL válida.                   |
| `LOG_LEVEL`              | `info`                  | Sim            | Nível do pino: `fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent`. |
| `DATABASE_URL`           | sem padrão              | Não            | Postgres com o usuário `recreio_app`, sujeito ao Row Level Security.         |
| `DATABASE_MIGRATION_URL` | sem padrão              | Não            | Postgres com o dono das tabelas. Só para migrações. Segredo.                 |
| `DEV_ESCOLA_DOMINIO`     | sem padrão              | Não            | Escola usada quando o portal roda em `localhost` (ADR 0006).                 |
| `REDIS_URL`              | sem padrão              | Não            | Redis das filas BullMQ (ADR 0009).                                           |
| `SMTP_URL`               | sem padrão              | Não            | Servidor de e-mail. Mailpit no ambiente local.                               |
| `S3_ENDPOINT`            | sem padrão              | Não            | Endpoint compatível com S3 (ADR 0010). RustFS no ambiente local.             |
| `S3_ACCESS_KEY`          | sem padrão              | Não            | Chave de acesso do S3. Segredo.                                              |
| `S3_SECRET_KEY`          | sem padrão              | Não            | Chave secreta do S3. Segredo.                                                |
| `S3_BUCKET`              | sem padrão              | Não            | Bucket de documentos e fotos.                                                |

No portal, a única variável de execução é `API_UPSTREAM`, lida pelo nginx.

## Health e ready

| Rota          | Situação  | Responde 200 quando                         | Uso                                                     |
| ------------- | --------- | ------------------------------------------- | ------------------------------------------------------- |
| `/api/health` | Existe    | O processo Node atende HTTP                 | Healthcheck da imagem e liveness. Não consulta o banco. |
| `/api/ready`  | Planejada | Postgres e Redis respondem (roadmap fase 1) | Readiness: o balanceador só manda tráfego com 200 aqui. |

O liveness reinicia o container quando falha. Por isso ele não depende do banco: uma queda do Postgres reiniciaria todas as instâncias da API sem resolver nada. O readiness tira a instância do balanceador até o banco voltar.

## Release

- Versões seguem semver: `vMAJOR.MINOR.PATCH`. MAJOR quebra contrato público da API, MINOR traz funcionalidade, PATCH corrige.
- Cada merge na `main` gera imagens com a tag do commit (`sha-<7 caracteres>`) e faz deploy em staging.
- Uma tag `vX.Y.Z` na `main` promove as mesmas imagens do commit para produção, com a tag da versão. A imagem não é reconstruída.
- As migrações rodam no pipeline antes do deploy e precisam funcionar com a versão anterior da API ainda no ar.
- Rollback: deploy da tag anterior. Migração não é desfeita no rollback, por isso cada uma é compatível com a versão anterior.
- O changelog sai dos commits (Conventional Commits).

Pendente para este fluxo: registro de imagens e workflow de deploy, ambos dependem do ADR 0011.

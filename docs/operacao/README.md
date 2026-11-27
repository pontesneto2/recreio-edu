# Operação

Como a API e o portal são empacotados, configurados e liberados. A hospedagem ainda não foi escolhida (ADR 0011 pendente). Este documento cobre o que vale para qualquer provedor.

- [ci-cd.md](ci-cd.md): workflows do GitHub Actions e proteção da `main`.
- [runbook-local.md](runbook-local.md): serviços locais com Docker Compose.
- [observabilidade.md](observabilidade.md): logs, traces (OpenTelemetry), erros (Sentry) e como ver traces localmente.
- [filas.md](filas.md): filas BullMQ, worker, tentativas e como criar uma tarefa.
- [armazenamento.md](armazenamento.md): bucket, chaves por escola e URLs assinadas.

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
| Worker | `apps/api/Dockerfile` | A mesma imagem da API, outro comando      | não   | `node` (1000) | desligado                 |
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
- A imagem final tem `NODE_ENV=production`, roda `node --import ./dist/instrumentation.js dist/main.js` e os arquivos ficam com dono root, então o processo não altera o próprio código. O `--import` liga o OpenTelemetry antes do app ([observabilidade.md](observabilidade.md)).
- O worker usa a mesma imagem com o comando `node --import ./dist/instrumentation.js dist/worker.js`. O serviço desliga o healthcheck da imagem, porque o worker não serve HTTP. Exemplo no serviço `worker` de `compose.app.yml`.
- `@recreio/contracts` exporta os arquivos `.ts` de `src/`. O Node 24 remove os tipos de arquivos cujo caminho real fica fora de `node_modules`. O link `node_modules/@recreio/contracts` aponta para `/app/packages/contracts`, então o pacote roda sem compilação. O teste de fumaça confirmou com `GET /api/alunos/xyz`, que valida o id com o schema do pacote.
- A pasta `apps/api/drizzle` (migrações) entra na imagem. O build cria a pasta vazia quando ela ainda não existe.
- O `pino-http` não registra `/api/health` nem `/api/ready`, chamados pelo healthcheck a cada 15 s.

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

`compose.app.yml` sobe a API, o worker e o portal com as imagens de produção, ligados aos serviços de `docker-compose.yml`:

```bash
docker compose -f compose.app.yml up --build
```

O portal fica em http://localhost:8080 (mude com `WEB_PORT`). A API e o worker ficam só na rede interna do Compose.

## Variáveis de ambiente da API

A API e o worker validam as variáveis com Zod em `apps/api/src/config/env.ts` ao subir. Variável inválida derruba o processo com a mensagem do Zod. Fora de produção, as variáveis de serviço caem nos valores do `docker-compose.yml`. Em produção, as marcadas como obrigatórias derrubam o processo quando faltam. O modelo local está em `apps/api/.env.example`.

| Variável                      | Padrão fora de produção                   | Em produção                  | Uso                                                                                            |
| ----------------------------- | ----------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------- |
| `NODE_ENV`                    | `development`                             | `production` (na imagem)     | `development`, `test` ou `production`.                                                         |
| `PORT`                        | `3333`                                    | `3333`                       | Porta HTTP da API.                                                                             |
| `CORS_ORIGIN`                 | `http://localhost:5173`                   | Origem do portal             | Origem liberada no CORS. Precisa ser URL válida.                                               |
| `LOG_LEVEL`                   | `info`                                    | `info`                       | Nível do pino: `fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent`.                   |
| `RATE_LIMIT_PER_MINUTE`       | `300`                                     | `300`                        | Requisições por minuto por IP em `/api/v1`. Desligado em `NODE_ENV=test`.                      |
| `TRUST_PROXY`                 | `loopback`                                | Saltos de proxy (ver abaixo) | `trust proxy` do Express: define `req.ip` e o IP do limite de requisições.                     |
| `DATABASE_URL`                | `recreio_app` em `localhost:5432`         | Obrigatória                  | Postgres com o usuário `recreio_app`, sujeito ao Row Level Security.                           |
| `DATABASE_MIGRATION_URL`      | `recreio` em `localhost:5432`             | Obrigatória. Segredo         | Postgres com o dono das tabelas. Só para migrações e seed.                                     |
| `AUTH_SECRET`                 | Valor local fixo                          | Obrigatória. Segredo         | Assina cookies e tokens do Better Auth. 32 caracteres ou mais (ADR 0007).                      |
| `AUTH_URL`                    | `http://localhost:5173`                   | Origem do portal             | Origem dos links dos e-mails de conta quando o `Origin` não é confiável.                       |
| `AUTH_TRUSTED_ORIGINS`        | `http://localhost:5173`                   | Origem do portal             | Origens aceitas pelo Better Auth, por vírgula. Aceita curinga de subdomínio.                   |
| `AUTH_RATE_LIMIT_PER_MINUTE`  | `10`                                      | `10`                         | Tentativas por minuto por IP em entrar, cadastrar e trocar senha.                              |
| `SEED_SENHA_PADRAO`           | Vazia                                     | Não usar                     | Senha das contas de demonstração do seed. O seed não roda em produção.                         |
| `REDIS_URL`                   | `redis://localhost:6379` (vazia em teste) | Obrigatória                  | Redis das filas e do contador do limite (ADR 0009). Sem ela, o limite fica em memória.         |
| `WORKER_CONCURRENCY`          | `5`                                       | `5`                          | Tarefas por fila que o worker processa ao mesmo tempo.                                         |
| `SMTP_URL`                    | `smtp://localhost:1025`                   | Obrigatória. Segredo         | Servidor de e-mail. Mailpit no ambiente local.                                                 |
| `EMAIL_FROM`                  | `Recreio <nao-responda@recreio.app>`      | Remetente verificado         | Remetente dos e-mails.                                                                         |
| `S3_ENDPOINT`                 | `http://localhost:9000`                   | Vazia na AWS                 | Endpoint compatível com S3 (ADR 0010). RustFS no ambiente local.                               |
| `S3_PUBLIC_ENDPOINT`          | sem padrão                                | Opcional                     | Endpoint das URLs assinadas entregues ao navegador. Sem valor, vale `S3_ENDPOINT`.             |
| `S3_REGION`                   | `us-east-1`                               | Região do bucket             | Região do S3.                                                                                  |
| `S3_ACCESS_KEY`               | `recreio`                                 | Opcional. Segredo            | Chave de acesso. Sem ela, o SDK usa a cadeia padrão de credenciais.                            |
| `S3_SECRET_KEY`               | `recreio-storage`                         | Opcional. Segredo            | Chave secreta.                                                                                 |
| `S3_BUCKET`                   | `recreio`                                 | Obrigatória                  | Bucket de documentos e fotos.                                                                  |
| `S3_FORCE_PATH_STYLE`         | `true` quando há `S3_ENDPOINT`            | `false` na AWS               | URL `endpoint/bucket/chave`, exigida pelo RustFS.                                              |
| `S3_URL_TTL_SECONDS`          | `300`                                     | `300`                        | Validade das URLs assinadas, de 30 a 3600 segundos.                                            |
| `OTEL_SDK_DISABLED`           | `false` (`true` nos testes)               | `false`                      | Desliga o OpenTelemetry.                                                                       |
| `OTEL_SERVICE_NAME`           | `recreio-api` ou `recreio-worker`         | Opcional                     | Nome do serviço nos traces.                                                                    |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4318` (padrão do SDK)   | Coletor da hospedagem        | Destino OTLP dos traces. As demais `OTEL_*` estão em [observabilidade.md](observabilidade.md). |
| `SENTRY_DSN`                  | sem padrão                                | Recomendada                  | Projeto do Sentry. Sem ela, nenhum erro sai para o Sentry.                                     |
| `SENTRY_ENVIRONMENT`          | valor de `NODE_ENV`                       | `staging` ou `production`    | Ambiente mostrado no Sentry.                                                                   |

No portal, a única variável de execução é `API_UPSTREAM`, lida pelo nginx.

### TRUST_PROXY em produção

O Express só lê `X-Forwarded-For` de proxies confiáveis. Com o valor errado, `req.ip` vira o IP do proxy e todos os clientes dividem a mesma cota do limite de requisições, ou um cliente forja o próprio IP.

| Topologia                                              | Valor         |
| ------------------------------------------------------ | ------------- |
| Desenvolvimento (Vite repassa `/api` em `localhost`)   | `loopback`    |
| `compose.app.yml` (nginx do portal em outro container) | `uniquelocal` |
| Balanceador da hospedagem na frente da API             | `1`           |
| Balanceador e nginx do portal na frente da API         | `2`           |

O número conta os saltos a partir da API. Use o número da topologia real depois do ADR 0011. `true` confia em qualquer origem e não deve ir para produção.

## Health e ready

| Rota          | Responde 200 quando                                      | Uso                                                                 |
| ------------- | -------------------------------------------------------- | ------------------------------------------------------------------- |
| `/api/health` | O processo Node atende HTTP                              | Healthcheck da imagem e liveness. Não consulta dependências.        |
| `/api/ready`  | Postgres responde a `select 1` e Redis responde a `PING` | Readiness: o balanceador só manda tráfego com 200 aqui. Senão, 503. |

O corpo de `/api/ready` diz qual dependência falhou. Cada verificação tem 3 s de limite e as 2 rodam em paralelo:

```json
{ "status": "indisponivel", "dependencias": { "postgres": "ok", "redis": "indisponivel" } }
```

Cada dependência vale `ok`, `indisponivel` ou `desligado` (não configurada no processo, só nos testes sem Redis). O motivo da falha vai só para o log (`dependência indisponível`).

O liveness reinicia o container quando falha. Por isso ele não depende do banco nem do Redis: uma queda do Postgres reiniciaria todas as instâncias da API sem resolver nada. O readiness tira a instância do balanceador até a dependência voltar.

## Release

- Versões seguem semver: `vMAJOR.MINOR.PATCH`. MAJOR quebra contrato público da API, MINOR traz funcionalidade, PATCH corrige.
- Cada merge na `main` gera imagens com a tag do commit (`sha-<7 caracteres>`) e faz deploy em staging.
- Uma tag `vX.Y.Z` na `main` promove as mesmas imagens do commit para produção, com a tag da versão. A imagem não é reconstruída.
- As migrações rodam no pipeline antes do deploy e precisam funcionar com a versão anterior da API ainda no ar.
- Rollback: deploy da tag anterior. Migração não é desfeita no rollback, por isso cada uma é compatível com a versão anterior.
- O changelog sai dos commits (Conventional Commits).

Pendente para este fluxo: registro de imagens e workflow de deploy, ambos dependem do ADR 0011.

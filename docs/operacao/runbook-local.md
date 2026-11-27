# Runbook local

Serviços de apoio do desenvolvimento, definidos em `docker-compose.yml`. A API, o worker das filas e o portal rodam fora do Docker com `npm run dev`. Para testar as imagens de produção, veja a última seção.

Requisito: Docker Desktop (ou Docker Engine) com Compose 2.20 ou mais novo.

## Comandos

| Ação                         | Comando                                                   |
| ---------------------------- | --------------------------------------------------------- |
| Subir os serviços            | `docker compose up -d`                                    |
| Ver o estado e o healthcheck | `docker compose ps`                                       |
| Ver logs de todos            | `docker compose logs -f`                                  |
| Ver logs de um serviço       | `docker compose logs -f postgres`                         |
| Abrir o psql                 | `docker compose exec postgres psql -U recreio -d recreio` |
| Parar sem perder dados       | `docker compose down`                                     |
| Parar e apagar os dados      | `docker compose down -v`                                  |
| Subir também o Jaeger        | `docker compose --profile observabilidade up -d`          |
| Parar o Jaeger               | `docker compose --profile observabilidade down`           |

## Portas

| Serviço  | Porta | Uso                                                | Credenciais                                                       |
| -------- | ----- | -------------------------------------------------- | ----------------------------------------------------------------- |
| Postgres | 5432  | Banco `recreio`                                    | `recreio` / `recreio` (dono), `recreio_app` / `recreio_app` (API) |
| Redis    | 6379  | Filas BullMQ                                       | sem senha                                                         |
| Mailpit  | 1025  | SMTP que recebe os e-mails da API                  | sem senha                                                         |
| Mailpit  | 8025  | Interface web dos e-mails recebidos                | http://localhost:8025                                             |
| RustFS   | 9000  | API compatível com S3                              | `recreio` / `recreio-storage`                                     |
| RustFS   | 9001  | Console web do armazenamento                       | http://localhost:9001                                             |
| Jaeger   | 16686 | Interface dos traces (perfil `observabilidade`)    | http://localhost:16686                                            |
| Jaeger   | 4318  | OTLP por HTTP, recebe os traces da API e do worker | sem senha                                                         |

A API (`npm run dev:api`) usa 3333 e o portal (`npm run dev:web`) usa 5173. O worker (`npm run dev:worker`) não abre porta.

## Worker e e-mail

`npm run dev` sobe o worker junto com a API e o portal. Para testar a fila de e-mails:

1. `npm run email:teste -w @recreio/api -- voce@exemplo.com` enfileira um e-mail de teste.
2. O log do worker mostra `tarefa concluída`.
3. O e-mail aparece em http://localhost:8025.

Com o Redis fora do ar, o worker registra `Redis indisponível, tentando reconectar` e volta a consumir sozinho quando o Redis sobe. Filas, tentativas e falhas estão em [filas.md](filas.md).

A porta do Postgres no host vem de `POSTGRES_PORT` no `.env` da raiz (modelo em `.env.example`). Sem o arquivo, fica 5432. Quem troca a porta ajusta também `DATABASE_URL` e `DATABASE_MIGRATION_URL` em `apps/api/.env`.

### PostgreSQL do Windows na 5432

Um PostgreSQL instalado como serviço do Windows escuta na 5432 junto com o Docker Desktop. `localhost:5432` chega nele, e o login falha com `password authentication failed for user "recreio"`, mesmo com o Compose no ar. Para confirmar, `netstat -ano | findstr :5432` mostra 2 processos, um deles `postgres.exe`.

Correção, sem mexer no serviço do Windows:

1. `.env` na raiz com `POSTGRES_PORT=5433`.
2. Em `apps/api/.env`:

   ```bash
   DATABASE_URL=postgres://recreio_app:recreio_app@localhost:5433/recreio
   DATABASE_MIGRATION_URL=postgres://recreio:recreio@localhost:5433/recreio
   ```

3. `docker compose up -d`, depois `npm run db:migrate` e `npm run db:seed`.

## Apagar e recriar os dados

```bash
docker compose down -v
docker compose up -d
```

O `-v` apaga os volumes `postgres-data` e `storage-data`. Na subida seguinte, o Postgres roda `infra/postgres/init/01-app-role.sh` de novo e recria o usuário `recreio_app`. O script só roda com o volume vazio.

O bucket `recreio` do RustFS não é criado pelo Compose. A API cria o bucket ao subir em desenvolvimento e registra `bucket de arquivos pronto` com `resultado: "criado"`. Detalhes em [armazenamento.md](armazenamento.md).

## Problemas comuns

| Sintoma                                                                                       | Causa                                         | Correção                                                                                       |
| --------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `error during connect` ou `Cannot connect to the Docker daemon`                               | Docker Desktop fechado                        | Abra o Docker Desktop e espere o ícone ficar verde. Confira com `docker info`.                 |
| `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified` (Windows) | Docker Desktop fechado ou WSL parado          | Abra o Docker Desktop. Se persistir, rode `wsl --shutdown` e abra de novo.                     |
| `Bind for 0.0.0.0:5432 failed: port is already allocated`                                     | Outro Postgres (ou outro Compose) na porta    | Pare o outro processo ou use `POSTGRES_PORT` no `.env` da raiz.                                |
| `password authentication failed for user "recreio"` com o Compose no ar (Windows)             | PostgreSQL do Windows atende `localhost:5432` | `POSTGRES_PORT=5433`, como em [PostgreSQL do Windows na 5432](#postgresql-do-windows-na-5432). |
| `role "recreio_app" does not exist`                                                           | Volume criado antes do script de init         | `docker compose down -v` e suba de novo.                                                       |
| `password authentication failed for user "recreio_app"`                                       | Senha diferente da do volume                  | Confira `DATABASE_URL` em `apps/api/.env` ou recrie o volume.                                  |
| Serviço com estado `unhealthy` em `docker compose ps`                                         | Serviço não respondeu ao healthcheck          | `docker compose logs <serviço>` mostra o motivo.                                               |
| E-mail não aparece no Mailpit                                                                 | Worker parado ou `SMTP_URL` em outro host     | Suba o worker (`npm run dev:worker`). Use `smtp://localhost:1025` no `apps/api/.env`.          |
| `/api/ready` responde 503 com `"redis": "indisponivel"`                                       | Redis parado                                  | `docker compose up -d redis`. O limite de requisições deixa passar enquanto isso.              |
| `bucket de arquivos indisponível` no log da API                                               | RustFS parado ou credenciais erradas          | `docker compose up -d storage` e confira `S3_ACCESS_KEY` e `S3_SECRET_KEY`.                    |
| Nenhum trace no Jaeger                                                                        | Perfil `observabilidade` fora do ar           | `docker compose --profile observabilidade up -d` e confira `OTEL_SDK_DISABLED`.                |

## Imagens de produção na máquina local

```bash
docker compose -f compose.app.yml up --build -d
docker compose -f compose.app.yml logs -f api web
docker compose -f compose.app.yml down
```

`compose.app.yml` inclui `docker-compose.yml` e adiciona `api`, `worker` e `web`. O `worker` usa a imagem da API com o comando `dist/worker.js`. O portal fica em http://localhost:8080 e repassa `/api` para a API. Com `WEB_PORT=8081` o portal muda de porta. O projeto se chama `recreio` nos 2 arquivos, então os volumes são os mesmos do desenvolvimento.

# Runbook local

Serviços de apoio do desenvolvimento, definidos em `docker-compose.yml`. A API e o portal rodam fora do Docker com `npm run dev`. Para testar as imagens de produção, veja a última seção.

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

## Portas

| Serviço  | Porta | Uso                                 | Credenciais                                                       |
| -------- | ----- | ----------------------------------- | ----------------------------------------------------------------- |
| Postgres | 5432  | Banco `recreio`                     | `recreio` / `recreio` (dono), `recreio_app` / `recreio_app` (API) |
| Redis    | 6379  | Filas BullMQ                        | sem senha                                                         |
| Mailpit  | 1025  | SMTP que recebe os e-mails da API   | sem senha                                                         |
| Mailpit  | 8025  | Interface web dos e-mails recebidos | http://localhost:8025                                             |
| RustFS   | 9000  | API compatível com S3               | `recreio` / `recreio-storage`                                     |
| RustFS   | 9001  | Console web do armazenamento        | http://localhost:9001                                             |

A API (`npm run dev:api`) usa 3333 e o portal (`npm run dev:web`) usa 5173.

## Apagar e recriar os dados

```bash
docker compose down -v
docker compose up -d
```

O `-v` apaga os volumes `postgres-data` e `storage-data`. Na subida seguinte, o Postgres roda `infra/postgres/init/01-app-role.sh` de novo e recria o usuário `recreio_app`. O script só roda com o volume vazio.

O bucket `recreio` do RustFS não é criado pelo Compose. Crie pelo console em http://localhost:9001 depois de apagar os dados.

## Problemas comuns

| Sintoma                                                                                       | Causa                                      | Correção                                                                        |
| --------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------- |
| `error during connect` ou `Cannot connect to the Docker daemon`                               | Docker Desktop fechado                     | Abra o Docker Desktop e espere o ícone ficar verde. Confira com `docker info`.  |
| `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified` (Windows) | Docker Desktop fechado ou WSL parado       | Abra o Docker Desktop. Se persistir, rode `wsl --shutdown` e abra de novo.      |
| `Bind for 0.0.0.0:5432 failed: port is already allocated`                                     | Outro Postgres (ou outro Compose) na porta | Pare o outro processo ou mude o lado esquerdo da porta no `docker-compose.yml`. |
| `role "recreio_app" does not exist`                                                           | Volume criado antes do script de init      | `docker compose down -v` e suba de novo.                                        |
| `password authentication failed for user "recreio_app"`                                       | Senha diferente da do volume               | Confira `DATABASE_URL` em `apps/api/.env` ou recrie o volume.                   |
| Serviço com estado `unhealthy` em `docker compose ps`                                         | Serviço não respondeu ao healthcheck       | `docker compose logs <serviço>` mostra o motivo.                                |
| E-mail não aparece no Mailpit                                                                 | `SMTP_URL` apontando para outro host       | Use `smtp://localhost:1025` no `apps/api/.env`.                                 |

## Imagens de produção na máquina local

```bash
docker compose -f compose.app.yml up --build -d
docker compose -f compose.app.yml logs -f api web
docker compose -f compose.app.yml down
```

`compose.app.yml` inclui `docker-compose.yml` e adiciona `api` e `web`. O portal fica em http://localhost:8080 e repassa `/api` para a API. Com `WEB_PORT=8081` o portal muda de porta. O projeto se chama `recreio` nos 2 arquivos, então os volumes são os mesmos do desenvolvimento.

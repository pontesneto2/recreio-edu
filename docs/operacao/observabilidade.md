# Observabilidade

A API e o worker produzem 3 sinais: logs no stdout (pino), traces por OpenTelemetry (OTLP) e erros no Sentry. Os 3 compartilham o id da requisição, então um `X-Request-Id` leva ao log, ao trace e ao erro.

## Logs

- O pino escreve JSON no stdout, uma linha por evento. Em `NODE_ENV=development` o `pino-pretty` formata em cores.
- O nível vem de `LOG_LEVEL` (padrão `info`). Em `NODE_ENV=test` o log fica desligado.
- O pino-http grava uma linha por requisição com método, URL, status e tempo. `/api/health` e `/api/ready` ficam fora do log (`autoLogging.ignore` em `shared/http/log-http.ts`), porque o healthcheck chama a cada 15 s.
- Campos de cada linha da requisição:

| Campo                  | Origem                                                    |
| ---------------------- | --------------------------------------------------------- |
| `req.id`               | `X-Request-Id` do cliente, ou um UUID novo                |
| `escolaId`             | Escola resolvida pelo `Host`, depois do `resolverEscola`  |
| `trace_id` e `span_id` | Span ativo do OpenTelemetry. Só aparecem com o SDK ligado |
| `fila`, `jobId`        | Linhas do worker: fila e id da tarefa                     |

O worker registra `tarefa concluída`, `tarefa falhou, nova tentativa agendada` (warn) e `tarefa falhou de vez` (error).

## Traces

`apps/api/src/instrumentation.ts` liga o OpenTelemetry Node SDK antes do app. Os scripts `dev`, `dev:worker`, `start`, `start:worker` e a imagem carregam o arquivo com `node --import`.

| Instrumentação | O que vira span                                                        |
| -------------- | ---------------------------------------------------------------------- |
| `http`         | Cada requisição recebida (span raiz) e cada chamada HTTP de saída (S3) |
| `express`      | Cada middleware e o handler da rota, com `http.route`                  |
| `pg`           | Cada consulta e cada conexão tirada do pool                            |
| `ioredis`      | Cada comando no Redis: limite de requisições, filas, `PING` do ready   |
| `pino`         | Não cria span. Põe `trace_id` e `span_id` em cada linha de log         |

O span raiz da requisição leva 2 atributos próprios (`shared/observability/span.ts`):

- `recreio.request_id`: o mesmo valor do cabeçalho `X-Request-Id`.
- `recreio.escola_id`: a escola resolvida pelo `Host`. Ausente nas rotas sem escola.

`/api/health` e `/api/ready` não geram trace.

### Configuração

O SDK lê as variáveis padrão `OTEL_*`. As mais usadas:

| Variável                      | Padrão                            | Uso                                                |
| ----------------------------- | --------------------------------- | -------------------------------------------------- |
| `OTEL_SDK_DISABLED`           | `false` (`true` nos testes)       | `true` desliga o SDK e o hook de ESM               |
| `OTEL_SERVICE_NAME`           | `recreio-api` ou `recreio-worker` | Nome do serviço nos traces                         |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4318`           | Coletor OTLP                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | `http/protobuf`                   | `grpc` usa a porta 4317                            |
| `OTEL_EXPORTER_OTLP_HEADERS`  | sem padrão                        | Chave do provedor de traces, como `x-api-key=...`  |
| `OTEL_TRACES_SAMPLER`         | `parentbased_always_on`           | Em produção com volume, `parentbased_traceidratio` |
| `OTEL_TRACES_SAMPLER_ARG`     | sem padrão                        | Fração amostrada, como `0.1`                       |

Logs e métricas não saem pelo OTLP: `instrumentation.ts` define `OTEL_LOGS_EXPORTER=none` e `OTEL_METRICS_EXPORTER=none` quando a variável não existe. Sem coletor no ar, o envio falha sem mensagem e a API segue normal.

O hook de ESM (`import-in-the-middle`) intercepta só `http`, `https`, `express`, `pg`, `ioredis` e `pino`. Uma instrumentação nova entra em `instrumentations` e o nome do pacote entra em `MODULOS_INSTRUMENTADOS`, no mesmo arquivo.

### Ver traces localmente

1. Suba o Jaeger: `docker compose --profile observabilidade up -d`.
2. Suba a API: `npm run dev:api`. O padrão já envia para `http://localhost:4318`.
3. Faça uma chamada: `curl -H 'X-Request-Id: teste-1' http://localhost:3333/api/v1/escola`.
4. Abra http://localhost:16686, escolha o serviço `recreio-api` e clique em **Find Traces**.
5. Para achar uma requisição pelo id, use a busca por tag `recreio.request_id=teste-1`.

O trace mostra o span `GET /api/v1/escola`, os middlewares do Express, o `EVALSHA` do limite no Redis e as consultas do Postgres dentro da transação da escola. `docker compose --profile observabilidade down` para o Jaeger. Os traces ficam só na memória dele.

## Erros no Sentry

- Com `SENTRY_DSN`, `instrumentation.ts` inicia o `@sentry/node` só para erros. Os traces ficam no OpenTelemetry, então o Sentry não registra outro provedor de traces (`enableOpenTelemetrySetup: false`).
- O `errorHandler` envia ao Sentry todo erro que vira 5xx, com as tags `requestId` e `escolaId`. Erros 4xx (`DADOS_INVALIDOS`, `NAO_ENCONTRADO`, `CORPO_GRANDE_DEMAIS`, `LIMITE_EXCEDIDO`) não vão.
- O worker envia a tarefa que falhou de vez, com as tags `fila` e `jobId`. Falha com nova tentativa agendada não vai.
- `SENTRY_ENVIRONMENT` separa staging de produção. Padrão: o valor de `NODE_ENV`.
- Sem `SENTRY_DSN`, `reportarErro` (`shared/observability/erros.ts`) não faz nada.

## Investigar um 500

1. Pegue o `X-Request-Id` da resposta (aba Rede do navegador ou `curl -i`).
2. No log, procure `req.id` igual ao id. A linha `erro não tratado` traz a pilha e o `trace_id`.
3. No Jaeger (ou no provedor de traces), busque `recreio.request_id` ou abra o `trace_id`. O span com erro mostra a consulta ou a chamada que falhou.
4. No Sentry, filtre pela tag `requestId`.

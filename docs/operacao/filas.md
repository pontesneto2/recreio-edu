# Filas e worker

Trabalho que não cabe na requisição (e-mail, push, PDF, webhooks) vai para uma fila do BullMQ no Redis ([ADR 0009](../adr/0009-filas-com-bullmq.md)). A API só enfileira. O worker (`apps/api/src/worker.ts`) é outro processo e consome as filas.

## Peças

| Arquivo                        | Papel                                                                              |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| `shared/queue/filas.ts`        | Definição de cada fila: nome, schema Zod dos dados, tentativas e retenção          |
| `shared/queue/enfileirador.ts` | Produtor usado pela API: valida os dados, calcula o id e põe na fila               |
| `shared/queue/consumidor.ts`   | Worker do BullMQ para uma fila: valida os dados de novo, processa, registra falhas |
| `shared/redis/redis.ts`        | Conexões ioredis: `api` falha rápido, `worker` espera o Redis voltar               |
| `worker.ts`                    | Liga cada fila ao seu processador e trata SIGTERM                                  |
| `shared/email/`                | Fila `emails`: modelos em português, envio por SMTP (nodemailer)                   |

No container da API, `container.filas.enfileirar(fila, dados, chave)` devolve o id da tarefa. Sem `REDIS_URL` (testes), a chamada rejeita.

## Filas

| Fila     | Dados                               | Tentativas | Espera entre tentativas | Processador                    |
| -------- | ----------------------------------- | ---------- | ----------------------- | ------------------------------ |
| `emails` | `{ modelo, para, variaveis }` (Zod) | 5          | 10 s, 20 s, 40 s, 80 s  | `shared/email/processar-email` |

Modelos de e-mail hoje: `boas-vindas` (`nome`, `escola`, `linkAcesso`) e `teste` (`origem`). As chaves do Redis usam o prefixo `recreio:`.

## Id determinístico

Toda tarefa recebe uma chave de negócio, como `['boas-vindas', usuarioId]`. O id é `<fila>-<sha256 da fila e da chave>`.

- A mesma chave gera o mesmo id. O BullMQ ignora a 2ª inclusão enquanto a 1ª existir, então um clique duplo ou um retry do cliente não manda 2 e-mails.
- Tarefas concluídas ficam 7 dias no Redis. Depois disso, a mesma chave enfileira de novo. A chave deve conter o que torna o efeito único (por exemplo o id do convite, não só o do usuário).
- O hash tira dado pessoal do id e evita `:`, que o BullMQ não aceita.
- O e-mail sai com `Message-ID: <id da tarefa@domínio do remetente>`. Uma nova tentativa depois de um envio que o SMTP aceitou repete o mesmo `Message-ID`.

## Tentativas e falhas

- Erro lançado pelo processador agenda nova tentativa com espera exponencial (`backoff: exponential`).
- Dados que não passam no schema falham de vez (`UnrecoverableError`), sem nova tentativa.
- Depois da última tentativa, a tarefa fica na lista `failed` da fila por 30 dias. O worker registra `tarefa falhou de vez` no log (nível error) e envia o erro ao Sentry com as tags `fila` e `jobId`.
- Para reprocessar uma falha, use `Queue.getJob(id)` e `job.retry()` num script, ou um painel do BullMQ apontado para o Redis.

## Rodar

| Ação                          | Comando                                                   |
| ----------------------------- | --------------------------------------------------------- |
| API, worker e portal juntos   | `npm run dev`                                             |
| Só o worker                   | `npm run dev:worker`                                      |
| Enfileirar um e-mail de teste | `npm run email:teste -w @recreio/api -- voce@exemplo.com` |
| Ver o e-mail recebido         | http://localhost:8025 (Mailpit)                           |
| Worker na imagem de produção  | serviço `worker` de `compose.app.yml`                     |

O worker usa a mesma imagem da API com outro comando: `node --import ./dist/instrumentation.js dist/worker.js`. O healthcheck da imagem chama `/api/health`, que o worker não serve, então o serviço desliga o healthcheck. `WORKER_CONCURRENCY` (padrão 5) define quantas tarefas cada fila processa ao mesmo tempo.

## Desligamento

No SIGTERM o worker para de pegar tarefas, espera as que estão rodando (`worker.close()`), fecha o SMTP e o Redis e sai com 0. Depois de 30 s ele sai com 1. Uma tarefa interrompida pela queda do processo volta para a fila quando o lock dela expira e roda de novo, por isso o processador precisa ser idempotente.

## Adicionar uma tarefa

1. Escreva o schema Zod dos dados. Para e-mail, acrescente o modelo em `shared/email/email-job.ts` e o texto em `shared/email/modelos.ts`. O typecheck falha se faltar o texto.
2. Para uma fila nova, acrescente a definição em `filas` (`shared/queue/filas.ts`) com nome, schema, tentativas e espera inicial.
3. Escreva o processador (`Processador<'fila'>`) num arquivo do módulo dono do trabalho. Ele recebe os dados já validados e o `Job`. Lance erro para nova tentativa e `UnrecoverableError` para falha definitiva.
4. Registre o consumidor em `worker.ts` com `createConsumidor('fila', processador, config)`.
5. Na API, chame `container.filas.enfileirar('fila', dados, ['acao', idDoEfeito])` depois de gravar no banco.
6. Teste o processador com dados de exemplo e um teste de fila contra o Redis do Testcontainers, como `shared/queue/filas.test.ts`.

Enquanto não existir a tabela de saída (outbox), uma tarefa enfileirada depois do commit pode se perder se o Redis cair entre o commit e o `enfileirar`. A Idempotency-Key e o outbox estão em [api/padroes.md](../api/padroes.md).

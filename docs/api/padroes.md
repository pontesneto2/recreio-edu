# Padrões da API

Regras que todo endpoint segue. A decisão está na [ADR 0008](../adr/0008-padroes-de-api.md). O código de cada regra está em `apps/api/src/shared/`.

## Nomes e URLs

- Recursos no plural, em português, minúsculos, com hífen: `/alunos`, `/turmas`, `/ocorrencias-disciplinares`.
- Identificador no caminho: `/alunos/{id}`. Sub-recurso só quando ele não existe sem o pai: `/turmas/{id}/aulas`.
- Ação que não cabe em CRUD vira sub-recurso com verbo no infinitivo: `POST /matriculas/{id}/cancelar`.
- Campos do JSON em camelCase, em português, como nos contratos: `mensalidadeCentavos`, `corMarca`.
- Parâmetros de query em camelCase: `?turmaId=...&limit=20`.
- Data em ISO 8601 (`2026-11-25`), instante em ISO 8601 com fuso (`2026-11-25T14:30:00-03:00`).
- `operationId` no OpenAPI é verbo mais recurso: `listarAlunos`, `buscarAluno`, `obterEscola`.

## Métodos

| Método   | Uso                            | Corpo de resposta    | Idempotente |
| -------- | ------------------------------ | -------------------- | ----------- |
| `GET`    | Ler um recurso ou uma lista    | O recurso ou a lista | Sim         |
| `POST`   | Criar recurso ou disparar ação | O recurso criado     | Não         |
| `PUT`    | Substituir o recurso inteiro   | O recurso atualizado | Sim         |
| `PATCH`  | Alterar só os campos enviados  | O recurso atualizado | Não         |
| `DELETE` | Remover o recurso              | Vazio                | Sim         |

## Status HTTP

| Status | Quando                                                           |
| ------ | ---------------------------------------------------------------- |
| `200`  | Leitura ou alteração com corpo de resposta                       |
| `201`  | Recurso criado. Cabeçalho `Location` aponta para ele             |
| `204`  | Sucesso sem corpo, como `DELETE`                                 |
| `400`  | Entrada fora do schema (`DADOS_INVALIDOS`)                       |
| `401`  | Sem sessão válida (planejado, com o login)                       |
| `403`  | Sessão sem permissão para a ação (planejado)                     |
| `404`  | Recurso ou rota não existe (`NAO_ENCONTRADO`)                    |
| `413`  | Corpo acima de 1 MB (`CORPO_GRANDE_DEMAIS`)                      |
| `409`  | Conflito de estado, como matrícula duplicada (planejado)         |
| `422`  | Entrada válida no schema que quebra regra de negócio (planejado) |
| `429`  | Limite de requisições excedido (`LIMITE_EXCEDIDO`)               |
| `500`  | Erro não previsto (`ERRO_INTERNO`). O detalhe fica só no log     |

## Erros (RFC 9457)

Toda resposta de erro usa `Content-Type: application/problem+json`:

```json
{
  "type": "https://recreio.app/problemas/dados-invalidos",
  "title": "Dados inválidos",
  "status": 400,
  "detail": "Os dados enviados não são válidos.",
  "instance": "/api/v1/alunos/ID%20Inv%C3%A1lido",
  "code": "DADOS_INVALIDOS",
  "errors": { "id": ["Texto inválido: deve corresponder ao padrão /^[a-z0-9-]+$/"] }
}
```

| Campo      | Conteúdo                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------ |
| `type`     | URL fixa do tipo de erro                                                                   |
| `title`    | Resumo do tipo. Igual em todo erro do mesmo `type`                                         |
| `status`   | O mesmo status HTTP da resposta                                                            |
| `detail`   | Explicação deste caso, em português, para quem desenvolve                                  |
| `instance` | Caminho da requisição, sem a query string (a query pode ter dado pessoal)                  |
| `code`     | Código estável. O portal decide a mensagem por ele, sem ler `title` nem `detail`           |
| `errors`   | Só em `DADOS_INVALIDOS`: caminho do campo com pontos (`responsavel.cpf`) para as mensagens |

Uma falha fora de campo, como corpo que não é objeto, usa a chave `$` em `errors`.

### Tipos de problema

| `code`                | Status | `type`                                              | `title`                           |
| --------------------- | ------ | --------------------------------------------------- | --------------------------------- |
| `DADOS_INVALIDOS`     | 400    | `https://recreio.app/problemas/dados-invalidos`     | Dados inválidos                   |
| `NAO_ENCONTRADO`      | 404    | `https://recreio.app/problemas/nao-encontrado`      | Recurso não encontrado            |
| `CORPO_GRANDE_DEMAIS` | 413    | `https://recreio.app/problemas/corpo-grande-demais` | Corpo da requisição grande demais |
| `LIMITE_EXCEDIDO`     | 429    | `https://recreio.app/problemas/limite-excedido`     | Limite de requisições excedido    |
| `ERRO_INTERNO`        | 500    | `https://recreio.app/problemas/erro-interno`        | Erro interno                      |

Um código novo entra em 3 lugares: `problemCodeSchema` em `packages/contracts/src/problem.ts`, o catálogo em `apps/api/src/shared/errors/problem-types.ts` e o exemplo em `shared/openapi/problem-responses.ts`. O typecheck falha se o catálogo ficar sem o código.

Corpo JSON malformado responde 400 `DADOS_INVALIDOS` com `detail` "O corpo da requisição não é JSON válido.". Corpo acima de 1 MB (limite do `express.json` em `app.ts`) responde 413 `CORPO_GRANDE_DEMAIS` com o limite no `detail`. No OpenAPI, o montador acrescenta a resposta 413 em toda operação com `requestBody`.

No código, o service lança `NotFoundError`, `ValidationError` ou `TooManyRequestsError`. O `errorHandler` converte em problem+json. Erro que não é `AppError` vira `ERRO_INTERNO` e vai para o log com o `X-Request-Id`.

No portal, `getJson` lança `ApiError` com `status`, `code`, `title`, `detail` e `errors`. Resposta sem problem+json (proxy fora do ar, página HTML) vira `code` `ERRO_HTTP`.

## Paginação

Listas novas usam cursor. Os helpers estão em `packages/contracts/src/pagination.ts`:

- `cursorQuerySchema` valida `?limit=` (1 a 100, padrão 20) e `?cursor=` (texto opaco, até 512 caracteres).
- `paginated(alunoSchema)` monta o schema da resposta `{ data, nextCursor }`. `nextCursor` é `null` na última página.

```
GET /api/v1/alunos?limit=20
→ { "data": [...], "nextCursor": "eyJpZCI6ImRhdmkifQ" }

GET /api/v1/alunos?limit=20&cursor=eyJpZCI6ImRhdmkifQ
→ { "data": [...], "nextCursor": null }
```

O cliente repassa o cursor sem interpretar. O servidor codifica nele a chave de ordenação do último item (por exemplo `nome` e `id` em base64url) e filtra com `WHERE (nome, id) > (...)`. Não há `offset`: a consulta custa o mesmo na página 1 e na 500.

Os endpoints atuais (`/alunos`, `/escola`) ainda devolvem a lista ou o objeto direto. A troca para `{ data, nextCursor }` muda o formato da resposta e entra quando o repositório Drizzle chegar.

## Idempotency-Key (planejado)

`POST` que cria cobrança ou envia mensagem vai aceitar o cabeçalho `Idempotency-Key` (UUID gerado pelo cliente).

1. O servidor guarda chave, escola, usuário, hash do corpo e a resposta, por 24 horas.
2. A mesma chave com o mesmo corpo devolve a resposta guardada, com o mesmo status, sem repetir o efeito.
3. A mesma chave com outro corpo responde `422` com `code` `CHAVE_IDEMPOTENCIA_REUTILIZADA`.
4. Uma segunda requisição com a chave enquanto a primeira ainda roda responde `409`.
5. Sem o cabeçalho, esses `POST` respondem `400`.

A tabela fica no PostgreSQL, na mesma transação do efeito. O envio externo (e-mail, push, gateway) sai pela fila da [ADR 0009](../adr/0009-filas-com-bullmq.md).

## Limite de requisições

- `/api/v1/*` aceita `RATE_LIMIT_PER_MINUTE` requisições por minuto por IP (padrão 300, em `apps/api/.env`).
- `/api/health` e `/api/docs` ficam fora do limite.
- Toda resposta de `/api/v1` traz os cabeçalhos do draft 8 da IETF: `RateLimit: "300-in-1min"; r=297; t=42` e `RateLimit-Policy: "300-in-1min"; q=300; w=60; pk=...`.
- Acima do limite a resposta é `429` com `LIMITE_EXCEDIDO` e `Retry-After` em segundos.
- Em `NODE_ENV=test` o limite fica desligado. Um teste liga com `createApp(container, { rateLimitPerMinute: 2 })`.

Com `REDIS_URL`, o contador fica no Redis (`rate-limit-redis`, chaves `recreio:limite:*`) e vale para todas as instâncias da API. Sem Redis (testes), ele fica na memória do processo. Com o Redis fora do ar, a requisição passa sem contar (`passOnStoreError`), porque derrubar a API por falta do contador custa mais que alguns minutos sem limite.

O IP vem de `req.ip`, que respeita `TRUST_PROXY` (`app.set('trust proxy', ...)`). O padrão `loopback` confia só no proxy do Vite em `localhost`. Em produção o valor é o número de saltos de proxy, senão todos os clientes contam como o IP do balanceador. A tabela por topologia está em [operacao/README.md](../operacao/README.md#trust_proxy-em-produção). O limite por usuário entra com o login.

## X-Request-Id

- O cliente pode enviar `X-Request-Id` com até 128 caracteres de `A-Z a-z 0-9 . _ : -`.
- Valor ausente ou fora dessa regra é trocado por um `crypto.randomUUID()`.
- A resposta devolve o id em `X-Request-Id`, inclusive nas respostas de erro.
- O pino-http grava o id em cada linha de log da requisição (`req.id`). Para investigar um `500`, procure o id no log.

## Exemplos com curl

```bash
# Dados da escola, com o id da requisição na resposta
curl -i http://localhost:3333/api/v1/escola -H 'X-Request-Id: suporte-123'

# 404 em problem+json
curl -i http://localhost:3333/api/v1/alunos/nao-existe

# 400 com erros por campo
curl -i 'http://localhost:3333/api/v1/alunos/ID%20Invalido'

# Cabeçalhos de limite
curl -sI http://localhost:3333/api/v1/alunos | grep -i ratelimit

# Documento OpenAPI
curl -s http://localhost:3333/api/v1/openapi.json | head
```

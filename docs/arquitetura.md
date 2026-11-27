# Arquitetura

O repositório é um monorepo com npm workspaces: 2 aplicações em `apps/` e 2 bibliotecas internas em `packages/`. Cada aplicação tem a própria pasta `src/`.

```
recreio-edu/
├── apps/
│   ├── api/                 API REST (Node 24, Express 5)
│   │   └── src/
│   └── web/                 Portal (React 19, Vite 8)
│       └── src/
├── packages/
│   ├── contracts/           Schemas Zod usados pela API e pelo portal
│   └── design-system/       Componentes e tokens do Recreio
├── prototipo/               Telas de referência (não entram no build)
└── docs/                    Arquitetura e decisões (ADRs)
```

As dependências seguem uma direção só: `apps/*` importa `packages/*`, e `packages/*` nunca importa `apps/*`. O portal e a API não importam um ao outro; a única ligação entre eles é `@recreio/contracts`.

## API (`apps/api/src`)

```
src/
├── instrumentation.ts       OpenTelemetry e Sentry, carregado com node --import antes do app
├── main.ts                  Sobe o servidor, prepara o bucket e trata SIGINT/SIGTERM
├── worker.ts                Processo que consome as filas do BullMQ
├── app.ts                   Monta o Express: segurança, logs, rotas, erros
├── container.ts             Raiz de composição: liga repositórios aos services
├── openapi.ts               Junta as declarações OpenAPI dos módulos
├── config/env.ts            Variáveis de ambiente validadas com Zod
├── scripts/                 `generate-openapi.ts` (npm run openapi) e `enviar-email-teste.ts`
├── modules/
│   ├── autenticacao/        Better Auth, /eu e os middlewares exigirLogin, exigirSessao e exigirPermissao
│   └── <dominio>/
│       ├── <dominio>.routes.ts       URLs e verbos HTTP
│       ├── <dominio>.openapi.ts      Operações documentadas no OpenAPI
│       ├── <dominio>.controller.ts   Lê a requisição, valida, chama o service
│       ├── <dominio>.service.ts      Regra de negócio
│       ├── <dominio>.repository.ts   Acesso a dados com Drizzle
│       └── <dominio>.*.test.ts       Testes do módulo
├── shared/
│   ├── errors/              AppError e subclasses, catálogo de problemas
│   ├── http/                Problem+json, validação, X-Request-Id, limite de requisições, ready, log HTTP
│   ├── openapi/             Registro, montagem do documento e página /api/docs
│   ├── logger/              Logger estruturado (pino)
│   ├── observability/       Atributos de span (request id, escola) e envio de erros ao Sentry
│   ├── redis/               Conexões ioredis da API e do worker
│   ├── queue/               Definição das filas, produtor (enfileirador) e consumidor do BullMQ
│   ├── email/               Modelos de e-mail em português, envio SMTP e processador da fila
│   ├── storage/             Cliente S3, chaves por escola e URLs assinadas
│   └── tenant/              Escola da requisição: middleware resolverEscola e EscolaContexto
├── database/
│   ├── schema/              Tabelas em TypeScript (Drizzle)
│   ├── client.ts            Pool do pg e instância do Drizzle
│   ├── escola-context.ts    withEscola, busca da escola pelo slug e vínculos da conta
│   ├── migrator.ts          Aplica as migrações de apps/api/drizzle
│   ├── seed/                Dados de demonstração do protótipo
│   └── cli/                 Scripts db:migrate, db:seed e db:reset
└── test/                    Postgres e Redis descartáveis (Testcontainers) e helpers HTTP
```

Cada requisição percorre `routes → controller → service → repository`. Cada camada conhece só a seguinte:

- O controller trata HTTP: lê `req`, valida com `parseInput` e escreve `res`. Regra de negócio fica fora dele.
- O service tem a regra de negócio e lança erros de domínio (`NotFoundError`). Ele não importa nada do Express.
- O repository é um tipo (`AlunosRepository`). A implementação de produção usa Drizzle (`createDrizzleAlunosRepository`). Os testes de service usam a implementação em memória (`alunos.repository.memory.ts`).

Os módulos são funções fábrica (`createAlunosService(repository)`), sem classes de serviço nem framework de injeção. Os testes montam o service com um repositório próprio.

As rotas de negócio ficam sob `/api/v1`. `app.ts` define `trust proxy` (`TRUST_PROXY`) e monta, nesta ordem: pino-http (com `X-Request-Id`, sem log de health e ready), helmet, CORS, o limite de tentativas de entrada e o Better Auth em `/api/auth/*` (antes do `express.json`, porque ele lê o corpo cru), `express.json` (até 1 MB), `/api/health`, `/api/ready`, `/api/docs`, o router da v1 (limite por IP com contador no Redis, `openapi.json`, `/eu` e o router `/escolas/:escola` com `resolverEscola` e os módulos) e o tratamento de erro.

### Dados e escola da requisição

A API é multi-escola (ADR 0006). A escola vem do slug do caminho (ADR 0011): toda rota com dados de escola fica em `/api/v1/escolas/:escola` e passa antes pelo middleware `resolverEscola`:

1. O middleware lê o slug, chama a função `escola_por_slug` no banco e grava `{ escolaId }` em `res.locals`. Slug sem escola responde 404.
2. `exigirSessao` ou `exigirPermissao(modulo, acao)`, no router do módulo, conferem a sessão, o vínculo com a escola e a permissão ([autenticacao.md](autenticacao.md)).
3. O controller pega o contexto com `escolaDaRequisicao(res)` e repassa ao service.
4. O service repassa o `EscolaContexto` ao repositório em toda chamada.
5. O repositório roda as consultas dentro de `withEscola(escolaId, fn)`. Ele abre uma transação com `app.escola_id` definido, e as políticas de Row Level Security escondem as linhas de outras escolas.

A API conecta como `recreio_app`, que não é dono das tabelas. Migrações e seed rodam como `recreio`. Tabelas, migrações, políticas e o checklist de tabela nova estão em [banco-de-dados.md](banco-de-dados.md).

`/api/health` responde se o processo está vivo. `/api/ready` roda `select 1` no Postgres e `PING` no Redis e responde 503 com o corpo `{ status, dependencias: { postgres, redis } }` quando um deles não responde.

### Infraestrutura

O container (`container.ts`) monta também a infraestrutura usada pelos módulos:

- `redis`: conexão ioredis da API, usada pelo limite de requisições e pelas filas. Sem `REDIS_URL` (testes), o limite conta em memória.
- `filas`: produtor do BullMQ. `filas.enfileirar('emails', dados, chave)` valida os dados, calcula um id determinístico e põe a tarefa na fila. O `worker.ts` consome. Detalhes em [operacao/filas.md](operacao/filas.md).
- `armazenamento`: cliente S3 com chaves prefixadas pelo `escola_id` e URLs assinadas de upload e download. Detalhes em [operacao/armazenamento.md](operacao/armazenamento.md).

`instrumentation.ts` liga o OpenTelemetry (spans de HTTP, Express, pg e ioredis) e, com `SENTRY_DSN`, o Sentry. O span raiz de cada requisição leva `recreio.request_id` e `recreio.escola_id`. Detalhes em [operacao/observabilidade.md](operacao/observabilidade.md).

Erros saem em `application/problem+json` (RFC 9457), com código estável em `code` para o portal tratar:

```json
{
  "type": "https://recreio.app/problemas/nao-encontrado",
  "title": "Recurso não encontrado",
  "status": 404,
  "detail": "Aluno não encontrado.",
  "instance": "/api/v1/escolas/colegio-recreio/alunos/7a1e2b3c-0000-4000-8000-000000000000",
  "code": "NAO_ENCONTRADO"
}
```

| Código                | Status | Quando                                                      |
| --------------------- | ------ | ----------------------------------------------------------- |
| `DADOS_INVALIDOS`     | 400    | Entrada não segue o schema Zod. `errors` lista os campos    |
| `NAO_AUTENTICADO`     | 401    | Sem cookie de sessão, ou sessão expirada                    |
| `SEM_ACESSO`          | 403    | A conta não tem vínculo com a escola do caminho             |
| `PERMISSAO_NEGADA`    | 403    | Nenhum perfil da conta tem a ação no módulo                 |
| `NAO_ENCONTRADO`      | 404    | Recurso ou rota não existe                                  |
| `CORPO_GRANDE_DEMAIS` | 413    | Corpo JSON acima de 1 MB                                    |
| `LIMITE_EXCEDIDO`     | 429    | Passou de `RATE_LIMIT_PER_MINUTE`. `Retry-After` diz quando |
| `ERRO_INTERNO`        | 500    | Erro não previsto. O detalhe vai para o log e para o Sentry |

O catálogo fica em `shared/errors/problem-types.ts` e o schema do corpo em `packages/contracts/src/problem.ts`. Campos, paginação, limites e exemplos estão em [api/padroes.md](api/padroes.md).

Cada módulo declara as próprias operações em `<dominio>.openapi.ts`. `src/openapi.ts` junta os módulos num documento OpenAPI 3.1, servido em `/api/v1/openapi.json` e versionado em `docs/api/openapi.json` ([api/README.md](api/README.md)).

## Portal (`apps/web/src`)

```
src/
├── main.tsx                 Ponto de entrada
├── app/
│   ├── providers.tsx        TanStack Query, tema da escola e preferências salvas
│   ├── guardas.tsx          Guardas de sessão: InicioGlobal, InicioDaEscola, ExigirPerfil
│   └── router.tsx           Rotas por escola e perfil (React Router, modo data)
├── pages/<pagina>/          Uma pasta por rota; compõe features
├── features/<dominio>/
│   ├── api/                 queryOptions do TanStack Query
│   ├── components/          Componentes do domínio
│   ├── hooks/               Hooks do domínio (useEscolaTema)
│   └── index.ts             API pública da feature
├── shared/
│   ├── api/                 Cliente HTTP e QueryClient
│   ├── config/navigation/   Menu de cada perfil (familia, aluno, professor, escola)
│   ├── layout/              Cascas: PerfilLayout (SideNav + TabBar) e AvulsaLayout
│   ├── preferencias/        Preferências de acessibilidade salvas no navegador
│   ├── sessao/              euQuery, useSessao, login e saída, slug da rota e perfis da conta
│   ├── pwa/                 Aviso de versão nova, conexão e faixa "Sem internet"
│   └── ui/                  QueryState e lista de links
└── test/                    Setup do Vitest e helpers de renderização
```

O portal vive em `/{slug}` (ADR 0011) e tem uma casca por perfil (`/colegio-recreio/familia`, `/aluno`, `/professor`, `/escola`), montada a partir do menu em `shared/config/navigation`. Item do menu sem tela pronta abre "Em construção". As cascas exigem sessão e vínculo com a escola; `/` leva a Entrar ou à escola da conta ([autenticacao.md](autenticacao.md)). O portal é um PWA: o service worker guarda a casca para abrir sem conexão e nunca guarda resposta de `/api/`. Rotas, PWA, tema e Storybook estão em [frontend.md](frontend.md).

Regras de importação:

- `pages` importa `features` e `shared`.
- `features` importa `shared` e nunca outra feature. Código usado por 2 features desce para `shared`.
- Fora da própria feature, o import passa pelo `index.ts` dela (`@/features/alunos/index.ts`).
- O alias `@/` aponta para `src/`.

Dados do servidor ficam no cache do TanStack Query; o portal não guarda cópia em estado global. Toda resposta passa pelo schema Zod do contrato antes de chegar ao componente, então uma mudança incompatível na API falha na hora com erro claro.

O React Compiler memoiza componentes no build. O código não usa `useMemo`, `useCallback` nem `memo` para desempenho.

## Contratos (`packages/contracts`)

Cada recurso tem um schema Zod e o tipo derivado dele (`Aluno = z.infer<typeof alunoSchema>`). A API usa o tipo nos dados e o schema para validar entrada. O portal usa o schema para validar a resposta. Os testes da API conferem cada endpoint contra o schema.

## Design system (`packages/design-system`)

Componentes do protótipo convertidos para TypeScript. As props de cada componente estão em `src/types.ts`. Estilos vêm de `tokens.css` (variáveis) e `recreio.css` (classes `rc-*`). Telas novas usam esses componentes e tokens; cor, tamanho e duração não são escritos à mão. O Storybook do pacote (`npm run storybook`) mostra os componentes nos 4 temas, com verificação de acessibilidade pelo axe.

## Testes

| Onde   | Ferramenta                    | O que cobre                                                                                                             |
| ------ | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| API    | `node --test`, Testcontainers | Services com repositório em memória; HTTP e RLS contra PostgreSQL real; filas contra Redis real; arquivos contra RustFS |
| Portal | Vitest, Testing Library       | Páginas e cascas renderizadas com rota real e `fetch` simulado                                                          |

## Qualidade

- `npm run check` roda lint, typecheck, testes e build. O CI do GitHub Actions roda o mesmo a cada push e pull request.
- O hook de pre-commit roda ESLint e Prettier nos arquivos alterados.
- Mensagens de commit seguem Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`), checadas pelo commitlint.

## Decisões

As decisões de arquitetura ficam em [`docs/adr`](adr/).

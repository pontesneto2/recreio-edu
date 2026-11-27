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
├── main.ts                  Sobe o servidor e trata SIGINT/SIGTERM
├── app.ts                   Monta o Express: segurança, logs, rotas, erros
├── container.ts             Raiz de composição: liga repositórios aos services
├── openapi.ts               Junta as declarações OpenAPI dos módulos
├── config/env.ts            Variáveis de ambiente validadas com Zod
├── scripts/                 `generate-openapi.ts` (npm run openapi)
├── modules/
│   └── <dominio>/
│       ├── <dominio>.routes.ts       URLs e verbos HTTP
│       ├── <dominio>.openapi.ts      Operações documentadas no OpenAPI
│       ├── <dominio>.controller.ts   Lê a requisição, valida, chama o service
│       ├── <dominio>.service.ts      Regra de negócio
│       ├── <dominio>.repository.ts   Acesso a dados (hoje em memória)
│       └── <dominio>.*.test.ts       Testes do módulo
├── shared/
│   ├── errors/              AppError e subclasses, catálogo de problemas
│   ├── http/                Problem+json, validação, X-Request-Id, limite de requisições
│   ├── openapi/             Registro, montagem do documento e página /api/docs
│   └── logger/              Logger estruturado (pino)
└── database/seed/           Dados de demonstração do protótipo
```

Cada requisição percorre `routes → controller → service → repository`. Cada camada conhece só a seguinte:

- O controller trata HTTP: lê `req`, valida com `parseInput` e escreve `res`. Regra de negócio fica fora dele.
- O service tem a regra de negócio e lança erros de domínio (`NotFoundError`). Ele não importa nada do Express.
- O repository é um tipo (`AlunosRepository`) com uma implementação em memória. A troca por banco de dados cria outra implementação do mesmo tipo e muda só `container.ts`.

Os módulos são funções fábrica (`createAlunosService(repository)`), sem classes de serviço nem framework de injeção. Os testes montam o service com um repositório próprio.

As rotas de negócio ficam sob `/api/v1`. `app.ts` monta, nesta ordem: pino-http (com `X-Request-Id`), helmet, CORS, `express.json`, `/api/health`, `/api/docs`, o router da v1 (limite por IP, `openapi.json` e os módulos) e o tratamento de erro.

Erros saem em `application/problem+json` (RFC 9457), com código estável em `code` para o portal tratar:

```json
{
  "type": "https://recreio.app/problemas/nao-encontrado",
  "title": "Recurso não encontrado",
  "status": 404,
  "detail": "Aluno não encontrado.",
  "instance": "/api/v1/alunos/nao-existe",
  "code": "NAO_ENCONTRADO"
}
```

| Código            | Status | Quando                                                      |
| ----------------- | ------ | ----------------------------------------------------------- |
| `DADOS_INVALIDOS` | 400    | Entrada não segue o schema Zod. `errors` lista os campos    |
| `NAO_ENCONTRADO`  | 404    | Recurso ou rota não existe                                  |
| `LIMITE_EXCEDIDO` | 429    | Passou de `RATE_LIMIT_PER_MINUTE`. `Retry-After` diz quando |
| `ERRO_INTERNO`    | 500    | Erro não previsto. O detalhe vai só para o log              |

O catálogo fica em `shared/errors/problem-types.ts` e o schema do corpo em `packages/contracts/src/problem.ts`. Campos, paginação, limites e exemplos estão em [api/padroes.md](api/padroes.md).

Cada módulo declara as próprias operações em `<dominio>.openapi.ts`. `src/openapi.ts` junta os módulos num documento OpenAPI 3.1, servido em `/api/v1/openapi.json` e versionado em `docs/api/openapi.json` ([api/README.md](api/README.md)).

## Portal (`apps/web/src`)

```
src/
├── main.tsx                 Ponto de entrada
├── app/
│   ├── providers.tsx        TanStack Query, tema da escola e preferências salvas
│   └── router.tsx           Rotas por perfil (React Router, modo data)
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
│   ├── pwa/                 Aviso de versão nova, conexão e faixa "Sem internet"
│   └── ui/                  QueryState e lista de links
└── test/                    Setup do Vitest e helpers de renderização
```

O portal tem uma casca por perfil (`/familia`, `/aluno`, `/professor`, `/escola`), montada a partir do menu em `shared/config/navigation`. Item do menu sem tela pronta abre "Em construção". Até existir login, `/` mostra a escolha de perfil. O portal é um PWA: o service worker guarda a casca para abrir sem conexão e nunca guarda resposta de `/api/`. Rotas, PWA, tema e Storybook estão em [frontend.md](frontend.md).

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

| Onde   | Ferramenta              | O que cobre                                                    |
| ------ | ----------------------- | -------------------------------------------------------------- |
| API    | `node --test`           | Services com repositório em memória; HTTP de ponta a ponta     |
| Portal | Vitest, Testing Library | Páginas e cascas renderizadas com rota real e `fetch` simulado |

## Qualidade

- `npm run check` roda lint, typecheck, testes e build. O CI do GitHub Actions roda o mesmo a cada push e pull request.
- O hook de pre-commit roda ESLint e Prettier nos arquivos alterados.
- Mensagens de commit seguem Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`), checadas pelo commitlint.

## Decisões

As decisões de arquitetura ficam em [`docs/adr`](adr/).

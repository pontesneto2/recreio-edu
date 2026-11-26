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
├── config/env.ts            Variáveis de ambiente validadas com Zod
├── modules/
│   └── <dominio>/
│       ├── <dominio>.routes.ts       URLs e verbos HTTP
│       ├── <dominio>.controller.ts   Lê a requisição, valida, chama o service
│       ├── <dominio>.service.ts      Regra de negócio
│       ├── <dominio>.repository.ts   Acesso a dados (hoje em memória)
│       └── <dominio>.*.test.ts       Testes do módulo
├── shared/
│   ├── errors/              AppError, NotFoundError, ValidationError
│   ├── http/                Tratamento de erro e validação de entrada
│   └── logger/              Logger estruturado (pino)
└── database/seed/           Dados de demonstração do protótipo
```

Cada requisição percorre `routes → controller → service → repository`. Cada camada conhece só a seguinte:

- O controller trata HTTP: lê `req`, valida com `parseInput` e escreve `res`. Regra de negócio fica fora dele.
- O service tem a regra de negócio e lança erros de domínio (`NotFoundError`). Ele não importa nada do Express.
- O repository é um tipo (`AlunosRepository`) com uma implementação em memória. A troca por banco de dados cria outra implementação do mesmo tipo e muda só `container.ts`.

Os módulos são funções fábrica (`createAlunosService(repository)`), sem classes de serviço nem framework de injeção. Os testes montam o service com um repositório próprio.

Erros saem sempre no mesmo formato, com código estável para o portal tratar:

```json
{ "erro": { "codigo": "NAO_ENCONTRADO", "mensagem": "Aluno não encontrado." } }
```

| Código            | Status | Quando                                      |
| ----------------- | ------ | ------------------------------------------- |
| `DADOS_INVALIDOS` | 400    | Entrada não segue o schema Zod              |
| `NAO_ENCONTRADO`  | 404    | Recurso ou rota não existe                  |
| `ERRO_INTERNO`    | 500    | Erro não previsto; o detalhe vai só pro log |

## Portal (`apps/web/src`)

```
src/
├── main.tsx                 Ponto de entrada
├── app/
│   ├── providers.tsx        TanStack Query e tema da escola
│   └── router.tsx           Rotas (React Router, modo data)
├── pages/<pagina>/          Uma pasta por rota; compõe features
├── features/<dominio>/
│   ├── api/                 queryOptions do TanStack Query
│   ├── components/          Componentes do domínio
│   └── index.ts             API pública da feature
├── shared/
│   ├── api/                 Cliente HTTP e QueryClient
│   ├── config/              Menu lateral
│   └── layout/              Casca do portal (AppShell + SideNav)
└── test/                    Setup do Vitest e helpers de renderização
```

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

Componentes do protótipo convertidos para TypeScript. As props de cada componente estão em `src/types.ts`. Estilos vêm de `tokens.css` (variáveis) e `recreio.css` (classes `rc-*`). Telas novas usam esses componentes e tokens; cor, tamanho e duração não são escritos à mão.

## Testes

| Onde   | Ferramenta              | O que cobre                                                |
| ------ | ----------------------- | ---------------------------------------------------------- |
| API    | `node --test`           | Services com repositório em memória; HTTP de ponta a ponta |
| Portal | Vitest, Testing Library | Páginas renderizadas com rota real e `fetch` simulado      |

## Qualidade

- `npm run check` roda lint, typecheck, testes e build. O CI do GitHub Actions roda o mesmo a cada push e pull request.
- O hook de pre-commit roda ESLint e Prettier nos arquivos alterados.
- Mensagens de commit seguem Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`), checadas pelo commitlint.

## Decisões

As decisões de arquitetura ficam em [`docs/adr`](adr/).

# Como contribuir

## Fluxo

1. Crie uma branch a partir de `main`: `feat/boletim-familia`, `fix/total-mensalidade`.
2. Rode `npm run check` antes de abrir o pull request.
3. Abra o pull request preenchendo o modelo. O CI precisa passar para o merge.

## Commits

Conventional Commits, conferidos pelo commitlint no hook `commit-msg`:

```
feat(alunos): lista de alunos por turma
fix(api): 404 para matrícula inexistente
docs: ADR do banco de dados
```

Tipos aceitos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

## Código

- TypeScript strict em todo o código. `any` só com comentário explicando o motivo.
- Imports relativos com extensão (`./alunos.service.ts`).
- Componentes e funções como `const` com arrow function e export nomeado.
- Textos da interface seguem a voz do design system (`prototipo/design-system/README.md`): frase curta, verbo na frente, sem emoji, sem exclamação.

## Novo módulo na API

1. Schema em `packages/contracts/src/<dominio>.ts` e export em `index.ts`.
2. Pasta `apps/api/src/modules/<dominio>` com `routes`, `controller`, `service`, `repository` e teste do service.
3. Service registrado em `src/container.ts` e rota no router `v1` de `src/app.ts`. O caminho segue [docs/api/padroes.md](docs/api/padroes.md).
4. Operações em `modules/<dominio>/<dominio>.openapi.ts` com `defineOpenApiModule`: `operationId`, `summary`, `tags`, parâmetros, resposta de sucesso e os erros específicos (`problemResponse('NAO_ENCONTRADO')`). O módulo entra na lista de `src/openapi.ts`.
5. `npm run openapi -w @recreio/api` e commit do `docs/api/openapi.json` junto com a mudança. O teste `openapi.test.ts` falha sem esse passo.

## Nova tela no portal

1. Consulta em `apps/web/src/features/<dominio>/api/<dominio>.queries.ts`.
2. Componentes em `features/<dominio>/components`, exportados no `index.ts` da feature.
3. Página em `pages/<pagina>/<Pagina>Page.tsx` e rota em `app/router.tsx`.
4. Teste da página com `renderRoute` e `mockApi` de `src/test/render.tsx`.

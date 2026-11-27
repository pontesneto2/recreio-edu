# Recreio Sistema Educacional

Portal web em React e API em Node para o Recreio. O protótipo com as 173 telas fica em `prototipo/` como referência.

## Stack

| Camada     | Tecnologia                                                                                                             |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| Linguagem  | TypeScript 6 em todo o código, modo strict                                                                             |
| Portal     | React 19, React Compiler, Vite 8, React Router 8, TanStack Query 5                                                     |
| API        | Node 24 executando TypeScript nativo, Express 5                                                                        |
| Contratos  | Zod 4, schemas compartilhados entre API e portal em `@recreio/contracts`                                               |
| Testes     | Vitest e Testing Library no portal, `node --test` na API, Playwright e axe no navegador, Lighthouse CI                 |
| Qualidade  | ESLint 10, typescript-eslint, Prettier, Husky, lint-staged, commitlint                                                 |
| CI         | GitHub Actions: auditoria, format, lint, typecheck, testes, build, e2e, axe no Storybook, Lighthouse, imagens e CodeQL |
| Imagens    | Docker multi-stage: API em `node:24-alpine`, portal em nginx sem root                                                  |
| API extras | pino (logs estruturados), helmet (cabeçalhos de segurança), desligamento gracioso                                      |
| Padrões    | `/api/v1`, erros RFC 9457, OpenAPI 3.1 gerado do Zod, `X-Request-Id`, limite por IP                                    |

## Requisitos

- Node 24 ou mais novo (`.nvmrc` aponta 24). A API roda os arquivos `.ts` direto no Node, sem etapa de compilação no desenvolvimento.
- npm 11 ou mais novo.
- Docker Desktop (ou Docker Engine) com Compose 2.20 ou mais novo, para Postgres, Redis, Mailpit e RustFS.

## Primeiros passos

```bash
npm install
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

- Portal web: http://localhost:5173 (escolha de perfil em `/`; rotas por perfil em [docs/frontend.md](docs/frontend.md))
- API: http://localhost:3333/api/health (processo) e http://localhost:3333/api/ready (banco)
- Documentação da API: http://localhost:3333/api/docs

O Vite repassa `/api` para a porta 3333, então o portal chama `fetch('/api/v1/...')` sem configurar URL. Rotas de negócio ficam sob `/api/v1`; versionamento, erros e o OpenAPI estão em [docs/api](docs/api/README.md).

Em `localhost`, a API atende a escola de `DEV_ESCOLA_DOMINIO` (Colégio Recreio). Banco, usuários, migrações e RLS estão em [docs/banco-de-dados.md](docs/banco-de-dados.md). Os testes da API sobem um PostgreSQL com Testcontainers, então o Docker precisa estar rodando para `npm test`.

## Docker

| Arquivo                                   | O que faz                                                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `docker-compose.yml`                      | Serviços do desenvolvimento: Postgres 5432 (`POSTGRES_PORT`), Redis 6379, Mailpit 1025 e 8025, RustFS 9000 e 9001.  |
| `apps/api/Dockerfile`                     | Imagem da API: só dependências de produção, usuário `node`, healthcheck em `/api/health`.                           |
| `apps/web/Dockerfile` e `apps/web/nginx/` | Imagem do portal: nginx sem root na porta 8080, fallback de SPA, cache e CSP, `/api` repassado para `API_UPSTREAM`. |
| `compose.app.yml`                         | API e portal com as imagens de produção, ligados aos serviços acima.                                                |

```bash
docker compose up -d                              # serviços do desenvolvimento
docker compose -f compose.app.yml up --build      # imagens de produção, portal em http://localhost:8080
docker compose down                               # para tudo, mantém os dados
```

Portas, reset de dados e problemas comuns: [docs/operacao/runbook-local.md](docs/operacao/runbook-local.md). Imagens, variáveis e release: [docs/operacao](docs/operacao/README.md).

## Ver as telas do protótipo

```bash
npm run prototipo
```

Abra http://localhost:5000. O `index.html` lista as telas por grupo (Família, Aluno, Escola, Professor, Celular, App).

## Estrutura

Cada aplicação tem a própria pasta `src/`. As camadas e as regras de importação estão em [docs/arquitetura.md](docs/arquitetura.md). Os padrões da API (URLs, status, erros, paginação, limites) estão em [docs/api/padroes.md](docs/api/padroes.md). As decisões ficam em [docs/adr](docs/adr/), o plano de entregas em [docs/roadmap.md](docs/roadmap.md) e o fluxo de trabalho em [CONTRIBUTING.md](CONTRIBUTING.md).

| Pasta                               | Conteúdo                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------ |
| `apps/web/src`                      | Portal: `app/` (rotas e provedores), `pages/`, `features/<dominio>/`, `shared/`.           |
| `apps/api/src`                      | API: `modules/<dominio>/` (routes, controller, service, repository), `shared/`, `config/`. |
| `packages/contracts`                | Schemas Zod e tipos de cada recurso. A API valida com eles e o portal confere a resposta.  |
| `packages/design-system`            | Componentes e tokens do Recreio em TypeScript, importados como `@recreio/design-system`.   |
| `prototipo/visualizar`              | Cada tela do protótipo como HTML estático.                                                 |
| `prototipo/telas-fonte`             | Os `.dc.html` originais. O método `renderVals()` traz os dados de exemplo de cada tela.    |
| `prototipo/design-system`           | Documentação por componente e o código-fonte original.                                     |
| `prototipo/docs/dados-canonicos.md` | Nomes, datas, valores e regras de negócio das telas.                                       |

## Scripts da raiz

| Script                                | O que faz                                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `npm run dev`                         | Sobe API e portal juntos.                                                                         |
| `npm run dev:api` / `npm run dev:web` | Sobe só um dos dois.                                                                              |
| `npm run db:migrate`                  | Aplica as migrações pendentes como `recreio`.                                                     |
| `npm run db:seed`                     | Grava os dados de demonstração. Pode rodar de novo.                                               |
| `npm run prototipo`                   | Serve `prototipo/visualizar` na porta 5000.                                                       |
| `npm run storybook`                   | Storybook do design system na porta 6006.                                                         |
| `npm run build-storybook`             | Gera o Storybook estático em `packages/design-system/storybook-static`.                           |
| `npm run build`                       | Compila API (`apps/api/dist`) e portal (`apps/web/dist`).                                         |
| `npm run typecheck`                   | Roda o TypeScript em todos os pacotes.                                                            |
| `npm test`                            | Roda os testes da API e do portal.                                                                |
| `npm run test:e2e`                    | Build do portal e testes de ponta a ponta com Playwright e axe, com a API simulada.               |
| `npm run test:storybook`              | Build do Storybook e axe em cada história.                                                        |
| `npm run test:lighthouse`             | Build do portal e Lighthouse em `/` e `/escola` (acessibilidade e boas práticas a partir de 0,9). |
| `npm run lint`                        | ESLint em todo o código fora de `prototipo/`.                                                     |
| `npm run format`                      | Prettier em todo o código fora de `prototipo/`.                                                   |
| `npm run check`                       | Lint, typecheck, testes e build, na mesma ordem do CI.                                            |
| `npm run openapi -w @recreio/api`     | Regrava `docs/api/openapi.json` a partir dos contratos.                                           |

## Portar uma tela do protótipo

1. Abra a tela em `prototipo/visualizar` para ver o resultado esperado.
2. Leia o `.dc.html` correspondente em `prototipo/telas-fonte`. A marcação usa `Recreio.<Componente>`; cada um existe em `@recreio/design-system` com o mesmo nome.
3. Descreva os dados de `renderVals()` como schema Zod em `packages/contracts`.
4. Crie o módulo em `apps/api/src/modules/<dominio>`, com as operações em `<dominio>.openapi.ts`, e a consulta em `apps/web/src/features/<dominio>/api`.
5. Crie a página em `apps/web/src/pages` e registre-a pelo href do item do menu em `TELAS_PRONTAS` de `apps/web/src/app/router.tsx` ([docs/frontend.md](docs/frontend.md)).

## Variáveis de ambiente

A API lê `apps/api/.env` quando o arquivo existe e valida as variáveis com Zod ao subir. Copie `apps/api/.env.example` para começar. `RATE_LIMIT_PER_MINUTE` (padrão 300) limita as requisições por minuto por IP em `/api/v1`.

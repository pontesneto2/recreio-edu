# Recreio Sistema Educacional

Portal web em React e API em Node para o Recreio. O protótipo com as 173 telas fica em `prototipo/` como referência.

## Stack

| Camada     | Tecnologia                                                                        |
| ---------- | --------------------------------------------------------------------------------- |
| Linguagem  | TypeScript 6 em todo o código, modo strict                                        |
| Portal     | React 19, React Compiler, Vite 8, React Router 8, TanStack Query 5                |
| API        | Node 24 executando TypeScript nativo, Express 5                                   |
| Contratos  | Zod 4, schemas compartilhados entre API e portal em `@recreio/contracts`          |
| Testes     | Vitest e Testing Library no portal, `node --test` na API                          |
| Qualidade  | ESLint 10, typescript-eslint, Prettier, Husky, lint-staged, commitlint            |
| CI         | GitHub Actions com format, lint, typecheck, testes e build em cada push e PR      |
| API extras | pino (logs estruturados), helmet (cabeçalhos de segurança), desligamento gracioso |

## Requisitos

- Node 24 ou mais novo (`.nvmrc` aponta 24). A API roda os arquivos `.ts` direto no Node, sem etapa de compilação no desenvolvimento.
- npm 11 ou mais novo.

## Primeiros passos

```bash
npm install
npm run dev
```

- Portal web: http://localhost:5173
- API: http://localhost:3333/api/health

O Vite repassa `/api` para a porta 3333, então o portal chama `fetch('/api/...')` sem configurar URL.

## Ver as telas do protótipo

```bash
npm run prototipo
```

Abra http://localhost:5000. O `index.html` lista as telas por grupo (Família, Aluno, Escola, Professor, Celular, App).

## Estrutura

Cada aplicação tem a própria pasta `src/`. As camadas, as regras de importação e o formato de erro da API estão em [docs/arquitetura.md](docs/arquitetura.md). As decisões ficam em [docs/adr](docs/adr/), o plano de entregas em [docs/roadmap.md](docs/roadmap.md) e o fluxo de trabalho em [CONTRIBUTING.md](CONTRIBUTING.md).

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

| Script                                | O que faz                                                 |
| ------------------------------------- | --------------------------------------------------------- |
| `npm run dev`                         | Sobe API e portal juntos.                                 |
| `npm run dev:api` / `npm run dev:web` | Sobe só um dos dois.                                      |
| `npm run prototipo`                   | Serve `prototipo/visualizar` na porta 5000.               |
| `npm run build`                       | Compila API (`apps/api/dist`) e portal (`apps/web/dist`). |
| `npm run typecheck`                   | Roda o TypeScript em todos os pacotes.                    |
| `npm test`                            | Roda os testes da API e do portal.                        |
| `npm run lint`                        | ESLint em todo o código fora de `prototipo/`.             |
| `npm run format`                      | Prettier em todo o código fora de `prototipo/`.           |
| `npm run check`                       | Lint, typecheck, testes e build, na mesma ordem do CI.    |

## Portar uma tela do protótipo

1. Abra a tela em `prototipo/visualizar` para ver o resultado esperado.
2. Leia o `.dc.html` correspondente em `prototipo/telas-fonte`. A marcação usa `Recreio.<Componente>`; cada um existe em `@recreio/design-system` com o mesmo nome.
3. Descreva os dados de `renderVals()` como schema Zod em `packages/contracts`.
4. Crie o módulo em `apps/api/src/modules/<dominio>` e a consulta em `apps/web/src/features/<dominio>/api`.
5. Crie a página em `apps/web/src/pages` e a rota em `apps/web/src/app/router.tsx`.

## Variáveis de ambiente

A API lê `apps/api/.env` quando o arquivo existe e valida as variáveis com Zod ao subir. Copie `apps/api/.env.example` para começar.

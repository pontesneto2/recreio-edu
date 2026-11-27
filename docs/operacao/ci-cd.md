# CI/CD

O GitHub Actions roda 2 workflows. Os 2 têm `permissions: contents: read` no topo e grupo de `concurrency` por ref, então um push novo cancela a execução anterior da mesma branch.

## Workflows

| Arquivo                        | Quando roda                                          | Jobs                                                |
| ------------------------------ | ---------------------------------------------------- | --------------------------------------------------- |
| `.github/workflows/ci.yml`     | Push na `main` e todo pull request                   | `check`, `e2e`, `storybook`, `lighthouse`, `docker` |
| `.github/workflows/codeql.yml` | Push na `main`, todo pull request, segunda 06:00 UTC | `analyze`                                           |

Os jobs de `ci.yml` rodam em paralelo, cada um com o próprio `npm ci` e o cache do npm do `actions/setup-node`. Nenhum pede permissão além de `contents: read`.

### `check`

Mesma sequência do `npm run check`, mais auditoria e formatação:

1. `npm ci`
2. `npm audit --audit-level=high --omit=dev`: falha com vulnerabilidade alta ou crítica nas dependências de produção.
3. `npm run format:check`
4. `npm run lint`
5. `npm run typecheck`
6. `npm test`
7. `npm run build`

### `e2e`

Roda `npm run test:e2e`: build do portal, `vite preview` na porta 4273 e os testes de `apps/web/e2e` no Chromium do Playwright. A API é simulada, sem Postgres nem backend. Cada tela passa pelo axe e reprova com violação séria ou crítica. Detalhes em [frontend.md](../frontend.md#testes-no-navegador).

- O Chromium fica no `actions/cache`, com chave pela versão do `@playwright/test` no `node_modules`. Sem cache, `npx playwright install --with-deps chromium` baixa o navegador e as bibliotecas do sistema. Com cache, `npx playwright install-deps chromium` instala só as bibliotecas.
- Uma nova tentativa por teste (`retries: 1` com `CI`).
- Na falha, o artefato `relatorio-e2e` guarda `playwright-report/` e `test-results/` (com trace) por 7 dias.

### `storybook`

Roda `npm run test:storybook`: `storybook build` e o axe em cada história do Storybook gerado (`packages/design-system/a11y`). Qualquer violação reprova, como no painel do addon. Mesmo cache do Chromium do job `e2e`. Na falha, o artefato `relatorio-storybook` guarda o relatório do Playwright por 7 dias.

### `lighthouse`

Roda `npm run test:lighthouse`: build do portal e o `lhci autorun` com `apps/web/lighthouserc.json`. Mede `/` e `/escola` com a API falsa do `vite preview --mode api-falsa`. Reprova com acessibilidade ou boas práticas abaixo de 0,9. Usa o Google Chrome que já vem no `ubuntu-latest`. O artefato `relatorio-lighthouse` guarda os relatórios HTML e JSON por 7 dias, em toda execução. Os relatórios não vão para servidor externo (`upload.target: filesystem`).

O Lighthouse 12 tirou a categoria PWA. O job `e2e` confere manifesto, service worker e abertura sem conexão em `e2e/pwa.spec.ts`.

### `docker`

Constrói `apps/api/Dockerfile` e `apps/web/Dockerfile` com `docker/setup-buildx-action` e `docker/build-push-action`. Não publica imagem (`push: false`). As camadas ficam no cache do GitHub Actions (`type=gha`), uma chave por imagem (`scope=api`, `scope=web`). As 2 imagens ficam no mesmo job para a proteção da `main` exigir um check só, com nome fixo.

### `analyze` (CodeQL)

Analisa JavaScript e TypeScript com o pacote de consultas `security-extended`, sem etapa de build (`build-mode: none`). O job pede `security-events: write` para enviar os alertas à aba Security do repositório.

### Dependabot

`.github/dependabot.yml` abre pull requests para:

| Ecossistema      | Pastas                   | Frequência | Observação                                   |
| ---------------- | ------------------------ | ---------- | -------------------------------------------- |
| `npm`            | `/`                      | Semanal    | minor e patch num pull request só            |
| `github-actions` | `/`                      | Mensal     |                                              |
| `docker`         | `/apps/api`, `/apps/web` | Semanal    | Ignora major do `node`, que segue o `.nvmrc` |

## Checks obrigatórios e proteção da `main`

A proteção é configurada no GitHub, fora do repositório. Caminho: Settings, Rules, Rulesets, New branch ruleset.

| Campo                                 | Valor                               |
| ------------------------------------- | ----------------------------------- |
| Enforcement status                    | Active                              |
| Target branches                       | Default branch (`main`)             |
| Restrict deletions                    | Ligado                              |
| Block force pushes                    | Ligado                              |
| Require a pull request before merging | Ligado, 1 aprovação                 |
| Require status checks to pass         | Ligado, os 5 checks da lista abaixo |
| Require branches to be up to date     | Ligado                              |

Checks obrigatórios, todos de `ci.yml`. O nome do check é o id do job, então renomear um job tira o check da proteção sem aviso.

| Check        | O que bloqueia                                                    |
| ------------ | ----------------------------------------------------------------- |
| `check`      | Auditoria, formatação, lint, typecheck, testes unitários e build  |
| `e2e`        | Fluxos do portal no navegador, axe nas telas e PWA                |
| `storybook`  | Violação do axe em qualquer história do Storybook                 |
| `lighthouse` | Acessibilidade ou boas práticas abaixo de 0,9 em `/` ou `/escola` |
| `docker`     | Build das imagens da API e do portal                              |

O check `analyze` do CodeQL fica fora da lista obrigatória até a base de alertas estar zerada. Depois dele entrar, um alerta novo bloqueia o merge.

Os checks só aparecem na busca do ruleset depois de rodarem uma vez. Abra um pull request com este workflow antes de configurar.

## Deploy

Ainda não existe workflow de deploy. Ele depende da hospedagem (ADR 0011). O plano está em [README.md](README.md#release): staging a cada merge na `main`, produção por tag `vX.Y.Z`, migrações antes do deploy.

Quando o deploy entrar, o job que publica imagens recebe `packages: write` só nele, e as credenciais da hospedagem vêm de OIDC (`id-token: write`) em vez de segredo fixo.

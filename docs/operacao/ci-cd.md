# CI/CD

O GitHub Actions roda 2 workflows. Os 2 têm `permissions: contents: read` no topo e grupo de `concurrency` por ref, então um push novo cancela a execução anterior da mesma branch.

## Workflows

| Arquivo                        | Quando roda                                          | Jobs              |
| ------------------------------ | ---------------------------------------------------- | ----------------- |
| `.github/workflows/ci.yml`     | Push na `main` e todo pull request                   | `check`, `docker` |
| `.github/workflows/codeql.yml` | Push na `main`, todo pull request, segunda 06:00 UTC | `analyze`         |

### `check`

Mesma sequência do `npm run check`, mais auditoria e formatação:

1. `npm ci`
2. `npm audit --audit-level=high --omit=dev`: falha com vulnerabilidade alta ou crítica nas dependências de produção.
3. `npm run format:check`
4. `npm run lint`
5. `npm run typecheck`
6. `npm test`
7. `npm run build`

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

| Campo                                 | Valor                             |
| ------------------------------------- | --------------------------------- |
| Enforcement status                    | Active                            |
| Target branches                       | Default branch (`main`)           |
| Restrict deletions                    | Ligado                            |
| Block force pushes                    | Ligado                            |
| Require a pull request before merging | Ligado, 1 aprovação               |
| Require status checks to pass         | Ligado, checks `check` e `docker` |
| Require branches to be up to date     | Ligado                            |

O check `analyze` do CodeQL fica fora da lista obrigatória até a base de alertas estar zerada. Depois dele entrar, um alerta novo bloqueia o merge.

Os checks só aparecem na busca do ruleset depois de rodarem uma vez. Abra um pull request com este workflow antes de configurar.

## Deploy

Ainda não existe workflow de deploy. Ele depende da hospedagem (ADR 0011). O plano está em [README.md](README.md#release): staging a cada merge na `main`, produção por tag `vX.Y.Z`, migrações antes do deploy.

Quando o deploy entrar, o job que publica imagens recebe `packages: write` só nele, e as credenciais da hospedagem vêm de OIDC (`id-token: write`) em vez de segredo fixo.

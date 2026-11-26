# 0001. Monorepo com npm workspaces

- Status: aceita
- Data: 2026-11-26

## Contexto

O projeto tem portal web, API e uma biblioteca de componentes vinda do protótipo. Os 3 precisam evoluir juntos: um campo novo na API muda o tipo no portal e às vezes um componente.

## Decisão

Um repositório com npm workspaces: `apps/web`, `apps/api`, `packages/contracts` e `packages/design-system`. Os pacotes internos são consumidos como código-fonte TypeScript, sem etapa de build própria.

## Consequências

- Uma mudança que atravessa API, contrato e portal cabe num único pull request.
- `npm install` na raiz instala tudo; não há publicação de pacotes internos.
- Turborepo ou Nx ficam para quando o tempo de build justificar cache de tarefas.

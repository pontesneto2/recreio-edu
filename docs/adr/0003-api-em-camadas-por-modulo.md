# 0003. API em camadas, organizada por módulo de domínio

- Status: aceita
- Data: 2026-11-26

## Contexto

A API vai crescer para dezenas de domínios (alunos, financeiro, portaria, biblioteca, comunicados). Pastas por tipo técnico (`controllers/`, `services/`) espalham um domínio por vários lugares.

## Decisão

Uma pasta por domínio em `src/modules/<dominio>`, com `routes`, `controller`, `service` e `repository`. As camadas são funções fábrica ligadas em `src/container.ts`. Repositórios são tipos com implementação em memória até o banco de dados ser escolhido.

## Consequências

- Um domínio novo é uma pasta nova mais 2 linhas em `container.ts` e `app.ts`.
- Services são testados sem HTTP e sem banco.
- A escolha do banco (ADR futura) troca só os repositórios.

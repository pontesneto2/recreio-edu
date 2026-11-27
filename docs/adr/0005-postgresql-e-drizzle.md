# 0005. PostgreSQL 17 com Drizzle ORM

- Status: aceita
- Data: 2026-11-27

## Contexto

Os dados do Recreio são relacionais: escola, unidade, turma, aluno, responsável, mensalidade. Precisamos de integridade referencial, transações, isolamento por escola no próprio banco e migrações versionadas.

## Decisão

- PostgreSQL 17. Local via `docker-compose.yml`; em produção, serviço gerenciado com recuperação para um ponto no tempo.
- Drizzle ORM com o driver `pg`. O schema fica em TypeScript (`apps/api/src/database/schema`) e as migrações SQL são geradas pelo `drizzle-kit` e versionadas em `apps/api/drizzle`.
- 2 usuários de banco: `recreio` (dono das tabelas, roda migrações) e `recreio_app` (usado pela API, sem privilégio de dono). As políticas de Row Level Security valem para `recreio_app` (ADR 0006).
- Valores em dinheiro em centavos (`integer`). Identificadores em `uuid` gerados pelo banco (`gen_random_uuid()`).

## Consequências

- O SQL gerado fica legível no pull request, e a revisão de migração vira revisão de código.
- Testes de integração sobem um PostgreSQL real com Testcontainers.
- Trocar de ORM depois afeta só `apps/api/src/database` e os repositórios.

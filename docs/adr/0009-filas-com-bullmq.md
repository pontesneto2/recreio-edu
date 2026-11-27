# 0009. Filas com BullMQ e Redis

- Status: aceita
- Data: 2026-11-27

## Contexto

Envio de e-mail, push, geração de PDF de boletim, cobrança e webhooks não podem travar a requisição nem se perder numa queda da API.

## Decisão

- BullMQ sobre Redis 8. Local via `docker-compose.yml`.
- Um processo separado (`apps/api/src/worker.ts`) consome as filas; a API só enfileira.
- Toda tarefa é idempotente e tem id determinístico, para que a repetição não duplique efeito.
- Tentativas com espera exponencial; após o limite, a tarefa vai para uma fila de falhas monitorada.

## Consequências

- Redis passa a ser dependência de produção, com persistência ligada.
- `/api/ready` confere o Redis além do PostgreSQL.

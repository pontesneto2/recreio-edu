# 0008. Padrões da API: REST versionado, Problem Details e OpenAPI gerado dos contratos

- Status: aceita
- Data: 2026-11-27

## Contexto

A API vai servir o portal, o app nativo e, no futuro, integrações de terceiros. Precisa de contrato documentado, erros previsíveis e evolução sem quebrar clientes.

## Decisão

- REST sobre JSON, recursos no plural em português (`/alunos`, `/turmas`), prefixo de versão `/api/v1`.
- Erros no formato RFC 9457 (`application/problem+json`) com `type`, `title`, `status`, `detail`, `instance` e a extensão `code` (código estável, como `NAO_ENCONTRADO`).
- Documento OpenAPI 3.1 gerado dos schemas Zod de `packages/contracts`, servido em `/api/v1/openapi.json`, com referência navegável em `/api/docs`.
- Listas paginadas por cursor: `?limit=` e `?cursor=`, resposta `{ data, nextCursor }`.
- Cabeçalho `X-Request-Id` em toda resposta, repassado quando o cliente envia.
- `Idempotency-Key` aceito em `POST` que cria cobrança ou envia mensagem.
- Limite de requisições por IP e por usuário, com resposta `429` e `Retry-After`.
- Mudança incompatível cria `/api/v2`; a versão anterior continua até os clientes migrarem.

## Consequências

- O contrato é a fonte única: schema Zod, tipo TypeScript, validação e documentação saem do mesmo arquivo.
- Um teste no CI falha se o OpenAPI gerado mudar sem o arquivo versionado ser atualizado.
- O portal trata erros pelo campo `code`, sem depender do texto.

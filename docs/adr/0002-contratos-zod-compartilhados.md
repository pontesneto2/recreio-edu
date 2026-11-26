# 0002. Contratos Zod compartilhados entre API e portal

- Status: aceita
- Data: 2026-11-26

## Contexto

As telas do protótipo trazem os dados de exemplo em `renderVals()`. Esses dados viram respostas da API. Sem um contrato comum, API e portal divergem em silêncio.

## Decisão

Cada recurso tem um schema Zod em `packages/contracts`. Os tipos TypeScript saem do schema com `z.infer`. A API valida entradas com o schema e os testes conferem as respostas contra ele. O portal valida cada resposta antes de usar.

## Consequências

- Um campo renomeado na API quebra o typecheck do portal.
- Uma resposta fora do contrato vira erro explícito no portal, sem `undefined` espalhado pela tela.
- Gerar OpenAPI a partir dos schemas fica possível quando houver consumidores externos.

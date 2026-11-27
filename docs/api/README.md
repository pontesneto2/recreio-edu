# API Recreio

A API segue a [ADR 0008](../adr/0008-padroes-de-api.md). As regras de nome, status, erros, paginação e limites estão em [padroes.md](padroes.md).

## Navegar pela documentação

Com a API rodando (`npm run dev:api`):

| Endereço                                     | Conteúdo                                                |
| -------------------------------------------- | ------------------------------------------------------- |
| http://localhost:3333/api/docs               | Referência navegável (Scalar), com cliente para testar  |
| http://localhost:3333/api/v1/openapi.json    | Documento OpenAPI 3.1 da versão 1                       |
| [openapi.json](openapi.json) neste diretório | Cópia versionada do mesmo documento, para revisar no PR |

A página `/api/docs` carrega o Scalar do jsDelivr numa versão fixa (`SCALAR_CDN` em `apps/api/src/shared/openapi/api-reference.ts`). Ela tem CSP própria com nonce por requisição. O resto da API mantém a CSP padrão do helmet.

## De onde vem o documento

O OpenAPI sai dos schemas Zod de `packages/contracts`. Ninguém escreve o JSON à mão.

1. Cada módulo declara as operações em `apps/api/src/modules/<dominio>/<dominio>.openapi.ts`, ao lado das rotas: `operationId`, `summary`, `tags`, parâmetros e respostas.
2. `apps/api/src/openapi.ts` junta os módulos com `createOpenApiDocument` (`shared/openapi/document.ts`).
3. O montador acrescenta as respostas `404`, `429` e `500` em toda operação, e `413` nas operações com corpo. O módulo declara só as específicas, como `400` e `404`, com `problemResponse('NAO_ENCONTRADO')`.
4. A biblioteca [zod-openapi](https://github.com/samchungy/zod-openapi) converte os schemas. Os schemas listados em `schemas` viram componentes com nome (`#/components/schemas/Aluno`).

## Regenerar o openapi.json

Depois de mudar um contrato ou uma declaração `*.openapi.ts`:

```bash
npm run openapi -w @recreio/api
```

O comando grava `docs/api/openapi.json`. Versione o arquivo no mesmo commit da mudança. O teste `apps/api/src/openapi.test.ts` falha quando o arquivo versionado difere do documento gerado, e a mensagem de erro repete o comando acima. Assim o diff do contrato aparece na revisão do PR.

O arquivo fica fora do Prettier (`.prettierignore`), porque o teste compara o texto exato do `JSON.stringify`.

## Versionamento

- Toda rota de negócio fica sob `/api/v1`. `/api/health` e `/api/ready` não têm versão nem entram no OpenAPI, porque servem ao balanceador e não a clientes. `/api/health` responde 200 com o processo vivo. `/api/ready` responde 200 com Postgres e Redis no ar e 503 com algum fora. O corpo diz qual: `{ "status": "indisponivel", "dependencias": { "postgres": "ok", "redis": "indisponivel" } }`.
- Rotas com dados de escola ficam em `/api/v1/escolas/{escola}/...`, com o slug da escola no caminho (ADR 0011). Slug sem escola responde 404 `NAO_ENCONTRADO`. `/api/v1/eu` e `/api/v1/openapi.json` são globais. O `Host` não escolhe escola.
- Mudança compatível entra na v1 sem aviso: campo novo na resposta, parâmetro opcional novo, endpoint novo, código de erro novo.
- Mudança incompatível cria `/api/v2`: remover ou renomear campo, mudar tipo, tornar parâmetro obrigatório, mudar o significado de um status.
- A v2 nasce como um router novo em `app.ts` e um documento OpenAPI próprio. A v1 continua no ar até os clientes migrarem.
- Clientes tratam erro pelo campo `code`. O texto de `title` e `detail` pode mudar sem nova versão.

## Descontinuação

1. A operação recebe `deprecated: true` no `*.openapi.ts`. O Scalar mostra a marca.
2. A resposta passa a enviar `Deprecation` (RFC 9745) e `Sunset` (RFC 8594) com a data de desligamento, mais `Link` para a substituta.
3. O prazo mínimo entre o aviso e o desligamento é de 6 meses para o app nativo, que depende de atualização na loja.
4. Na data, a rota responde `410 Gone` por mais um ciclo de release e depois sai do código.

Os cabeçalhos dos passos 2 e 4 ainda não existem. Entram junto com a primeira descontinuação real.

## Autenticação

A [ADR 0007](../adr/0007-autenticacao-better-auth.md) define sessão em cookie `httpOnly`, `Secure`, `SameSite=Lax`. Fluxos, perfis e a matriz de permissões estão em [autenticacao.md](../autenticacao.md).

- Entrar, sair, cadastro, confirmação de e-mail e troca de senha ficam em `/api/auth/*`, rotas do [Better Auth](https://www.better-auth.com/docs/concepts/api) fora deste documento. A lista das rotas usadas está em [autenticacao.md](../autenticacao.md#rotas-do-better-auth).
- O portal chama a API na mesma origem (o Vite repassa `/api` em desenvolvimento) com `credentials: 'include'`, então o navegador envia o cookie.
- O OpenAPI declara o `securityScheme` `cookieAuth` (`apiKey` no cookie `recreio.session_token`). Cada operação protegida lista a exigência; `/escolas/{escola}/publica` declara `security: []`.
- Sem sessão válida, a rota responde `401` `NAO_AUTENTICADO`. Sem vínculo com a escola do caminho, `403` `SEM_ACESSO`. Com vínculo e sem a permissão, `403` `PERMISSAO_NEGADA`.
- Integrações de terceiros vão usar outro esquema (token por escola), decidido em ADR própria.

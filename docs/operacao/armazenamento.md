# Armazenamento de arquivos

Documentos de matrícula, fotos e PDFs ficam num armazenamento compatível com S3 ([ADR 0010](../adr/0010-armazenamento-de-arquivos-s3.md)). RustFS no ambiente local, o S3 do provedor em produção. O código fica em `apps/api/src/shared/storage/`. Nenhuma rota pública usa o módulo ainda. Ele entra com a funcionalidade de documentos.

## Bucket

- Um bucket só para todas as escolas: `S3_BUCKET` (local: `recreio`).
- Os arquivos são privados. O bucket não tem política pública, e toda leitura passa por URL assinada.
- Ao subir, a API chama `prepararBucket`. Em desenvolvimento ela cria o bucket que falta. Em produção ela só confere e registra `bucket de arquivos indisponível` (nível error) quando ele não existe. A API sobe nos 2 casos.
- Em produção o bucket é criado pela infraestrutura da hospedagem, com versionamento e criptografia ligados.

## Chaves

A chave do objeto é `<escola_id>/<caminho>`, por exemplo `0f4f6a1e-.../alunos/7a1e2b3c/rg.pdf`.

- `chaveDoArquivo(escolaId, caminho)` monta a chave. O caminho aceita letras, números, `.`, `_` e `-` em segmentos separados por `/`, sem `..` e sem barra no início. Caminho fora da regra lança `ValidationError` (400).
- Antes de assinar um download, `conferirChaveDaEscola` confere o prefixo. Chave de outra escola lança `NotFoundError` (404), sem dizer que o arquivo existe.
- O caminho não leva dado pessoal: use ids (`alunos/<id>/rg.pdf`), não nomes.

## URLs assinadas

| Função            | Método | O que o navegador faz                                                     |
| ----------------- | ------ | ------------------------------------------------------------------------- |
| `presignUpload`   | `PUT`  | Envia o arquivo direto ao armazenamento com os cabeçalhos de `cabecalhos` |
| `presignDownload` | `GET`  | Baixa o arquivo. `nomeArquivo` define o nome no `Content-Disposition`     |

- A validade vem de `S3_URL_TTL_SECONDS` (padrão 300 s, máximo 3600 s). A resposta traz `expiraEm`.
- O `Content-Type` faz parte da assinatura do upload. Um `PUT` com outro tipo recebe 403.
- O SDK não põe checksum na URL (`requestChecksumCalculation: 'WHEN_REQUIRED'`), então o navegador envia o corpo sem calcular CRC32.
- O arquivo não passa pelo processo da API.

Fluxo esperado na funcionalidade de documentos:

1. O portal pede `POST /api/v1/<recurso>/uploads` com nome e tipo. A API confere a sessão e a escola e devolve `presignUpload`.
2. O navegador faz o `PUT` direto na URL.
3. O portal confirma o upload. A API grava a chave na tabela do recurso, com `escola_id`.
4. Para baixar, a API lê a chave da tabela (sob RLS) e devolve `presignDownload`.

## Endpoints

- `S3_ENDPOINT` é o endereço que a API usa. Em produção na AWS fica vazio, e o SDK usa o endpoint da região (`S3_REGION`).
- `S3_PUBLIC_ENDPOINT` é o endereço das URLs entregues ao navegador, quando ele chega no armazenamento por outro nome. Em `compose.app.yml` a API usa `http://storage:9000` e o navegador `http://localhost:9000`.
- `S3_FORCE_PATH_STYLE` monta a URL como `endpoint/bucket/chave`. O RustFS exige. O padrão liga quando há `S3_ENDPOINT`.
- Sem `S3_ACCESS_KEY` e `S3_SECRET_KEY`, o SDK usa a cadeia padrão de credenciais (papel da instância, variáveis `AWS_*`).

## Local

- Console do RustFS: http://localhost:9001, usuário `recreio`, senha `recreio-storage`.
- O bucket `recreio` aparece na primeira subida da API (`npm run dev:api`).
- O teste `shared/storage/armazenamento.test.ts` sobe um RustFS pelo Testcontainers, cria buckets, faz upload e download pelas URLs assinadas e confere o 403 de outro `Content-Type`. Sem Docker, os testes do arquivo aparecem como pulados, com o motivo.

## Pendente

- Limite de tamanho no upload: o `PUT` assinado não limita o corpo. A funcionalidade de documentos usa POST assinado (`@aws-sdk/s3-presigned-post`) com `content-length-range`, ou confere o tamanho com `HeadObject` na confirmação.
- Antivírus nos arquivos enviados, antes de liberar o download para outras pessoas.

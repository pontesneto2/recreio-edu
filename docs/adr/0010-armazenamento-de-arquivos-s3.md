# 0010. Arquivos em armazenamento compatível com S3

- Status: aceita
- Data: 2026-11-27

## Contexto

O sistema guarda documentos de matrícula, fotos, PDFs de boletim e contratos assinados. Esses arquivos não cabem no banco e precisam de acesso controlado.

## Decisão

- API S3 como interface única, via `@aws-sdk/client-s3`.
- Local: RustFS no `docker-compose.yml` (a imagem comunitária do MinIO saiu do Docker Hub). Produção: o S3 do provedor de hospedagem.
- Arquivos privados por padrão. Download e upload por URL assinada com validade curta.
- Chave do arquivo começa pelo `escola_id`, e a API confere a escola antes de assinar a URL.

## Consequências

- Trocar de provedor muda só endpoint e credenciais.
- Nenhum arquivo passa pelo processo da API no upload; o navegador envia direto para o armazenamento.

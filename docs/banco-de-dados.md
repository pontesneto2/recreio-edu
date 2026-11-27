# Banco de dados

A API usa PostgreSQL 17 com Drizzle ORM ([ADR 0005](adr/0005-postgresql-e-drizzle.md)). Cada escola vê só os próprios dados por Row Level Security ([ADR 0006](adr/0006-multi-escola-por-dominio-e-rls.md)). A escola da requisição vem do slug da rota ([ADR 0011](adr/0011-escola-pela-rota.md)).

## Rodar localmente

```bash
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

- `http://localhost:3333/api/ready` responde `{ "status": "ok" }` quando o banco está no ar.
- `http://localhost:3333/api/v1/escolas/colegio-recreio/publica` mostra nome, cidade e cor do Colégio Recreio, sem login.
- As outras rotas da escola pedem sessão. As contas de demonstração estão em [autenticacao.md](autenticacao.md#contas-de-demonstração-só-desenvolvimento).
- `npm run db:reset -w @recreio/api` apaga o schema, roda as migrações e o seed de novo. Não roda com `NODE_ENV=production`.

As URLs padrão da API apontam para o `docker-compose.yml`, então o `.env` é opcional. Para mudar, copie `apps/api/.env.example` para `apps/api/.env`.

### Porta 5432 ocupada

No Windows, um PostgreSQL instalado como serviço pode escutar na 5432 junto com o Docker. A conexão em `localhost:5432` cai nele, e o login de `recreio` falha com `password authentication failed`. Para usar a 5433:

1. Copie `.env.example` da raiz para `.env` e troque para `POSTGRES_PORT=5433`. O `docker compose` lê esse arquivo.
2. Em `apps/api/.env`, aponte as 2 URLs para a 5433:

   ```bash
   DATABASE_URL=postgres://recreio_app:recreio_app@localhost:5433/recreio
   DATABASE_MIGRATION_URL=postgres://recreio:recreio@localhost:5433/recreio
   ```

3. Rode `docker compose up -d` de novo. O container passa a publicar a 5433.

## Os 2 usuários

| Usuário       | Variável                 | Uso                                                            |
| ------------- | ------------------------ | -------------------------------------------------------------- |
| `recreio`     | `DATABASE_MIGRATION_URL` | Dono das tabelas. Roda migrações, seed e `db:reset`.           |
| `recreio_app` | `DATABASE_URL`           | Usado pela API. Não é dono nem superusuário, então o RLS vale. |

O `infra/postgres/init/01-app-role.sh` cria `recreio_app` na primeira subida do Docker, com o volume vazio. Em produção, crie `recreio_app` antes da primeira migração, porque as migrações dão `GRANT` para ele.

## Tabelas

| Tabela                                       | Colunas principais                                                                             | Regras                                                                                                                                                                       |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `escolas`                                    | `nome`, `cnpj`, `cidade`, `cor_marca`, `slug`, `dominio`, `criado_em`, `atualizado_em`         | `cnpj`, `slug` e `dominio` únicos. `slug` no formato `colegio-recreio`, até 63 caracteres. `dominio` opcional, em minúsculas. `cor_marca` no formato `#RRGGBB`.              |
| `unidades`                                   | `escola_id`, `slug`, `nome`                                                                    | `slug` único por escola.                                                                                                                                                     |
| `turmas`                                     | `escola_id`, `unidade_id`, `nome`, `turno`, `ano_letivo`                                       | `turno` em `manha`, `tarde`, `integral` ou `noite`. Nome único por unidade e ano letivo.                                                                                     |
| `alunos`                                     | `escola_id`, `unidade_id`, `turma_id`, `nome`, `matricula`, `mensalidade_centavos`, timestamps | `matricula` única por escola. `mensalidade_centavos` inteiro maior ou igual a 0.                                                                                             |
| `vinculos`                                   | `escola_id`, `usuario_id`, `perfil`, timestamps                                                | Uma linha por perfil. `perfil` em `responsavel`, `aluno`, `professor`, `secretaria`, `financeiro`, `portaria`, `coordenacao` ou `direcao`. Único por escola, conta e perfil. |
| `permissoes`                                 | `escola_id`, `perfil`, `modulo`, `acoes` (`text[]`), timestamps                                | Única por escola, perfil e módulo. `acoes` não vazia, só com `ver`, `criar`, `editar`, `excluir` e `aprovar`.                                                                |
| `user`, `session`, `account`, `verification` | Esquema do Better Auth                                                                         | Globais, sem `escola_id` e sem RLS. `email` único. Uma conta por provedor e id.                                                                                              |

- Toda chave primária é `uuid` gerado pelo banco (`gen_random_uuid()`).
- Dinheiro fica em centavos (`integer`). R$ 1.620,00 é `162000`.
- As chaves estrangeiras de turma e aluno são compostas com `escola_id`. Uma turma só aponta para unidade da mesma escola, e um aluno só aponta para turma da mesma escola e unidade.
- Toda chave estrangeira tem índice que começa pelas mesmas colunas.
- As tabelas do Better Auth usam id `text` e os nomes de coluna do Better Auth. `vinculos.usuario_id` aponta para `user.id` com `on delete cascade`. Detalhes em [autenticacao.md](autenticacao.md).

O schema fica em `apps/api/src/database/schema/*.ts`. As migrações SQL ficam em `apps/api/drizzle/`.

## Migrações

1. Altere o schema em `apps/api/src/database/schema`.
2. Gere a migração: `npm run db:generate -w @recreio/api -- --name descricao_curta`.
3. Leia o SQL gerado em `apps/api/drizzle/`. Ele entra no pull request e passa por revisão como código.
4. Aplique: `npm run db:migrate`.
5. Faça commit do schema, do `.sql` e de `apps/api/drizzle/meta/`.

SQL que o Drizzle não gera (políticas, funções, `GRANT`) vai numa migração manual: `npm run db:generate -w @recreio/api -- --custom --name descricao_curta`. O comando cria um `.sql` vazio para preencher.

Regras:

- Migração aplicada não muda. Correção vira migração nova.
- Toda migração funciona com a versão anterior da API ainda no ar. Remover coluna leva 2 entregas: primeiro o código para de usar, depois a migração remove.
- As migrações rodam como `recreio`. A tabela de controle fica em `drizzle.__drizzle_migrations`.

## Row Level Security

Cada requisição com dados de escola segue este caminho:

1. O middleware `resolverEscola` lê o slug de `/api/v1/escolas/:escola` e chama `escola_por_slug(slug)`. Slug sem escola responde 404 (`NAO_ENCONTRADO`).
2. O repositório chama `withEscola(escolaId, fn)`. Ele abre uma transação e roda `select set_config('app.escola_id', escolaId, true)`.
3. As políticas comparam `escola_id` com `app.escola_id`. Linhas de outra escola não aparecem nem podem ser gravadas.
4. No fim da transação, `app.escola_id` volta ao valor vazio. A próxima requisição na mesma conexão começa sem escola.

A política de cada tabela:

```sql
USING ("escola_id" = nullif(current_setting('app.escola_id', true), '')::uuid)
WITH CHECK ("escola_id" = nullif(current_setting('app.escola_id', true), '')::uuid)
```

- `current_setting(..., true)` devolve `NULL` quando a variável não existe, e `''` depois que uma transação com `set_config` local termina. O `nullif` transforma os 2 casos em `NULL`, e a comparação com `NULL` não libera linha nenhuma.
- `FORCE ROW LEVEL SECURITY` aplica a política também ao dono das tabelas. Por isso o seed grava unidades, turmas, alunos, vínculos e permissões dentro de `withEscola`. Superusuário ignora RLS sempre.
- `escolas` tem RLS sem `FORCE`. `recreio_app` só lê a própria escola e não tem política de escrita. O dono lê a tabela toda, e a função `escola_por_slug` (`SECURITY DEFINER`, dono `recreio`, `search_path` fixo) depende disso para achar a escola antes de existir `app.escola_id`. A antiga `escola_por_dominio` fica até a versão anterior da API sair do ar.
- `vinculos` tem uma política só de `SELECT` para o dono. A função `vinculos_do_usuario` (`SECURITY DEFINER`) depende dela para listar os vínculos de uma conta em todas as escolas, para `GET /api/v1/eu`. `recreio_app` continua preso a `app.escola_id`.
- Os repositórios também filtram por `escola_id`. Um vazamento precisa de falha no filtro e na política ao mesmo tempo.

Os testes de `apps/api/src/database/rls.test.ts` sobem 2 escolas e provam o isolamento como `recreio_app`.

## Checklist para nova tabela com `escola_id`

1. Coluna `escola_id uuid not null` com referência a `escolas.id`.
2. Referência a tabela da escola (unidade, turma, aluno) como chave composta com `escola_id`. A tabela pai precisa de `unique (escola_id, id)`.
3. Índice que começa por `escola_id` cobrindo cada chave estrangeira.
4. `npm run db:generate -w @recreio/api -- --name nova_tabela`.
5. Migração manual com `ENABLE` e `FORCE ROW LEVEL SECURITY`, a política `USING` e `WITH CHECK` acima e `GRANT SELECT, INSERT, UPDATE, DELETE` para `recreio_app`.
6. Repositório com todas as consultas dentro de `withEscola` e filtro explícito por `escola_id`.
7. Nome da tabela em `TABELAS_DA_ESCOLA` de `rls.test.ts` e, se tiver dado de demonstração, linhas no seed.

## Testes

`npm test -w @recreio/api` sobe um PostgreSQL 17 descartável com Testcontainers, aplica as migrações e o seed. O Docker precisa estar rodando. O container usa porta aleatória e não interfere no `docker compose`.

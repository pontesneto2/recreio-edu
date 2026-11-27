# 0006. Multi-escola: escola resolvida pelo domínio e isolada com Row Level Security

- Status: aceita, com a resolução por domínio substituída pela [ADR 0011](0011-escola-pela-rota.md)
- Data: 2026-11-27

## Contexto

O Recreio é white label. Cada escola acessa pelo próprio endereço (por exemplo `colegiorecreio.recreio.app`) e nunca pode ver dados de outra. Um filtro esquecido numa consulta não pode vazar dados de menores.

## Decisão

- Banco único, schema único, coluna `escola_id` em toda tabela de dados da escola.
- A API descobre a escola pelo cabeçalho `Host` da requisição, comparando com `escolas.dominio`. Em desenvolvimento, `localhost` aponta para a escola definida em `DEV_ESCOLA_DOMINIO`.
- Cada requisição roda as consultas dentro de uma transação que define `set_config('app.escola_id', <id>, true)`.
- Toda tabela com `escola_id` tem `ENABLE` e `FORCE ROW LEVEL SECURITY` e uma política `escola_id = current_setting('app.escola_id')::uuid`.
- A API conecta como `recreio_app`, que não é dono das tabelas nem superusuário.
- Depois do login (ADR 0007), a API também confere se o usuário pertence à escola do domínio.

## Consequências

- Uma consulta sem filtro de escola devolve só dados da escola atual, porque o banco aplica a política.
- Toda operação de repositório recebe o contexto da escola; não existe acesso ao banco fora dele.
- Relatórios entre escolas (uso interno da Recreio) exigem uma conexão administrativa separada, auditada.

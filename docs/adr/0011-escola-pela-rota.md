# 0011. Escola identificada pela rota no domínio único

- Status: aceita
- Data: 2026-11-27
- Substitui a parte de resolução por domínio da [ADR 0006](0006-multi-escola-por-dominio-e-rls.md). O isolamento com Row Level Security continua valendo.

## Contexto

Todas as escolas clientes ficam no mesmo servidor e no mesmo domínio da empresa, `recreio-edu.com.br`. Cada escola é separada só pelo primeiro trecho do caminho: `recreio-edu.com.br/colegio-recreio`. Um domínio por escola exigiria DNS e certificado por cliente e complicaria a sessão de quem tem filhos em 2 escolas.

## Decisão

- Cada escola tem um `slug` único (`^[a-z0-9-]+$`), por exemplo `colegio-recreio`.
- Portal: `recreio-edu.com.br/{slug}/...`. Exemplos: `/colegio-recreio/entrar`, `/colegio-recreio/familia`, `/colegio-recreio/escola/alunos`.
- A raiz `recreio-edu.com.br/` é a página da empresa e a busca de escola. Quem já entrou vê a lista das próprias escolas.
- API: rotas com dados de escola ficam em `/api/v1/escolas/{slug}/...`. O middleware desse roteador troca o slug pelo `escola_id` com a função `escola_por_slug` (`SECURITY DEFINER`), confere sessão e vínculo e abre a transação com `app.escola_id`.
- Rotas globais: `/api/auth/*` (um login para todas as escolas), `/api/v1/eu` (usuário e vínculos agrupados por escola).
- Sessão: um cookie no domínio único. O vínculo com a escola é conferido em cada requisição; ter sessão não dá acesso a outra escola.
- Domínio próprio (`portal.colegiorecreio.com.br`) fica como opção futura de plano pago: a coluna `dominio` continua e, quando usada, redireciona para o slug.
- PWA: manifesto por escola em `/{slug}/manifest.webmanifest`, com nome, cor e ícone da escola e `scope` `/{slug}/`. Instalar o portal da escola gera um ícone com a marca dela.

## Consequências

- Um certificado TLS e um deploy atendem todas as escolas.
- Toda chave de cache do portal inclui o slug.
- Trocar o slug de uma escola quebra links salvos; a troca exige redirecionamento do slug antigo.
- Os testes HTTP passam a usar o caminho, sem cabeçalho `Host`.

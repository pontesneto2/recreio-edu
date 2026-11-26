# 0004. Portal organizado por feature

- Status: aceita
- Data: 2026-11-26

## Contexto

O protótipo tem 173 telas para 6 públicos (família, aluno, escola, professor, celular, app). Muitas telas mostram o mesmo domínio para públicos diferentes, como o boletim na visão da família e na do professor.

## Decisão

O código do portal fica em `features/<dominio>` (consultas e componentes do domínio), `pages/<pagina>` (uma por rota, compõe features) e `shared/` (o que não é de domínio). Uma feature não importa outra. Dados do servidor ficam no TanStack Query.

## Consequências

- A mesma feature atende páginas de públicos diferentes.
- Remover uma feature é apagar uma pasta e as rotas que a usam.
- Código usado por 2 features desce para `shared/`.

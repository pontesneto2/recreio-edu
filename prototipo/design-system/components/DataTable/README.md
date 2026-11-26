# DataTable

Tabela das telas de trabalho: ordenação, seleção em lote, densidade, cabeçalho fixo, carregamento com esqueleto e estado vazio.

**O consumidor fornece:** `columns` (`key`, `label`, `sortable`, `numeric`, `align`, `width`, `render`), `rows`, `rowKey`, `selectable` com `selected`/`onSelect`, `sort`/`onSort`, `density` (compact, normal, comfortable), `loading`, `empty`, `onRowClick`, `caption`.

- Linhas de 44 px (36 px no modo compacto), zebradas: ímpares em `surface-1`, pares em `row-alt`. Hover em `row-hover` com filete na cor da escola.
- Linhas entram em sequência rápida. Valores numéricos alinhados à direita com algarismos tabulares.
- No celular, troque por List com os dois campos mais importantes.

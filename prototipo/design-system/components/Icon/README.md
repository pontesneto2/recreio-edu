# Icon

Conjunto único de ícones do Sistema Recreio: traço de 1,75 px, cantos redondos, grade de 24 px, cor herdada do texto.

**Quando usar:** sempre ao lado de uma palavra nas ações principais e nos status. Ícone sozinho só em IconButton, que exige rótulo.

**O consumidor fornece:** `name` (lista em `Recreio.iconNames`), `size` (padrão 20), `label` quando o ícone carrega significado sem texto ao lado.

- Faça: usar o mesmo tamanho dentro de um mesmo componente (16 em pílulas, 18 em botões, 20 em navegação).
- Não faça: colocar ícone dentro de um quadrado colorido acima de títulos, nem misturar outra biblioteca de ícones.
- Ícone novo: desenhar no mesmo traço e adicionar ao objeto `I` em `core.jsx`.

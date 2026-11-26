# ModuleCard

Liga e desliga um módulo para a escola, por unidade e por segmento, mostrando dependências. Cada módulo tem uma cor de categoria que se repete no ícone do menu, nos indicadores e nos registros daquele módulo.

**O consumidor fornece:** `icon`, `name`, `description`, `color` (azul, verde, amarelo, laranja, vermelho, roxo, ciano, rosa), `enabled`, `onToggle`, `requires`, `segments`, `plan`, `locked`.

- Ligado, o ícone ganha a cor do módulo, gira levemente e o cartão recebe um degradê suave da mesma cor.
- Módulo desligado some dos menus das famílias. A oferta de módulos aparece só para o admin.
- A chave tem estado próprio e avisa por `onToggle`. Na tela de módulos, a grade fica dentro de um `SaveGuard` com o botão Salvar módulos.

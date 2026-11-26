# ClassPicker

Escolha de turma e turno conforme o acesso de quem usa. O sistema só mostra as turmas que a pessoa alcança.

**O consumidor fornece:** `classes` (`id`, `name`, `shift`, `segment`, `families`), `value` (ids escolhidos), `scope` (`minhas` ou `todas`), `label`, `max`, `onChange`.

- `scope="minhas"` com até `max` turmas (6 por padrão): botões de marcar, um por turma e turno. É o caso do professor e do auxiliar, que veem só o que está na ficha em Equipe.
- `scope="todas"` ou mais turmas que `max`: selects de Segmento, Turno e Turma, botão Adicionar e a lista das escolhidas, cada uma com um X. A opção "Todas as turmas do filtro" adiciona o grupo de uma vez. É o caso da coordenação e da direção.
- O total de turmas e de famílias que recebem aparece embaixo e muda na hora.

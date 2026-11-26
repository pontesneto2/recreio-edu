# AgendaList

Agenda da turma organizada por dia: provas, tarefas, eventos, passeios, reuniões e dias sem aula, cada tipo com cor e ícone. Tarefa pode ser marcada como feita.

**O consumidor fornece:** `days` (`day`, `today`, `items` com `kind`: prova, tarefa, evento, reuniao, feriado, passeio; `time`, `subject`, `title`, `meta`, `done`), `onToggle`.

- Filtro por tipo no topo. Itens zebrados com faixa lateral na cor do tipo.
- O check da tarefa dá um pequeno salto ao marcar.

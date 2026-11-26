# RoutineEditor

Grade semanal de um grupo do integral: horário, atividade, modalidade, dias da semana e quem lança. A rotina que o monitor vê no `IntegralBoard` e a que a família acompanha saem desta grade.

**O consumidor fornece:** `blocks` (`id`, `time`, `end`, `title`, `program`, `days` de 0 a 4, `who`), `people` (quem pode lançar), `group` (nome do grupo), `onSave`.

- Uma linha por atividade, com a cor da modalidade na borda. Os dias são cinco botões de ligar e desligar.
- Adicionar atividade cria a linha no fim. A lixeira remove.
- Segue a regra de salvar: Salvar grade nasce desabilitado, habilita na primeira mudança e fica bloqueado enquanto faltar horário, nome ou dia.
- Sair com alteração pendente abre o aviso de saída.
- Abaixo de 820px de largura cada atividade vira um cartão empilhado.

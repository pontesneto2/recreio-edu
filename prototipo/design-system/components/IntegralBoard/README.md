# IntegralBoard

Rotina do tempo integral, do semi-integral e do reforço, do lado da escola. É aqui que o monitor lança almoço, descanso, estudo dirigido, reforço, oficina e saída. O que é salvo aparece na hora para a família, no `ProgramTracker`.

**O consumidor fornece:** `students` (`id`, `name`, `klass`, `group`, `programs`, `exit`, `pickups`, `workshop`, `reforco`, `week`, `log`, `note`), `scope` (`meus` ou `todos`), `groups`, `by` (quem lança), `date`, `familyHref`, `recordHref`, `onSave`.

- A tela abre só com a lista. Nenhum aluno vem aberto: o lançamento aparece embaixo da linha quando a pessoa escolhe um aluno, e fecha no segundo toque.
- Desenho vertical: lista em cima, rotina do aluno em linha do tempo de cima para baixo, com a semana, a saída, o reforço e o recado do dia ao lado.
- `scope="meus"`: a pessoa vê só os grupos da ficha dela, com o aviso de quem define isso. `scope="todos"`: selects de Grupo e Turma, para coordenação e direção.
- Filtros por modalidade, por situação (com lançamento a fazer, completos) e busca por nome.
- Cada atividade tem opções de um toque, observação para a família e, quando faz sentido, disciplina ou quem buscou. A etiqueta mostra "A lançar", "Sem salvar" ou "Lançado por, às".
- "Lançar para o grupo" marca a mesma atividade para vários alunos de uma vez. Depois a pessoa ajusta as exceções.
- Segue a regra de salvar: a barra conta os lançamentos pendentes, fica presa ao rodapé enquanto houver algum e avisa ao sair sem salvar.
- Aluno só de reforço mostra só o reforço. Semi-integral não mostra oficina.
- `alert` no aluno (alergia grave, por exemplo) vira um sinal vermelho na linha e um aviso no topo do lançamento. Vem da ficha de saúde e aparece só para quem pode ver dado de saúde.

A grade de onde saem as atividades fica no `RoutineEditor`.

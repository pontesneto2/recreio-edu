# AttendanceRoster

Chamada da aula: todos presentes por padrão, um toque na linha alterna entre presente, falta e atraso. Contadores no topo.

**O consumidor fornece:** `students` (`id`, `name`, `photo`, `note` com adaptação do AEE), `value`, `onChange`, `onSave`, `savedAt`, `date`, `lesson`, `offline`.

- Funciona sem internet e sincroniza depois.
- Toda a linha é alvo de toque, e os botões P, F e A ficam disponíveis para teclado e leitor de tela.
- Rodapé fixo com o estado da chamada (não salva, alterações não salvas, salva às 8h24), o botão Todos presentes e o botão Salvar chamada. Salvar fica desabilitado até haver mudança. No celular, o rodapé fica acima da barra de abas.

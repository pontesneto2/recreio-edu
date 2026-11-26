# ProgramTracker

Acompanhamento do dia por modalidade: turno regular, tempo integral, semi-integral e reforço. Mostra a semana com uma barrinha por modalidade (preenchida: presente; contorno vermelho: faltou), o dia em linha do tempo com o que já foi feito, o que acontece agora e o que vem depois, e um resumo da semana.

**O consumidor fornece:** `student`, `programs` (regular, integral, semi, reforco), `week` (`day`, `today` e, por modalidade, `true`, `false` ou `null`), `blocks` (`time`, `program`, `status`: feito, agora, proximo; `title`, `note`, `by`, `icon`), `summary`.

- Cada modalidade tem cor própria: regular azul, integral verde, semi-integral amarelo, reforço roxo.
- O filtro mostra só uma modalidade, para a monitora do integral ou o professor do reforço.

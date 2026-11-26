# GateLog

Movimento da portaria no dia: quantos estão na escola, saídas, atrasos e visitantes, e a lista ao vivo com o registro mais recente piscando em amarelo.

**O consumidor fornece:** `counts` (`presentes`, `saidas`, `atrasos`, `visitantes`), `entries` (`time`, `kind`: entrada, saida, atraso, visitante, antecipada; `name`, `group`, `by`), `live`.

- Cada tipo tem cor e ícone próprios; o filtro mostra só um tipo.
- Lista zebrada, com hover, rolagem própria a partir de 360 px.

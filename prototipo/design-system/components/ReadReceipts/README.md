# ReadReceipts

Relatório de leitura de um comunicado: anel com o percentual de leitura, enviados, leram, confirmaram e sem leitura, e a lista de quem falta com lembrete em lote.

**O consumidor fornece:** `title`, `total`, `read`, `confirmed`, `pending` (`name`, `child`, `group`), `onRemind`.

- O lembrete vai só para quem não leu, uma vez por dia no máximo.
- Lista zebrada para leitura rápida de nomes.

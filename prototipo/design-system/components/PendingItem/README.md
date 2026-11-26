# PendingItem

Uma pendência da família com prazo e o botão para resolver ali mesmo. Base da tela Pendências e do topo da tela Hoje.

**O consumidor fornece:** `kind` (pagamento, assinatura, autorizacao, enquete, leitura, documento, reuniao), `title`, `child`, `due` em linguagem natural ("Vence amanhã"), `dueTone`, `amount`, `actionLabel`, `onAction`, `done`, `index`.

- Ordenar por prazo; o que vence primeiro fica em cima.
- Pendência resolvida fica riscada por um instante e sai da lista.

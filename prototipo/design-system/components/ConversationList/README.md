# ConversationList

Caixa de entrada do chat: busca, filtros (todas, não lidas, professores, secretaria), não lidas em destaque, quem está digitando e prévia da última mensagem. Abre a conversa no MessageThread.

**O consumidor fornece:** `conversations` (`id`, `name`, `kind`, `role`, `child`, `last`, `time`, `unread`, `online`, `typing`), `active`, `onSelect`, `filters`.

- Conversas zebradas, com hover e filete na cor da escola na conversa aberta.
- O nome do filho aparece quando a família tem mais de um.

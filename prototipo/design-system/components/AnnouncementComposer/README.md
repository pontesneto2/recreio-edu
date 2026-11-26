# AnnouncementComposer

Editor de comunicado da escola: título, mensagem, prioridade, público com contagem, confirmação de leitura, notificação no celular e agendamento. O alcance conta até o total ao escolher o público.

**O consumidor fornece:** `audiences` (`id`, `label`, `count` de responsáveis), `defaultAudience`, `onSend` e `onSchedule` (recebem título, texto, público, prioridade e opções).

- As duas primeiras linhas viram o resumo da notificação; o campo avisa isso.
- Urgente mostra o aviso de que toca mesmo no silencioso; usar só para saída antecipada, saúde e segurança.
- O botão só libera com título, mensagem e público preenchidos.

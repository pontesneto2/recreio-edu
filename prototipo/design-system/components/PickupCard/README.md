# PickupCard

Retirada na portaria: aluno, quem veio buscar com foto e documento, situação da autorização, QR de retirada e confirmação de saída. Ao confirmar, a família recebe o aviso no celular com o horário.

**O consumidor fornece:** `student` (`name`, `group`, `photo`), `person` (`name`, `relation`, `doc`, `photo`, `note`), `status` (autorizado, temporario, bloqueado), `validity`, `qr`, `onConfirm`, `onDeny`.

- Não autorizado troca as ações para ligar para o responsável e chamar a coordenação; nunca libera.
- Autorização de um dia é enviada pela família no app e expira à meia-noite.

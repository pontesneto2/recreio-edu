# AppointmentPicker

Agenda online: a família escolhe com quem quer falar, o dia, um horário livre e o formato (presencial ou por vídeo). Confirma com check animado e oferece adicionar ao calendário.

**O consumidor fornece:** `people` (`id`, `name`, `role`, `icon`), `days` (`id`, `week`, `num`, `label`, `slots` com `time` e `free`), `onBook`.

- Horário ocupado aparece riscado e não aceita toque.
- Cada dia mostra quantos horários livres tem antes de abrir.

# SaveGuard

A regra de salvar do sistema. Toda região em que a pessoa troca um dado fica dentro de um SaveGuard, ou usa um componente que já traz a mesma barra.

**O consumidor fornece:** `children` (os campos), `label` (texto do botão, "Salvar alterações" por padrão), `savedTitle` e `savedMessage` (texto do toast ao salvar), `hint` (texto da barra antes da primeira mudança), `sticky` (barra presa ao rodapé em formulários longos), `onSave`, `onDiscard`.

- O botão Salvar nasce desabilitado. Habilita na primeira mudança de qualquer campo, chave, opção ou seleção da região.
- A barra conta as alterações pendentes e muda de cor enquanto houver alguma. Depois de salvar mostra a hora.
- Descartar volta os campos para o último estado salvo.
- Ao salvar, um toast de sucesso confirma e a barra mostra a hora.
- Sair da tela com alteração pendente abre o aviso com três saídas: Continuar editando, Sair sem salvar, Salvar e sair. Fechar a aba aciona o aviso do navegador.
- Busca e filtros não contam como alteração. Marque a região com `data-nosave` quando houver filtro dentro do SaveGuard.
- Botão próprio que muda dado sem ser campo: marque com `data-save-change`.

## Quem já segue a regra sem SaveGuard

GradeEntry, GradeList, AttendanceRoster, BrandEditor e PermissionMatrix têm barra própria com o mesmo comportamento e o mesmo aviso de saída, pelo hook `useUnsaved(dirty, { onSave })`.

## Quando não usar

Ações que já terminam em confirmação própria: publicar comunicado, enviar mensagem, registrar empréstimo, dar baixa. Nelas o botão de envio fica desabilitado até o formulário estar completo.

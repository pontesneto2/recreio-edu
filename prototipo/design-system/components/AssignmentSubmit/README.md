# AssignmentSubmit

Envio de trabalho pelo portal do aluno, em três passos na mesma tela: escolher o professor, abrir a atividade que ele publicou e enviar o arquivo com título e descrição. Turma e turno vêm do cadastro do aluno e aparecem travados.

**O consumidor fornece:** `student` (`name`, `klass`, `shift`), `teachers` (`id`, `name`, `subject`), `assignments` (`id`, `teacher`, `title`, `dueLabel`, `points`, `status`, `desc`, `attach`, `closed`, `sent`, `grade`, `feedback`), `defaultTeacher` e `defaultAssignment` para abrir direto em uma atividade, `onSubmit`.

- Passo 1: o Select lista professor e matéria. Turma e turno são leitura, com cadeado.
- Passo 2: só as atividades daquele professor para a turma do aluno. Filtros Para entregar e Já enviadas. Cada linha mostra prazo, valor e situação: Para entregar, Refazer, Entregue ou a nota.
- Passo 3: enunciado e arquivo do professor, depois Título (obrigatório), Descrição, arquivo de até 20 MB ou link, recado e a declaração de autoria.
- Segue a regra de salvar: Enviar trabalho nasce desabilitado e a barra diz o que falta. Sair com o formulário preenchido abre o aviso de saída.
- Enviar pede confirmação, mostra o estado de envio e devolve um recibo com data, arquivos e protocolo. O aviso de sucesso sai pelo `useToast`.
- Enquanto o prazo estiver aberto (`closed` falso), o recibo oferece Enviar de novo. A entrega nova substitui a anterior.
- Atividade corrigida mostra nota e devolutiva. Atividade com `status: 'refazer'` mostra o pedido do professor acima do formulário.
- Professor sem atividade mostra o estado vazio. Arquivo acima de 20 MB fica marcado com erro e bloqueia o envio.
- Abaixo de 620px de largura os campos do passo 1 empilham e a barra de envio ocupa a largura toda.

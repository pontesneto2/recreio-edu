# GradeEntry

Lançamento de notas como planilha: setas e Enter movem entre células, colar do Excel preenche em bloco. O campo só aceita valores válidos, sem aviso de erro.

**O consumidor fornece:** `students`, `assessments` (`id`, `label`, `weight`), `values` (chave `aluno:avaliação`; faltas em `aluno:faltas`), `max` (padrão 10), `absences` (coluna de faltas do período, fora da média), `onChange`, `onSave`, `saving`.

- Aceita vírgula ou ponto, até 2 casas. Nota fica entre 0 e `max`: tecla que passaria do limite é ignorada, sinal de menos e letras também; valor colado acima do limite vira `max`. Faltas só aceitam inteiros.
- Média ponderada calculada na hora.
- Linhas compactas de 40 px, zebradas e com hover; a coluna de alunos fica fixa ao rolar de lado.
- Média em pílula verde (6 ou mais) ou vermelha (abaixo de 6).
- Rodapé com a contagem de alterações, Descartar e Salvar notas. O botão nasce desabilitado e habilita na primeira nota trocada. Sair da tela com nota pendente abre o aviso de saída.

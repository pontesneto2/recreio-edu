# GradeList

Lançamento de notas no celular: uma avaliação por vez, uma linha por aluno. O professor toca em − e + (passo de 0,5) ou digita. A nota fica sempre entre 0 e `max`.

**O consumidor fornece:** `students` (`id`, `name`, `note`), `values` (aluno → nota), `max`, `step`, `assessment`, `onSave`.

- Barra com quantas notas foram lançadas e a média da turma, calculada na hora.
- Nota abaixo de 6 aparece em vermelho. Linha sem nota fica em cinza.
- Rodapé com o número de alterações e o botão Salvar notas, que só habilita quando algo mudou.
- Para a tabela completa no computador, use `GradeEntry`.

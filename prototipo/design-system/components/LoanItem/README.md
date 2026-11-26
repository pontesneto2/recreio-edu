# LoanItem

Empréstimo da biblioteca: livro, aluno, turma, prazo, situação, multa por atraso e ações de renovar e devolver.

**O consumidor fornece:** `book`, `author`, `student`, `group`, `due`, `status` (emdia, vence, atrasado, devolvido), `fine`, `renewals`, `maxRenewals`, `onRenew`, `onReturn`, `index`.

- Atrasado não renova até a devolução. A multa aparece ao lado do prazo.
- Linhas zebradas; no celular as ações descem para baixo do nome.

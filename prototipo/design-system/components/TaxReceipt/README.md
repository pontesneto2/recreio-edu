# TaxReceipt

Informe de pagamentos com educação para o Imposto de Renda: escola, responsável financeiro, total pago no ano por dependente, total geral que conta até o valor, observação do que entra como despesa de educação e código de autenticidade.

**O consumidor fornece:** `year` (ano-calendário), `school` (`name`, `cnpj`, `address`), `payer` (`name`, `cpf` já mascarado), `dependents` (`name`, `cpf` mascarado, `course`, `total`), `code`, `onDownload`, `onEmail`.

- Disponível a partir de fevereiro, no Financeiro e por e-mail ao responsável financeiro.
- CPF sempre mascarado na tela; completo só no PDF baixado pelo próprio titular.
- Dados do demo são fictícios.

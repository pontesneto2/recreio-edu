# InvoiceCard

Mensalidade ou cobrança avulsa: competência, valor, vencimento, situação e o caminho para pagar.

**O consumidor fornece:** `competence`, `description`, `child`, `amount`, `due`, `status` (aberta, avencer, vencida, paga, compensando, negociada), `discount`, `fine`, `onPay(metodo)`, `onReceipt`, `compact`.

- Vencida mostra quanto é multa e juros. Paga mostra o comprovante.
- Pix vem primeiro: é o meio mais barato para a escola e o mais rápido para a família.

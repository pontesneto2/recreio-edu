# PixPayment

Pagamento por Pix: valor, QR, passos em três frases, copia e cola, contagem do prazo e confirmação automática com check animado.

**O consumidor fornece:** `amount`, `code` (copia e cola gerado pelo PSP), `expiresIn` (segundos), `status` (aguardando, pago), `payee`, `reference`, `onDone`.

- A tela atualiza sozinha pelo webhook do PSP; a família não precisa enviar comprovante.
- O QR do protótipo é ilustrativo; em produção vem do PSP.

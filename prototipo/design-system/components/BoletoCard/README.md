# BoletoCard

Boleto bancário: valor, vencimento, código de barras, linha digitável com cópia em um toque, beneficiário, regra de multa e juros, PDF e segunda via.

**O consumidor fornece:** `competence`, `child`, `amount`, `due`, `line` (linha digitável), `status` (aberto, vencido, pago, registrando), `payee`, `fineNote`, `onDownload`, `onSecondCopy`, `onPix`.

- Copiar leva só os números, pronto para colar no app do banco.
- Vencido troca a ação para Gerar segunda via, já com multa e juros calculados.
- O código de barras do protótipo é ilustrativo; em produção vem do banco emissor.

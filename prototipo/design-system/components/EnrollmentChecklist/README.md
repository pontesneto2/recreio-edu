# EnrollmentChecklist

Matrícula e rematrícula online: etapas, progresso em anel, documentos com situação (aprovado, em análise, falta enviar, refazer) e envio na própria linha, contrato com resumo e assinatura eletrônica animada.

**O consumidor fornece:** `student`, `year`, `step`, `documents` (`name`, `status`, `note`), `contract` (`summary`, `signedAt`), `onSign`.

- Documento recusado sempre explica o motivo e o que enviar.
- O contrato só assina com os documentos obrigatórios enviados; o anel mostra o quanto falta.

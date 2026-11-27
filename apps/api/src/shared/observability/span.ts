import { type Attributes, context, trace } from '@opentelemetry/api';
import { getRPCMetadata, RPCType } from '@opentelemetry/core';

/** Atributos próprios dos spans. Ficam junto dos atributos `http.*` do span da requisição. */
export const ATRIBUTO = {
  requestId: 'recreio.request_id',
  escolaId: 'recreio.escola_id',
} as const;

/**
 * Grava atributos no span HTTP da requisição atual, o span raiz que aparece na lista de traces.
 * Dentro de um middleware o span ativo é o do middleware. O span raiz vem do metadado
 * que a instrumentação de HTTP guarda no contexto. Sem OpenTelemetry, não faz nada.
 */
export const anotarRequisicao = (atributos: Attributes): void => {
  const ativo = context.active();
  const metadado = getRPCMetadata(ativo);
  const span = metadado?.type === RPCType.HTTP ? metadado.span : trace.getSpan(ativo);
  span?.setAttributes(atributos);
};

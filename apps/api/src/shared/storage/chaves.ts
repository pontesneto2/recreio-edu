import { z } from 'zod';
import { NotFoundError, ValidationError } from '../errors/app-error.ts';

const escolaIdSchema = z.uuid();

/** Segmentos com letras, números, `.`, `_` e `-`, separados por `/`. Sem `..` e sem barra no início. */
const SEGMENTO = /^[A-Za-z0-9._-]+$/;
const TAMANHO_MAXIMO = 512;

const validarCaminho = (caminho: string) => {
  const segmentos = caminho.split('/');
  const valido =
    caminho.length > 0 &&
    caminho.length <= TAMANHO_MAXIMO &&
    segmentos.every((segmento) => SEGMENTO.test(segmento) && segmento !== '.' && segmento !== '..');
  if (!valido) {
    throw new ValidationError('Caminho de arquivo inválido.', {
      caminho: ['Use letras, números, ".", "_" e "-" em segmentos separados por "/", sem "..".'],
    });
  }
};

const prefixoDaEscola = (escolaId: string) => {
  if (!escolaIdSchema.safeParse(escolaId).success) throw new Error(`escolaId inválido: ${escolaId}`);
  return `${escolaId}/`;
};

/**
 * Chave do objeto no bucket: `<escola_id>/<caminho>` (ADR 0010).
 * O prefixo separa os arquivos de cada escola e permite conferir a dona antes de assinar.
 */
export const chaveDoArquivo = (escolaId: string, caminho: string): string => {
  validarCaminho(caminho);
  return `${prefixoDaEscola(escolaId)}${caminho}`;
};

/** Confere que a chave pertence à escola. Chave de outra escola responde 404, sem dizer que existe. */
export const conferirChaveDaEscola = (escolaId: string, chave: string): void => {
  const prefixo = prefixoDaEscola(escolaId);
  if (!chave.startsWith(prefixo)) throw new NotFoundError('Arquivo não encontrado.');
  validarCaminho(chave.slice(prefixo.length));
};

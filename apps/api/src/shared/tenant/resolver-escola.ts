import { slugDaEscolaSchema } from '@recreio/contracts';
import type { RequestHandler, Response } from 'express';
import { NotFoundError } from '../errors/app-error.ts';
import { ATRIBUTO, anotarRequisicao } from '../observability/span.ts';
import type { EscolaContexto } from './escola-contexto.ts';

/** Nome do parâmetro de rota com o slug: `/api/v1/escolas/:escola`. */
export const PARAMETRO_DA_ESCOLA = 'escola';

/** Slug válido da rota, ou `undefined` para texto fora do formato (que nunca casa com uma escola). */
export const slugDaRota = (valor: unknown): string | undefined => {
  const resultado = slugDaEscolaSchema.safeParse(valor);
  return resultado.success ? resultado.data : undefined;
};

export type ResolverEscolaOptions = {
  buscarEscolaPorSlug: (slug: string) => Promise<string | undefined>;
};

/**
 * Resolve a escola pelo slug da rota (ADR 0011) e guarda em `res.locals`. Slug desconhecido
 * ou fora do formato responde 404. Vai no router montado em `/escolas/:escola`, com `mergeParams`.
 */
export const createResolverEscola = ({ buscarEscolaPorSlug }: ResolverEscolaOptions): RequestHandler => {
  return async (req, res, next) => {
    const slug = slugDaRota(req.params[PARAMETRO_DA_ESCOLA]);
    const escolaId = slug ? await buscarEscolaPorSlug(slug) : undefined;
    if (!escolaId) throw new NotFoundError('Escola não encontrada.');
    const contexto: EscolaContexto = { escolaId };
    res.locals.escola = contexto;
    // Os logs seguintes da requisição e o span HTTP levam a escola.
    req.log = req.log.child({ escolaId });
    anotarRequisicao({ [ATRIBUTO.escolaId]: escolaId });
    next();
  };
};

/** Escola já resolvida na resposta, ou `undefined` antes do `resolverEscola`. Usada em log e erro. */
export const escolaIdDaResposta = (res: { locals?: Record<string, unknown> }): string | undefined => {
  const contexto = res.locals?.escola;
  return contexto && typeof contexto === 'object' && 'escolaId' in contexto && typeof contexto.escolaId === 'string'
    ? contexto.escolaId
    : undefined;
};

/** Contexto gravado pelo `resolverEscola`. Falha quando a rota foi montada sem o middleware. */
export const escolaDaRequisicao = (res: Response): EscolaContexto => {
  const contexto: unknown = res.locals.escola;
  if (!contexto || typeof contexto !== 'object' || !('escolaId' in contexto) || typeof contexto.escolaId !== 'string') {
    throw new Error('Rota sem o middleware resolverEscola: a escola da requisição não foi definida.');
  }
  return { escolaId: contexto.escolaId };
};

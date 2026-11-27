import type { RequestHandler, Response } from 'express';
import { NotFoundError } from '../errors/app-error.ts';
import { ATRIBUTO, anotarRequisicao } from '../observability/span.ts';
import type { EscolaContexto } from './escola-contexto.ts';

const HOSTS_LOCAIS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

/**
 * Domínio usado na busca da escola. `hostname` já vem sem porta (Express).
 * Em desenvolvimento, localhost vira `dominioLocal`.
 */
export const dominioDoHost = (hostname: string, dominioLocal?: string): string => {
  const host = hostname.trim().toLowerCase().replace(/\.$/, '');
  return dominioLocal && HOSTS_LOCAIS.has(host) ? dominioLocal : host;
};

export type ResolverEscolaOptions = {
  buscarEscolaPorDominio: (dominio: string) => Promise<string | undefined>;
  /** Domínio atendido em localhost. Fica vazio em produção. */
  dominioLocal?: string;
};

/** Resolve a escola pelo Host (ADR 0006) e guarda em `res.locals`. Host desconhecido responde 404. */
export const createResolverEscola = ({
  buscarEscolaPorDominio,
  dominioLocal,
}: ResolverEscolaOptions): RequestHandler => {
  return async (req, res, next) => {
    const dominio = dominioDoHost(req.hostname ?? '', dominioLocal);
    const escolaId = dominio ? await buscarEscolaPorDominio(dominio) : undefined;
    if (!escolaId) throw new NotFoundError('Escola não encontrada para este endereço.');
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

import type { Acao, Modulo, PerfilDeVinculo, Usuario } from '@recreio/contracts';
import type { Request, RequestHandler, Response } from 'express';
import type { IncomingHttpHeaders } from 'node:http';
import { NaoAutenticadoError, PermissaoNegadaError, SemAcessoError } from '../../shared/errors/app-error.ts';
import { escolaDaRequisicao } from '../../shared/tenant/resolver-escola.ts';
import type { AcessoRepository } from './acesso.repository.ts';

/** Quem fez a requisição e com quais perfis na escola da rota. */
export type Acesso = { usuario: Usuario; perfis: PerfilDeVinculo[] };

/** Lê o cookie de sessão. Devolve `undefined` sem sessão válida. */
export type BuscarUsuarioDaSessao = (headers: IncomingHttpHeaders) => Promise<Usuario | undefined>;

export type AcessoMiddlewares = {
  /** Exige sessão válida (401 `NAO_AUTENTICADO`). Para rotas globais, como `/eu`. */
  exigirLogin: RequestHandler;
  /** Exige sessão e vínculo com a escola da rota (403 `SEM_ACESSO`). Vai depois do `resolverEscola`. */
  exigirSessao: RequestHandler;
  /** Faz o mesmo que `exigirSessao` e exige a ação no módulo para algum perfil (403 `PERMISSAO_NEGADA`). */
  exigirPermissao: (modulo: Modulo, acao: Acao) => RequestHandler;
};

const CHAVE_USUARIO = 'usuario';
const CHAVE_ACESSO = 'acesso';

/**
 * Autorização da v1 (ADR 0007). O vínculo e a permissão dependem da escola da rota, então
 * `exigirSessao` e `exigirPermissao` vão depois do `resolverEscola`. O resultado fica em
 * `res.locals`, e a sessão é lida uma vez por requisição mesmo com mais de um middleware na rota.
 */
export const createAcessoMiddlewares = (
  buscarUsuario: BuscarUsuarioDaSessao,
  repositorio: AcessoRepository,
): AcessoMiddlewares => {
  const carregarUsuario = async (req: Request, res: Response): Promise<Usuario> => {
    const salvo = res.locals[CHAVE_USUARIO] as Usuario | undefined;
    if (salvo) return salvo;
    const usuario = await buscarUsuario(req.headers);
    if (!usuario) throw new NaoAutenticadoError('Sessão ausente ou expirada. Entre de novo para continuar.');
    res.locals[CHAVE_USUARIO] = usuario;
    return usuario;
  };

  const carregarAcesso = async (req: Request, res: Response): Promise<Acesso> => {
    const salvo = res.locals[CHAVE_ACESSO] as Acesso | undefined;
    if (salvo) return salvo;
    const usuario = await carregarUsuario(req, res);
    const perfis = await repositorio.perfisDoUsuario(escolaDaRequisicao(res), usuario.id);
    if (perfis.length === 0) throw new SemAcessoError('A conta não tem vínculo com esta escola.');
    const acesso: Acesso = { usuario, perfis };
    res.locals[CHAVE_ACESSO] = acesso;
    return acesso;
  };

  return {
    exigirLogin: async (req, res, next) => {
      await carregarUsuario(req, res);
      next();
    },
    exigirSessao: async (req, res, next) => {
      await carregarAcesso(req, res);
      next();
    },
    exigirPermissao: (modulo, acao) => async (req, res, next) => {
      const { perfis } = await carregarAcesso(req, res);
      if (!(await repositorio.temPermissao(escolaDaRequisicao(res), perfis, modulo, acao))) {
        throw new PermissaoNegadaError(`Os perfis da conta não têm a ação "${acao}" no módulo "${modulo}".`);
      }
      next();
    },
  };
};

/** Pessoa gravada por `exigirLogin`, `exigirSessao` ou `exigirPermissao`. */
export const usuarioDaRequisicao = (res: Response): Usuario => {
  const usuario = res.locals[CHAVE_USUARIO] as Usuario | undefined;
  if (!usuario) throw new Error('Rota sem exigirLogin: a pessoa da requisição não foi carregada.');
  return usuario;
};

/** Acesso gravado por `exigirSessao` ou `exigirPermissao`. Falha quando a rota foi montada sem eles. */
export const acessoDaRequisicao = (res: Response): Acesso => {
  const acesso = res.locals[CHAVE_ACESSO] as Acesso | undefined;
  if (!acesso) throw new Error('Rota sem exigirSessao: o acesso da requisição não foi carregado.');
  return acesso;
};

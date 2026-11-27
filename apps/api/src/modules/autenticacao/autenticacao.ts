import type { Usuario } from '@recreio/contracts';
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Database } from '../../database/client.ts';
import type { WithEscola } from '../../database/escola-context.ts';
import type { Enfileirador } from '../../shared/queue/enfileirador.ts';
import { type AcessoMiddlewares, createAcessoMiddlewares } from './acesso.middleware.ts';
import { type AcessoRepository, createDrizzleAcessoRepository } from './acesso.repository.ts';
import { type ConfigAutenticacao, createAuth } from './auth.ts';

export type Autenticacao = {
  /** Rotas do Better Auth em `/api/auth/*`. Lê o corpo cru, então vai antes do `express.json`. */
  handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
  /** Middlewares de sessão e permissão das rotas da v1. */
  acesso: AcessoMiddlewares;
  /** Vínculos e permissões, para `/eu`. */
  repositorio: AcessoRepository;
};

export const createAutenticacao = (
  db: Database,
  withEscola: WithEscola,
  filas: Enfileirador,
  config: ConfigAutenticacao,
): Autenticacao => {
  const auth = createAuth(db, filas, config);
  const repositorio = createDrizzleAcessoRepository(db, withEscola);

  const buscarUsuario = async (headers: IncomingMessage['headers']): Promise<Usuario | undefined> => {
    const sessao = await auth.api.getSession({ headers: fromNodeHeaders(headers) });
    if (!sessao) return undefined;
    const { id, name, email, emailVerified } = sessao.user;
    return { id, nome: name, email, emailVerificado: emailVerified };
  };

  return {
    handler: toNodeHandler(auth),
    acesso: createAcessoMiddlewares(buscarUsuario, repositorio),
    repositorio,
  };
};

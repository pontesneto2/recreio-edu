import { type Eu, euSchema } from '@recreio/contracts';
import { type QueryClient, queryOptions } from '@tanstack/react-query';
import { ApiError, getJson, postJson } from '../api/http-client.ts';
import { apagarSessaoSalva, lerSessaoSalva, salvarSessao } from './sessao-salva.ts';

/** Situação da sessão neste navegador. A sessão vale para todas as escolas da conta (ADR 0011). */
export type Sessao = { situacao: 'anonima' } | { situacao: 'ativa'; eu: Eu };

export const sessaoKeys = {
  eu: ['sessao', 'eu'] as const,
};

const ANONIMA: Sessao = { situacao: 'anonima' };

/**
 * Lê `/api/v1/eu`. O 401 vira situação da sessão, não erro da consulta. Sem conexão, vale a
 * última sessão salva neste navegador, para a casca do PWA abrir offline.
 */
export const euQuery = queryOptions({
  queryKey: sessaoKeys.eu,
  queryFn: async (): Promise<Sessao> => {
    try {
      const eu = await getJson('/api/v1/eu', euSchema);
      salvarSessao(eu);
      return { situacao: 'ativa', eu };
    } catch (erro) {
      if (erro instanceof ApiError && erro.status === 401) {
        apagarSessaoSalva();
        return ANONIMA;
      }
      // Falha de rede (TypeError do fetch): usa a sessão salva, se houver.
      const salva = erro instanceof ApiError ? undefined : lerSessaoSalva();
      if (salva) return { situacao: 'ativa', eu: salva };
      throw erro;
    }
  },
});

/**
 * Marca a sessão como encerrada. As cascas dos perfis veem a mudança e levam para Entrar
 * com o caminho de volta. Apaga o cache inteiro, para a próxima conta não ver dado da anterior.
 */
export const encerrarSessaoNoCache = (queryClient: QueryClient) => {
  apagarSessaoSalva();
  queryClient.clear();
  queryClient.setQueryData(sessaoKeys.eu, ANONIMA);
};

/* Rotas do Better Auth em /api/auth (ADR 0007). O cookie httpOnly vem na resposta. */

export const entrar = (email: string, senha: string) => postJson('/api/auth/sign-in/email', { email, password: senha });

export const sair = () => postJson('/api/auth/sign-out', {});

export const pedirTrocaDeSenha = (email: string) => postJson('/api/auth/request-password-reset', { email });

export const redefinirSenha = (token: string, senhaNova: string) =>
  postJson('/api/auth/reset-password', { token, newPassword: senhaNova });

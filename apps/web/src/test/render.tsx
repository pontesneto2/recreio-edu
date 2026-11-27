import type { Eu, PerfilDeVinculo } from '@recreio/contracts';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Providers } from '@/app/providers.tsx';
import { routes } from '@/app/router.tsx';
import { createQueryClient } from '@/shared/api/query-client.ts';

/** Renderiza o portal inteiro numa rota, com cache novo a cada teste. Devolve também o router. */
export const renderRoute = (path: string) => {
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({ queries: { retry: false } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return {
    router,
    ...render(
      <Providers queryClient={queryClient} router={router}>
        <RouterProvider router={router} />
      </Providers>,
    ),
  };
};

/** Resposta de erro no formato da API (RFC 9457). */
export const problemResponse = (status: number, problem: Record<string, unknown>) =>
  new Response(JSON.stringify({ status, ...problem }), {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  });

/** Resposta de erro das rotas do Better Auth (`/api/auth/*`). */
export const authErrorResponse = (status: number, code: string) => Response.json({ code, message: code }, { status });

/**
 * Valor de uma rota simulada: o corpo JSON de um 200, ou uma função que monta a `Response`
 * (cada chamada precisa de uma resposta nova, porque o corpo só é lido uma vez).
 */
type MontarResposta = (init?: RequestInit) => Response | Promise<Response>;
type RespostaSimulada = unknown;

const naoEncontrada = (url: string) =>
  problemResponse(404, {
    type: 'https://recreio.app/problemas/nao-encontrado',
    title: 'Recurso não encontrado',
    detail: `Rota GET ${url} não encontrada.`,
    instance: url,
    code: 'NAO_ENCONTRADO',
  });

/**
 * Troca o `fetch` global por respostas fixas. A chave é a URL (`/api/v1/eu`) ou o método
 * e a URL (`POST /api/auth/sign-in/email`). URL fora da lista recebe 404. Devolve o mock.
 */
export const mockApi = (responses: Record<string, RespostaSimulada>) => {
  const fetchSimulado = vi.fn(async (url: string, init?: RequestInit) => {
    const metodo = init?.method ?? 'GET';
    const chave = `${metodo} ${url}` in responses ? `${metodo} ${url}` : url;
    if (!(chave in responses)) return naoEncontrada(url);
    const resposta = responses[chave];
    return typeof resposta === 'function' ? (resposta as MontarResposta)(init) : Response.json(resposta);
  });
  vi.stubGlobal('fetch', fetchSimulado);
  return fetchSimulado;
};

/** Slug da escola dos testes (ADR 0011). As rotas do portal começam por ele. */
export const SLUG = 'colegio-recreio';

/** Caminho do portal na escola dos testes: `naEscola('/familia')` vira `/colegio-recreio/familia`. */
export const naEscola = (caminho = '') => `/${SLUG}${caminho}`;

/** URL da API da escola dos testes: `apiDaEscola('/alunos')` vira `/api/v1/escolas/colegio-recreio/alunos`. */
export const apiDaEscola = (caminho = '') => `/api/v1/escolas/${SLUG}${caminho}`;

export const ESCOLA_PUBLICA = { slug: SLUG, nome: 'Colégio Recreio', cidade: 'Fortaleza', corMarca: '#0067CC' };

/** Corpo de `/api/v1/eu` para uma pessoa com os perfis dados na escola dos testes. */
export const euCom = (perfis: PerfilDeVinculo[], nome = 'Fernanda Lima'): Eu => ({
  usuario: { id: 'usuario-1', nome, email: 'fernanda.lima@colegiorecreio.test', emailVerificado: true },
  escolas: perfis.length ? [{ slug: SLUG, nome: ESCOLA_PUBLICA.nome, perfis }] : [],
});

/** `/api/v1/eu` com sessão ativa e os perfis dados, mais a escola pública. Espalhe no `mockApi`. */
export const comSessao = (perfis: PerfilDeVinculo[], nome?: string) => ({
  '/api/v1/eu': euCom(perfis, nome),
  [apiDaEscola('/publica')]: ESCOLA_PUBLICA,
});

/** `/api/v1/eu` sem sessão (401), mais a escola pública. */
export const semSessao = () => ({
  '/api/v1/eu': () =>
    problemResponse(401, {
      type: 'https://recreio.app/problemas/nao-autenticado',
      title: 'Sessão ausente ou expirada',
      instance: '/api/v1/eu',
      code: 'NAO_AUTENTICADO',
    }),
  [apiDaEscola('/publica')]: ESCOLA_PUBLICA,
});

/** Um vínculo de cada casca: responsável, aluno, professor e direção. */
export const TODOS_OS_PERFIS: PerfilDeVinculo[] = ['responsavel', 'aluno', 'professor', 'direcao'];

import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Providers } from '@/app/providers.tsx';
import { routes } from '@/app/router.tsx';
import { createQueryClient } from '@/shared/api/query-client.ts';

/** Renderiza o portal inteiro numa rota, com cache novo a cada teste. */
export const renderRoute = (path: string) => {
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({ queries: { retry: false } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(
    <Providers queryClient={queryClient}>
      <RouterProvider router={router} />
    </Providers>,
  );
};

/** Resposta de erro no formato da API (RFC 9457). */
export const problemResponse = (status: number, problem: Record<string, unknown>) =>
  new Response(JSON.stringify({ status, ...problem }), {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  });

/** Troca o `fetch` global por respostas fixas, indexadas pela URL. URL fora da lista recebe 404. */
export const mockApi = (responses: Record<string, unknown>) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      url in responses
        ? Response.json(responses[url])
        : problemResponse(404, {
            type: 'https://recreio.app/problemas/nao-encontrado',
            title: 'Recurso não encontrado',
            detail: `Rota GET ${url} não encontrada.`,
            instance: url,
            code: 'NAO_ENCONTRADO',
          }),
    ),
  );

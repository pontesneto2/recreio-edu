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

/** Troca o `fetch` global por respostas fixas, indexadas pela URL. */
export const mockApi = (responses: Record<string, unknown>) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      url in responses
        ? Response.json(responses[url])
        : Response.json({ erro: { codigo: 'NAO_ENCONTRADO' } }, { status: 404 }),
    ),
  );

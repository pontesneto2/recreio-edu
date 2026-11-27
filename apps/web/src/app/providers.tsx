import { RecreioProvider } from '@recreio/design-system';
import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { type ReactNode, useSyncExternalStore } from 'react';
import type { createBrowserRouter } from 'react-router';
import { useEscolaTema } from '@/features/escola/index.ts';
import { carregarPreferencias } from '@/shared/preferencias/preferencias-salvas.ts';
import { PARAMETRO_DA_ESCOLA } from '@/shared/sessao/escola-da-rota.ts';

/** O que os provedores leem do router: o estado atual e a assinatura das mudanças. */
export type RouterDoPortal = Pick<ReturnType<typeof createBrowserRouter>, 'state' | 'subscribe'>;

type ProvidersProps = { queryClient: QueryClient; router: RouterDoPortal; children: ReactNode };

/**
 * Slug da escola da rota atual. Os provedores ficam fora do `RouterProvider` (o toast de versão
 * nova também usa o tema), então leem as rotas casadas direto do router.
 */
const useEscolaDoRouter = (router: RouterDoPortal) => {
  const estado = useSyncExternalStore(router.subscribe, () => router.state);
  return estado.matches.map((casada) => casada.params[PARAMETRO_DA_ESCOLA]).find(Boolean);
};

/** Tema com a cor da escola da rota e as preferências de acessibilidade salvas neste navegador. */
const TemaDaEscola = ({ router, children }: { router: RouterDoPortal; children: ReactNode }) => {
  const seed = useEscolaTema(useEscolaDoRouter(router));
  return (
    <RecreioProvider seed={seed} initialPrefs={{ theme: 'claro', ...carregarPreferencias() }}>
      {children}
    </RecreioProvider>
  );
};

/** Provedores globais: cache de dados e tema da escola. */
export const Providers = ({ queryClient, router, children }: ProvidersProps) => (
  <QueryClientProvider client={queryClient}>
    <TemaDaEscola router={router}>{children}</TemaDaEscola>
    {import.meta.env.DEV && <ReactQueryDevtools buttonPosition="bottom-right" />}
  </QueryClientProvider>
);

import { RecreioProvider } from '@recreio/design-system';
import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';
import { useEscolaTema } from '@/features/escola/index.ts';
import { carregarPreferencias } from '@/shared/preferencias/preferencias-salvas.ts';

type ProvidersProps = { queryClient: QueryClient; children: ReactNode };

/** Tema com a cor da escola e as preferências de acessibilidade salvas neste navegador. */
const TemaDaEscola = ({ children }: { children: ReactNode }) => {
  const seed = useEscolaTema();
  return (
    <RecreioProvider seed={seed} initialPrefs={{ theme: 'claro', ...carregarPreferencias() }}>
      {children}
    </RecreioProvider>
  );
};

/** Provedores globais: cache de dados e tema da escola. */
export const Providers = ({ queryClient, children }: ProvidersProps) => (
  <QueryClientProvider client={queryClient}>
    <TemaDaEscola>{children}</TemaDaEscola>
    {import.meta.env.DEV && <ReactQueryDevtools buttonPosition="bottom-right" />}
  </QueryClientProvider>
);

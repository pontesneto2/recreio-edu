import { RecreioProvider } from '@recreio/design-system';
import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';

type ProvidersProps = { queryClient: QueryClient; children: ReactNode };

/** Provedores globais: cache de dados e tema da escola. */
export const Providers = ({ queryClient, children }: ProvidersProps) => (
  <QueryClientProvider client={queryClient}>
    <RecreioProvider seed="#0067CC" theme="claro">
      {children}
    </RecreioProvider>
    {import.meta.env.DEV && <ReactQueryDevtools buttonPosition="bottom-right" />}
  </QueryClientProvider>
);

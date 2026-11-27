import '@recreio/design-system/tokens.css';
import '@recreio/design-system/recreio.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { Providers } from './app/providers.tsx';
import { router } from './app/router.tsx';
import { createQueryClient } from './shared/api/query-client.ts';
import { AvisoDeAtualizacao } from './shared/pwa/AvisoDeAtualizacao.tsx';

const container = document.getElementById('root');
if (!container) throw new Error('Elemento #root não encontrado em index.html.');

createRoot(container).render(
  <StrictMode>
    <Providers queryClient={createQueryClient()}>
      <RouterProvider router={router} />
      <AvisoDeAtualizacao />
    </Providers>
  </StrictMode>,
);

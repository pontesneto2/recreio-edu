import { LoadingCard } from '@recreio/design-system';
import { Suspense } from 'react';
import { Outlet } from 'react-router';

/** Conteúdo da rota atual. A página chega sob demanda (veja `app/router.tsx`); até lá, a casca mostra o carregando. */
export const ConteudoDaRota = () => (
  <Suspense fallback={<LoadingCard label="Carregando a tela" />}>
    <Outlet />
  </Suspense>
);

import { createBrowserRouter } from 'react-router';
import { AlunosPage } from '@/pages/alunos/AlunosPage.tsx';
import { InicioPage } from '@/pages/inicio/InicioPage.tsx';
import { NaoEncontradaPage } from '@/pages/nao-encontrada/NaoEncontradaPage.tsx';
import { PortalLayout } from '@/shared/layout/PortalLayout.tsx';

export const routes = [
  {
    element: <PortalLayout />,
    children: [
      { index: true, element: <InicioPage /> },
      { path: 'alunos', element: <AlunosPage /> },
      { path: '*', element: <NaoEncontradaPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);

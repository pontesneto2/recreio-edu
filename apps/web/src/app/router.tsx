import type { ReactNode } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router';
import { AlunosPage } from '@/pages/alunos/AlunosPage.tsx';
import { EmConstrucaoPage } from '@/pages/em-construcao/EmConstrucaoPage.tsx';
import { EscolhaPerfilPage } from '@/pages/escolha-perfil/EscolhaPerfilPage.tsx';
import { InicioPage } from '@/pages/inicio/InicioPage.tsx';
import { MaisPage } from '@/pages/mais/MaisPage.tsx';
import { NaoEncontradaPage } from '@/pages/nao-encontrada/NaoEncontradaPage.tsx';
import { PreferenciasPage } from '@/pages/preferencias/PreferenciasPage.tsx';
import { SemInternetPage } from '@/pages/sem-internet/SemInternetPage.tsx';
import { NAVEGACOES, PERFIS, type Perfil } from '@/shared/config/navigation/index.ts';
import { AvulsaLayout } from '@/shared/layout/AvulsaLayout.tsx';
import { itensDoMenu, rotaDoMais } from '@/shared/layout/navegacao.ts';
import { PerfilLayout } from '@/shared/layout/PerfilLayout.tsx';
import { ROTA_SEM_INTERNET } from '@/shared/pwa/AvisoSemInternet.tsx';

/**
 * Telas prontas de cada perfil, pelo href do item do menu. Item sem tela aqui
 * abre "Em construção". Tela nova: crie a página e registre o href nesta tabela.
 */
const TELAS_PRONTAS: Record<Perfil, Record<string, ReactNode>> = {
  familia: {},
  aluno: {},
  professor: {},
  escola: {
    '/escola': <InicioPage />,
    '/escola/alunos': <AlunosPage />,
  },
};

const rotasDoPerfil = (perfil: Perfil): RouteObject => {
  const navegacao = NAVEGACOES[perfil];
  const telas = TELAS_PRONTAS[perfil];
  // Itens que apontam para fora do perfil, como Acessibilidade, têm rota própria.
  const itens = itensDoMenu(navegacao).filter((item) => item.href.startsWith(navegacao.base));

  return {
    path: navegacao.base,
    element: <PerfilLayout navegacao={navegacao} />,
    children: [
      ...itens.map((item) => ({
        ...(item.href === navegacao.base ? { index: true } : { path: item.href }),
        element: telas[item.href] ?? <EmConstrucaoPage item={item} navegacao={navegacao} />,
      })),
      { path: rotaDoMais(navegacao), element: <MaisPage navegacao={navegacao} /> },
      { path: '*', element: <NaoEncontradaPage /> },
    ],
  };
};

export const routes: RouteObject[] = [
  ...PERFIS.map(rotasDoPerfil),
  {
    element: <AvulsaLayout />,
    children: [
      { index: true, element: <EscolhaPerfilPage /> },
      { path: 'preferencias', element: <PreferenciasPage /> },
      { path: ROTA_SEM_INTERNET, element: <SemInternetPage /> },
      { path: '*', element: <NaoEncontradaPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);

import { type ComponentType, lazy, type ReactNode } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router';
// Fica no arquivo principal: sem conexão e sem service worker, um arquivo sob demanda não baixa.
import { SemInternetPage } from '@/pages/sem-internet/SemInternetPage.tsx';
import { NAVEGACOES, PERFIS, type Perfil } from '@/shared/config/navigation/index.ts';
import { AvulsaLayout } from '@/shared/layout/AvulsaLayout.tsx';
import { itensDoMenu, rotaDoMais } from '@/shared/layout/navegacao.ts';
import { PerfilLayout } from '@/shared/layout/PerfilLayout.tsx';
import { ROTA_SEM_INTERNET } from '@/shared/pwa/AvisoSemInternet.tsx';

/**
 * Cada página vira um arquivo JS próprio no build e só baixa quando a rota abre.
 * O `Suspense` das cascas mostra o carregando. O service worker guarda todos os arquivos, então funciona sem conexão.
 */
const sobDemanda = <P extends object>(carregar: () => Promise<ComponentType<P>>) =>
  lazy(async () => ({ default: await carregar() }));

const AlunosPage = sobDemanda(() => import('@/pages/alunos/AlunosPage.tsx').then((m) => m.AlunosPage));
const EmConstrucaoPage = sobDemanda(() =>
  import('@/pages/em-construcao/EmConstrucaoPage.tsx').then((m) => m.EmConstrucaoPage),
);
const EscolhaPerfilPage = sobDemanda(() =>
  import('@/pages/escolha-perfil/EscolhaPerfilPage.tsx').then((m) => m.EscolhaPerfilPage),
);
const InicioPage = sobDemanda(() => import('@/pages/inicio/InicioPage.tsx').then((m) => m.InicioPage));
const MaisPage = sobDemanda(() => import('@/pages/mais/MaisPage.tsx').then((m) => m.MaisPage));
const NaoEncontradaPage = sobDemanda(() =>
  import('@/pages/nao-encontrada/NaoEncontradaPage.tsx').then((m) => m.NaoEncontradaPage),
);
const PreferenciasPage = sobDemanda(() =>
  import('@/pages/preferencias/PreferenciasPage.tsx').then((m) => m.PreferenciasPage),
);

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

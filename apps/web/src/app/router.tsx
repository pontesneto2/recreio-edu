import { type ComponentType, lazy, type ReactNode } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router';
// Fica no arquivo principal: sem conexão e sem service worker, um arquivo sob demanda não baixa.
import { SemInternetPage } from '@/pages/sem-internet/SemInternetPage.tsx';
// Casca da entrada, sem Suspense acima dela.
import { EntradaLayout } from '@/pages/entrar/EntradaLayout.tsx';
import { NAVEGACOES, PERFIS, type Perfil } from '@/shared/config/navigation/index.ts';
import { AvulsaLayout } from '@/shared/layout/AvulsaLayout.tsx';
import { itensDoMenu, rotaDoMais } from '@/shared/layout/navegacao.ts';
import { ROTA_SEM_INTERNET } from '@/shared/pwa/AvisoSemInternet.tsx';
import { CascaDoPerfil, InicioDaEscola, InicioGlobal } from './guardas.tsx';

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
const EntrarPage = sobDemanda(() => import('@/pages/entrar/EntrarPage.tsx').then((m) => m.EntrarPage));
const EsqueciSenhaPage = sobDemanda(() =>
  import('@/pages/esqueci-senha/EsqueciSenhaPage.tsx').then((m) => m.EsqueciSenhaPage),
);
const InicioPage = sobDemanda(() => import('@/pages/inicio/InicioPage.tsx').then((m) => m.InicioPage));
const MaisPage = sobDemanda(() => import('@/pages/mais/MaisPage.tsx').then((m) => m.MaisPage));
const NaoEncontradaPage = sobDemanda(() =>
  import('@/pages/nao-encontrada/NaoEncontradaPage.tsx').then((m) => m.NaoEncontradaPage),
);
const PreferenciasPage = sobDemanda(() =>
  import('@/pages/preferencias/PreferenciasPage.tsx').then((m) => m.PreferenciasPage),
);
const RedefinirSenhaPage = sobDemanda(() =>
  import('@/pages/redefinir-senha/RedefinirSenhaPage.tsx').then((m) => m.RedefinirSenhaPage),
);
const SairPage = sobDemanda(() => import('@/pages/sair/SairPage.tsx').then((m) => m.SairPage));

/**
 * Telas prontas de cada perfil, pelo href do item do menu (sem o slug da escola). Item sem tela
 * aqui abre "Em construção". Tela nova: crie a página e registre o href nesta tabela.
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

/** Caminho relativo à casca: `/familia/agenda` vira `agenda`. */
const relativoAoPerfil = (base: string, href: string) => href.slice(base.length + 1);

/** Rotas de um perfil, relativas a `/:escola`: `familia`, `familia/agenda`, `familia/mais`. */
const rotasDoPerfil = (perfil: Perfil): RouteObject => {
  const navegacao = NAVEGACOES[perfil];
  const telas = TELAS_PRONTAS[perfil];
  // Itens que apontam para fora do perfil, como Acessibilidade e Sair, têm rota própria.
  const itens = itensDoMenu(navegacao).filter((item) => item.href.startsWith(`${navegacao.base}/`));
  const entrada = itensDoMenu(navegacao).find((item) => item.href === navegacao.base);

  return {
    path: navegacao.base.slice(1),
    element: <CascaDoPerfil perfil={perfil} />,
    children: [
      ...(entrada
        ? [{ index: true, element: telas[entrada.href] ?? <EmConstrucaoPage item={entrada} navegacao={navegacao} /> }]
        : []),
      ...itens.map((item) => ({
        path: relativoAoPerfil(navegacao.base, item.href),
        element: telas[item.href] ?? <EmConstrucaoPage item={item} navegacao={navegacao} />,
      })),
      { path: relativoAoPerfil(navegacao.base, rotaDoMais(navegacao)), element: <MaisPage navegacao={navegacao} /> },
      { path: '*', element: <NaoEncontradaPage /> },
    ],
  };
};

/** Telas de conta que não dependem da escola: o link do e-mail abre sem o slug. */
const ROTAS_DE_ENTRADA: RouteObject[] = [
  { path: 'esqueci-senha', element: <EsqueciSenhaPage /> },
  { path: 'redefinir-senha', element: <RedefinirSenhaPage /> },
];

/**
 * A escola vem do primeiro segmento do caminho (ADR 0011): `/colegio-recreio/familia`.
 * As rotas fixas (`/entrar`, `/sair`, `/preferencias`, `/sem-internet`, `/esqueci-senha`,
 * `/redefinir-senha`) vencem o `:escola` e por isso não podem ser slug de escola.
 */
export const routes: RouteObject[] = [
  { element: <EntradaLayout />, children: [{ path: 'entrar', element: <EntrarPage /> }, ...ROTAS_DE_ENTRADA] },
  {
    element: <AvulsaLayout />,
    children: [
      { index: true, element: <InicioGlobal /> },
      { path: 'sair', element: <SairPage /> },
      { path: 'preferencias', element: <PreferenciasPage /> },
      { path: ROTA_SEM_INTERNET, element: <SemInternetPage /> },
    ],
  },
  {
    path: ':escola',
    children: [
      { element: <EntradaLayout />, children: [{ path: 'entrar', element: <EntrarPage /> }] },
      {
        element: <AvulsaLayout />,
        children: [
          { index: true, element: <InicioDaEscola /> },
          { path: 'sair', element: <SairPage /> },
          { path: 'preferencias', element: <PreferenciasPage /> },
        ],
      },
      ...PERFIS.map(rotasDoPerfil),
      { element: <AvulsaLayout />, children: [{ path: '*', element: <NaoEncontradaPage /> }] },
    ],
  },
  { element: <AvulsaLayout />, children: [{ path: '*', element: <NaoEncontradaPage /> }] },
];

export const router = createBrowserRouter(routes);

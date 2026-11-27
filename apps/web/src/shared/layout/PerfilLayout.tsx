import { AppShell, SideNav, TabBar } from '@recreio/design-system';
import { useLocation, useNavigate } from 'react-router';
import type { NavegacaoDoPerfil } from '../config/navigation/index.ts';
import { AvisoSemInternet } from '../pwa/AvisoSemInternet.tsx';
import { ConteudoDaRota } from './ConteudoDaRota.tsx';
import { encontrarAtivoDaBarra, encontrarItemAtivo, itensDaBarraInferior, itensDoMenu } from './navegacao.ts';

/** Escola mostrada no menu até a sessão trazer a escola e a unidade da pessoa. */
const ESCOLA_PADRAO = { name: 'Colégio Recreio', unit: 'Unidade Aldeota' };

type PerfilLayoutProps = { navegacao: NavegacaoDoPerfil };

/** Casca de um perfil: menu lateral no desktop e barra inferior abaixo de 860px (o `AppShell` troca pelo CSS). */
export const PerfilLayout = ({ navegacao }: PerfilLayoutProps) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const barraInferior = itensDaBarraInferior(navegacao);

  const irPara = (id: string) => {
    const item = [...itensDoMenu(navegacao), ...barraInferior].find((candidato) => candidato.id === id);
    if (item) navigate(item.href);
  };

  return (
    <AppShell
      sidenav={
        <SideNav
          school={ESCOLA_PADRAO}
          groups={navegacao.grupos}
          active={encontrarItemAtivo(navegacao, pathname)?.id}
          onNavigate={irPara}
        />
      }
      tabbar={<TabBar items={barraInferior} active={encontrarAtivoDaBarra(navegacao, pathname)} onNavigate={irPara} />}
    >
      <AvisoSemInternet />
      <ConteudoDaRota />
    </AppShell>
  );
};

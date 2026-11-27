import type { EscolaDoUsuario, Eu } from '@recreio/contracts';
import { AppShell, MadeBy, ProfileSwitcher, SideNav, TabBar } from '@recreio/design-system';
import { useLocation, useNavigate } from 'react-router';
import { NAVEGACOES, type NavegacaoDoPerfil, type Perfil } from '../config/navigation/index.ts';
import { ROTA_SAIR } from '../config/navigation/comum.ts';
import { AvisoSemInternet } from '../pwa/AvisoSemInternet.tsx';
import { cascasDosPerfis } from '../sessao/perfis.ts';
import { ConteudoDaRota } from './ConteudoDaRota.tsx';
import {
  caminhoNaEscola,
  encontrarAtivoDaBarra,
  encontrarItemAtivo,
  itensDaBarraInferior,
  itensDoMenu,
} from './navegacao.ts';

type PerfilLayoutProps = {
  /** Menu com os links já dentro da escola (`navegacaoNaEscola`). */
  navegacao: NavegacaoDoPerfil;
  /** Pessoa logada (de `/api/v1/eu`). */
  eu: Eu;
  /** Escola da rota, com os perfis da pessoa nela. */
  escola: EscolaDoUsuario;
};

/** Casca de um perfil: menu lateral no desktop e barra inferior abaixo de 860px (o `AppShell` troca pelo CSS). */
export const PerfilLayout = ({ navegacao, eu, escola }: PerfilLayoutProps) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const barraInferior = itensDaBarraInferior(navegacao);
  const perfis = cascasDosPerfis(escola.perfis).map((perfil) => ({
    id: perfil,
    label: NAVEGACOES[perfil].titulo,
    icon: NAVEGACOES[perfil].icone,
  }));

  const irPara = (id: string) => {
    const item = [...itensDoMenu(navegacao), ...barraInferior].find((candidato) => candidato.id === id);
    if (item) navigate(item.href);
  };

  return (
    <AppShell
      sidenav={
        <SideNav
          school={{ name: escola.nome }}
          groups={navegacao.grupos}
          active={encontrarItemAtivo(navegacao, pathname)?.id}
          onNavigate={irPara}
          footer={
            <>
              <ProfileSwitcher
                user={{ name: eu.usuario.nome }}
                profiles={perfis}
                activeProfile={navegacao.perfil}
                onProfile={(perfil) => navigate(caminhoNaEscola(escola.slug, NAVEGACOES[perfil as Perfil].base))}
                onLogout={() => navigate(caminhoNaEscola(escola.slug, ROTA_SAIR))}
              />
              <MadeBy />
            </>
          }
        />
      }
      tabbar={<TabBar items={barraInferior} active={encontrarAtivoDaBarra(navegacao, pathname)} onNavigate={irPara} />}
    >
      <AvisoSemInternet />
      <ConteudoDaRota />
    </AppShell>
  );
};

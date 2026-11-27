import type { EscolaDoUsuario, Eu } from '@recreio/contracts';
import { ErrorState, LoadingCard } from '@recreio/design-system';
import { lazy, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { NAVEGACOES, type Perfil } from '@/shared/config/navigation/index.ts';
import { caminhoNaEscola, navegacaoNaEscola } from '@/shared/layout/navegacao.ts';
import { PerfilLayout } from '@/shared/layout/PerfilLayout.tsx';
import { rotaDeEntrar } from '@/shared/sessao/destino.ts';
import { useEscolaDaRota } from '@/shared/sessao/escola-da-rota.ts';
import { cascasDosPerfis, escolaDaConta } from '@/shared/sessao/perfis.ts';
import type { Sessao } from '@/shared/sessao/sessao.api.ts';
import { useSessao } from '@/shared/sessao/useSessao.ts';

const EscolhaEscolaPage = lazy(async () => ({
  default: (await import('@/pages/escolha-escola/EscolhaEscolaPage.tsx')).EscolhaEscolaPage,
}));
const EscolhaPerfilPage = lazy(async () => ({
  default: (await import('@/pages/escolha-perfil/EscolhaPerfilPage.tsx')).EscolhaPerfilPage,
}));
const SemAcessoPage = lazy(async () => ({
  default: (await import('@/pages/sem-acesso/SemAcessoPage.tsx')).SemAcessoPage,
}));

/** Carregando e erro de rede da consulta `/api/v1/eu`. Com resposta, devolve a sessão. */
const useEstadoDaSessao = (): { tela: ReactNode; sessao?: undefined } | { tela?: undefined; sessao: Sessao } => {
  const consulta = useSessao();
  if (consulta.isPending) return { tela: <LoadingCard label="Abrindo o portal" /> };
  if (consulta.isError) {
    return {
      tela: (
        <ErrorState
          title="Não conseguimos abrir o portal"
          onRetry={() => void consulta.refetch()}
          details={consulta.error.message}
        >
          Confira a internet e tente de novo.
        </ErrorState>
      ),
    };
  }
  return { sessao: consulta.data };
};

/**
 * Entrada do portal (`/`). Sem sessão vai para Entrar. Com uma escola abre a escola, que
 * decide o perfil. Com mais de uma, ou nenhuma, mostra a lista de escolas da conta.
 */
export const InicioGlobal = () => {
  const { tela, sessao } = useEstadoDaSessao();
  if (!sessao) return tela;
  if (sessao.situacao === 'anonima') return <Navigate to={rotaDeEntrar()} replace />;
  const [unica, ...outras] = sessao.eu.escolas;
  if (unica && outras.length === 0) return <Navigate to={caminhoNaEscola(unica.slug, '/')} replace />;
  return <EscolhaEscolaPage eu={sessao.eu} />;
};

/**
 * Entrada da escola (`/:escola`). Sem sessão vai para Entrar da escola. Sem vínculo mostra o aviso.
 * Com um perfil abre a casca dele; com mais de um mostra a escolha.
 */
export const InicioDaEscola = () => {
  const slug = useEscolaDaRota();
  const { tela, sessao } = useEstadoDaSessao();
  if (!sessao) return tela;
  if (sessao.situacao === 'anonima') return <Navigate to={rotaDeEntrar(slug)} replace />;
  const escola = escolaDaConta(sessao.eu, slug);
  if (!escola) return <SemAcessoPage />;

  const perfis = cascasDosPerfis(escola.perfis);
  const [unico] = perfis;
  if (perfis.length === 1 && unico) return <Navigate to={caminhoNaEscola(slug, NAVEGACOES[unico].base)} replace />;
  return <EscolhaPerfilPage eu={sessao.eu} escola={escola} perfis={perfis} />;
};

type ExigirPerfilProps = {
  perfil: Perfil;
  children: (eu: Eu, escola: EscolaDoUsuario) => ReactNode;
};

/**
 * Guarda das cascas de perfil. Sem sessão vai para Entrar da escola e volta para cá depois.
 * Sem vínculo que libere esta casca volta para `/:escola`, que mostra o que a pessoa pode abrir.
 */
export const ExigirPerfil = ({ perfil, children }: ExigirPerfilProps) => {
  const slug = useEscolaDaRota();
  const { pathname, search } = useLocation();
  const { tela, sessao } = useEstadoDaSessao();
  if (!sessao) return tela;
  if (sessao.situacao === 'anonima') return <Navigate to={rotaDeEntrar(slug, `${pathname}${search}`)} replace />;
  const escola = escolaDaConta(sessao.eu, slug);
  if (!escola || !cascasDosPerfis(escola.perfis).includes(perfil)) {
    return <Navigate to={caminhoNaEscola(slug, '/')} replace />;
  }
  return children(sessao.eu, escola);
};

/** Casca do perfil na escola da rota. Exige sessão e um vínculo que libere este perfil (ADR 0007). */
export const CascaDoPerfil = ({ perfil }: { perfil: Perfil }) => {
  const navegacao = navegacaoNaEscola(NAVEGACOES[perfil], useEscolaDaRota());
  return (
    <ExigirPerfil perfil={perfil}>
      {(eu, escola) => <PerfilLayout navegacao={navegacao} eu={eu} escola={escola} />}
    </ExigirPerfil>
  );
};

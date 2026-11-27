import { Button, EmptyState, LoadingCard } from '@recreio/design-system';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { escolaPublicaQuery } from '@/features/escola/index.ts';
import { NaoEncontradaPage } from '@/pages/nao-encontrada/NaoEncontradaPage.tsx';
import { ApiError } from '@/shared/api/http-client.ts';
import { ROTA_SAIR } from '@/shared/config/navigation/comum.ts';
import { useEscolaDaRota } from '@/shared/sessao/escola-da-rota.ts';

/**
 * Conta que entrou, mas não tem vínculo com a escola da rota (403 `SEM_ACESSO`).
 * Slug que não é de escola nenhuma mostra a página não encontrada.
 */
export const SemAcessoPage = () => {
  const navigate = useNavigate();
  const { isPending, error } = useQuery(escolaPublicaQuery(useEscolaDaRota()));

  if (isPending) return <LoadingCard label="Abrindo a escola" />;
  if (error instanceof ApiError && error.status === 404) return <NaoEncontradaPage />;

  return (
    <EmptyState
      title="Sua conta não tem acesso a esta escola"
      action={
        <>
          <Button variant="primary" icon="school" onClick={() => navigate('/')}>
            Ver minhas escolas
          </Button>
          <Button variant="ghost" icon="logout" onClick={() => navigate(ROTA_SAIR)}>
            Sair e entrar com outra conta
          </Button>
        </>
      }
    >
      A escola libera o acesso em Grupos e permissões. Fale com a secretaria para pedir o seu perfil.
    </EmptyState>
  );
};

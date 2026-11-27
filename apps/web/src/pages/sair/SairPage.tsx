import { ErrorState, LoadingCard } from '@recreio/design-system';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { rotaDeEntrar } from '@/shared/sessao/destino.ts';
import { useEscolaDaRotaOpcional } from '@/shared/sessao/escola-da-rota.ts';
import { encerrarSessaoNoCache, sair } from '@/shared/sessao/sessao.api.ts';

/** Encerra a sessão na API, limpa o cache e volta para Entrar da escola (ou a global, em `/sair`). Aberta pelo item "Sair" do menu. */
export const SairPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const escola = useEscolaDaRotaOpcional();
  const saida = useMutation({
    mutationFn: sair,
    onSuccess: async () => {
      encerrarSessaoNoCache(queryClient);
      await navigate(rotaDeEntrar(escola), { replace: true });
    },
  });
  const { mutate } = saida;

  useEffect(() => {
    mutate();
  }, [mutate]);

  if (saida.isError) {
    return (
      <ErrorState title="Não conseguimos sair agora" onRetry={() => mutate()} details={saida.error.message}>
        Confira a internet e tente de novo. A conta continua aberta neste aparelho.
      </ErrorState>
    );
  }
  return <LoadingCard label="Saindo da conta" />;
};

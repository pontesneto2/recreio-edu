import { Button, EmptyState, LoginLayout } from '@recreio/design-system';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { escolaPublicaQuery } from '@/features/escola/index.ts';
import { ApiError } from '@/shared/api/http-client.ts';
import { ConteudoDaRota } from '@/shared/layout/ConteudoDaRota.tsx';
import { useEscolaDaRotaOpcional } from '@/shared/sessao/escola-da-rota.ts';

/** Nome mostrado na entrada sem escola, ou enquanto a escola carrega. */
const NOME_PADRAO = 'Recreio';

const EscolaNaoEncontrada = () => {
  const navigate = useNavigate();
  return (
    <EmptyState
      title="Escola não encontrada"
      action={
        <Button variant="primary" onClick={() => navigate('/entrar')}>
          Entrar sem escolher a escola
        </Button>
      }
    >
      Confira o endereço que a escola enviou. Ele começa pelo nome da escola, como recreio-edu.com.br/colegio-recreio.
    </EmptyState>
  );
};

/**
 * Casca das telas sem sessão (entrar, esqueci a senha, nova senha): formulário de um lado e
 * vitrine do Recreio do outro. Em `/:escola/entrar` mostra o nome da escola. Abaixo de 860px a
 * vitrine some. Fonte: `Main` e `Celular-Entrar`.
 */
export const EntradaLayout = () => {
  const slug = useEscolaDaRotaOpcional();
  const { data: escola, error } = useQuery({ ...escolaPublicaQuery(slug ?? ''), enabled: Boolean(slug) });
  const naoExiste = error instanceof ApiError && error.status === 404;

  return (
    <main id="conteudo">
      <LoginLayout school={{ name: escola?.nome ?? NOME_PADRAO, unit: escola?.cidade }}>
        {naoExiste ? <EscolaNaoEncontrada /> : <ConteudoDaRota />}
      </LoginLayout>
    </main>
  );
};

import { EmptyState, ErrorState, LoadingCard } from '@recreio/design-system';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ApiError } from '../api/http-client.ts';
import { useConexao } from '../pwa/useConexao.ts';

type Vazio<T> = {
  /** Diz se o dado carregado conta como vazio. Padrão: lista sem itens. */
  quando?: (data: T) => boolean;
  titulo: string;
  texto?: ReactNode;
  acao?: ReactNode;
};

type QueryStateProps<T> = {
  query: UseQueryResult<T>;
  /** Texto lido pelo leitor de tela enquanto carrega. */
  carregando?: string;
  /** Esqueleto no formato do conteúdo. Padrão: `LoadingCard`. */
  esqueleto?: ReactNode;
  vazio?: Vazio<T>;
  erro?: { titulo?: string; texto?: ReactNode };
  children: (data: T) => ReactNode;
};

const listaVazia = (data: unknown) => Array.isArray(data) && data.length === 0;

const semPermissao = (erro: Error) => erro instanceof ApiError && erro.code === 'PERMISSAO_NEGADA';

/** Os 3 estados de toda tela com dado do servidor: carregando, erro e vazio. O conteúdo só aparece com dado. */
export const QueryState = <T,>({ query, carregando, esqueleto, vazio, erro, children }: QueryStateProps<T>) => {
  const online = useConexao();

  if (query.isPending) return esqueleto ?? <LoadingCard label={carregando ?? 'Carregando'} />;

  if (query.isError && semPermissao(query.error)) {
    return (
      <EmptyState title="Seu perfil não vê esta informação" compact>
        A escola libera o acesso em Grupos e permissões.
      </EmptyState>
    );
  }

  if (query.isError) {
    return (
      <ErrorState
        title={online ? erro?.titulo : undefined}
        offline={!online}
        onRetry={() => void query.refetch()}
        details={query.error.message}
      >
        {online ? erro?.texto : undefined}
      </ErrorState>
    );
  }

  const estaVazio = vazio?.quando ?? listaVazia;
  if (vazio && estaVazio(query.data)) {
    return (
      <EmptyState title={vazio.titulo} action={vazio.acao} compact>
        {vazio.texto}
      </EmptyState>
    );
  }

  return children(query.data);
};

import { Button, EmptyState, TopBar } from '@recreio/design-system';
import { useNavigate } from 'react-router';
import type { ItemDeNavegacao, NavegacaoDoPerfil } from '@/shared/config/navigation/index.ts';

type EmConstrucaoPageProps = { item: ItemDeNavegacao; navegacao: NavegacaoDoPerfil };

/** Destino dos itens do menu cujas telas ainda não foram portadas do protótipo. */
export const EmConstrucaoPage = ({ item, navegacao }: EmConstrucaoPageProps) => {
  const navigate = useNavigate();
  const inicio = navegacao.grupos[0]?.items[0];

  return (
    <>
      <TopBar title={item.label} />
      <EmptyState
        title="Esta tela está em construção"
        action={
          <Button variant="primary" icon="home" onClick={() => navigate(navegacao.base)}>
            Voltar para {inicio?.label ?? 'o início'}
          </Button>
        }
      >
        {item.label} chega numa próxima versão do portal. As telas prontas continuam no menu.
      </EmptyState>
    </>
  );
};

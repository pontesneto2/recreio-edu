import { Alert, Button } from '@recreio/design-system';
import { useLocation, useNavigate } from 'react-router';
import { useConexao } from './useConexao.ts';

export const ROTA_SEM_INTERNET = '/sem-internet';

/** Faixa no topo do conteúdo enquanto o aparelho está sem conexão. */
export const AvisoSemInternet = () => {
  const online = useConexao();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (online || pathname === ROTA_SEM_INTERNET) return null;

  return (
    <Alert
      tone="warning"
      icon="wifi-off"
      title="Sem internet"
      actions={
        <Button variant="secondary" size="sm" onClick={() => navigate(ROTA_SEM_INTERNET)}>
          Ver o que funciona sem internet
        </Button>
      }
    >
      Você vê o que já foi carregado. Pagamentos e assinaturas esperam a conexão voltar.
    </Alert>
  );
};

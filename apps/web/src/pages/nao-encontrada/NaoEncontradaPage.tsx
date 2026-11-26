import { Button, EmptyState } from '@recreio/design-system';
import { useNavigate } from 'react-router';

export const NaoEncontradaPage = () => {
  const navigate = useNavigate();

  return (
    <EmptyState
      title="Página não encontrada"
      action={
        <Button variant="primary" icon="home" onClick={() => navigate('/')}>
          Voltar ao início
        </Button>
      }
    >
      O endereço não existe ou mudou de lugar.
    </EmptyState>
  );
};

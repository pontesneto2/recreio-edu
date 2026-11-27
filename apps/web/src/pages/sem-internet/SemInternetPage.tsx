import { Button, Card, Icon, StatusPill, type StatusPillProps, TopBar } from '@recreio/design-system';
import { useNavigate } from 'react-router';
import { useConexao } from '@/shared/pwa/useConexao.ts';

type Recurso = { titulo: string; descricao: string; icone: string };

const DISPONIVEL = [
  {
    titulo: 'Menu e telas do portal',
    descricao: 'Abrem sem conexão, porque ficam salvos neste aparelho',
    icone: 'grid',
  },
  {
    titulo: 'Dados desta visita',
    descricao: 'O que você já abriu continua na tela até fechar a aba',
    icone: 'history',
  },
  {
    titulo: 'Acessibilidade',
    descricao: 'Tamanho do texto, contraste e movimento ficam salvos neste aparelho',
    icone: 'accessibility',
  },
];

const PRECISA_DE_INTERNET = [
  { titulo: 'Pagar com Pix', descricao: 'O código é gerado na hora pelo banco', icone: 'wallet' },
  { titulo: 'Assinar contrato', descricao: 'A assinatura é validada no servidor', icone: 'edit' },
  { titulo: 'Dados novos da escola', descricao: 'Notas, agenda e recados chegam pela internet', icone: 'sync' },
];

type ListaDeRecursosProps = {
  rotulo: string;
  recursos: Recurso[];
  situacao: { texto: string; tom: StatusPillProps['tone'] };
};

const ListaDeRecursos = ({ rotulo, recursos, situacao }: ListaDeRecursosProps) => (
  <ul className="rc-list is-divided" aria-label={rotulo}>
    {recursos.map((recurso) => (
      <li key={recurso.titulo} className="rc-li">
        <div className="rc-li-row">
          <span className="rc-li-lead">
            <Icon name={recurso.icone} size={20} />
          </span>
          <span className="rc-li-body">
            <span className="rc-li-title">{recurso.titulo}</span>
            <span className="rc-li-meta">{recurso.descricao}</span>
          </span>
          <span className="rc-li-trail">
            <StatusPill tone={situacao.tom} size="sm">
              {situacao.texto}
            </StatusPill>
          </span>
        </div>
      </li>
    ))}
  </ul>
);

/** O que funciona sem conexão e o que espera a internet voltar. Fonte: `Celular-Offline`. */
export const SemInternetPage = () => {
  const online = useConexao();
  const navigate = useNavigate();

  return (
    <>
      <TopBar
        title="Modo sem internet"
        subtitle={online ? 'A conexão voltou. As telas já carregam dados novos.' : 'O essencial continua aqui'}
        actions={
          online ? (
            <Button variant="primary" icon="home" onClick={() => navigate('/')}>
              Voltar ao início
            </Button>
          ) : (
            <Button variant="primary" icon="refresh" onClick={() => window.location.reload()}>
              Tentar de novo
            </Button>
          )
        }
      />
      <Card title="Disponível agora" subtitle="Salvo neste aparelho" padding="sm">
        <ListaDeRecursos
          rotulo="Disponível sem internet"
          recursos={DISPONIVEL}
          situacao={{ texto: 'Pronto', tom: 'success' }}
        />
      </Card>
      <Card title="Precisa de internet" subtitle="Espera a conexão voltar" padding="sm">
        <ListaDeRecursos
          rotulo="Precisa de internet"
          recursos={PRECISA_DE_INTERNET}
          situacao={{ texto: 'Indisponível', tom: 'neutral' }}
        />
      </Card>
      <p>Nada do que você já salvou se perde. Quando a conexão volta, as telas buscam os dados novos sozinhas.</p>
    </>
  );
};

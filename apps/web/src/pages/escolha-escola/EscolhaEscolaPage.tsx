import type { Eu } from '@recreio/contracts';
import { Button, Card, EmptyState, Logo } from '@recreio/design-system';
import { useNavigate } from 'react-router';
import { ROTA_SAIR } from '@/shared/config/navigation/comum.ts';
import { NAVEGACOES } from '@/shared/config/navigation/index.ts';
import { caminhoNaEscola } from '@/shared/layout/navegacao.ts';
import { cascasDosPerfis } from '@/shared/sessao/perfis.ts';
import { ListaDeLinks } from '@/shared/ui/ListaDeLinks.tsx';

type EscolhaEscolaPageProps = { eu: Eu };

const perfisDaEscola = (perfis: Parameters<typeof cascasDosPerfis>[0]) =>
  cascasDosPerfis(perfis)
    .map((perfil) => NAVEGACOES[perfil].titulo)
    .join(', ');

/** Escolas da conta, para quem tem vínculo com mais de uma. Sem nenhuma, explica o que falta. */
export const EscolhaEscolaPage = ({ eu }: EscolhaEscolaPageProps) => {
  const navigate = useNavigate();

  if (eu.escolas.length === 0) {
    return (
      <EmptyState
        title="Sua conta ainda não tem escola"
        action={
          <Button variant="primary" icon="logout" onClick={() => navigate(ROTA_SAIR)}>
            Sair e entrar com outra conta
          </Button>
        }
      >
        A escola libera o acesso em Grupos e permissões. Fale com a secretaria para pedir o seu perfil.
      </EmptyState>
    );
  }

  return (
    <>
      <header>
        <Logo size={32} />
        <h1>Qual escola?</h1>
        <p>{eu.usuario.nome}</p>
      </header>
      <Card title="Suas escolas" subtitle="O mesmo login vale em todas" padding="sm">
        <ListaDeLinks
          rotulo="Escolas"
          links={eu.escolas.map((escola) => ({
            to: caminhoNaEscola(escola.slug, '/'),
            titulo: escola.nome,
            descricao: perfisDaEscola(escola.perfis),
            icone: 'school',
          }))}
        />
      </Card>
    </>
  );
};

import { Alert, Card, Logo } from '@recreio/design-system';
import { NAVEGACOES, PERFIS } from '@/shared/config/navigation/index.ts';
import { ListaDeLinks } from '@/shared/ui/ListaDeLinks.tsx';

const LINKS_DOS_PERFIS = PERFIS.map((perfil) => {
  const navegacao = NAVEGACOES[perfil];
  return {
    to: navegacao.base,
    titulo: navegacao.titulo,
    descricao: navegacao.descricao,
    icone: navegacao.icone,
    cor: navegacao.cor,
  };
});

/** Entrada do portal até existir login: a pessoa escolhe com qual perfil quer ver. Fonte: `App-Perfil-Escolha`. */
export const EscolhaPerfilPage = () => (
  <>
    <header>
      <Logo size={32} />
      <h1>Quem vai usar?</h1>
      <p>Colégio Recreio · Unidade Aldeota</p>
    </header>
    <Alert tone="info" title="O portal abre no seu perfil">
      Quando a entrada com senha estiver pronta, a escola libera o perfil em Grupos e permissões e quem tem um só perfil
      entra direto. Por enquanto, escolha abaixo.
    </Alert>
    <Card title="Perfis" subtitle="Cada perfil tem menu e telas próprios" padding="sm">
      <ListaDeLinks rotulo="Perfis" links={LINKS_DOS_PERFIS} />
    </Card>
    <Card title="Este aparelho" padding="sm">
      <ListaDeLinks
        rotulo="Este aparelho"
        links={[
          {
            to: '/preferencias',
            titulo: 'Acessibilidade',
            descricao: 'Tamanho do texto, fonte, contraste e movimento',
            icone: 'accessibility',
          },
        ]}
      />
    </Card>
  </>
);

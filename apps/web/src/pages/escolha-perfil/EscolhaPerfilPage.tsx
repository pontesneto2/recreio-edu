import type { EscolaDoUsuario, Eu } from '@recreio/contracts';
import { Alert, Card, Logo } from '@recreio/design-system';
import { ROTA_SAIR } from '@/shared/config/navigation/comum.ts';
import { NAVEGACOES, type Perfil } from '@/shared/config/navigation/index.ts';
import { caminhoNaEscola } from '@/shared/layout/navegacao.ts';
import { ListaDeLinks } from '@/shared/ui/ListaDeLinks.tsx';

type EscolhaPerfilPageProps = {
  eu: Eu;
  /** Escola da rota, com os perfis da pessoa nela. */
  escola: EscolaDoUsuario;
  /** Cascas liberadas pelos vínculos da pessoa nesta escola. */
  perfis: Perfil[];
};

const rotuloDePerfis = (quantidade: number) =>
  `${quantidade} ${quantidade === 1 ? 'perfil liberado' : 'perfis liberados'}`;

/** Escolha de perfil para quem tem mais de um vínculo na escola. Fonte: `App-Perfil-Escolha`. */
export const EscolhaPerfilPage = ({ eu, escola, perfis }: EscolhaPerfilPageProps) => (
  <>
    <header>
      <Logo size={32} />
      <h1>Quem vai usar?</h1>
      <p>
        {eu.usuario.nome} · {escola.nome} · {rotuloDePerfis(perfis.length)}
      </p>
    </header>
    <Alert tone="info" title="O portal abre no seu perfil">
      A escola libera o perfil em Grupos e permissões. Quem tem um só perfil entra direto. Quem tem mais de um escolhe
      aqui.
    </Alert>
    <Card title="Seus perfis" subtitle="Cada perfil tem menu e telas próprios" padding="sm">
      <ListaDeLinks
        rotulo="Perfis"
        links={perfis.map((perfil) => {
          const navegacao = NAVEGACOES[perfil];
          return {
            to: caminhoNaEscola(escola.slug, navegacao.base),
            titulo: navegacao.titulo,
            descricao: navegacao.descricao,
            icone: navegacao.icone,
            cor: navegacao.cor,
          };
        })}
      />
    </Card>
    <Card title="Este aparelho" padding="sm">
      <ListaDeLinks
        rotulo="Este aparelho"
        links={[
          {
            to: caminhoNaEscola(escola.slug, '/preferencias'),
            titulo: 'Acessibilidade',
            descricao: 'Tamanho do texto, fonte, contraste e movimento',
            icone: 'accessibility',
          },
          ...(eu.escolas.length > 1
            ? [{ to: '/', titulo: 'Trocar de escola', descricao: 'Suas outras escolas', icone: 'school' }]
            : []),
          {
            to: caminhoNaEscola(escola.slug, ROTA_SAIR),
            titulo: 'Sair',
            descricao: 'Encerra a sessão neste aparelho',
            icone: 'logout',
          },
        ]}
      />
    </Card>
  </>
);

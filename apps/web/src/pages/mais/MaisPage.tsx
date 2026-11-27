import { Card, TopBar } from '@recreio/design-system';
import type { NavegacaoDoPerfil } from '@/shared/config/navigation/index.ts';
import { ROTA_SEM_INTERNET } from '@/shared/pwa/AvisoSemInternet.tsx';
import { ListaDeLinks } from '@/shared/ui/ListaDeLinks.tsx';

type MaisPageProps = { navegacao: NavegacaoDoPerfil };

const LINKS_DO_APARELHO = [
  {
    to: ROTA_SEM_INTERNET,
    titulo: 'Uso sem internet',
    descricao: 'O que continua funcionando sem conexão',
    icone: 'wifi-off',
  },
];

/** Menu inteiro do perfil no celular, aberto pelo "Mais" da barra inferior. Fonte: `Celular-Mais`. */
export const MaisPage = ({ navegacao }: MaisPageProps) => (
  <>
    <TopBar title="Mais" subtitle={`${navegacao.titulo} · Colégio Recreio`} />
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 24 }}>
      {navegacao.grupos.map((grupo) => (
        <Card key={grupo.label ?? 'principal'} title={grupo.label ?? 'Principal'} padding="sm">
          <ListaDeLinks
            rotulo={grupo.label ?? 'Principal'}
            links={grupo.items.map((item) => ({ to: item.href, titulo: item.label, icone: item.icon }))}
          />
        </Card>
      ))}
      <Card title="Este aparelho" padding="sm">
        <ListaDeLinks rotulo="Este aparelho" links={LINKS_DO_APARELHO} />
      </Card>
    </div>
  </>
);

import { Card, TopBar } from '@recreio/design-system';
import { AlunosTabela } from '@/features/alunos/index.ts';
import { UnidadesResumo } from '@/features/escola/index.ts';

export const InicioPage = () => (
  <>
    <TopBar title="Painel" subtitle="Portal da escola" />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <UnidadesResumo />
      <Card title="Alunos" subtitle="Matrículas ativas na unidade">
        <AlunosTabela />
      </Card>
    </div>
  </>
);

import { Card, TopBar } from '@recreio/design-system';
import { AlunosTabela } from '@/features/alunos/index.ts';

export const AlunosPage = () => (
  <>
    <TopBar title="Alunos" subtitle="Matrículas da unidade" />
    <Card>
      <AlunosTabela />
    </Card>
  </>
);

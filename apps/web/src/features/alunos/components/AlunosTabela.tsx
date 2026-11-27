import type { Aluno } from '@recreio/contracts';
import { Alert, DataTable, brl } from '@recreio/design-system';
import { useQuery } from '@tanstack/react-query';
import { alunosQuery } from '../api/alunos.queries.ts';

const COLUNAS = [
  { key: 'nome', label: 'Aluno' },
  { key: 'turma', label: 'Turma' },
  { key: 'matricula', label: 'Matrícula' },
  {
    key: 'mensalidadeCentavos',
    label: 'Mensalidade',
    align: 'right' as const,
    render: (aluno: Aluno) => brl(aluno.mensalidadeCentavos / 100),
  },
];

export const AlunosTabela = () => {
  const { data, isPending, isError } = useQuery(alunosQuery);

  if (isError) {
    return (
      <Alert tone="danger" title="Não conseguimos carregar os alunos">
        Confira se a API está rodando na porta 3333 e recarregue a página.
      </Alert>
    );
  }

  return <DataTable columns={COLUNAS} rows={data ?? []} loading={isPending} caption="Alunos matriculados" />;
};

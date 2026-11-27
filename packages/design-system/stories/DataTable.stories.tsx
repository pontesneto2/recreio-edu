import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { DataTable, EmptyState } from '../src/index.ts';
import type { Column, DataTableProps } from '../src/types.ts';
import { ALUNOS, type AlunoExemplo } from './dados.ts';

const COLUNAS: Column<AlunoExemplo>[] = [
  { key: 'nome', label: 'Aluno', sortable: true },
  { key: 'turma', label: 'Turma', sortable: true },
  { key: 'turno', label: 'Turno' },
  { key: 'responsavel', label: 'Responsável' },
];

type Ordem = { key: string; dir: 'asc' | 'desc' };

const ordenar = (ordem: Ordem) => {
  const chave = ordem.key as keyof AlunoExemplo;
  const sinal = ordem.dir === 'asc' ? 1 : -1;
  return [...ALUNOS].sort((a, b) => a[chave].localeCompare(b[chave], 'pt-BR') * sinal);
};

const TabelaOrdenavel = (props: DataTableProps<AlunoExemplo>) => {
  const [ordem, setOrdem] = useState<Ordem>({ key: 'nome', dir: 'asc' });
  return <DataTable {...props} rows={ordenar(ordem)} sort={ordem} onSort={setOrdem} />;
};

const TabelaSelecionavel = (props: DataTableProps<AlunoExemplo>) => {
  const [selecionados, setSelecionados] = useState<Array<string | number>>(['ana']);
  return <DataTable {...props} rowKey="id" selectable selected={selecionados} onSelect={setSelecionados} />;
};

const meta = {
  title: 'Dados/DataTable',
  component: DataTable,
  args: { columns: COLUNAS, rows: ALUNOS, caption: 'Alunos da Unidade Aldeota' },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};

export const Ordenavel: Story = { render: (args) => <TabelaOrdenavel {...args} /> };

export const Selecionavel: Story = { render: (args) => <TabelaSelecionavel {...args} /> };

export const Carregando: Story = { args: { rows: [], loading: true } };

export const Vazio: Story = {
  args: {
    rows: [],
    empty: (
      <EmptyState title="Nenhum aluno nesta turma" compact>
        A secretaria ainda não enturmou ninguém no 9º ano C.
      </EmptyState>
    ),
  },
};

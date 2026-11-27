import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatCard, brl } from '../src/index.ts';

const meta = {
  title: 'Dados/StatCard',
  component: StatCard,
  args: { label: 'Alunos · Unidade Aldeota', value: 1248, icon: 'school', color: 'azul' },
  argTypes: {
    color: {
      control: 'select',
      options: ['azul', 'verde', 'amarelo', 'laranja', 'vermelho', 'roxo', 'ciano', 'rosa'],
    },
  },
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};

export const OutraUnidade: Story = { args: { label: 'Alunos · Unidade Eusébio', value: 936 } };

export const ComVariacao: Story = {
  args: {
    label: 'Frequência da Ana Beatriz',
    value: 96,
    format: (v: number) => `${Math.round(v)}%`,
    delta: 1.4,
    deltaSuffix: ' p.p.',
    deltaLabel: 'no bimestre',
    trend: [91, 93, 94, 92, 95, 95, 96],
    icon: 'check-circle',
    color: 'verde',
  },
};

export const Destaque: Story = {
  args: {
    variant: 'hero',
    label: 'Mensalidades vencidas',
    value: 68420.9,
    format: (v: number) => brl(v),
    hint: '41 famílias · 3,3% dos alunos',
    icon: 'wallet',
  },
};

export const Carregando: Story = { args: { loading: true } };

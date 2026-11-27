import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { TabBar } from '../src/index.ts';
import type { TabBarProps } from '../src/types.ts';
import { ABAS_FAMILIA } from './dados.ts';

const BarraNavegavel = (props: TabBarProps) => {
  const [ativo, setAtivo] = useState('hoje');
  return <TabBar {...props} active={ativo} onNavigate={setAtivo} />;
};

const meta = {
  title: 'Navegação/TabBar',
  component: TabBar,
  args: { items: ABAS_FAMILIA, active: 'hoje' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 390, marginInline: 'auto' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TabBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Familia: Story = {};

export const Navegavel: Story = { render: (args) => <BarraNavegavel {...args} /> };

export const Aluno: Story = {
  args: {
    active: 'tarefas',
    items: [
      { id: 'hoje', label: 'Hoje', icon: 'home' },
      { id: 'tarefas', label: 'Tarefas', icon: 'clipboard', count: 2 },
      { id: 'notas', label: 'Notas', icon: 'chart' },
      { id: 'horario', label: 'Horário', icon: 'clock' },
      { id: 'mais', label: 'Mais', icon: 'menu' },
    ],
  },
};

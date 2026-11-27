import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { SideNav } from '../src/index.ts';
import type { SideNavProps } from '../src/types.ts';
import { ESCOLA, GRUPOS_ESCOLA } from './dados.ts';

const MenuNavegavel = (props: SideNavProps) => {
  const [ativo, setAtivo] = useState('painel');
  return <SideNav {...props} active={ativo} onNavigate={setAtivo} />;
};

const meta = {
  title: 'Navegação/SideNav',
  component: SideNav,
  args: { school: ESCOLA, groups: GRUPOS_ESCOLA, active: 'painel', collapsed: false },
  decorators: [
    (Story) => (
      <div style={{ height: 720, display: 'flex' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SideNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};

export const Navegavel: Story = { render: (args) => <MenuNavegavel {...args} /> };

export const Recolhido: Story = { args: { collapsed: true, active: 'mensalidades' } };

export const ComUnidades: Story = {
  args: {
    units: [
      { id: 'aldeota', label: 'Unidade Aldeota', meta: '1.248 alunos', current: true },
      { id: 'eusebio', label: 'Unidade Eusébio', meta: '936 alunos' },
    ],
  },
};

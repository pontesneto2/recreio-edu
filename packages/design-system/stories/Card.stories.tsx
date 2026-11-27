import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Card, StatusPill } from '../src/index.ts';

const meta = {
  title: 'Dados/Card',
  component: Card,
  args: {
    title: 'Rematrícula 2027',
    subtitle: 'Ana Beatriz · 9º ano A',
    children: 'Contrato enviado em 20/11 e ainda não assinado. Documentos entregues: 2 de 5.',
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};

export const ComAcoes: Story = {
  args: {
    actions: (
      <StatusPill tone="warning" icon="clock">
        Até 15/12
      </StatusPill>
    ),
    footer: <Button icon="edit">Assinar contrato</Button>,
  },
};

export const Interativo: Story = {
  args: {
    interactive: true,
    title: 'Boletim do 3º bimestre',
    subtitle: 'Publicado ontem, 18h30',
    children: 'Ana Beatriz e Davi. Toque para abrir o boletim.',
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert, Button } from '../src/index.ts';

const meta = {
  title: 'Feedback/Alert',
  component: Alert,
  args: {
    tone: 'info',
    title: 'Aula de campo no Parque do Cocó',
    children: 'Sexta, 27/11, das 7h às 12h. O bilhete da Ana Beatriz precisa ser assinado até 26/11.',
  },
  argTypes: { tone: { control: 'inline-radio', options: ['info', 'success', 'warning', 'danger'] } },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Informacao: Story = {};

export const Sucesso: Story = {
  args: {
    tone: 'success',
    title: 'Pagamento recebido',
    children: 'Mensalidade de novembro do Davi paga por Pix em 09/11. O comprovante está em Financeiro.',
  },
};

export const Atencao: Story = {
  args: {
    tone: 'warning',
    title: 'Mensalidade de novembro em aberto',
    children: 'Ana Beatriz · venceu em 10/11 · R$ 1.652,40 com multa de R$ 32,40.',
    actions: <Button size="sm">Pagar com Pix</Button>,
  },
};

export const Perigo: Story = {
  args: {
    tone: 'danger',
    title: 'Alergia grave a amendoim',
    children: 'Davi Lima · 2º ano B. Avise a cantina e a professora Luana Freitas antes de qualquer lanche coletivo.',
  },
};

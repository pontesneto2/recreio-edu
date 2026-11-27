import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, EmptyState } from '../src/index.ts';

const meta = {
  title: 'Feedback/EmptyState',
  component: EmptyState,
  args: {
    title: 'Tudo em dia',
    children: 'Nenhuma mensalidade em aberto. A de dezembro vence em 10/12 e o boleto já está pronto.',
    action: <Button variant="secondary">Ver boleto</Button>,
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};

export const Compacto: Story = {
  args: {
    compact: true,
    title: 'O boletim do 4º bimestre sai em 11/12',
    children:
      'Os professores ainda estão lançando as notas. As parciais aparecem na agenda assim que cada uma é liberada.',
    action: undefined,
  },
};

export const Neutro: Story = {
  args: {
    tone: 'neutral',
    title: 'O Davi não tem livro emprestado',
    children: 'A turma dele vai à biblioteca toda sexta, às 15h30. Você pode reservar um título antes.',
    action: <Button variant="secondary">Reservar livro</Button>,
  },
};

export const BuscaSemResultado: Story = {
  args: {
    title: 'Nenhum comunicado encontrado',
    children: 'Você quis dizer passeio ao Planetário? Há 2 comunicados com essas palavras.',
    action: <Button variant="secondary">Buscar passeio planetário</Button>,
    secondary: <Button variant="ghost">Limpar busca</Button>,
  },
};

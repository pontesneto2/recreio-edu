import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../src/index.ts';

const meta = {
  title: 'Ações/Button',
  component: Button,
  args: { children: 'Pagar com Pix', variant: 'primary', size: 'md' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost', 'danger', 'link'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primario: Story = { args: { icon: 'qr' } };

export const Secundario: Story = { args: { variant: 'secondary', children: 'Ver boleto', icon: 'barcode' } };

export const Fantasma: Story = { args: { variant: 'ghost', children: 'Descartar' } };

export const Perigo: Story = { args: { variant: 'danger', children: 'Excluir a avaliação Prova 2', icon: 'trash' } };

export const Salvando: Story = { args: { children: 'Salvar notas', loading: true, loadingLabel: 'Salvando' } };

export const Desabilitado: Story = { args: { children: 'Salvar preferências', disabled: true } };

export const LarguraToda: Story = { args: { children: 'Confirmar saída', full: true, size: 'lg' } };

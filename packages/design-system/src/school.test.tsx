import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BrandEditor, FakeQR, MessageThread, ModuleCard, PixPayment } from './school';
import type { ThreadMessage } from './types';

describe('FakeQR', () => {
  it('desenha os três marcadores de canto', () => {
    const { container } = render(<FakeQR seed="abc" />);
    // Cada marcador tem dois quadrados escuros (rc-qr-f).
    expect(container.querySelectorAll('rect.rc-qr-f')).toHaveLength(6);
  });

  it('o mesmo seed gera o mesmo desenho', () => {
    const a = render(<FakeQR seed="abc" />).container.innerHTML;
    const b = render(<FakeQR seed="abc" />).container.innerHTML;
    expect(a).toBe(b);
  });
});

describe('PixPayment', () => {
  it('conta o prazo e mostra a confirmação quando a prop status vira pago', () => {
    vi.useFakeTimers();
    const { rerender } = render(<PixPayment amount={120} expiresIn={90} />);
    expect(screen.getByText('01:30')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText('01:29')).toBeInTheDocument();
    rerender(<PixPayment amount={120} expiresIn={90} status="pago" />);
    expect(screen.getByText('Pagamento recebido')).toBeInTheDocument();
  });
});

describe('MessageThread', () => {
  const msg = (id: number, text: string): ThreadMessage => ({ id, from: 'escola', text, time: '10:00' });

  it('sem mensagens renderiza sem entrar em laço', () => {
    render(<MessageThread subject="Transporte" />);
    expect(screen.getByRole('textbox', { name: 'Mensagem' })).toBeInTheDocument();
  });

  it('troca a lista quando a prop muda e acrescenta o que a pessoa envia', async () => {
    const onSend = vi.fn();
    const { rerender } = render(<MessageThread subject="Transporte" messages={[msg(1, 'Bom dia')]} onSend={onSend} />);
    expect(screen.getByText('Bom dia')).toBeInTheDocument();
    rerender(<MessageThread subject="Transporte" messages={[msg(2, 'Van atrasada')]} onSend={onSend} />);
    expect(screen.queryByText('Bom dia')).not.toBeInTheDocument();
    expect(screen.getByText('Van atrasada')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox', { name: 'Mensagem' }), 'Obrigado');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(screen.getByText('Obrigado')).toBeInTheDocument();
    expect(onSend).toHaveBeenCalledWith(expect.objectContaining({ text: 'Obrigado', from: 'me' }));
  });
});

describe('ModuleCard', () => {
  const card = (enabled?: boolean, onToggle?: () => void) => (
    <ModuleCard icon="calendar" name="Agenda" description="Agenda da turma" enabled={enabled} onToggle={onToggle} />
  );

  it('segue a prop enabled quando ela muda', () => {
    const { rerender } = render(card(false));
    const sw = screen.getByRole('switch', { name: 'Agenda' });
    expect(sw).not.toBeChecked();
    rerender(card(true));
    expect(sw).toBeChecked();
  });

  it('liga pelo switch e avisa', async () => {
    const onToggle = vi.fn();
    render(card(false, onToggle));
    const sw = screen.getByRole('switch', { name: 'Agenda' });
    await userEvent.click(sw);
    expect(sw).toBeChecked();
    expect(onToggle).toHaveBeenCalledWith(true, expect.anything());
  });
});

describe('BrandEditor', () => {
  it('cor inválida no meio da digitação mantém a cor salva na prévia', async () => {
    const { container } = render(<BrandEditor />);
    const stage = container.querySelector<HTMLElement>('.rc-brand-stage')!;
    const before = stage.getAttribute('style');
    const field = screen.getByRole('textbox', { name: 'Primária' });
    await userEvent.clear(field);
    await userEvent.type(field, '#12');
    expect(stage.getAttribute('style')).toBe(before);
    await userEvent.type(field, '34AB');
    expect(field).toHaveValue('#1234AB');
    expect(stage.getAttribute('style')).not.toBe(before);
  });
});

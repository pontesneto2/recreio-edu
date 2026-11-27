import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchField, Select, Switch, TextArea } from './inputs';

describe('TextArea', () => {
  it('com autoGrow ajusta a altura ao montar e ao digitar', async () => {
    render(<TextArea label="Recado" maxLength={20} />);
    const box = screen.getByRole('textbox', { name: 'Recado' });
    // No jsdom scrollHeight é 0; a altura vira 0 + 2px de borda.
    expect(box.style.height).toBe('2px');
    box.style.height = '';
    await userEvent.type(box, 'oi');
    expect(box.style.height).toBe('2px');
    expect(screen.getByText('2/20')).toBeInTheDocument();
  });

  it('sem autoGrow não mexe na altura', () => {
    render(<TextArea label="Recado" autoGrow={false} />);
    expect(screen.getByRole('textbox', { name: 'Recado' }).style.height).toBe('');
  });
});

describe('SearchField', () => {
  it('copia a prop value quando ela muda e aceita digitação local', async () => {
    const { rerender } = render(<SearchField value="ana" />);
    const box = screen.getByRole('searchbox');
    expect(box).toHaveValue('ana');
    rerender(<SearchField value="bruno" />);
    expect(box).toHaveValue('bruno');
    await userEvent.type(box, 's');
    expect(box).toHaveValue('brunos');
  });

  it('o botão de limpar esvazia e avisa', async () => {
    const onClear = vi.fn();
    render(<SearchField value="ana" onClear={onClear} />);
    await userEvent.click(screen.getByRole('button', { name: 'Limpar busca' }));
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(onClear).toHaveBeenCalledOnce();
  });
});

describe('Select', () => {
  const options = [
    { value: 'a', label: 'Manhã' },
    { value: 'b', label: 'Tarde' },
    { value: 'c', label: 'Integral' },
  ];

  it('ao abrir destaca a opção escolhida', async () => {
    render(<Select label="Turno" options={options} value="c" onChange={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /Turno/ }));
    expect(screen.getByRole('option', { name: 'Integral' })).toHaveClass('is-hi');
  });

  it('sem escolha destaca a primeira e reabrir volta ao destaque da escolha', async () => {
    render(<Select label="Turno" options={options} placeholder="Escolha" />);
    const btn = screen.getByRole('button', { name: /Turno/ });
    await userEvent.click(btn);
    expect(screen.getByRole('option', { name: 'Manhã' })).toHaveClass('is-hi');
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: 'Tarde' })).toHaveClass('is-hi');
    await userEvent.keyboard('{Escape}');
    await userEvent.click(btn);
    expect(screen.getByRole('option', { name: 'Manhã' })).toHaveClass('is-hi');
  });
});

describe('Switch', () => {
  it('controlado segue a prop checked e só avisa no clique', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<Switch label="Avisos" checked onChange={onChange} />);
    const sw = screen.getByRole('switch', { name: 'Avisos' });
    expect(sw).toBeChecked();
    await userEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(false, expect.anything());
    expect(sw).toBeChecked();
    rerender(<Switch label="Avisos" checked={false} onChange={onChange} />);
    expect(sw).not.toBeChecked();
  });

  it('sem checked liga e desliga sozinho a partir de defaultChecked', async () => {
    render(<Switch label="Avisos" defaultChecked />);
    const sw = screen.getByRole('switch', { name: 'Avisos' });
    expect(sw).toBeChecked();
    await userEvent.click(sw);
    expect(sw).not.toBeChecked();
  });

  it('ao deixar de ser controlado mantém o último valor', async () => {
    const { rerender } = render(<Switch label="Avisos" checked />);
    rerender(<Switch label="Avisos" />);
    const sw = screen.getByRole('switch', { name: 'Avisos' });
    expect(sw).toBeChecked();
    await userEvent.click(sw);
    expect(sw).not.toBeChecked();
  });
});

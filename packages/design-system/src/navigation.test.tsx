import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CommandPalette, SideNav } from './navigation';

describe('SideNav', () => {
  const nav = () => screen.getByRole('navigation', { name: 'Navegação principal' });

  it('segue a prop collapsed quando ela muda', () => {
    const { rerender } = render(<SideNav collapsed />);
    expect(nav()).toHaveClass('is-collapsed');
    rerender(<SideNav collapsed={false} />);
    expect(nav()).not.toHaveClass('is-collapsed');
  });

  it('sem prop lê e grava o estado no navegador', async () => {
    window.localStorage.setItem('recreio.menu', 'recolhido');
    const onCollapse = vi.fn();
    render(<SideNav onCollapse={onCollapse} />);
    expect(nav()).toHaveClass('is-collapsed');
    await userEvent.click(screen.getByRole('button', { name: 'Abrir o menu' }));
    expect(nav()).not.toHaveClass('is-collapsed');
    expect(window.localStorage.getItem('recreio.menu')).toBe('aberto');
    expect(onCollapse).toHaveBeenCalledWith(false);
  });
});

describe('CommandPalette', () => {
  const noop = () => {};
  const groups = [
    {
      label: 'Pessoas',
      items: [
        { id: 'p1', label: 'Ana Souza' },
        { id: 'p2', label: 'Bruno Lima' },
      ],
    },
    {
      label: 'Telas',
      items: [
        { id: 't1', label: 'Agenda' },
        { id: 't2', label: 'Boletim' },
      ],
    },
  ];
  const selected = () => screen.getByRole('option', { selected: true });

  it('numera as opções em sequência entre os grupos', () => {
    render(<CommandPalette open groups={groups} onClose={noop} />);
    const ids = screen.getAllByRole('option').map((o) => o.id.replace(/^.*-/, ''));
    expect(ids).toEqual(['0', '1', '2', '3']);
  });

  it('as setas passam de um grupo para o outro', async () => {
    render(<CommandPalette open groups={groups} onClose={noop} />);
    expect(selected()).toHaveTextContent('Ana Souza');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(selected()).toHaveTextContent('Agenda');
  });

  it('digitar volta o destaque para o primeiro resultado', async () => {
    render(<CommandPalette open groups={groups} onClose={noop} />);
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(selected()).toHaveTextContent('Boletim');
    await userEvent.type(screen.getByRole('combobox'), 'b');
    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(selected()).toHaveTextContent('Bruno Lima');
  });

  it('fechar limpa a busca e o destaque', async () => {
    const { rerender } = render(<CommandPalette open groups={groups} onClose={noop} />);
    await userEvent.type(screen.getByRole('combobox'), 'a');
    await userEvent.keyboard('{ArrowDown}');
    rerender(<CommandPalette open={false} groups={groups} onClose={noop} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(<CommandPalette open groups={groups} onClose={noop} />);
    expect(screen.getByRole('combobox')).toHaveValue('');
    expect(selected()).toHaveTextContent('Ana Souza');
  });

  it('Enter escolhe o item destacado e fecha', async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(<CommandPalette open groups={groups} onSelect={onSelect} onClose={onClose} />);
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onSelect).toHaveBeenCalledWith(groups[0].items[1]);
    expect(onClose).toHaveBeenCalledOnce();
  });
});

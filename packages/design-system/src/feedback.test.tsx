import { act, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Dialog, Sheet } from './feedback';

type Panel = (open: boolean) => ReactElement;

const cases: Array<[string, Panel, number]> = [
  [
    'Dialog',
    (open) => (
      <Dialog open={open} onClose={() => {}} title="Excluir aluno">
        corpo
      </Dialog>
    ),
    200,
  ],
  [
    'Sheet',
    (open) => (
      <Sheet open={open} onClose={() => {}} title="Filtros">
        corpo
      </Sheet>
    ),
    260,
  ],
];

describe.each(cases)('%s', (_name, panel, ms) => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('fechado desde o início não monta nada', () => {
    render(panel(false));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it(`ao fechar fica montado com is-leaving por ${ms}ms e depois sai`, () => {
    const { rerender } = render(panel(true));
    expect(screen.getByRole('dialog')).not.toHaveClass('is-leaving');
    rerender(panel(false));
    expect(screen.getByRole('dialog')).toHaveClass('is-leaving');
    act(() => vi.advanceTimersByTime(ms - 1));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('reabrir durante a saída cancela a saída', () => {
    const { rerender } = render(panel(true));
    rerender(panel(false));
    act(() => vi.advanceTimersByTime(ms / 2));
    rerender(panel(true));
    expect(screen.getByRole('dialog')).not.toHaveClass('is-leaving');
    act(() => vi.advanceTimersByTime(ms * 2));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('abrir depois de fechado monta de novo', () => {
    const { rerender } = render(panel(false));
    rerender(panel(true));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

import { act, render, renderHook, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { RecreioProvider, SchoolTheme, useCountUp, useUid } from './core';

const RET_KEY = 'recreio:voltar-ao-app';

describe('useUid', () => {
  it('gera um id com o prefixo e mantém o mesmo id entre renders', () => {
    const { result, rerender } = renderHook(() => useUid('dlg'));
    const first = result.current;
    expect(first).toMatch(/^dlg-\d+$/);
    rerender();
    expect(result.current).toBe(first);
  });

  it('dá ids diferentes para componentes diferentes', () => {
    const a = renderHook(() => useUid());
    const b = renderHook(() => useUid());
    expect(a.result.current).not.toBe(b.result.current);
  });
});

describe('useCountUp', () => {
  it('com movimento reduzido devolve o valor na hora e acompanha a mudança', () => {
    document.documentElement.setAttribute('data-motion', 'reduzido');
    const { result, rerender } = renderHook(({ v }) => useCountUp(v), { initialProps: { v: 40 } });
    expect(result.current).toBe(40);
    rerender({ v: 75 });
    expect(result.current).toBe(75);
  });

  it('sem movimento reduzido começa em 0 e chega ao valor', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    const { result } = renderHook(() => useCountUp(10, 100));
    expect(result.current).toBe(0);
    act(() => vi.advanceTimersByTime(50));
    expect(result.current).toBeGreaterThan(0);
    expect(result.current).toBeLessThan(10);
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe(10);
  });
});

describe('SchoolTheme', () => {
  it('repassa a ref para o elemento raiz', () => {
    const ref = createRef<HTMLElement>();
    render(
      <SchoolTheme ref={ref} as="section">
        oi
      </SchoolTheme>,
    );
    expect(ref.current?.tagName).toBe('SECTION');
    expect(ref.current).toHaveClass('rc-school-theme');
  });
});

describe('RecreioProvider', () => {
  it('aplica o tema da prop e acompanha a troca da prop', () => {
    const { rerender } = render(<RecreioProvider theme="escuro">x</RecreioProvider>);
    expect(document.documentElement).toHaveAttribute('data-theme', 'escuro');
    rerender(<RecreioProvider theme="claro">x</RecreioProvider>);
    expect(document.documentElement).toHaveAttribute('data-theme', 'claro');
  });

  it('mantém o tema escolhido quando a prop some', () => {
    const { rerender } = render(<RecreioProvider theme="escuro">x</RecreioProvider>);
    rerender(<RecreioProvider>x</RecreioProvider>);
    expect(document.documentElement).toHaveAttribute('data-theme', 'escuro');
  });

  it('no portal mostra o atalho de volta para a tela do app guardada', () => {
    window.sessionStorage.setItem(RET_KEY, 'App-Inicio.dc.html');
    render(
      <RecreioProvider>
        <p>portal</p>
      </RecreioProvider>,
    );
    expect(screen.getByRole('link', { name: 'Voltar ao app' })).toHaveAttribute('href', 'App-Inicio.dc.html');
  });

  it('ignora valor guardado fora do formato', () => {
    window.sessionStorage.setItem(RET_KEY, 'https://exemplo.com');
    render(
      <RecreioProvider>
        <p>portal</p>
      </RecreioProvider>,
    );
    expect(screen.queryByRole('link', { name: 'Voltar ao app' })).not.toBeInTheDocument();
  });

  it('dentro do app esconde o atalho, apaga o valor e guarda a origem ao sair para o portal', () => {
    window.sessionStorage.setItem(RET_KEY, 'App-Inicio.dc.html');
    render(
      <RecreioProvider>
        <div className="rc-nat-body">
          <a href="Portal-Notas.dc.html" onClick={(e) => e.preventDefault()}>
            Notas
          </a>
        </div>
      </RecreioProvider>,
    );
    expect(screen.queryByRole('link', { name: 'Voltar ao app' })).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem(RET_KEY)).toBeNull();
    act(() => screen.getByRole('link', { name: 'Notas' }).click());
    expect(window.sessionStorage.getItem(RET_KEY)).toBe('App-Perfil-Escolha.dc.html');
  });
});

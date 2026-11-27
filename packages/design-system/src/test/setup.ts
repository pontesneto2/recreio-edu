import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  // O jsdom não implementa a rolagem; os componentes só pedem para o item aparecer.
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  window.sessionStorage.clear();
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-motion');
  document.documentElement.removeAttribute('data-theme');
});

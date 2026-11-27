import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
});

afterEach(() => {
  cleanup();
  // A sessão salva para o modo sem internet não passa de um teste para outro.
  window.localStorage.removeItem('recreio.sessao');
  vi.unstubAllGlobals();
});

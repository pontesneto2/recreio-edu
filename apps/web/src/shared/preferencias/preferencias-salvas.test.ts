import { DEFAULT_PREFS } from '@recreio/design-system';
import { carregarPreferencias, salvarPreferencias } from './preferencias-salvas.ts';

describe('preferências salvas', () => {
  beforeEach(() => window.localStorage.clear());

  test('devolve o que foi salvo', () => {
    salvarPreferencias({ ...DEFAULT_PREFS, textScale: 150, theme: 'alto-contraste' });

    expect(carregarPreferencias()).toMatchObject({ textScale: 150, theme: 'alto-contraste' });
  });

  test('ignora valor corrompido ou fora do esperado', () => {
    window.localStorage.setItem('recreio.preferencias', '{"textScale": 900}');
    expect(carregarPreferencias()).toEqual({});

    window.localStorage.setItem('recreio.preferencias', 'não é json');
    expect(carregarPreferencias()).toEqual({});
  });
});

import { RecreioProvider } from '@recreio/design-system';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AvisoDeAtualizacao } from './AvisoDeAtualizacao.tsx';

const sw = vi.hoisted(() => ({ temVersaoNova: false, updateServiceWorker: vi.fn(async () => {}) }));

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [sw.temVersaoNova, () => {}],
    offlineReady: [false, () => {}],
    updateServiceWorker: sw.updateServiceWorker,
  }),
}));

const renderizar = () =>
  render(
    <RecreioProvider>
      <AvisoDeAtualizacao />
    </RecreioProvider>,
  );

describe('AvisoDeAtualizacao', () => {
  afterEach(() => {
    sw.temVersaoNova = false;
    sw.updateServiceWorker.mockClear();
  });

  test('não mostra nada sem versão nova', () => {
    renderizar();

    expect(screen.queryByText('Versão nova do portal')).not.toBeInTheDocument();
  });

  test('com versão nova, atualiza só quando a pessoa pede', async () => {
    sw.temVersaoNova = true;
    renderizar();

    expect(await screen.findByText('Versão nova do portal')).toBeInTheDocument();
    expect(sw.updateServiceWorker).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Atualizar agora' }));

    expect(sw.updateServiceWorker).toHaveBeenCalledWith(true);
  });
});

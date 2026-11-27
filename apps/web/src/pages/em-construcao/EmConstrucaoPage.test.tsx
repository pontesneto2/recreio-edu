import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { comSessao, mockApi, renderRoute, naEscola } from '@/test/render.tsx';

describe('EmConstrucaoPage', () => {
  beforeEach(() => mockApi(comSessao(['aluno'])));

  test('mostra o nome da tela e volta para a entrada do perfil', async () => {
    renderRoute(naEscola('/aluno/tarefas'));

    expect(await screen.findByRole('heading', { name: 'Tarefas' })).toBeInTheDocument();
    expect(screen.getByText('Esta tela está em construção')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Voltar para Hoje' }));

    expect(await screen.findByRole('heading', { name: 'Hoje' })).toBeInTheDocument();
  });
});

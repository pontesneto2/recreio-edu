import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authErrorResponse, mockApi, renderRoute, semSessao } from '@/test/render.tsx';

describe('esqueci a senha', () => {
  test('pede o link pelo e-mail e confirma o envio', async () => {
    const fetchSimulado = mockApi({
      ...semSessao(),
      'POST /api/auth/request-password-reset': () => Response.json({ status: true }),
    });
    renderRoute('/esqueci-senha');

    const form = await screen.findByRole('form', { name: 'Recuperar a senha' });
    await userEvent.type(within(form).getByLabelText(/E-mail/), 'fernanda.lima@colegiorecreio.test');
    await userEvent.click(within(form).getByRole('button', { name: 'Enviar link' }));

    expect(await screen.findByText('Link enviado')).toBeInTheDocument();
    const pedido = fetchSimulado.mock.calls.find(([url]) => url === '/api/auth/request-password-reset');
    expect(JSON.parse(String(pedido?.[1]?.body))).toEqual({ email: 'fernanda.lima@colegiorecreio.test' });
  });
});

describe('nova senha', () => {
  const preencher = async (senha: string, repeticao: string) => {
    const form = await screen.findByRole('form', { name: 'Nova senha' });
    await userEvent.type(within(form).getByLabelText(/^Senha nova/), senha);
    await userEvent.type(within(form).getByLabelText(/^Repita a senha nova/), repeticao);
    await userEvent.click(within(form).getByRole('button', { name: 'Salvar senha nova' }));
  };

  test('envia o token do link e a senha nova', async () => {
    const fetchSimulado = mockApi({
      ...semSessao(),
      'POST /api/auth/reset-password': () => Response.json({ status: true }),
    });
    renderRoute('/redefinir-senha?token=abc123');

    await preencher('senha-nova-2026', 'senha-nova-2026');

    expect(await screen.findByText('Senha alterada')).toBeInTheDocument();
    const troca = fetchSimulado.mock.calls.find(([url]) => url === '/api/auth/reset-password');
    expect(JSON.parse(String(troca?.[1]?.body))).toEqual({ token: 'abc123', newPassword: 'senha-nova-2026' });
  });

  test('senha curta ou diferente não sai do formulário', async () => {
    const fetchSimulado = mockApi(semSessao());
    renderRoute('/redefinir-senha?token=abc123');

    await preencher('curta', 'outra');

    expect(await screen.findByText('Use 10 caracteres ou mais.')).toBeInTheDocument();
    expect(screen.getByText('As 2 senhas precisam ser iguais.')).toBeInTheDocument();
    expect(fetchSimulado.mock.calls.some(([url]) => url === '/api/auth/reset-password')).toBe(false);
  });

  test('link vencido pede um novo', async () => {
    mockApi({ ...semSessao(), 'POST /api/auth/reset-password': () => authErrorResponse(400, 'INVALID_TOKEN') });
    renderRoute('/redefinir-senha?token=velho');

    await preencher('senha-nova-2026', 'senha-nova-2026');

    expect(
      await screen.findByText('O link expirou ou já foi usado. Peça um novo em Esqueci a senha.'),
    ).toBeInTheDocument();
  });

  test('link sem token avisa e aponta para Esqueci a senha', async () => {
    mockApi(semSessao());
    renderRoute('/redefinir-senha');

    expect(await screen.findByText('Link incompleto')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pedir um link novo' })).toHaveAttribute('href', '/esqueci-senha');
  });
});

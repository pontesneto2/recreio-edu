import { Alert, Button, TextField } from '@recreio/design-system';
import { useMutation } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { Link } from 'react-router';
import { ApiError } from '@/shared/api/http-client.ts';
import { ROTA_ENTRAR } from '@/shared/sessao/destino.ts';
import { pedirTrocaDeSenha } from '@/shared/sessao/sessao.api.ts';

const mensagemDoErro = (erro: Error) =>
  erro instanceof ApiError && erro.code === 'LIMITE_EXCEDIDO'
    ? 'Muitos pedidos seguidos. Espere 1 minuto e peça de novo.'
    : 'Não conseguimos enviar o link agora. Confira a internet e tente de novo.';

/** Pedido de link para criar senha nova. Fonte: "Recuperar a senha" em `Celular-Entrar`. */
export const EsqueciSenhaPage = () => {
  const pedido = useMutation({ mutationFn: pedirTrocaDeSenha });

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    pedido.mutate(String(new FormData(evento.currentTarget).get('email') ?? '').trim());
  };

  return (
    <>
      <h1 className="rc-login-heading">Recuperar a senha</h1>
      <p className="rc-login-lead">Enviamos um link para o e-mail cadastrado. Ele vale por 30 minutos.</p>
      {pedido.isSuccess ? (
        <div className="rc-login-fields">
          <Alert tone="success" title="Link enviado">
            Se o e-mail estiver cadastrado, o link chega em alguns minutos. Confira também a caixa de spam.
          </Alert>
          <Link className="rc-link" to={ROTA_ENTRAR}>
            Voltar para Entrar
          </Link>
        </div>
      ) : (
        <form className="rc-login-fields" onSubmit={enviar} aria-label="Recuperar a senha">
          <TextField
            label="E-mail"
            name="email"
            type="email"
            icon="mail"
            size="lg"
            autoComplete="username"
            inputMode="email"
            required
          />
          {pedido.isError && (
            <Alert tone="danger" title="Link não enviado">
              {mensagemDoErro(pedido.error)}
            </Alert>
          )}
          <Button type="submit" variant="primary" size="lg" full loading={pedido.isPending} loadingLabel="Enviando">
            Enviar link
          </Button>
          <Link className="rc-link" to={ROTA_ENTRAR}>
            Voltar para Entrar
          </Link>
        </form>
      )}
    </>
  );
};

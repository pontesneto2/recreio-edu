import { Alert, Button, TextField } from '@recreio/design-system';
import { useMutation } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ApiError } from '@/shared/api/http-client.ts';
import { ROTA_ENTRAR } from '@/shared/sessao/destino.ts';
import { redefinirSenha } from '@/shared/sessao/sessao.api.ts';

/** Mesmo mínimo da API (`SENHA_MINIMA`). */
const SENHA_MINIMA = 10;

const mensagemDoErro = (erro: Error) => {
  const codigo = erro instanceof ApiError ? erro.code : undefined;
  if (codigo === 'INVALID_TOKEN') return 'O link expirou ou já foi usado. Peça um novo em Esqueci a senha.';
  if (codigo === 'PASSWORD_TOO_SHORT') return `A senha precisa de ${SENHA_MINIMA} caracteres ou mais.`;
  return 'Não conseguimos trocar a senha agora. Confira a internet e tente de novo.';
};

/** Erro de cada campo, antes de enviar. */
const validar = (senha: string, repeticao: string) => ({
  senha: senha.length < SENHA_MINIMA ? `Use ${SENHA_MINIMA} caracteres ou mais.` : undefined,
  repeticao: repeticao !== senha ? 'As 2 senhas precisam ser iguais.' : undefined,
});

/** Senha nova pelo link do e-mail (`/redefinir-senha?token=...`). */
export const RedefinirSenhaPage = () => {
  const [busca] = useSearchParams();
  const token = busca.get('token');
  const [erros, setErros] = useState<ReturnType<typeof validar>>({ senha: undefined, repeticao: undefined });
  const troca = useMutation({ mutationFn: (senha: string) => redefinirSenha(token ?? '', senha) });

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    const senha = String(dados.get('senha') ?? '');
    const encontrados = validar(senha, String(dados.get('repeticao') ?? ''));
    setErros(encontrados);
    if (!encontrados.senha && !encontrados.repeticao) troca.mutate(senha);
  };

  if (!token) {
    return (
      <>
        <h1 className="rc-login-heading">Nova senha</h1>
        <div className="rc-login-fields">
          <Alert tone="danger" title="Link incompleto">
            O link do e-mail chegou sem o código. Peça um novo em Esqueci a senha.
          </Alert>
          <Link className="rc-link" to="/esqueci-senha">
            Pedir um link novo
          </Link>
        </div>
      </>
    );
  }

  if (troca.isSuccess) {
    return (
      <>
        <h1 className="rc-login-heading">Nova senha</h1>
        <div className="rc-login-fields">
          <Alert tone="success" title="Senha alterada">
            Entre com a senha nova. Os outros aparelhos saíram da conta.
          </Alert>
          <Link className="rc-btn rc-btn-primary rc-btn-lg rc-btn-full" to={ROTA_ENTRAR}>
            Entrar
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="rc-login-heading">Nova senha</h1>
      <p className="rc-login-lead">Crie a senha nova da sua conta.</p>
      <form className="rc-login-fields" onSubmit={enviar} aria-label="Nova senha" noValidate>
        <TextField
          label="Senha nova"
          name="senha"
          type="password"
          size="lg"
          autoComplete="new-password"
          hint={`Pelo menos ${SENHA_MINIMA} caracteres.`}
          error={erros.senha}
          required
        />
        <TextField
          label="Repita a senha nova"
          name="repeticao"
          type="password"
          size="lg"
          autoComplete="new-password"
          error={erros.repeticao}
          required
        />
        {troca.isError && (
          <Alert tone="danger" title="Senha não alterada">
            {mensagemDoErro(troca.error)}
          </Alert>
        )}
        <Button type="submit" variant="primary" size="lg" full loading={troca.isPending} loadingLabel="Salvando">
          Salvar senha nova
        </Button>
      </form>
    </>
  );
};

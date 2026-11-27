import { Alert, Button, TextField } from '@recreio/design-system';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { ApiError } from '@/shared/api/http-client.ts';
import { caminhoNaEscola } from '@/shared/layout/navegacao.ts';
import { caminhoDeVolta } from '@/shared/sessao/destino.ts';
import { useEscolaDaRotaOpcional } from '@/shared/sessao/escola-da-rota.ts';
import { entrar } from '@/shared/sessao/sessao.api.ts';
import { useSessao } from '@/shared/sessao/useSessao.ts';

type Credenciais = { email: string; senha: string };

/** Mensagem pelo `code` da resposta. Erro diz o que aconteceu e o que fazer agora. */
const mensagemDoErro = (erro: Error) => {
  const codigo = erro instanceof ApiError ? erro.code : undefined;
  if (codigo === 'INVALID_EMAIL_OR_PASSWORD') return 'E-mail ou senha não conferem. Confira os dois e tente de novo.';
  if (codigo === 'EMAIL_NOT_VERIFIED') {
    return 'Confirme seu e-mail antes de entrar. Enviamos um link novo para a sua caixa de entrada.';
  }
  if (codigo === 'LIMITE_EXCEDIDO') return 'Muitas tentativas seguidas. Espere 1 minuto e tente de novo.';
  return 'Não conseguimos entrar agora. Confira a internet e tente de novo.';
};

const lerCredenciais = (form: HTMLFormElement): Credenciais => {
  const dados = new FormData(form);
  return { email: String(dados.get('email') ?? '').trim(), senha: String(dados.get('senha') ?? '') };
};

/** Entrada com e-mail e senha, em `/entrar` ou `/:escola/entrar`. Um login vale para todas as escolas. Fonte: `Main` (desktop) e `Celular-Entrar` (celular). */
export const EntrarPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [busca] = useSearchParams();
  const escola = useEscolaDaRotaOpcional();
  const destino = caminhoDeVolta(busca.get('voltar')) ?? (escola ? caminhoNaEscola(escola, '/') : '/');
  const { data: sessao } = useSessao();

  const login = useMutation({
    mutationFn: ({ email, senha }: Credenciais) => entrar(email, senha),
    onSuccess: async () => {
      // A conta nova não pode ver dado em cache da anterior.
      queryClient.clear();
      await navigate(destino, { replace: true });
    },
  });

  if (sessao?.situacao === 'ativa' && !login.isPending) return <Navigate to={destino} replace />;

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    login.mutate(lerCredenciais(evento.currentTarget));
  };

  return (
    <>
      <h1 className="rc-login-heading">Entrar</h1>
      <p className="rc-login-lead">Use o e-mail e a senha cadastrados na escola.</p>
      <form className="rc-login-fields" onSubmit={enviar} aria-label="Entrar">
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
        <TextField label="Senha" name="senha" type="password" size="lg" autoComplete="current-password" required />
        {login.isError && (
          <Alert tone="danger" title="Não foi possível entrar">
            {mensagemDoErro(login.error)}
          </Alert>
        )}
        <Button type="submit" variant="primary" size="lg" full loading={login.isPending} loadingLabel="Entrando">
          Entrar
        </Button>
        <Link className="rc-link" to="/esqueci-senha">
          Esqueci a senha
        </Link>
        <p className="rc-login-note">Primeiro acesso? O convite chegou no e-mail informado na matrícula.</p>
      </form>
    </>
  );
};

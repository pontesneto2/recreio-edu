# 0007. Autenticação com Better Auth e sessão em cookie

- Status: aceita
- Data: 2026-11-27

## Contexto

Os usuários são responsáveis, alunos, professores e equipe da escola. Uma mesma pessoa pode ter vários perfis (mãe e professora). O portal e a API ficam no mesmo domínio da escola.

## Decisão

- Better Auth na API, com adaptador Drizzle e tabelas no mesmo PostgreSQL.
- Login por e-mail e senha no início; passkeys e login social entram depois, pela mesma biblioteca.
- Sessão em cookie `httpOnly`, `Secure`, `SameSite=Lax`. Nenhum token fica em `localStorage`.
- Um usuário pertence a uma escola por vínculo (`vinculos`: usuário, escola, perfil). Perfis: `responsavel`, `aluno`, `professor`, `secretaria`, `financeiro`, `portaria`, `coordenacao`, `direcao`.
- Permissões por módulo e ação (`ver`, `criar`, `editar`, `excluir`, `aprovar`), checadas num middleware da API antes do controller.

## Consequências

- O portal não guarda credencial; só chama a API com `credentials: 'include'`.
- Troca de perfil não exige novo login.
- Senhas usam o hash padrão da biblioteca (scrypt); política de senha e limite de tentativas ficam configurados na API.

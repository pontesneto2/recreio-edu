import { alunoSchema, escolaPublicaSchema, escolaSchema, euSchema, type Problem } from '@recreio/contracts';

/**
 * Respostas fixas da API para o e2e e o Lighthouse. Passam pelos schemas do contrato:
 * quando o formato muda, o teste para aqui com o campo errado, antes de abrir o navegador.
 */
export const ESCOLA = escolaSchema.parse({
  nome: 'Colégio Recreio',
  cnpj: '07.412.386/0001-52',
  cidade: 'Fortaleza',
  corMarca: '#0067CC',
  hoje: '2026-11-25',
  unidades: [
    { id: '6f1c1c1e-2b7d-4c3a-8e9f-1a2b3c4d5e6f', nome: 'Unidade Aldeota', alunos: 1248 },
    { id: '9a3e5b7c-1d2f-4e6a-8b0c-3d5f7a9b1c2e', nome: 'Unidade Eusébio', alunos: 936 },
  ],
});

export const ALUNOS = alunoSchema.array().parse([
  {
    id: '0d4b7a52-6c1e-4f0a-9d3b-2f5e8c7a0318',
    nome: 'Davi Lima',
    turma: '2º ano B',
    turno: 'Manhã',
    matricula: '2024-0318',
    mensalidadeCentavos: 148000,
  },
  {
    id: '4c8e2a6b-9f1d-4b3e-a5c7-0e2f4a6c0127',
    nome: 'Helena Rocha',
    turma: '5º ano A',
    turno: 'Tarde',
    matricula: '2023-0127',
    mensalidadeCentavos: 162000,
  },
]);

/** Slug da escola das telas (ADR 0011). As rotas do portal começam por ele. */
export const SLUG = 'colegio-recreio';

/** Caminho do portal na escola: `naEscola('/familia')` vira `/colegio-recreio/familia`. */
export const naEscola = (caminho = '') => `/${SLUG}${caminho}`;

export const ESCOLA_PUBLICA = escolaPublicaSchema.parse({
  slug: SLUG,
  nome: ESCOLA.nome,
  cidade: ESCOLA.cidade,
  corMarca: ESCOLA.corMarca,
});

/** Sessão de demonstração: uma pessoa com os 4 perfis do portal no Colégio Recreio. */
export const EU = euSchema.parse({
  usuario: {
    id: 'demonstracao',
    nome: 'Fernanda Lima',
    email: 'fernanda.lima@colegiorecreio.test',
    emailVerificado: true,
  },
  escolas: [{ slug: SLUG, nome: ESCOLA.nome, perfis: ['responsavel', 'aluno', 'professor', 'direcao'] }],
});

/** Corpo de resposta por caminho de `/api/v1`. */
export const RESPOSTAS: Record<string, unknown> = {
  '/api/v1/eu': EU,
  [`/api/v1/escolas/${SLUG}`]: ESCOLA,
  [`/api/v1/escolas/${SLUG}/publica`]: ESCOLA_PUBLICA,
  [`/api/v1/escolas/${SLUG}/alunos`]: ALUNOS,
};

/** Erro 404 no formato da API (RFC 9457) para um caminho fora de `RESPOSTAS`. */
export const naoEncontrado = (caminho: string): Problem => ({
  type: 'https://recreio.app/problemas/nao-encontrado',
  title: 'Recurso não encontrado',
  status: 404,
  detail: `Rota GET ${caminho} não encontrada.`,
  instance: caminho,
  code: 'NAO_ENCONTRADO',
});

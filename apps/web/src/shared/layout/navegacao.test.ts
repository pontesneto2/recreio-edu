import { NAVEGACAO_ESCOLA } from '../config/navigation/escola.ts';
import { NAVEGACAO_FAMILIA } from '../config/navigation/familia.ts';
import { NAVEGACOES, PERFIS } from '../config/navigation/index.ts';
import { encontrarAtivoDaBarra, encontrarItemAtivo, itensDaBarraInferior, itensDoMenu } from './navegacao.ts';

describe('navegação por perfil', () => {
  test('a entrada do perfil só fica ativa na própria rota', () => {
    expect(encontrarItemAtivo(NAVEGACAO_ESCOLA, '/escola')?.id).toBe('painel');
    expect(encontrarItemAtivo(NAVEGACAO_ESCOLA, '/escola/alunos/davi')?.id).toBe('alunos');
    expect(encontrarItemAtivo(NAVEGACAO_ESCOLA, '/escola/nao-existe')).toBeUndefined();
  });

  test('a barra inferior marca "Mais" fora dos destinos fixos', () => {
    expect(encontrarAtivoDaBarra(NAVEGACAO_FAMILIA, '/familia/chat')).toBe('chat');
    expect(encontrarAtivoDaBarra(NAVEGACAO_FAMILIA, '/familia/boletim')).toBe('mais');
    expect(itensDaBarraInferior(NAVEGACAO_FAMILIA).map((item) => item.label)).toEqual([
      'Hoje',
      'Agenda',
      'Financeiro',
      'Chat',
      'Mais',
    ]);
  });

  test.each(PERFIS)('%s: ids e rotas do menu não se repetem e a barra aponta para itens existentes', (perfil) => {
    const navegacao = NAVEGACOES[perfil];
    const itens = itensDoMenu(navegacao);
    const ids = itens.map((item) => item.id);
    const hrefs = itens.map((item) => item.href);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(itens[0]?.href).toBe(navegacao.base);
    for (const { id } of navegacao.barraInferior) expect(ids).toContain(id);
  });
});

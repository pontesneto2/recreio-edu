import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { emailJobSchema } from './email-job.ts';
import { escaparHtml, renderizarEmail } from './modelos.ts';

describe('modelos de e-mail', () => {
  test('boas-vindas traz nome, escola e link no texto e no HTML', () => {
    const mensagem = renderizarEmail({
      modelo: 'boas-vindas',
      para: 'fernanda@exemplo.com',
      variaveis: { nome: 'Fernanda', escola: 'Colégio Recreio', linkAcesso: 'https://colegiorecreio.recreio.app/' },
    });
    assert.equal(mensagem.assunto, 'Boas-vindas ao portal do Colégio Recreio');
    assert.match(mensagem.texto, /^Olá, Fernanda\./);
    assert.match(mensagem.texto, /Entrar no portal: https:\/\/colegiorecreio\.recreio\.app\//);
    assert.match(mensagem.html, /<html lang="pt-BR">/);
    assert.match(mensagem.html, /<a href="https:\/\/colegiorecreio\.recreio\.app\/">Entrar no portal<\/a>/);
  });

  test('as variáveis entram escapadas no HTML e intactas no texto', () => {
    const mensagem = renderizarEmail({
      modelo: 'boas-vindas',
      para: 'a@exemplo.com',
      variaveis: { nome: '<script>x</script>', escola: 'A & B', linkAcesso: 'https://a.recreio.app/?x="1"' },
    });
    assert.doesNotMatch(mensagem.html, /<script>/);
    assert.match(mensagem.html, /&lt;script&gt;x&lt;\/script&gt;/);
    assert.match(mensagem.html, /A &amp; B/);
    assert.match(mensagem.texto, /<script>x<\/script>/);
  });

  test('escaparHtml troca os 5 caracteres especiais', () => {
    assert.equal(escaparHtml(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
  });

  test('o schema recusa link que não é http nem https', () => {
    const resultado = emailJobSchema.safeParse({
      modelo: 'boas-vindas',
      para: 'a@exemplo.com',
      variaveis: { nome: 'A', escola: 'B', linkAcesso: 'javascript:alert(1)' },
    });
    assert.equal(resultado.success, false);
  });
});

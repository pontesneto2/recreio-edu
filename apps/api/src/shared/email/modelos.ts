import type { EmailJob, ModeloEmail } from './email-job.ts';

/** E-mail pronto para envio: assunto, versão em texto puro e versão em HTML. */
export type Mensagem = { assunto: string; texto: string; html: string };

type Conteudo = {
  assunto: string;
  saudacao: string;
  paragrafos: string[];
  acao?: { rotulo: string; url: string };
};

type VariaveisDe<M extends ModeloEmail> = Extract<EmailJob, { modelo: M }>['variaveis'];

const ENTIDADES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Troca os caracteres especiais do HTML. Toda variável passa por aqui antes de entrar no HTML. */
export const escaparHtml = (texto: string) => texto.replace(/[&<>"']/g, (caractere) => ENTIDADES[caractere] ?? '');

const RODAPE = 'Este e-mail foi enviado pelo Recreio. Não responda esta mensagem.';

/** Monta texto e HTML com a mesma estrutura: saudação, parágrafos, botão opcional e rodapé. */
export const montarMensagem = ({ assunto, saudacao, paragrafos, acao }: Conteudo): Mensagem => {
  const texto = [saudacao, ...paragrafos, ...(acao ? [`${acao.rotulo}: ${acao.url}`] : []), '--', RODAPE].join('\n\n');
  const corpo = [
    `<p>${escaparHtml(saudacao)}</p>`,
    ...paragrafos.map((paragrafo) => `<p>${escaparHtml(paragrafo)}</p>`),
    acao ? `<p><a href="${escaparHtml(acao.url)}">${escaparHtml(acao.rotulo)}</a></p>` : '',
    `<hr><p style="color:#666;font-size:12px">${escaparHtml(RODAPE)}</p>`,
  ].join('\n');
  const html = `<!doctype html>\n<html lang="pt-BR"><head><meta charset="utf-8"><title>${escaparHtml(assunto)}</title></head>\n<body style="font-family:sans-serif;line-height:1.5">\n${corpo}\n</body></html>\n`;
  return { assunto, texto, html };
};

/** Um modelo por tipo de e-mail. O texto fica em português e as variáveis chegam já validadas. */
const modelos: { [M in ModeloEmail]: (variaveis: VariaveisDe<M>) => Mensagem } = {
  'boas-vindas': ({ nome, escola, linkAcesso }) =>
    montarMensagem({
      assunto: `Boas-vindas ao portal do ${escola}`,
      saudacao: `Olá, ${nome}.`,
      paragrafos: [
        `Seu acesso ao portal do ${escola} está pronto.`,
        'Use o botão abaixo para entrar pela primeira vez.',
      ],
      acao: { rotulo: 'Entrar no portal', url: linkAcesso },
    }),
  teste: ({ origem }) =>
    montarMensagem({
      assunto: 'E-mail de teste do Recreio',
      saudacao: 'Olá.',
      paragrafos: [`Este é um e-mail de teste enviado por ${origem}.`, 'Se ele chegou, a fila de e-mails funciona.'],
    }),
};

/** Mensagem pronta do modelo da tarefa. */
export const renderizarEmail = <J extends EmailJob>(job: J): Mensagem =>
  (modelos[job.modelo] as (variaveis: J['variaveis']) => Mensagem)(job.variaveis);

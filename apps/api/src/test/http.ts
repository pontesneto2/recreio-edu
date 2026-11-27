import { request } from 'node:http';

export type Resposta = { status: number; contentType: string; corpo: unknown };

/**
 * GET com cabeçalho Host próprio. O `fetch` do Node ignora Host, e a API
 * escolhe a escola por ele.
 */
export const requisitar = (porta: number, caminho: string, host: string): Promise<Resposta> =>
  new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port: porta, path: caminho, headers: { host } }, (res) => {
      let dados = '';
      res.setEncoding('utf8');
      res.on('data', (parte: string) => {
        dados += parte;
      });
      res.on('end', () => {
        const contentType = res.headers['content-type'] ?? '';
        const json = /json/.test(contentType) && dados !== '';
        resolve({ status: res.statusCode ?? 0, contentType, corpo: json ? JSON.parse(dados) : dados });
      });
    });
    req.on('error', reject);
    req.end();
  });

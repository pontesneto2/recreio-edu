import { Scalar } from '@scalar/express-api-reference';
import { Router } from 'express';
import { randomBytes } from 'node:crypto';

/** Versão fixa do bundle do Scalar no CDN, para a página não mudar sem um commit. */
const SCALAR_CDN = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.85.0';
const CDN_ORIGIN = 'https://cdn.jsdelivr.net';

/**
 * CSP só desta página. O resto da API mantém a CSP padrão do helmet.
 * Scripts precisam do nonce da requisição; estilos inline vêm do próprio Scalar.
 */
const apiReferenceCsp = (nonce: string) =>
  [
    "default-src 'self'",
    `script-src 'nonce-${nonce}' ${CDN_ORIGIN}`,
    `style-src 'self' 'unsafe-inline' ${CDN_ORIGIN}`,
    `font-src 'self' data: ${CDN_ORIGIN}`,
    "img-src 'self' data:",
    "connect-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
  ].join('; ');

/** Página navegável do OpenAPI (Scalar) que lê o documento em `specUrl`. */
export const createApiReferenceRouter = (specUrl: string) =>
  Router().get('/', (req, res, next) => {
    const nonce = randomBytes(16).toString('base64');
    res.setHeader('Content-Security-Policy', apiReferenceCsp(nonce));
    const render = Scalar({
      url: specUrl,
      cdn: SCALAR_CDN,
      nonce,
      pageTitle: 'API Recreio',
      withDefaultFonts: false,
      // Desliga os painéis e convites de serviços do Scalar. A página mostra só o documento e o cliente de teste.
      _integration: null,
      showDeveloperTools: 'never',
      agent: { disabled: true },
      mcp: { disabled: true },
    });
    // O Scalar tipa o handler com params `never`. Ele não lê `req`, então a conversão não muda nada.
    render(req as never, res, next);
  });

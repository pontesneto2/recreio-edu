import { Router } from 'express';
import type { AcessoMiddlewares } from '../autenticacao/acesso.middleware.ts';
import { createEscolaController } from './escola.controller.ts';
import type { EscolaService } from './escola.service.ts';

/**
 * Rotas da raiz de `/escolas/:escola`, depois do `resolverEscola`.
 * `/publica` fica aberta: a tela de entrada mostra nome e cor da escola antes do login.
 * `/` tem CNPJ e alunos por unidade, dados do painel, e exige `painel:ver`.
 */
export const createEscolaRouter = (service: EscolaService, acesso: AcessoMiddlewares) => {
  const controller = createEscolaController(service);
  return Router()
    .get('/publica', controller.obterPublica)
    .get('/', acesso.exigirPermissao('painel', 'ver'), controller.obter);
};

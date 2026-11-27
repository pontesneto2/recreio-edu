import { Router } from 'express';
import type { AcessoMiddlewares } from './acesso.middleware.ts';
import type { AcessoRepository } from './acesso.repository.ts';
import { createEuController } from './eu.controller.ts';

/** `/eu` é global: um login vale para todas as escolas (ADR 0011). */
export const createEuRouter = (repositorio: AcessoRepository, acesso: AcessoMiddlewares) => {
  const controller = createEuController(repositorio);
  return Router().get('/', acesso.exigirLogin, controller.obter);
};

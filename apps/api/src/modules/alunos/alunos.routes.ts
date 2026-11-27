import { Router } from 'express';
import type { AcessoMiddlewares } from '../autenticacao/acesso.middleware.ts';
import { createAlunosController } from './alunos.controller.ts';
import type { AlunosService } from './alunos.service.ts';

export const createAlunosRouter = (service: AlunosService, acesso: AcessoMiddlewares) => {
  const controller = createAlunosController(service);
  return Router()
    .use(acesso.exigirPermissao('alunos', 'ver'))
    .get('/', controller.listar)
    .get('/:id', controller.buscarPorId);
};

import { Router } from 'express';
import { createAlunosController } from './alunos.controller.ts';
import type { AlunosService } from './alunos.service.ts';

export const createAlunosRouter = (service: AlunosService) => {
  const controller = createAlunosController(service);
  return Router().get('/', controller.listar).get('/:id', controller.buscarPorId);
};

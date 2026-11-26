import { Router } from 'express';
import { createEscolaController } from './escola.controller.ts';
import type { EscolaService } from './escola.service.ts';

export const createEscolaRouter = (service: EscolaService) => {
  const controller = createEscolaController(service);
  return Router().get('/', controller.obter);
};

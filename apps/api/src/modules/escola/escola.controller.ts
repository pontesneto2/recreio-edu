import type { RequestHandler } from 'express';
import type { EscolaService } from './escola.service.ts';

export const createEscolaController = (service: EscolaService) => {
  const obter: RequestHandler = async (_req, res) => {
    res.json(await service.obter());
  };

  return { obter };
};

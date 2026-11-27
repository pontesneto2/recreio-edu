import type { RequestHandler } from 'express';
import { escolaDaRequisicao } from '../../shared/tenant/resolver-escola.ts';
import type { EscolaService } from './escola.service.ts';

export const createEscolaController = (service: EscolaService) => {
  const obter: RequestHandler = async (_req, res) => {
    res.json(await service.obter(escolaDaRequisicao(res)));
  };

  const obterPublica: RequestHandler = async (_req, res) => {
    res.json(await service.obterPublica(escolaDaRequisicao(res)));
  };

  return { obter, obterPublica };
};

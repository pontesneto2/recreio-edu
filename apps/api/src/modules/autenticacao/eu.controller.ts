import type { Eu } from '@recreio/contracts';
import type { RequestHandler } from 'express';
import { usuarioDaRequisicao } from './acesso.middleware.ts';
import type { AcessoRepository } from './acesso.repository.ts';

export const createEuController = (repositorio: AcessoRepository) => {
  const obter: RequestHandler = async (_req, res) => {
    const usuario = usuarioDaRequisicao(res);
    const eu: Eu = { usuario, escolas: await repositorio.escolasDoUsuario(usuario.id) };
    res.json(eu);
  };

  return { obter };
};

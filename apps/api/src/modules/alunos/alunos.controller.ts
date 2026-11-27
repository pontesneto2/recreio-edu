import { alunoIdSchema } from '@recreio/contracts';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { parseInput } from '../../shared/http/parse.ts';
import type { AlunosService } from './alunos.service.ts';

/** Parâmetros de `/alunos/:id`. O `alunos.openapi.ts` documenta o mesmo schema. */
export const alunoParamsSchema = z.object({ id: alunoIdSchema.meta({ description: 'Identificador do aluno.' }) });

export const createAlunosController = (service: AlunosService) => {
  const listar: RequestHandler = async (_req, res) => {
    res.json(await service.listar());
  };

  const buscarPorId: RequestHandler = async (req, res) => {
    const { id } = parseInput(alunoParamsSchema, req.params);
    res.json(await service.buscarPorId(id));
  };

  return { listar, buscarPorId };
};

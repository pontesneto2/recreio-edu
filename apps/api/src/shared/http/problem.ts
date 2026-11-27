import type { Problem, ProblemCode } from '@recreio/contracts';
import type { Request, Response } from 'express';
import type { FieldErrors } from '../errors/app-error.ts';
import { problemTypes, problemTypeUrl } from '../errors/problem-types.ts';

export const PROBLEM_CONTENT_TYPE = 'application/problem+json';

/** Monta o corpo RFC 9457 de um código do catálogo. */
export const createProblem = (
  code: ProblemCode,
  { detail, instance, errors }: { detail?: string; instance?: string; errors?: FieldErrors },
): Problem => ({
  type: problemTypeUrl(code),
  title: problemTypes[code].title,
  status: problemTypes[code].status,
  detail,
  instance,
  code,
  errors,
});

/** Caminho da requisição sem a query string, usado em `instance`. A query pode ter dado pessoal. */
export const requestInstance = (req: Request) => req.originalUrl.replace(/\?.*$/, '');

export const sendProblem = (res: Response, problem: Problem) => {
  res.status(problem.status).type(PROBLEM_CONTENT_TYPE).json(problem);
};

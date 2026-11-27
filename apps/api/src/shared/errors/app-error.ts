import type { ProblemCode } from '@recreio/contracts';
import { problemTypes } from './problem-types.ts';

/** Mensagens de validação por campo. A chave é o caminho do campo com pontos (`responsavel.cpf`). */
export type FieldErrors = Record<string, string[]>;

/** Erro de domínio com código estável. O tratador de erros converte em `application/problem+json`. */
export class AppError extends Error {
  readonly code: ProblemCode;
  readonly status: number;
  readonly errors?: FieldErrors;

  constructor(code: ProblemCode, detail: string, options: { errors?: FieldErrors; cause?: unknown } = {}) {
    super(detail, { cause: options.cause });
    this.name = 'AppError';
    this.code = code;
    this.status = problemTypes[code].status;
    this.errors = options.errors;
  }
}

export class NotFoundError extends AppError {
  constructor(detail: string) {
    super('NAO_ENCONTRADO', detail);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(detail: string, errors?: FieldErrors) {
    super('DADOS_INVALIDOS', detail, { errors });
    this.name = 'ValidationError';
  }
}

export class TooManyRequestsError extends AppError {
  constructor(detail: string) {
    super('LIMITE_EXCEDIDO', detail);
    this.name = 'TooManyRequestsError';
  }
}

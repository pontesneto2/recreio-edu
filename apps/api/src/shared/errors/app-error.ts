/** Erro de domínio com status HTTP e código estável que o portal pode tratar. */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, options: { statusCode?: number; code?: string; details?: unknown } = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = options.statusCode ?? 500;
    this.code = options.code ?? 'ERRO_INTERNO';
    this.details = options.details;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, { statusCode: 404, code: 'NAO_ENCONTRADO' });
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, { statusCode: 400, code: 'DADOS_INVALIDOS', details });
    this.name = 'ValidationError';
  }
}

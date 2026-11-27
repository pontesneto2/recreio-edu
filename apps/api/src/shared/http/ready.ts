import type { RequestHandler } from 'express';

export type Verificacao = () => Promise<void>;

/** `desligado`: a dependência não foi configurada neste processo (testes sem Redis). */
export type EstadoDependencia = 'ok' | 'indisponivel' | 'desligado';

export type Prontidao = {
  status: 'ok' | 'indisponivel';
  dependencias: { postgres: EstadoDependencia; redis: EstadoDependencia };
};

export type VerificacoesProntidao = {
  postgres: Verificacao;
  redis?: Verificacao;
};

const TIMEOUT_PADRAO_MS = 3_000;

const comLimite = async (verificacao: Verificacao, timeoutMs: number) => {
  let timer: NodeJS.Timeout | undefined;
  const limite = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`sem resposta em ${timeoutMs} ms`)), timeoutMs);
  });
  try {
    await Promise.race([verificacao(), limite]);
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Readiness: confere Postgres e Redis em paralelo. Responde 200 com todas no ar e 503 com
 * alguma fora. O corpo diz qual dependência falhou. O motivo vai só para o log.
 */
export const createReadyHandler =
  (verificacoes: VerificacoesProntidao, timeoutMs = TIMEOUT_PADRAO_MS): RequestHandler =>
  async (req, res) => {
    const conferir = async (nome: string, verificacao: Verificacao | undefined): Promise<EstadoDependencia> => {
      if (!verificacao) return 'desligado';
      try {
        await comLimite(verificacao, timeoutMs);
        return 'ok';
      } catch (err) {
        req.log.warn({ err, dependencia: nome }, 'dependência indisponível');
        return 'indisponivel';
      }
    };
    const [postgres, redis] = await Promise.all([
      conferir('postgres', verificacoes.postgres),
      conferir('redis', verificacoes.redis),
    ]);
    const corpo: Prontidao = {
      status: postgres === 'indisponivel' || redis === 'indisponivel' ? 'indisponivel' : 'ok',
      dependencias: { postgres, redis },
    };
    res.status(corpo.status === 'ok' ? 200 : 503).json(corpo);
  };

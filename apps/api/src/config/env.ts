import { z } from 'zod';

/** Valores do docker-compose.yml. Valem fora de produção quando a variável não existe. */
const PADRAO_LOCAL = {
  DATABASE_URL: 'postgres://recreio_app:recreio_app@localhost:5432/recreio',
  DATABASE_MIGRATION_URL: 'postgres://recreio:recreio@localhost:5432/recreio',
  AUTH_SECRET: 'recreio-dev-segredo-local-nao-use-em-producao',
} as const;

/**
 * Valor do `trust proxy` do Express: `true`/`false`, número de saltos ou lista de IPs e
 * nomes (`loopback`, `uniquelocal`, `10.0.0.0/8`).
 */
export const parseTrustProxy = (valor: string): boolean | number | string => {
  const texto = valor.trim();
  if (texto === 'true') return true;
  if (texto === 'false') return false;
  if (/^\d+$/.test(texto)) return Number(texto);
  return texto;
};

/** Proxy, Redis, filas, e-mail, arquivos e observabilidade. */
const infraSchema = {
  /** Proxies confiáveis para ler o IP do cliente em `X-Forwarded-For`. */
  TRUST_PROXY: z.string().min(1).default('loopback').transform(parseTrustProxy),
  /** Redis das filas e do contador do limite de requisições (ADR 0009). */
  REDIS_URL: z.url().optional(),
  /** Tarefas que o worker processa ao mesmo tempo em cada fila. */
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(100).default(5),
  /** Servidor SMTP. Mailpit no ambiente local. */
  SMTP_URL: z.url().optional(),
  /** Remetente dos e-mails. */
  EMAIL_FROM: z.string().min(3).default('Recreio <nao-responda@recreio.app>'),
  /** Endpoint compatível com S3 (ADR 0010). Sem valor em produção, o SDK usa o endpoint da AWS. */
  S3_ENDPOINT: z.url().optional(),
  /** Endpoint das URLs assinadas que o navegador recebe. Sem valor, vale `S3_ENDPOINT`. */
  S3_PUBLIC_ENDPOINT: z.url().optional(),
  S3_REGION: z.string().min(1).default('us-east-1'),
  /** Sem chave em produção, o SDK usa a cadeia padrão de credenciais (papel da instância). */
  S3_ACCESS_KEY: z.string().min(1).optional(),
  S3_SECRET_KEY: z.string().min(1).optional(),
  S3_BUCKET: z.string().min(3).optional(),
  /** Endereço `endpoint/bucket/chave`, exigido pelo RustFS. Padrão: ligado quando há `S3_ENDPOINT`. */
  S3_FORCE_PATH_STYLE: z.stringbool().optional(),
  /** Validade das URLs assinadas, em segundos. */
  S3_URL_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(300),
  /** Desliga o OpenTelemetry. O próprio SDK também lê esta variável. */
  OTEL_SDK_DISABLED: z.stringbool().default(false),
  /** Nome do serviço nos traces. Padrão: `recreio-api` ou `recreio-worker`. */
  OTEL_SERVICE_NAME: z.string().min(1).optional(),
  /** Coletor OTLP. Sem valor, o SDK usa `http://localhost:4318`. */
  OTEL_EXPORTER_OTLP_ENDPOINT: z.url().optional(),
  /** Projeto do Sentry. Sem valor, nenhum erro sai para o Sentry. */
  SENTRY_DSN: z.url().optional(),
  /** Ambiente mostrado no Sentry. Padrão: o valor de NODE_ENV. */
  SENTRY_ENVIRONMENT: z.string().min(1).optional(),
};

/** Valores do docker-compose.yml para as variáveis de infraestrutura, fora de produção. */
const PADRAO_LOCAL_INFRA = {
  REDIS_URL: 'redis://localhost:6379',
  SMTP_URL: 'smtp://localhost:1025',
  S3_ENDPOINT: 'http://localhost:9000',
  S3_ACCESS_KEY: 'recreio',
  S3_SECRET_KEY: 'recreio-storage',
  S3_BUCKET: 'recreio',
} as const;

const INFRA_OBRIGATORIAS_EM_PRODUCAO = ['REDIS_URL', 'SMTP_URL', 'S3_BUCKET'] as const;

type InfraBruta = z.output<z.ZodObject<typeof infraSchema>> & { NODE_ENV: string };

/** Aplica os padrões locais e exige as variáveis de produção. */
const resolverInfra = (raw: InfraBruta, ctx: z.RefinementCtx) => {
  const producao = raw.NODE_ENV === 'production';
  for (const chave of INFRA_OBRIGATORIAS_EM_PRODUCAO) {
    if (producao && !raw[chave]) {
      ctx.addIssue({ code: 'custom', path: [chave], message: `${chave} é obrigatória em produção.` });
    }
  }
  const local = <K extends keyof typeof PADRAO_LOCAL_INFRA>(chave: K) =>
    producao ? undefined : PADRAO_LOCAL_INFRA[chave];
  const s3Endpoint = raw.S3_ENDPOINT ?? local('S3_ENDPOINT');
  return {
    // Nos testes o Redis vem do container de teste. Sem REDIS_URL, o limite conta em memória.
    REDIS_URL: raw.REDIS_URL ?? (raw.NODE_ENV === 'development' ? PADRAO_LOCAL_INFRA.REDIS_URL : undefined),
    SMTP_URL: raw.SMTP_URL ?? PADRAO_LOCAL_INFRA.SMTP_URL,
    S3_ENDPOINT: s3Endpoint,
    S3_ACCESS_KEY: raw.S3_ACCESS_KEY ?? local('S3_ACCESS_KEY'),
    S3_SECRET_KEY: raw.S3_SECRET_KEY ?? local('S3_SECRET_KEY'),
    S3_BUCKET: raw.S3_BUCKET ?? PADRAO_LOCAL_INFRA.S3_BUCKET,
    S3_FORCE_PATH_STYLE: raw.S3_FORCE_PATH_STYLE ?? Boolean(s3Endpoint),
    SENTRY_ENVIRONMENT: raw.SENTRY_ENVIRONMENT ?? raw.NODE_ENV,
  };
};

/** Lista separada por vírgula, sem itens vazios. */
const listaDeTexto = z.string().transform((valor) =>
  valor
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
);

/** Autenticação (ADR 0007) e seed. */
const autenticacaoEnv = {
  /** Segredo que assina cookies e tokens do Better Auth, com 32 caracteres ou mais. Obrigatório em produção. */
  AUTH_SECRET: z.string().min(32).optional(),
  /** Origem do portal. Os links dos e-mails usam esta origem quando a requisição não traz uma confiável. */
  AUTH_URL: z.url().default('http://localhost:5173'),
  /** Origens aceitas no login, separadas por vírgula. Aceita curinga de subdomínio: `https://*.recreio.app`. */
  AUTH_TRUSTED_ORIGINS: listaDeTexto.default(['http://localhost:5173']),
  /** Tentativas por minuto por IP em entrar, cadastrar e pedir troca de senha. Em NODE_ENV=test fica desligado. */
  AUTH_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(10),
  /** Senha das contas de demonstração do seed. O seed não roda em produção. */
  SEED_SENHA_PADRAO: z.string().min(10).optional(),
};

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3333),
    CORS_ORIGIN: z.url().default('http://localhost:5173'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
    /** Requisições por minuto por IP em `/api/v1`. Em NODE_ENV=test o limite fica desligado. */
    RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(300),
    /** Conexão da API como recreio_app, sujeita às políticas de RLS. */
    DATABASE_URL: z.url().optional(),
    /** Conexão das migrações e do seed como recreio, dono das tabelas. */
    DATABASE_MIGRATION_URL: z.url().optional(),
    ...infraSchema,
    ...autenticacaoEnv,
  })
  .transform((raw, ctx) => {
    for (const chave of ['DATABASE_URL', 'DATABASE_MIGRATION_URL', 'AUTH_SECRET'] as const) {
      if (raw.NODE_ENV === 'production' && !raw[chave]) {
        ctx.addIssue({ code: 'custom', path: [chave], message: `${chave} é obrigatória em produção.` });
      }
    }
    return {
      ...raw,
      DATABASE_URL: raw.DATABASE_URL ?? PADRAO_LOCAL.DATABASE_URL,
      DATABASE_MIGRATION_URL: raw.DATABASE_MIGRATION_URL ?? PADRAO_LOCAL.DATABASE_MIGRATION_URL,
      ...resolverInfra(raw, ctx),
      AUTH_SECRET: raw.AUTH_SECRET ?? PADRAO_LOCAL.AUTH_SECRET,
    };
  });

export type Env = z.output<typeof envSchema>;

/** Lê e valida as variáveis. Os testes chamam com um objeto próprio. */
export const parseEnv = (variaveis: NodeJS.ProcessEnv): Env => envSchema.parse(variaveis);

export const env: Env = parseEnv(process.env);

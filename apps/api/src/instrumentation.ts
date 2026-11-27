// Carregado antes do app com `node --import ./src/instrumentation.ts` (dist/instrumentation.js na imagem).
// Liga o OpenTelemetry e, com SENTRY_DSN, o Sentry. Os módulos instrumentados só podem ser
// importados depois deste arquivo, por isso ele não importa nada da aplicação além do env.
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { NodeSDK } from '@opentelemetry/sdk-node';
import * as Sentry from '@sentry/node';
import { register } from 'import-in-the-middle/register-hooks.mjs';
import { basename } from 'node:path';
import { env } from './config/env.ts';

/** Módulos que o hook de ESM intercepta. Os demais carregam sem invólucro. */
const MODULOS_INSTRUMENTADOS = ['http', 'https', 'node:http', 'node:https', 'express', 'pg', 'ioredis', 'pino'];

const servicoPadrao = () => (basename(process.argv[1] ?? '').startsWith('worker') ? 'recreio-worker' : 'recreio-api');

const iniciarOpenTelemetry = () => {
  // Só traces. Logs continuam no stdout (pino) e métricas ficam para depois.
  process.env.OTEL_LOGS_EXPORTER ??= 'none';
  process.env.OTEL_METRICS_EXPORTER ??= 'none';

  register({ include: MODULOS_INSTRUMENTADOS });

  const sdk = new NodeSDK({
    serviceName: env.OTEL_SERVICE_NAME ?? servicoPadrao(),
    instrumentations: [
      new HttpInstrumentation({
        // Healthcheck e readiness a cada poucos segundos não viram trace.
        ignoreIncomingRequestHook: (req) => /^\/api\/(health|ready)(\?|$)/.test(req.url ?? ''),
      }),
      new ExpressInstrumentation(),
      new PgInstrumentation({ enhancedDatabaseReporting: false }),
      new IORedisInstrumentation(),
      // Põe trace_id e span_id em cada linha do pino. Os logs não saem pelo OTLP.
      new PinoInstrumentation({ disableLogSending: true }),
    ],
  });
  sdk.start();

  const encerrar = () => {
    sdk.shutdown().catch(() => undefined);
  };
  process.once('SIGTERM', encerrar);
  process.once('SIGINT', encerrar);
};

if (!env.OTEL_SDK_DISABLED) iniciarOpenTelemetry();

if (env.SENTRY_DSN) {
  // Só erros. Os traces ficam no OpenTelemetry acima, então o Sentry não registra outro provedor.
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT,
    enableOpenTelemetrySetup: false,
  });
}

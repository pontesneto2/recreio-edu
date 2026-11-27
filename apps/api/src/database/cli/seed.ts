import { env } from '../../config/env.ts';
import { logger } from '../../shared/logger/logger.ts';
import { seedDadosCanonicos } from '../seed/seed.ts';

const escolaId = await seedDadosCanonicos(env.DATABASE_MIGRATION_URL, env.DEV_ESCOLA_DOMINIO);
logger.info({ escolaId, dominio: env.DEV_ESCOLA_DOMINIO }, 'seed aplicado');

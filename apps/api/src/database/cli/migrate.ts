import { env } from '../../config/env.ts';
import { logger } from '../../shared/logger/logger.ts';
import { migrarBanco } from '../migrator.ts';

await migrarBanco(env.DATABASE_MIGRATION_URL);
logger.info('migrações aplicadas');

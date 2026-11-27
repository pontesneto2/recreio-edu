import { env } from '../../config/env.ts';
import { logger } from '../../shared/logger/logger.ts';
import { seedDadosCanonicos } from '../seed/seed.ts';

// As contas de demonstração têm senha conhecida. Em produção, o seed não roda.
if (env.NODE_ENV === 'production') {
  throw new Error('db:seed grava contas com senha conhecida e não roda em produção.');
}
if (!env.SEED_SENHA_PADRAO) {
  logger.warn('SEED_SENHA_PADRAO vazia: o seed grava a escola sem as contas de demonstração.');
}

const escolaId = await seedDadosCanonicos(env.DATABASE_MIGRATION_URL, {
  senhaPadrao: env.SEED_SENHA_PADRAO,
});
logger.info({ escolaId }, 'seed aplicado');

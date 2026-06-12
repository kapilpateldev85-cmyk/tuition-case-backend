import { execSync } from 'child_process';
import { Logger } from '@nestjs/common';

const logger = new Logger('Migrations');

/**
 * Applies pending Prisma migrations before the app starts.
 * Set SKIP_MIGRATIONS=true to disable (e.g. when migrations run in CI/CD separately).
 */
export function runMigrations(): void {
  if (process.env.SKIP_MIGRATIONS === 'true') {
    logger.log('Skipping database migrations (SKIP_MIGRATIONS=true)');
    return;
  }

  logger.log('Applying database migrations...');
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: process.env,
  });
  logger.log('Database migrations applied successfully');
}

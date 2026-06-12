import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    await this.verifySchema();
    this.logger.log('Database connection established');
  }

  /** Fail fast with a clear message if migrations were never applied. */
  private async verifySchema(): Promise<void> {
    try {
      await this.$queryRaw`SELECT 1 FROM "User" LIMIT 1`;
    } catch {
      throw new Error(
        'Database schema is missing. Run: npm run db:migrate (or restart the server to auto-apply migrations).',
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }
}

/**
 * Database seed — intentionally empty.
 *
 * Demo data is not required for production. Users register via the app
 * (POST /auth/register) or Swagger (/api/docs).
 *
 * To wipe all data: npm run db:clear
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('ℹ️  Seed skipped — no demo data configured.');
  console.log('   Create accounts via the app sign-up page or POST /auth/register.');
  console.log('   To clear existing data: npm run db:clear');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

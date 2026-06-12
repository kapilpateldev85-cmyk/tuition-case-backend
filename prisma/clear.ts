/**
 * Removes all application data from the database.
 * Schema and migrations are kept — only rows are deleted.
 *
 * Usage: npm run db:clear
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Clearing all data from the database...\n');

  const deleted = await prisma.$transaction([
    prisma.document.deleteMany(),
    prisma.tutorDocument.deleteMany(),
    prisma.caseInvitation.deleteMany(),
    prisma.case.deleteMany(),
    prisma.parent.deleteMany(),
    prisma.tutor.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log('Deleted records:');
  console.log(`  - Documents:          ${deleted[0].count}`);
  console.log(`  - Tutor documents:    ${deleted[1].count}`);
  console.log(`  - Case invitations:   ${deleted[2].count}`);
  console.log(`  - Cases:              ${deleted[3].count}`);
  console.log(`  - Parents:            ${deleted[4].count}`);
  console.log(`  - Tutors:             ${deleted[5].count}`);
  console.log(`  - Users:              ${deleted[6].count}`);
  console.log('\n✅ Database is empty. Register new accounts via POST /auth/register or the app sign-up page.');
}

main()
  .catch((error) => {
    console.error('❌ Clear failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

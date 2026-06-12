import { PrismaService } from '../../database/prisma.service';

/**
 * Resolves Tutor.id from User.id.
 * CaseInvitation.tutorId references Tutor.id, not User.id.
 */
export async function getTutorProfileId(
  prisma: PrismaService,
  userId: string,
): Promise<string | null> {
  const tutor = await prisma.tutor.findUnique({
    where: { userId },
    select: { id: true },
  });

  return tutor?.id ?? null;
}

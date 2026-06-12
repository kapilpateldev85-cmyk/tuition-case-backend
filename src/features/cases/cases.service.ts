import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateCaseDto,
  UpdateCaseDto,
  SearchCasesDto,
  CaseDto,
} from './dto/case.dto';
import { Role, InvitationStatus } from '@prisma/client';
import { createPaginatedResponse } from '../../common/dto/pagination.dto';
import { getTutorProfileId } from '../../common/utils/tutor-access.util';

@Injectable()
export class CasesService {
  private readonly logger = new Logger(CasesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createCase(
    userId: string,
    createCaseDto: CreateCaseDto,
  ) {
    // Only parents can create cases
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== Role.PARENT) {
      throw new ForbiddenException('Only parents can create cases');
    }

    const caseRecord = await this.prisma.case.create({
      data: {
        ...createCaseDto,
        ownerId: userId,
      },
    });

    this.logger.log(`Case created: ${caseRecord.id} by parent ${userId}`);

    return caseRecord;
  }

  async getCase(caseId: string, userId?: string) {
    const caseRecord = await this.prisma.case.findUnique({
      where: { id: caseId },
    });

    if (!caseRecord) {
      throw new NotFoundException('Case not found');
    }

    // Authorization check
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (user?.role === Role.PARENT && caseRecord.ownerId !== userId) {
        throw new ForbiddenException(
          'Parents can only view their own cases',
        );
      }

      if (user?.role === Role.TUTOR) {
        const tutorProfileId = await getTutorProfileId(this.prisma, user.id);

        const invitation = tutorProfileId
          ? await this.prisma.caseInvitation.findUnique({
              where: { caseId_tutorId: { caseId, tutorId: tutorProfileId } },
            })
          : null;

        if (!invitation) {
          throw new ForbiddenException(
            'You can only view cases you have been invited to',
          );
        }

        if (invitation.status === InvitationStatus.DECLINED) {
          throw new ForbiddenException(
            'You declined this invitation and no longer have access',
          );
        }
      }
    }

    return caseRecord;
  }

  async getCaseWithDetails(caseId: string, userId?: string) {
    const caseRecord = await this.getCase(caseId, userId);

    const [documents, invitations] = await Promise.all([
      this.prisma.document.findMany({
        where: { caseId },
        select: {
          id: true,
          filename: true,
          size: true,
          mimeType: true,
          uploadedAt: true,
          uploadedBy: { select: { email: true } },
        },
      }),
      this.prisma.caseInvitation.findMany({
        where: { caseId },
        select: {
          id: true,
          tutorId: true,
          tutor: {
            select: {
              displayName: true,
              id: true,
            },
          },
          status: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      ...caseRecord,
      documents,
      invitations,
    };
  }

  async updateCase(
    caseId: string,
    userId: string,
    updateCaseDto: UpdateCaseDto,
  ) {
    const caseRecord = await this.prisma.case.findUnique({
      where: { id: caseId },
    });

    if (!caseRecord) {
      throw new NotFoundException('Case not found');
    }

    if (caseRecord.ownerId !== userId) {
      throw new ForbiddenException('Only the case owner can update the case');
    }

    const updated = await this.prisma.case.update({
      where: { id: caseId },
      data: updateCaseDto,
    });

    this.logger.log(`Case updated: ${caseId}`);

    return updated;
  }

  async deleteCase(caseId: string, userId: string): Promise<void> {
    const caseRecord = await this.prisma.case.findUnique({
      where: { id: caseId },
    });

    if (!caseRecord) {
      throw new NotFoundException('Case not found');
    }

    if (caseRecord.ownerId !== userId) {
      throw new ForbiddenException('Only the case owner can delete the case');
    }

    await this.prisma.case.delete({
      where: { id: caseId },
    });

    this.logger.log(`Case deleted: ${caseId} by user ${userId}`);
  }

  async listCases(searchDto: SearchCasesDto, userId?: string) {
    const { page = 1, limit = 10, search, subject, level, status } = searchDto;
    const skip = (page - 1) * limit;

    let where: any = {};

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    if (subject) {
      where.subject = subject;
    }

    if (level) {
      where.level = level;
    }

    if (status) {
      where.status = status;
    }

    // If tutor, only show invited cases
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (user?.role === Role.TUTOR) {
        const tutorProfileId = await getTutorProfileId(this.prisma, user.id);

        const invitedCaseIds = tutorProfileId
          ? (
              await this.prisma.caseInvitation.findMany({
                where: {
                  tutorId: tutorProfileId,
                  status: { not: InvitationStatus.DECLINED },
                },
                select: { caseId: true },
              })
            ).map((inv) => inv.caseId)
          : [];

        where.id = { in: invitedCaseIds };
      } else if (user?.role === Role.PARENT) {
        where.ownerId = userId;
      }
    }

    const [cases, total] = await Promise.all([
      this.prisma.case.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.case.count({ where }),
    ]);

    return createPaginatedResponse(cases, total, page, limit);
  }

  async inviteTutor(
    caseId: string,
    tutorId: string,
    parentId: string,
  ): Promise<void> {
    const caseRecord = await this.prisma.case.findUnique({
      where: { id: caseId },
    });

    if (!caseRecord) {
      throw new NotFoundException('Case not found');
    }

    if (caseRecord.ownerId !== parentId) {
      throw new ForbiddenException(
        'Only the case owner can invite tutors',
      );
    }

    // Check if tutor exists
    const tutor = await this.prisma.tutor.findUnique({
      where: { id: tutorId },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }

    // Check if already invited
    const existing = await this.prisma.caseInvitation.findUnique({
      where: { caseId_tutorId: { caseId, tutorId } },
    });

    if (existing) {
      throw new BadRequestException('Tutor already invited to this case');
    }

    await this.prisma.caseInvitation.create({
      data: {
        caseId,
        tutorId,
        invitedById: parentId,
      },
    });

    this.logger.log(
      `Tutor ${tutorId} invited to case ${caseId} by parent ${parentId}`,
    );
  }

  async revokeTutorInvitation(
    caseId: string,
    tutorId: string,
    parentId: string,
  ): Promise<void> {
    const caseRecord = await this.prisma.case.findUnique({
      where: { id: caseId },
    });

    if (!caseRecord) {
      throw new NotFoundException('Case not found');
    }

    if (caseRecord.ownerId !== parentId) {
      throw new ForbiddenException(
        'Only the case owner can revoke invitations',
      );
    }

    const invitation = await this.prisma.caseInvitation.findUnique({
      where: { caseId_tutorId: { caseId, tutorId } },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    await this.prisma.caseInvitation.delete({
      where: { id: invitation.id },
    });

    this.logger.log(
      `Invitation revoked for tutor ${tutorId} from case ${caseId}`,
    );
  }

  async getTutorCaseInvitations(tutorId: string) {
    const user = await this.prisma.user.findFirst({
      where: { tutor: { id: tutorId } },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const invitations = await this.prisma.caseInvitation.findMany({
      where: { tutorId },
      include: {
        case: {
          select: {
            id: true,
            title: true,
            subject: true,
            level: true,
            location: true,
            budgetPerHour: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations;
  }

  async respondToInvitation(
    invitationId: string,
    userId: string,
    status: InvitationStatus,
  ) {
    if (
      status !== InvitationStatus.ACCEPTED &&
      status !== InvitationStatus.DECLINED
    ) {
      throw new BadRequestException(
        'Status must be ACCEPTED or DECLINED',
      );
    }

    const tutorProfileId = await getTutorProfileId(this.prisma, userId);
    if (!tutorProfileId) {
      throw new NotFoundException('Tutor profile not found');
    }

    const invitation = await this.prisma.caseInvitation.findUnique({
      where: { id: invitationId },
      include: {
        case: {
          select: {
            id: true,
            title: true,
            subject: true,
            level: true,
            location: true,
            budgetPerHour: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!invitation || invitation.tutorId !== tutorProfileId) {
      throw new ForbiddenException(
        'You can only respond to your own invitations',
      );
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        `Invitation has already been ${invitation.status.toLowerCase()}`,
      );
    }

    const updated = await this.prisma.caseInvitation.update({
      where: { id: invitationId },
      data: { status },
      include: {
        case: {
          select: {
            id: true,
            title: true,
            subject: true,
            level: true,
            location: true,
            budgetPerHour: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    this.logger.log(
      `Invitation ${invitationId} marked as ${status} by tutor ${tutorProfileId}`,
    );

    return updated;
  }

  async getTutorCaseInvitationsByUserId(userId: string) {
    // Resolve the Tutor profile ID from the User ID
    const tutor = await this.prisma.tutor.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor profile not found');
    }

    return this.getTutorCaseInvitations(tutor.id);
  }
}

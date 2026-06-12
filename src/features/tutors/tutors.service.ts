import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateTutorProfileDto,
  UpdateTutorProfileDto,
  TutorProfileDto,
  SearchTutorsDto,
} from './dto/tutor.dto';
import { Role } from '@prisma/client';
import { createPaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class TutorsService {
  private readonly logger = new Logger(TutorsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTutorProfile(tutorId: string): Promise<TutorProfileDto> {
    const tutor = await this.prisma.tutor.findUnique({
      where: { id: tutorId },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor profile not found');
    }

    return tutor;
  }

  async getTutorProfileByUserId(userId: string): Promise<TutorProfileDto> {
    const tutor = await this.prisma.tutor.findUnique({
      where: { userId },
      include: {
        user: {
          select: { email: true }
        },
        documents: {
          select: {
            id: true,
            filename: true,
            size: true,
            mimeType: true,
            uploadedAt: true,
          },
        },
      },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor profile not found');
    }

    return tutor as any;
  }

  async updateTutorProfile(
    userId: string,
    updateTutorProfileDto: UpdateTutorProfileDto,
  ): Promise<TutorProfileDto> {
    // Verify user is a tutor
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== Role.TUTOR) {
      throw new ForbiddenException('Only tutors can update tutor profiles');
    }

    const tutor = await this.prisma.tutor.findUnique({
      where: { userId },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor profile not found');
    }

    const updatedTutor = await this.prisma.tutor.update({
      where: { id: tutor.id },
      data: updateTutorProfileDto,
      include: {
        user: {
          select: { email: true },
        },
        documents: {
          select: {
            id: true,
            filename: true,
            size: true,
            mimeType: true,
            uploadedAt: true,
          },
        },
      },
    });

    this.logger.log(`Tutor profile updated: ${tutor.id}`);

    return updatedTutor as any;
  }

  async createTutorProfile(
    userId: string,
    createTutorProfileDto: CreateTutorProfileDto,
  ): Promise<TutorProfileDto> {
    // Check if profile already exists
    const existing = await this.prisma.tutor.findUnique({
      where: { userId },
    });

    if (existing) {
      return this.updateTutorProfile(userId, createTutorProfileDto);
    }

    const tutor = await this.prisma.tutor.create({
      data: {
        userId,
        ...createTutorProfileDto,
      },
      include: {
        user: {
          select: { email: true }
        },
        documents: true,
      },
    });

    this.logger.log(`Tutor profile created: ${tutor.id}`);

    return tutor as any;
  }

  async listTutors(searchDto: SearchTutorsDto) {
    const { page = 1, limit = 10, search } = searchDto;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { displayName: { contains: search, mode: 'insensitive' as any } },
            {
              qualifications: { contains: search, mode: 'insensitive' as any },
            },
            { experiences: { contains: search, mode: 'insensitive' as any } },
          ],
        }
      : {};

    const [tutors, total] = await Promise.all([
      this.prisma.tutor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tutor.count({ where }),
    ]);

    return createPaginatedResponse(tutors, total, page, limit);
  }

  async getTutorWithDocuments(tutorId: string) {
    const tutor = await this.prisma.tutor.findUnique({
      where: { id: tutorId },
      include: {
        user: {
          select: { email: true }
        },
        documents: {
          select: {
            id: true,
            filename: true,
            size: true,
            mimeType: true,
            uploadedAt: true,
          },
        },
      },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor profile not found');
    }

    return tutor;
  }
}

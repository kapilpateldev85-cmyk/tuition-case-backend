import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import { PrismaService } from '../../database/prisma.service';
import { Role, InvitationStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { getTutorProfileId } from '../../common/utils/tutor-access.util';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.jpg',
  '.jpeg',
  '.png',
  '.xlsx',
];

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly uploadPath: string;
  private readonly maxFileSize: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.uploadPath = this.configService.get<string>('UPLOAD_PATH') || './uploads';
    this.maxFileSize =
      this.configService.get<number>('MAX_FILE_SIZE') || 10485760; // 10MB
  }

  async uploadCaseDocument(
    caseId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    // Validate file
    this.validateFile(file);

    // Check case exists and user has access
    const caseRecord = await this.prisma.case.findUnique({
      where: { id: caseId },
    });

    if (!caseRecord) {
      throw new NotFoundException('Case not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    // Authorization: Parent can upload to their own cases, tutors can upload to invited cases
    if (user?.role === Role.PARENT && caseRecord.ownerId !== userId) {
      throw new ForbiddenException(
        'You can only upload to your own cases',
      );
    }

    if (user?.role === Role.TUTOR) {
      const tutorProfileId = await getTutorProfileId(this.prisma, userId);

      const invitation = tutorProfileId
        ? await this.prisma.caseInvitation.findUnique({
            where: { caseId_tutorId: { caseId, tutorId: tutorProfileId } },
          })
        : null;

      if (!invitation) {
        throw new ForbiddenException(
          'You can only upload to cases you are invited to',
        );
      }

      if (invitation.status === InvitationStatus.DECLINED) {
        throw new ForbiddenException(
          'You declined this invitation and cannot upload documents',
        );
      }
    }

    // Save file
    const storePath = await this.saveFile(file);

    // Create document record
    const document = await this.prisma.document.create({
      data: {
        caseId,
        uploadedById: userId,
        filename: file.originalname,
        storePath,
        mimeType: file.mimetype,
        size: file.size,
      },
    });

    this.logger.log(
      `Document uploaded: ${document.id} to case ${caseId}`,
    );

    return document;
  }

  async uploadTutorDocument(userId: string, file: Express.Multer.File) {
    // Validate file
    this.validateFile(file);

    // Check user is a tutor
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== Role.TUTOR) {
      throw new ForbiddenException('Only tutors can upload profile documents');
    }

    const tutor = await this.prisma.tutor.findUnique({
      where: { userId },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor profile not found');
    }

    // Save file
    const storePath = await this.saveFile(file);

    // Create document record
    const document = await this.prisma.tutorDocument.create({
      data: {
        tutorId: tutor.id,
        userId,
        filename: file.originalname,
        storePath,
        mimeType: file.mimetype,
        size: file.size,
      },
    });

    this.logger.log(`Tutor document uploaded: ${document.id} for tutor ${tutor.id}`);

    return document;
  }

  async getCaseDocuments(caseId: string, userId?: string) {
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
          'You can only view documents from your own cases',
        );
      }

      if (user?.role === Role.TUTOR) {
        const tutorProfileId = await getTutorProfileId(this.prisma, userId);

        const invitation = tutorProfileId
          ? await this.prisma.caseInvitation.findUnique({
              where: { caseId_tutorId: { caseId, tutorId: tutorProfileId } },
            })
          : null;

        if (!invitation) {
          throw new ForbiddenException(
            'You can only view documents from cases you are invited to',
          );
        }

        if (invitation.status === InvitationStatus.DECLINED) {
          throw new ForbiddenException(
            'You declined this invitation and cannot view documents',
          );
        }
      }
    }

    return this.prisma.document.findMany({
      where: { caseId },
      select: {
        id: true,
        filename: true,
        size: true,
        mimeType: true,
        uploadedAt: true,
        uploadedBy: { select: { email: true } },
      },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async getTutorDocuments(tutorId: string) {
    const tutor = await this.prisma.tutor.findUnique({
      where: { id: tutorId },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }

    return this.prisma.tutorDocument.findMany({
      where: { tutorId },
      select: {
        id: true,
        filename: true,
        size: true,
        mimeType: true,
        uploadedAt: true,
      },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async downloadDocument(documentId: string, userId?: string): Promise<{
    file: Buffer;
    filename: string;
    mimeType: string;
  }> {
    const caseDocument = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { case: true },
    });

    if (caseDocument) {
      return this.downloadCaseDocument(caseDocument, userId);
    }

    return this.downloadTutorDocument(documentId, userId);
  }

  private async downloadCaseDocument(
    document: {
      id: string;
      caseId: string;
      filename: string;
      storePath: string;
      mimeType: string;
      case: { ownerId: string };
    },
    userId?: string,
  ): Promise<{
    file: Buffer;
    filename: string;
    mimeType: string;
  }> {
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (user?.role === Role.PARENT && document.case.ownerId !== userId) {
        throw new ForbiddenException(
          'You can only download documents from your own cases',
        );
      }

      if (user?.role === Role.TUTOR) {
        const tutorProfileId = await getTutorProfileId(this.prisma, userId);

        const invitation = tutorProfileId
          ? await this.prisma.caseInvitation.findUnique({
              where: {
                caseId_tutorId: {
                  caseId: document.caseId,
                  tutorId: tutorProfileId,
                },
              },
            })
          : null;

        if (!invitation) {
          throw new ForbiddenException(
            'You can only download documents from cases you are invited to',
          );
        }

        if (invitation.status === InvitationStatus.DECLINED) {
          throw new ForbiddenException(
            'You declined this invitation and cannot download documents',
          );
        }
      }
    }

    const fileBuffer = await fs.readFile(document.storePath);

    return {
      file: fileBuffer,
      filename: document.filename,
      mimeType: document.mimeType,
    };
  }

  async downloadTutorDocument(
    documentId: string,
    userId?: string,
  ): Promise<{
    file: Buffer;
    filename: string;
    mimeType: string;
  }> {
    const document = await this.prisma.tutorDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Parents can download, tutors can only download their own
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (user?.role === Role.TUTOR) {
        const tutorProfileId = await getTutorProfileId(this.prisma, userId);

        if (!tutorProfileId || document.tutorId !== tutorProfileId) {
          throw new ForbiddenException(
            'You can only download your own profile documents',
          );
        }
      }

      if (user?.role !== Role.PARENT && user?.role !== Role.TUTOR) {
        throw new ForbiddenException(
          'You do not have permission to download this document',
        );
      }
    }

    const fileBuffer = await fs.readFile(document.storePath);

    return {
      file: fileBuffer,
      filename: document.filename,
      mimeType: document.mimeType,
    };
  }

  async deleteDocument(documentId: string, userId: string): Promise<void> {
    const caseDocument = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (caseDocument) {
      await this.deleteCaseDocument(caseDocument, userId);
      return;
    }

    await this.deleteTutorDocument(documentId, userId);
  }

  private async deleteCaseDocument(
    document: { id: string; caseId: string; uploadedById: string; storePath: string },
    userId: string,
  ): Promise<void> {
    const caseRecord = await this.prisma.case.findUnique({
      where: { id: document.caseId },
    });

    if (
      document.uploadedById !== userId &&
      caseRecord?.ownerId !== userId
    ) {
      throw new ForbiddenException(
        'You do not have permission to delete this document',
      );
    }

    await this.removeStoredFile(document.storePath);

    await this.prisma.document.delete({
      where: { id: document.id },
    });

    this.logger.log(`Case document deleted: ${document.id}`);
  }

  async deleteTutorDocument(documentId: string, userId: string): Promise<void> {
    const document = await this.prisma.tutorDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.userId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own profile documents',
      );
    }

    await this.removeStoredFile(document.storePath);

    await this.prisma.tutorDocument.delete({
      where: { id: documentId },
    });

    this.logger.log(`Tutor document deleted: ${documentId}`);
  }

  private async removeStoredFile(storePath: string): Promise<void> {
    try {
      await fs.unlink(storePath);
    } catch (error) {
      this.logger.warn(`Failed to delete file: ${storePath}`);
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(
        `File extension not allowed. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`,
      );
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }
  }

  private async saveFile(file: Express.Multer.File): Promise<string> {
    try {
      // Create upload directory if it doesn't exist
      await fs.mkdir(this.uploadPath, { recursive: true });

      // Generate secure filename
      const timestamp = Date.now();
      const uuid = uuidv4();
      const ext = path.extname(file.originalname);
      const filename = `${timestamp}-${uuid}${ext}`;
      const storePath = path.join(this.uploadPath, filename);

      // Save file
      await fs.writeFile(storePath, file.buffer);

      return storePath;
    } catch (error) {
      this.logger.error(`Failed to save file: ${error}`);
      throw new BadRequestException('Failed to upload file');
    }
  }
}

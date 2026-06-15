import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CaseLevel, CaseSubject, Role } from '@prisma/client';
import { CasesService } from './cases.service';
import { PrismaService } from '../../database/prisma.service';

describe('CasesService', () => {
  let service: CasesService;

  const prismaMock = {
    user: { findUnique: jest.fn() },
    case: { create: jest.fn(), findUnique: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CasesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<CasesService>(CasesService);
    jest.clearAllMocks();
  });

  describe('createCase', () => {
    it('creates a case for a parent user', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'parent-1',
        role: Role.PARENT,
      });
      const caseRecord = {
        id: 'case-1',
        title: 'Weekly P5 Math tuition',
        ownerId: 'parent-1',
      };
      prismaMock.case.create.mockResolvedValue(caseRecord);

      const dto = {
        title: 'Weekly P5 Math tuition',
        subject: CaseSubject.MATHEMATICS,
        level: CaseLevel.P5,
        location: 'Bishan',
        budgetPerHour: 50,
      };

      await expect(service.createCase('parent-1', dto)).resolves.toEqual(
        caseRecord,
      );
      expect(prismaMock.case.create).toHaveBeenCalled();
    });

    it('throws ForbiddenException for non-parent users', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'tutor-1',
        role: Role.TUTOR,
      });

      await expect(
        service.createCase('tutor-1', {
          title: 'Test',
          subject: CaseSubject.MATHEMATICS,
          level: CaseLevel.P5,
          location: 'Bishan',
          budgetPerHour: 50,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getCase', () => {
    it('throws NotFoundException when case does not exist', async () => {
      prismaMock.case.findUnique.mockResolvedValue(null);

      await expect(service.getCase('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

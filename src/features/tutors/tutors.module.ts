import { Module } from '@nestjs/common';
import { TutorsService } from './tutors.service';
import { TutorsController } from './tutors.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  providers: [TutorsService, PrismaService],
  controllers: [TutorsController],
  exports: [TutorsService],
})
export class TutorsModule {}

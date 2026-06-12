import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  providers: [DocumentsService, PrismaService],
  controllers: [DocumentsController],
  exports: [DocumentsService],
})
export class DocumentsModule {}

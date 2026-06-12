import { Module } from '@nestjs/common';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  providers: [CasesService, PrismaService],
  controllers: [CasesController],
  exports: [CasesService],
})
export class CasesModule {}

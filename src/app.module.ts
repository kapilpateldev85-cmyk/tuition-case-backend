import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './features/auth/auth.module';
import { CasesModule } from './features/cases/cases.module';
import { DocumentsModule } from './features/documents/documents.module';
import { TutorsModule } from './features/tutors/tutors.module';
import { PrismaService } from './database/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    CasesModule,
    DocumentsModule,
    TutorsModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}

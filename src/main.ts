import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { globalValidationPipe } from './common/pipes/validation.pipe';
import { runMigrations } from './database/run-migrations';
import { isCorsOriginAllowed } from './common/utils/cors.util';

const logger = new Logger('Main');

async function bootstrap() {
  runMigrations();

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // CORS — allow one or more frontend origins (comma-separated FRONTEND_URL)
  const frontendUrlRaw = configService.get<string>('FRONTEND_URL') ?? '';
  const corsOrigins = frontendUrlRaw
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow non-browser clients (Swagger, curl, health checks)
      if (!origin) {
        callback(null, true);
        return;
      }

      if (isCorsOriginAllowed(origin, corsOrigins)) {
        callback(null, true);
        return;
      }

      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(globalValidationPipe);

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Tuition Marketplace API')
    .setDescription(
      'Production-grade REST API for the Tuition Marketplace application. Manages tutor profiles, tuition cases, invitations, documents, and user authentication.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag(
      'auth',
      'Authentication endpoints - register, login, refresh tokens, and password management',
    )
    .addTag('cases', 'Tuition case management - create, list, invite tutors')
    .addTag(
      'tutors',
      'Tutor profiles and directory - browse tutors, search, view profiles',
    )
    .addTag(
      'documents',
      'Document upload and download - manage case documents and tutor profile documents',
    )
    .setContact(
      'Tuition Marketplace',
      'https://tuition-marketplace.example.com',
      'support@example.com',
    )
    .setLicense(
      'MIT',
      'https://opensource.org/licenses/MIT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: true,
    },
  });

  const port = configService.get<number>('PORT') || 3000;
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';

  await app.listen(port);

  logger.log(`✅ Application is running on port ${port}`);
  logger.log(`📚 Swagger documentation available at http://localhost:${port}/api/docs`);
  logger.log(`🔧 Environment: ${nodeEnv}`);
  logger.log(`🌐 CORS origins: ${corsOrigins.join(', ') || '(none configured)'}`);
}

bootstrap().catch((error) => {
  logger.error('Failed to start application:', error);
  process.exit(1);
});

import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as joi from 'joi';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: joi.object({
        DATABASE_URL: joi.string().required(),
        JWT_SECRET: joi.string().required(),
        JWT_REFRESH_SECRET: joi.string().required(),
        JWT_EXPIRES_IN: joi.string().default('15m'),
        JWT_REFRESH_EXPIRES_IN: joi.string().default('7d'),
        PORT: joi.number().default(3000),
        FRONTEND_URL: joi.string().required(),
        UPLOAD_PATH: joi.string().default('./uploads'),
        MAX_FILE_SIZE: joi.number().default(10485760), // 10MB
        NODE_ENV: joi.string().valid('development', 'production').default('development'),
      }),
    }),
  ],
})
export class ConfigService {}

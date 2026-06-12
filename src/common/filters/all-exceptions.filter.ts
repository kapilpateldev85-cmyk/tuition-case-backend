import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { createErrorResponse } from '../dto/api-response.dto';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const body = exceptionResponse as any;
        message = body.message || exception.message;
        error = body.error;
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2021') {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        message =
          'Database is not initialized. Migrations are applied automatically on server start — please retry in a moment or run: npm run db:migrate:prod';
      } else if (exception.code === 'P1001' || exception.code === 'P1002') {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        message = 'Database is unavailable. Please try again later.';
      } else {
        status = HttpStatus.BAD_REQUEST;
        message = 'A database error occurred';
        this.logger.error(`Prisma error ${exception.code}: ${exception.message}`);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
    }

    // Don't expose stack traces in production
    if (process.env.NODE_ENV === 'production') {
      error = undefined;
    }

    const errorResponse = createErrorResponse(message, status, error);

    this.logger.log({
      status,
      message,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    });

    response.status(status).json(errorResponse);
  }
}

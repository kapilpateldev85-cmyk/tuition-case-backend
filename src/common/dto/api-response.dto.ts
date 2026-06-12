import { HttpStatus } from '@nestjs/common';

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export function createApiResponse<T>(
  data: T,
  message = 'Success',
  statusCode = HttpStatus.OK,
): ApiResponse<T> {
  return {
    success: statusCode < 400,
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

export function createErrorResponse(
  message: string,
  statusCode: number,
  error?: string,
): ApiResponse<null> {
  return {
    success: false,
    statusCode,
    message,
    error: error || message,
    timestamp: new Date().toISOString(),
  };
}

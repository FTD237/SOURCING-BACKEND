// src/common/filters/http-exception.filter.ts - Avec type guard
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Response, Request } from 'express';

// Type guard personnalisé pour les codes d'erreur
const isPostgresDuplicateCode = (code: unknown): code is string => {
  return code === '23505';
};

const isMySQLDuplicateCode = (code: unknown): code is number => {
  return code === 1062;
};

const isForeignKeyCode = (code: unknown): code is string => {
  return code === '23503';
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erreur interne du serveur';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = this.getHttpMessage(exceptionResponse);
    } else if (exception instanceof QueryFailedError) {
      const driverError = exception.driverError as { code?: unknown };
      const errorCode = driverError?.code;

      if (
        isPostgresDuplicateCode(errorCode) ||
        isMySQLDuplicateCode(errorCode)
      ) {
        statusCode = HttpStatus.CONFLICT;
        message = 'Cet enregistrement existe déjà';
        error = 'Duplicate Entry';
      } else if (isForeignKeyCode(errorCode)) {
        statusCode = HttpStatus.BAD_REQUEST;
        message =
          "Cette opération référence un enregistrement qui n'existe pas";
        error = 'Foreign Key Violation';
      } else {
        statusCode = HttpStatus.BAD_REQUEST;
        message = exception.message;
        error = 'Database Error';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    response.status(statusCode).json({
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      error,
      message,
    });
  }

  private getHttpMessage(response: unknown): string {
    if (typeof response === 'string') return response;
    if (this.isRecord(response) && response.message) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      if (Array.isArray(response.message)) return response.message[0];
      if (typeof response.message === 'string') return response.message;
    }
    return 'Erreur';
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}

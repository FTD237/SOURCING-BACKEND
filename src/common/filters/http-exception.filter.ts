// src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Response, Request } from 'express';

// Interface pour la réponse d'erreur HTTP
interface HttpExceptionResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}

// Interface pour l'erreur de base de données
interface DatabaseDriverError {
  code?: string;
  detail?: string;
  table?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erreur interne du serveur';
    let error = 'Internal Server Error';

    // Gestion des exceptions HTTP
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (this.isHttpExceptionResponse(exceptionResponse)) {
        message = Array.isArray(exceptionResponse.message)
          ? exceptionResponse.message[0]
          : exceptionResponse.message;
        error = exceptionResponse.error || error;
      }
    }

    // Gestion des erreurs TypeORM
    else if (exception instanceof QueryFailedError) {
      const driverError = exception.driverError as DatabaseDriverError;

      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
      error = 'Database Error';

      // Violation d'unicité PostgreSQL
      if (driverError?.code === '23505') {
        status = HttpStatus.CONFLICT;
        message = 'Cet enregistrement existe déjà';
        error = 'Duplicate Entry';
      }

      // Violation d'unicité MySQL
      if (driverError?.code === 'ER_DUP_ENTRY') {
        status = HttpStatus.CONFLICT;
        message = 'Cet enregistrement existe déjà';
        error = 'Duplicate Entry';
      }

      // Violation de clé étrangère
      if (driverError?.code === '23503') {
        status = HttpStatus.BAD_REQUEST;
        message =
          "Cette opération référence un enregistrement qui n'existe pas";
        error = 'Foreign Key Violation';
      }
    }

    // Gestion des erreurs standards
    else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    // Logging (optionnel)
    console.error(
      `[${new Date().toISOString()}] ${status} - ${message}`,
      exception,
    );

    // Réponse formatée
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error,
      message,
    });
  }

  // Type guard pour vérifier la structure de la réponse HTTP
  private isHttpExceptionResponse(
    response: unknown,
  ): response is HttpExceptionResponse {
    return (
      typeof response === 'object' &&
      response !== null &&
      'statusCode' in response &&
      'message' in response
    );
  }
}

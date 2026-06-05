// src/common/exceptions/exception-factory.ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

// Définir un type pour l'erreur de base de données
interface DatabaseError extends Error {
  code?: string;
  driverError?: {
    code?: string;
    detail?: string;
    table?: string;
  };
}

export class ExceptionFactory {
  static notFound(resource: string, id?: string): never {
    throw new NotFoundException(
      id
        ? `${resource} avec l'ID ${id} n'existe pas`
        : `${resource} non trouvé(e)`,
    );
  }

  static duplicate(resource: string, field?: string, value?: string): never {
    const message =
      field && value
        ? `${resource} avec ${field} "${value}" existe déjà`
        : `${resource} existe déjà`;
    throw new ConflictException(message);
  }

  static forbidden(message: string = 'Accès interdit'): never {
    throw new ForbiddenException(message);
  }

  static unauthorized(message: string = 'Non authentifié'): never {
    throw new UnauthorizedException(message);
  }

  static badRequest(message: string): never {
    throw new BadRequestException(message);
  }

  static internal(message?: string): never {
    throw new InternalServerErrorException(
      message || 'Erreur interne du serveur',
    );
  }

  static database(error: unknown, resource: string): never {
    // Type guard pour QueryFailedError
    if (error instanceof QueryFailedError) {
      const dbError = error.driverError as DatabaseError;

      // PostgreSQL - violation d'unicité
      if (dbError?.code === '23505') {
        return this.duplicate(resource);
      }

      // PostgreSQL - violation de clé étrangère
      if (dbError?.code === '23503') {
        return this.badRequest(
          `${resource} est référencé par d'autres données`,
        );
      }

      // PostgreSQL - valeur trop longue
      if (dbError?.code === '22001') {
        return this.badRequest(`Une valeur est trop longue`);
      }
    }

    // Vérifier si c'est une erreur MySQL
    if (error && typeof error === 'object' && 'code' in error) {
      const mysqlError = error as { code: string };

      if (mysqlError.code === 'ER_DUP_ENTRY') {
        return this.duplicate(resource);
      }
    }

    // Erreur générique
    const errorMessage =
      error instanceof Error ? error.message : 'Erreur inconnue';
    return this.internal(`Erreur base de données: ${errorMessage}`);
  }
}

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
import {
  isDuplicateKeyError,
  extractDuplicateField,
  isPostgresDuplicateError,
  isMySQLDuplicateError,
} from '../types/error.types';

interface DuplicateErrorDetail {
  field?: string;
  value?: string;
  message: string;
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
    let message: string;

    if (field && value) {
      message = `${resource} avec ${field} "${value}" existe déjà`;
    } else if (field) {
      message = `${resource} avec ce ${field} existe déjà`;
    } else {
      message = `${resource} existe déjà`;
    }

    throw new ConflictException(message);
  }

  static duplicateWithDetail(detail: DuplicateErrorDetail): never {
    throw new ConflictException(detail.message);
  }

  static conflict(message: string): never {
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
    // Gestion des erreurs de duplication (conflit)
    if (isDuplicateKeyError(error)) {
      const field = extractDuplicateField(error);

      if (field) {
        return this.duplicate(resource, field);
      }

      return this.duplicate(resource);
    }

    // Gestion des erreurs de clé étrangère
    if (error instanceof QueryFailedError) {
      const driverError = (error as any).driverError;

      if (driverError?.code === '23503') {
        return this.badRequest(
          `${resource} est référencé par d'autres données`,
        );
      }

      if (driverError?.code === '23505') {
        return this.duplicate(resource);
      }
    }

    // Erreur générique
    const errorMessage =
      error instanceof Error ? error.message : 'Erreur inconnue';
    return this.internal(`Erreur base de données: ${errorMessage}`);
  }

  // Méthode spécifique pour les conflits métier
  static businessConflict(
    entity: string,
    reason: string,
    details?: Record<string, unknown>,
  ): never {
    throw new ConflictException({
      message: `Conflit métier sur ${entity}: ${reason}`,
      entity,
      reason,
      details,
    });
  }

  // Méthode pour les conflits de version (optimistic lock)
  static versionConflict(entity: string, id: string): never {
    throw new ConflictException(
      `${entity} avec l'ID ${id} a été modifié par un autre utilisateur`,
    );
  }

  // Méthode pour les conflits de ressource déjà utilisée
  static resourceInUse(resource: string, usedBy: string): never {
    throw new ConflictException(
      `${resource} est actuellement utilisé par ${usedBy}`,
    );
  }
}

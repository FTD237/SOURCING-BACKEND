import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

interface ApiCrudErrorResponsesOptions {
  /** Ajoute une réponse 400. `true` utilise le message par défaut, une
   * chaîne permet de le personnaliser (ex. "Expérience existante ou données invalides"). */
  badRequest?: boolean | string;
  /** Ajoute une réponse 409 avec la description fournie (ex. "Email déjà existant"). */
  conflict?: string;
  /** Ajoute une réponse 404 ; le libellé de la ressource est inséré dans
   * "<label> introuvable" (ex. "Entreprise" → "Entreprise introuvable"). */
  notFound?: string;
}

/**
 * Regroupe les réponses Swagger 401/403 communes à toutes les routes
 * protégées par `JwtAuthGuard` + `RolesGuard`, avec 400/409/404 optionnels
 * selon la route. Évite de répéter les mêmes blocs `@ApiResponse` dans
 * chaque contrôleur (source de duplication détectée par SonarQube).
 */
export function ApiCrudErrorResponses(
  options: ApiCrudErrorResponsesOptions = {},
) {
  const decorators = [
    ApiUnauthorizedResponse({ description: 'Authentification requise' }),
    ApiForbiddenResponse({ description: 'Rôle insuffisant' }),
  ];

  if (options.badRequest) {
    decorators.push(
      ApiBadRequestResponse({
        description:
          typeof options.badRequest === 'string'
            ? options.badRequest
            : 'Données invalides',
      }),
    );
  }

  if (options.conflict) {
    decorators.push(ApiConflictResponse({ description: options.conflict }));
  }

  if (options.notFound) {
    decorators.push(
      ApiNotFoundResponse({ description: `${options.notFound} introuvable` }),
    );
  }

  return applyDecorators(...decorators);
}

/**
 * Documente un paramètre de route UUID (ex. `:id`) de façon uniforme,
 * pour éviter de répéter `{ name, description, format: 'uuid' }` partout.
 */
export function ApiUuidParam(name: string, description: string) {
  return applyDecorators(ApiParam({ name, description, format: 'uuid' }));
}

// test/support/pagination.helper.ts

import { PaginationDto } from '../../src/common/pagination';

/**
 * Crée une PaginationDto complète avec des valeurs par défaut.
 *
 * @param overrides - Valeurs à surcharger (page, limite, tri, ordre)
 * @returns Une instance de PaginationDto prête à l'emploi
 *
 * @example
 * // Pagination par défaut (page 1, limite 10, ordre DESC)
 * const pagination = buildPagination();
 *
 * @example
 * // Pagination personnalisée
 * const pagination = buildPagination({ page: 2, limite: 5 });
 */
export function buildPagination(
  overrides: Partial<PaginationDto> = {},
): PaginationDto {
  const pagination = new PaginationDto();
  pagination.page = overrides.page ?? 1;
  pagination.limite = overrides.limite ?? 10;
  pagination.ordre = overrides.ordre ?? 'DESC';
  pagination.tri = overrides.tri;
  return pagination;
}

/**
 * Crée un objet partiel pour tester les cas où seules certaines propriétés
 * sont nécessaires (ex: pagination sans tri).
 */
export function buildPaginationPartial(
  overrides: Partial<PaginationDto> = {},
): Partial<PaginationDto> {
  return {
    page: overrides.page ?? 1,
    limite: overrides.limite ?? 10,
    ordre: overrides.ordre ?? 'DESC',
    ...(overrides.tri !== undefined && { tri: overrides.tri }),
  };
}

/**
 * Constantes utiles pour les tests
 */
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMITE: 10,
  ORDRE: 'DESC' as const,
} as const;

// src/common/types/error.types.ts
import { QueryFailedError } from 'typeorm';

// Type plus générique pour driverError
export interface DatabaseDriverError {
  code?: string;
  detail?: string;
  table?: string;
  constraint?: string;
  sqlMessage?: string;
  sql?: string;
}

// Type guard pour QueryFailedError avec driverError
export function isQueryFailedError(error: unknown): error is QueryFailedError {
  return error instanceof QueryFailedError;
}

// Type guard pour erreur PostgreSQL
export function isPostgresDuplicateError(error: unknown): boolean {
  if (!isQueryFailedError(error)) return false;

  const driverError = error.driverError as DatabaseDriverError;
  return driverError?.code === '23505';
}

// Type guard pour erreur MySQL
export function isMySQLDuplicateError(error: unknown): boolean {
  if (!isQueryFailedError(error)) return false;

  const driverError = error.driverError as DatabaseDriverError;
  return driverError?.code === 'ER_DUP_ENTRY';
}

// Vérification générique de duplication
export function isDuplicateKeyError(error: unknown): boolean {
  return isPostgresDuplicateError(error) || isMySQLDuplicateError(error);
}

// Extraction du champ en conflit
export function extractDuplicateField(error: unknown): string | null {
  if (!isQueryFailedError(error)) return null;

  const driverError = error.driverError as DatabaseDriverError;

  // PostgreSQL
  if (driverError?.code === '23505' && driverError.detail) {
    const match = driverError.detail.match(/\(([^)]+)\)/);
    return match ? match[1] : null;
  }

  // MySQL
  if (driverError?.code === 'ER_DUP_ENTRY' && driverError.sqlMessage) {
    const match = driverError.sqlMessage.match(/'([^']+)'/);
    return match ? match[1] : null;
  }

  return null;
}

// Extraction de la valeur en conflit
export function extractDuplicateValue(error: unknown): string | null {
  if (!isQueryFailedError(error)) return null;

  const driverError = error.driverError as DatabaseDriverError;

  // PostgreSQL
  if (driverError?.code === '23505' && driverError.detail) {
    const match = driverError.detail.match(/=\(([^)]+)\)/);
    return match ? match[1] : null;
  }

  // MySQL
  if (driverError?.code === 'ER_DUP_ENTRY' && driverError.sqlMessage) {
    const match = driverError.sqlMessage.match(/for key '.*'$/);
    return null;
  }

  return null;
}

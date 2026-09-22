import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Borne haute de la taille de page.
 *
 * Sans elle, `?limite=1000000` laisserait n'importe quel visiteur demander
 * l'annuaire complet en une requête : coût serveur non borné d'un côté,
 * aspiration des profils de finissants de l'autre.
 */
export const LIMITE_MAXIMALE = 100;
export const LIMITE_PAR_DEFAUT = 20;

export type Ordre = 'ASC' | 'DESC';

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Numéro de page demandée (commence à 1)',
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({
    description: "Nombre d'éléments par page",
    default: LIMITE_PAR_DEFAUT,
    minimum: 1,
    maximum: LIMITE_MAXIMALE,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LIMITE_MAXIMALE)
  @IsOptional()
  limite: number = LIMITE_PAR_DEFAUT;

  /**
   * Colonne de tri.
   *
   * Le format est contraint ici, mais cela ne suffit pas : la valeur finit
   * dans une clause ORDER BY, que TypeORM n'échappe pas. Chaque appelant doit
   * la confronter à sa propre liste blanche via {@link triAutorise} — le
   * filtre syntaxique n'est qu'une première barrière.
   */
  @ApiPropertyOptional({
    description:
      'Colonne utilisée pour le tri. Doit commencer par une lettre et ne contenir que des lettres, chiffres, `_` ou `.` (64 caractères max). Confrontée ensuite à une liste blanche par colonne via triAutorise().',
    example: 'dte_creation',
  })
  @IsString()
  @Matches(/^[a-zA-Z][a-zA-Z0-9_.]{0,63}$/, {
    message: 'Le champ de tri est invalide.',
  })
  @IsOptional()
  tri?: string;

  @ApiPropertyOptional({
    description: 'Ordre de tri',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @Transform(({ value }) => String(value).toUpperCase())
  @IsIn(['ASC', 'DESC'])
  @IsOptional()
  ordre: Ordre = 'DESC';

  get sauter(): number {
    return (this.page - 1) * this.limite;
  }
}

/**
 * Confronte le tri demandé à la liste des colonnes réellement triables.
 *
 * À appeler systématiquement avant de transmettre `tri` à une requête : une
 * valeur inconnue est ignorée au profit de la colonne par défaut, plutôt que
 * de produire une erreur SQL ou d'ouvrir une injection.
 */
export function triAutorise(
  demande: string | undefined,
  autorisees: readonly string[],
  parDefaut: string,
): string {
  return demande && autorisees.includes(demande) ? demande : parDefaut;
}

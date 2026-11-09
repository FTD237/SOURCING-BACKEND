// src/etudiant/dto/recherche-etudiant.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../common/pagination';
import { Statut } from '../../common/enum/statut.enum';
import { NiveauEtudeEnum } from '../../common/enum/niveau-etude.enum';

/** "true" / "false" en query string -> booléen (undefined si absent). */
const enBooleen = ({ value }: { value: unknown }): unknown => {
  switch (value) {
    case 'true':
    case true:
      return true;
    case 'false':
    case false:
      return false;
    default:
      return value;
  }
};

/**
 * Pagination + filtres de recherche des étudiants.
 * Tous les filtres sont optionnels et se combinent (ET).
 */
export class RechercheEtudiantDto extends PaginationDto {
  // -------------------------------------------------------------------------
  // Recherche libre
  // -------------------------------------------------------------------------
  @ApiPropertyOptional({
    description:
      'Recherche libre : nom, prénom, email ou matricule (contient, sans casse)',
    example: 'bella',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  q?: string;

  // -------------------------------------------------------------------------
  // Identifiants
  // -------------------------------------------------------------------------
  @ApiPropertyOptional({
    description: "Id de l'étudiant (UUID)",
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({
    description: "Id de l'utilisateur lié (UUID)",
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  // -------------------------------------------------------------------------
  // Champs User (jointure)
  // -------------------------------------------------------------------------
  @ApiPropertyOptional({
    description: 'Nom (contient, sans casse)',
    example: 'Kamga',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nom?: string;

  @ApiPropertyOptional({
    description: 'Prénom (contient, sans casse)',
    example: 'Aline',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  prenom?: string;

  @ApiPropertyOptional({
    description: 'Email (contient, sans casse)',
    example: 'aline.kamga@example.com',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  email?: string;

  // -------------------------------------------------------------------------
  // Champs Etudiant
  // -------------------------------------------------------------------------
  @ApiPropertyOptional({
    description: 'Matricule (contient, sans casse)',
    example: 'MAT-2024-001',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  matricule?: string;

  @ApiPropertyOptional({
    description: 'Id de la promotion (filtre exact)',
    example: 'promotion-1',
  })
  @IsOptional()
  @IsString()
  promotionId?: string;

  @ApiPropertyOptional({
    description: 'Année académique (filtre exact)',
    example: '2025-2026',
  })
  @IsOptional()
  @IsString()
  annee_acad?: string;

  @ApiPropertyOptional({
    description: 'Nationalité (contient, sans casse)',
    example: 'Camerounais',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationality?: string;

  @ApiPropertyOptional({
    enum: NiveauEtudeEnum,
    description: 'Niveau scolaire (filtre exact)',
    example: NiveauEtudeEnum.FOURTH_YEAR,
  })
  @IsOptional()
  @IsEnum(NiveauEtudeEnum)
  scholar_level?: NiveauEtudeEnum;

  @ApiPropertyOptional({
    description: 'Domaine principal (contient, sans casse)',
    example: 'Génie logiciel',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  main_domain?: string;

  @ApiPropertyOptional({
    description: 'Note minimale (star_rate >= valeur)',
    example: 3,
    minimum: 0,
    maximum: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  star_rate_min?: number;

  @ApiPropertyOptional({
    description: 'Note maximale (star_rate <= valeur)',
    example: 5,
    minimum: 0,
    maximum: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  star_rate_max?: number;

  @ApiPropertyOptional({
    description: 'Langue parlée (contient un élément du tableau)',
    example: 'français',
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Outil maîtrisé (contient un élément du tableau)',
    example: 'Webstorm',
  })
  @IsOptional()
  @IsString()
  tool?: string;

  @ApiPropertyOptional({
    description: "Étudiants en recherche d'emploi (true/false)",
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @Transform(enBooleen)
  @IsBoolean()
  is_job_seeker?: boolean;

  @ApiPropertyOptional({
    enum: Statut,
    description:
      'Filtre exact sur le statut. Le statut SUPPRIME est réservé aux ' +
      'rôles ADMIN, MANAGER et SUPERADMIN.',
    example: Statut.ACTIF,
  })
  @IsOptional()
  @IsEnum(Statut)
  statut?: Statut;

  @ApiPropertyOptional({
    default: false,
    description:
      'Inclut les étudiants supprimés. Réservé aux rôles ADMIN, MANAGER et ' +
      'SUPERADMIN (403 sinon).',
    example: false,
    type: Boolean,
  })
  @IsOptional()
  @Transform(enBooleen)
  @IsBoolean()
  inclureSupprimes?: boolean;
}

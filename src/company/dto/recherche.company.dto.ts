// src/company/dto/recherche-company.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationDto } from '../../common/pagination';
import { RecruitmentStatusEnum } from '../../common/enum/recruitment-status.enum';
import { NiveauEtudeEnum } from '../../common/enum/niveau-etude.enum';
import { Statut } from '../../common/enum/statut.enum';

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
 * Pagination + filtres de recherche des entreprises.
 * Tous les filtres sont optionnels et se combinent (ET).
 */
export class RechercheCompanyDto extends PaginationDto {
  @ApiPropertyOptional({
    description:
      'Recherche libre : nom, description, personne de contact (contient, sans casse)',
    example: 'MTN',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({
    description: "Id de l'entreprise (UUID)",
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

  @ApiPropertyOptional({
    description: "Nom de l'entreprise (contient, sans casse)",
    example: 'MTN',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  company_name?: string;

  @ApiPropertyOptional({
    description: 'Description (contient, sans casse)',
    example: 'réseau',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  company_description?: string;

  @ApiPropertyOptional({
    description: 'Personne de contact (contient, sans casse)',
    example: 'John',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contact_person?: string;

  @ApiPropertyOptional({
    description: 'Code pays (filtre exact, ex: CM)',
    example: 'CM',
    maxLength: 2,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  country_code?: string;

  @ApiPropertyOptional({
    description: 'Entreprise partenaire (true/false)',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @Transform(enBooleen)
  @IsBoolean()
  isPartner?: boolean;

  @ApiPropertyOptional({
    enum: RecruitmentStatusEnum,
    description: 'Statut de recrutement (filtre exact)',
    example: RecruitmentStatusEnum.CLOSED,
  })
  @IsOptional()
  @IsEnum(RecruitmentStatusEnum)
  recruitment_status?: RecruitmentStatusEnum;

  @ApiPropertyOptional({
    enum: NiveauEtudeEnum,
    description: 'Niveau minimum requis (filtre exact)',
    example: NiveauEtudeEnum.FIRST_YEAR,
  })
  @IsOptional()
  @IsEnum(NiveauEtudeEnum)
  minStudentLevel?: NiveauEtudeEnum;

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
      'Inclut les entreprises supprimées. Réservé aux rôles ADMIN, MANAGER ' +
      'et SUPERADMIN (403 sinon).',
    example: false,
    type: Boolean,
  })
  @IsOptional()
  @Transform(enBooleen)
  @IsBoolean()
  inclureSupprimes?: boolean;
}

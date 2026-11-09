// src/offre/offre.dto.ts
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { TypeOffre } from '../common/enum/type-offre.enum';
import { NiveauEtudeEnum } from '../common/enum/niveau-etude.enum';
import { Transform } from 'class-transformer';
import { parseDurationToMonths } from '../common/utils/duration.util';

/**
 * Transforme une chaîne ISO 8601 en Date.
 * Retourne `undefined` si la valeur est absente ou invalide
 * (pour laisser @IsNotEmpty / @IsDate gérer l'erreur).
 */
const versDate = ({ value }: { value: unknown }): Date | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
};

export class CreateOffreDto {
  @ApiPropertyOptional({
    description: "Description détaillée de l'offre",
    example: 'Stage de développement Full Stack, 6 mois, Douala.',
  })
  @IsOptional()
  @IsString()
  descriptions?: string;

  @ApiProperty({
    description: "id de l'entreprise créatrice de l'offre",
    example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023',
  })
  @IsNotEmpty()
  @IsUUID()
  companyId: string;

  @ApiProperty({
    type: 'array',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsArray()
  @IsNotEmpty({ message: 'skillIds ne peut pas être vide' })
  @IsUUID('all', { each: true })
  skillIds: string[];

  @ApiProperty({
    enum: TypeOffre,
    enumName: 'TypeOffre',
    example: TypeOffre.STAGE_ACADEMIQUE,
  })
  @IsNotEmpty({ message: "Le type d'offre doit être renseigner" })
  @IsEnum(TypeOffre)
  type_offre: TypeOffre;

  @ApiProperty({ example: 'Offre' })
  @IsNotEmpty()
  @IsString()
  titre: string;

  @ApiProperty({ format: 'date-time' })
  @Transform(versDate)
  @IsDate({ message: 'dte_debut doit être une date valide' })
  @IsNotEmpty()
  dte_debut: Date;

  @ApiProperty({ format: 'date-time' })
  @Transform(versDate)
  @IsDate({ message: 'dte_fin doit être une date valide' })
  @IsNotEmpty()
  dte_fin: Date;

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  required_documents: string[];

  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  domain: string[];

  @ApiProperty()
  @IsEnum(NiveauEtudeEnum)
  @IsNotEmpty()
  level: NiveauEtudeEnum;

  @ApiProperty({
    type: String,
    example: '6 mois',
    description: 'Durée en mois : "6 mois", "1 an" ou simplement 6',
  })
  @Transform(({ value }) => parseDurationToMonths(value))
  @IsInt({
    message: 'La durée doit être un nombre entier de mois (ex. "6 mois")',
  })
  @Min(1, { message: 'La durée minimale est de 1 mois' })
  duration: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  offre_ville: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  offre_address: string;
}

export class UpdateOffreDto extends PartialType(CreateOffreDto) {}

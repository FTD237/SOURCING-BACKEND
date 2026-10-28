// ─── experience.dto.ts ───────────────────────────────────────────────────────
import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Statut } from '../../common/enum/statut.enum';

export class CreateExperienceDto {
  @ApiProperty({
    example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023',
    description: "Id de l'étudiant",
  })
  @IsUUID()
  @IsNotEmpty()
  student_id: string;

  @ApiPropertyOptional({
    example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023',
    description: "ID de l'entreprise",
    required: false,
  })
  @IsUUID()
  @IsOptional()
  company_id?: string;

  @ApiProperty({
    example: "Développement d'une plateforme web de E-learning",
    description: "Intitulé de l'expérience",
  })
  @IsString()
  @IsNotEmpty()
  intitule: string;

  @ApiPropertyOptional({
    example: 'Stage de 5eme année au cours duquel...',
    description: "Description de l'expérience",
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'Stage académique',
    description: "Type de l'expérience",
    required: false,
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({
    example: '2025-11-17',
    description: 'Date de début (format ISO 8601)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  date_debut?: string;

  @ApiPropertyOptional({
    example: '2025-11-17',
    description: 'Date de fin (format ISO 8601)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  date_fin?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    example: ['1aec5bef-7a21-47d1-b7f5-c2a3e1b57023'],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  media_ids?: string[];
}

export class UpdateExperienceDto extends PartialType(CreateExperienceDto) {
  @ApiProperty({
    example: Statut.ACTIF,
    description: 'Statut',
    required: false,
  })
  @IsOptional()
  statut?: Statut;
}

// ─── experience.dto.ts ───────────────────────────────────────────────────────
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Statut } from '../common/enum/statut.enum';

export class CreateExperienceDto {
  @ApiProperty({
    example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023',
    description: "Id de l'étudiant",
  })
  @IsUUID()
  student_id: string;

  @ApiProperty({
    example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023',
    description: "ID de l'entreprise",
    required: false,
  })
  @IsUUID()
  @IsOptional()
  company_id?: string;

  @ApiProperty({
    example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023',
    description: 'ID du RH',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  rh_id?: string;

  @ApiProperty({
    example: "Développement d'une plateforme web de E-learning",
    description: "Intitulé de l'expérience",
  })
  @IsString()
  @IsNotEmpty()
  intitule: string;

  @ApiProperty({
    example: 'Stage de 5eme année au cours duquel...',
    description: "Description de l'expérience",
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'Stage académique',
    description: "Type de l'expérience",
    required: false,
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({
    example: '2025-11-17',
    description: 'Date de début (format ISO 8601)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  date_debut?: string;

  @ApiProperty({
    example: '2025-11-17',
    description: 'Date de fin (format ISO 8601)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  date_fin?: string;
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

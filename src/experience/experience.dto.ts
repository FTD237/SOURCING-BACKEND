// ─── experience.dto.ts ───────────────────────────────────────────────────────
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExperienceDto {
  @ApiProperty({
    example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023',
    description: "Id de l'étudiant",
  })
  @IsNumber()
  student_id: number;

  @ApiProperty({
    example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023',
    description: "ID de l'entreprise",
  })
  @IsNumber()
  @IsOptional()
  company_id?: number;

  @ApiProperty({
    example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023',
    description: 'ID du RH',
  })
  @IsNumber()
  @IsOptional()
  rh_id?: number;

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
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'Stage académique',
    description: "Type de l'expérience",
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({
    example: '17/11/2025',
    description: 'Date de début',
  })
  @IsDateString()
  @IsOptional()
  date_debut?: string;

  @ApiProperty({
    example: '17/11/2025',
    description: 'date de fin',
  })
  @IsDateString()
  @IsOptional()
  date_fin?: string;
}

export class UpdateExperienceDto extends PartialType(CreateExperienceDto) {}

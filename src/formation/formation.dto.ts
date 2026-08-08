// src/formation/formation.dto.ts

import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Statut } from '../common/enum/statut.enum';

export class CreateFormationDto {
  @ApiProperty({
    description: 'Nom de la formation (unique)',
    example: 'Développement Full Stack',
  })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiPropertyOptional({
    description: "Durée de la formation en nombre d'années",
    example: 3,
  })
  @IsNumber()
  @IsOptional()
  nbr_annee?: number;

  @ApiPropertyOptional({
    description: 'Code interne unique de la formation',
    example: 'DEV-FS-01',
  })
  @IsString()
  @IsOptional()
  code?: string;
}

export class UpdateFormationDto extends PartialType(CreateFormationDto) {
  @ApiPropertyOptional({
    description: 'Statut de la formation',
    enum: Statut,
    enumName: 'Statut',
    example: Statut.ACTIF,
  })
  @IsEnum(Statut)
  @IsOptional()
  statut?: Statut;
}

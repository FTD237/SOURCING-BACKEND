// src/offre/offre.dto.ts
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateOffreDto {
  @ApiPropertyOptional({
    description: "Description détaillée de l'offre",
    example: 'Stage de développement Full Stack, 6 mois, Douala.',
  })
  @IsOptional()
  @IsString()
  descriptions?: string;
}

export class UpdateOffreDto extends PartialType(CreateOffreDto) {}

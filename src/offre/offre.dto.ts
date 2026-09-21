// src/offre/offre.dto.ts
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

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
}

export class UpdateOffreDto extends PartialType(CreateOffreDto) {}

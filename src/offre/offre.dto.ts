// src/offre/offre.dto.ts
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { TypeOffre } from '../common/enum/type-offre.enum';

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

  @IsNotEmpty()
  @IsString()
  titre: string;

  @ApiProperty({ format: 'date-time' })
  @IsDate()
  @IsNotEmpty()
  dte_debut: Date;

  @ApiProperty({ format: 'date-time' })
  @IsDate()
  @IsNotEmpty()
  dte_fin: Date;
}

export class UpdateOffreDto extends PartialType(CreateOffreDto) {}

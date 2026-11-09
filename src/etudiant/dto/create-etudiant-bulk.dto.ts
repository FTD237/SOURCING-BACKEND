// etudiant/dto/create-etudiants-bulk.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { NiveauEtudeEnum } from '../../common/enum/niveau-etude.enum';

export class ImportEtudiantItemDto {
  @ApiProperty({ example: 'logan@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Fils' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({ example: 'Logan' })
  @IsString()
  @IsNotEmpty()
  prenom: string;

  @ApiProperty({ example: 'UI2027' })
  @IsString()
  @IsNotEmpty()
  matricule: string;

  @ApiProperty({ example: '2025-2026' })
  @IsString()
  @IsNotEmpty()
  annee_acad: string;

  @ApiProperty({ example: 'Camerounais' })
  @IsString()
  @IsNotEmpty()
  nationality: string;

  @ApiProperty({ required: false, enum: NiveauEtudeEnum })
  @IsOptional()
  @IsEnum(NiveauEtudeEnum)
  scholar_level?: NiveauEtudeEnum;

  @ApiProperty({ required: false, example: 638423556 })
  @IsOptional()
  @IsInt()
  phone_number?: number;

  @ApiProperty({ required: false, example: 'Génie logiciel' })
  @IsOptional()
  @IsString()
  main_domain?: string;

  @ApiProperty({ example: '1aec5bef-7a21-47d1-b7f5-c2a3e1b57023' })
  @IsUUID()
  promotionId: string;
}

export class CreateEtudiantsBulkDto {
  @ApiProperty({ type: [ImportEtudiantItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ImportEtudiantItemDto)
  etudiants: ImportEtudiantItemDto[];
}

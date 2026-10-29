// src/etudiant/etudiant.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  ValidateNested,
  IsUUID,
  IsArray,
  IsEnum,
} from 'class-validator';
import { User } from '../../user/user.entity';
import { Etudiant } from '../etudiant.entity';
import type { LiensUtiles } from '../../common/types/liens-utiles';
import { LiensUtilesDto } from './liens-utiles.dto';
import { Type } from 'class-transformer';
import { UpsertJobseekerDto } from '../../jobseeker/dto/upsert-jobseeker.dto';
import { PartialType } from '@nestjs/mapped-types';
import { Statut } from '../../common/enum/statut.enum';

export class CreateEtudiantDto {
  // Informations User
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  prenom: string;

  // Informations Etudiant
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  promotionId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  matricule: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nationality: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  phone_number: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  main_domain?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  tools?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  languages?: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  annee_acad: string;

  @ApiPropertyOptional({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  is_job_seeker?: boolean;

  @ApiPropertyOptional({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  star_rate?: number;

  @ApiPropertyOptional({ required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ type: () => LiensUtilesDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => LiensUtilesDto)
  liens?: LiensUtiles;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  avatar_id?: string;

  @ApiPropertyOptional({ type: () => UpsertJobseekerDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpsertJobseekerDto)
  jobseeker?: UpsertJobseekerDto;
}

export class UpdateEtudiantDto extends PartialType(CreateEtudiantDto) {
  @ApiProperty()
  @IsEnum(Statut)
  @IsOptional()
  statut?: Statut;
}

export class CreateEtudiantResponseDto {
  @ApiProperty()
  user: User;

  @ApiProperty()
  etudiant: Etudiant;
}

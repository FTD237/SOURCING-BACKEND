// src/etudiant/etudiant.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { User } from '../user/user.entity';
import { Etudiant } from './etudiant.entity';

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
  @IsNotEmpty()
  @IsString()
  annee_acad: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  is_job_seeker?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  star_rate?: number;
}

export class UpdateEtudiantDto {
  @ApiProperty({
    required: false,
    example: 'UI2027',
    description: 'matricule étudiant',
  })
  @IsOptional()
  @IsString()
  matricule?: string;

  @ApiProperty({ required: false, example: 'logan' })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiProperty({ required: false, example: 'prenom' })
  @IsOptional()
  @IsString()
  prenom?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: 'prenom' })
  promotionId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: 'matricule' })
  annee_acad?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, example: 'true' })
  is_job_seeker?: boolean;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  star_rate?: number;
}

export class CreateEtudiantResponseDto {
  @ApiProperty()
  user: User;

  @ApiProperty()
  etudiant: Etudiant;

  @ApiProperty({
    description: 'Mot de passe généré automatiquement (à envoyer par email)',
  })
  generatedPassword: string;
}

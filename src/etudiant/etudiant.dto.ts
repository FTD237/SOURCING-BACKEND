// ─── etudiant.dto.ts ────────────────────────────────────────────────────────
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateEtudiantDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  @IsOptional()
  promotionId?: number;

  @IsString()
  @IsNotEmpty()
  matricule: string;

  @IsString()
  @IsOptional()
  annee_acad?: string;

  @IsBoolean()
  @IsOptional()
  is_job_seeker?: boolean;
}

export class UpdateEtudiantDto extends PartialType(CreateEtudiantDto) {
  @IsNumber()
  @IsOptional()
  star_rate?: number;

  @IsString()
  @IsOptional()
  statut?: string;
}

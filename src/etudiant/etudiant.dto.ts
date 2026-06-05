// ─── etudiant.dto.ts ────────────────────────────────────────────────────────
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

// export class FindEtudiantDto {
//   @IsString()
//   @IsOptional()
//
// }

export class CreateEtudiantDto {
  @IsUUID()
  userId: number;

  @IsUUID()
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

export class EtudiantResponseDto extends PartialType(CreateEtudiantDto) {
  statut: string;
  create_by: string;
  update_by: string;
}

export class UpdateEtudiantDto extends PartialType(CreateEtudiantDto) {
  @IsNumber()
  @IsOptional()
  star_rate?: number;

  @IsString()
  @IsOptional()
  statut?: string;
}
